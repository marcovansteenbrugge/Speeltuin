"""LandXML-importer voor Blender.

Leest een LandXML-bestand uit Civil 3D (Uitvoer > Exporteren naar LandXML) en
zet het om naar Blender-objecten:

- Surfaces (TIN)        -> mesh
- Pipe networks         -> leidingen (buizen) en putten
- Alignments + profiel  -> 3D-lijn over het lengteprofiel
- Feature lines         -> 3D-lijn

Grote coördinaten (RD, bijvoorbeeld X=155000, Y=463000) worden naar een lokaal
nulpunt verschoven, omdat Blender daar anders onnauwkeurig mee rekent. Het
nulpunt staat in de scène (object "RD-nulpunt") en wordt bij volgende imports
hergebruikt, zodat meerdere bestanden op elkaar aansluiten.

Gebruik als add-on: Edit > Preferences > Add-ons > Install from Disk.
Gebruik vanaf de opdrachtregel:
    blender --background --python landxml_import.py -- invoer.xml uitvoer.blend
"""

bl_info = {
    "name": "LandXML-import (Civil 3D)",
    "author": "Speeltuin",
    "version": (1, 0, 0),
    "blender": (3, 6, 0),
    "location": "File > Import > LandXML (.xml)",
    "description": "Importeert surfaces, pipe networks, alignments en feature lines uit LandXML",
    "category": "Import-Export",
}

import math
import sys
import xml.etree.ElementTree as ET

import bpy
import bmesh  # na bpy: bij de losse bpy-module bestaat bmesh pas daarna
from bpy.props import FloatProperty, StringProperty
from bpy_extras.io_utils import ImportHelper

NULPUNT_NAAM = "RD-nulpunt"

# Omrekening naar meters.
EENHEDEN = {
    "meter": 1.0,
    "millimeter": 0.001,
    "centimeter": 0.01,
    "kilometer": 1000.0,
    "foot": 0.3048,
    "USSurveyFoot": 1200.0 / 3937.0,
    "inch": 0.0254,
    "mile": 1609.344,
}

KLEUREN = {
    "maaiveld": (0.42, 0.47, 0.36, 1.0),
    "put": (0.62, 0.62, 0.60, 1.0),
    "storm": (0.20, 0.45, 0.80, 1.0),
    "sanitary": (0.55, 0.35, 0.20, 1.0),
    "leiding": (0.35, 0.35, 0.38, 1.0),
    "alignment": (0.85, 0.15, 0.15, 1.0),
    "featureline": (0.90, 0.75, 0.10, 1.0),
}


# ---------------------------------------------------------------------------
# Inlezen van LandXML (zonder Blender)
# ---------------------------------------------------------------------------

def _tag(el):
    return el.tag.rsplit("}", 1)[-1]


def _kinderen(el, naam):
    return [k for k in el if _tag(k) == naam]


def _kind(el, naam):
    for k in el:
        if _tag(k) == naam:
            return k
    return None


def _getallen(tekst):
    return [float(t) for t in (tekst or "").split()]


def _ne(el, schaal):
    """LandXML schrijft 'noord oost [hoogte]'; geeft (x, y, z of None) terug."""
    w = _getallen(el.text)
    z = w[2] * schaal if len(w) > 2 else None
    return (w[1] * schaal, w[0] * schaal, z)


def lees_eenheden(root):
    units = _kind(root, "Units")
    lengte = diameter = 1.0
    if units is not None and len(units):
        u = units[0]
        lengte = EENHEDEN.get(u.get("linearUnit", "meter"), 1.0)
        diameter = EENHEDEN.get(u.get("diameterUnit", ""), lengte)
    return lengte, diameter


def lees_surfaces(root, schaal):
    uit = []
    for surf in root.iter():
        if _tag(surf) != "Surface":
            continue
        definitie = _kind(surf, "Definition")
        if definitie is None:
            continue
        pnts, faces = _kind(definitie, "Pnts"), _kind(definitie, "Faces")
        if pnts is None or faces is None:
            continue
        index, punten = {}, []
        for p in _kinderen(pnts, "P"):
            x, y, z = _ne(p, schaal)
            index[p.get("id")] = len(punten)
            punten.append((x, y, z or 0.0))
        vlakken = []
        for f in _kinderen(faces, "F"):
            if f.get("i") == "1":  # onzichtbaar vlak (buiten de rand of in een gat)
                continue
            ids = (f.text or "").split()
            if len(ids) >= 3 and all(i in index for i in ids):
                vlakken.append(tuple(index[i] for i in ids))
        uit.append({"naam": surf.get("name", "Surface"), "punten": punten, "vlakken": vlakken})
    return uit


def _doorsnede(el, dschaal):
    """Geeft (vorm, breedte, hoogte) van een leiding of put terug, in meters."""
    for k in el:
        t = _tag(k)
        if t in ("CircPipe", "CircStruct"):
            d = float(k.get("diameter", 0)) * dschaal
            return "rond", d, d
        if t in ("EggPipe", "ElliPipe"):
            return "rond", float(k.get("span", 0)) * dschaal, float(k.get("height", 0)) * dschaal
        if t == "RectPipe":
            return "recht", float(k.get("width", 0)) * dschaal, float(k.get("height", 0)) * dschaal
        if t == "RectStruct":
            return "recht", float(k.get("length", 0)) * dschaal, float(k.get("width", 0)) * dschaal
    return "rond", 0.0, 0.0


def lees_pipe_networks(root, schaal, dschaal):
    uit = []
    for net in root.iter():
        if _tag(net) != "PipeNetwork":
            continue
        putten, bob = {}, {}
        structs = _kind(net, "Structs")
        for s in _kinderen(structs, "Struct") if structs is not None else []:
            centrum = _kind(s, "Center")
            if centrum is None:
                continue
            x, y, _ = _ne(centrum, schaal)
            vorm, b, h = _doorsnede(s, dschaal)
            rim = s.get("elevRim")
            sump = s.get("elevSump")
            inverts = []
            for inv in _kinderen(s, "Invert"):
                z = float(inv.get("elev")) * schaal
                inverts.append(z)
                bob[(s.get("name"), inv.get("refPipe"))] = z
            putten[s.get("name")] = {
                "naam": s.get("name"),
                "x": x,
                "y": y,
                "rim": float(rim) * schaal if rim is not None else None,
                "sump": float(sump) * schaal if sump is not None else (min(inverts) if inverts else None),
                "vorm": vorm,
                "breedte": b or 1.0,
                "lengte": h or b or 1.0,
            }
        leidingen = []
        pipes = _kind(net, "Pipes")
        for p in _kinderen(pipes, "Pipe") if pipes is not None else []:
            begin, eind = putten.get(p.get("refStart")), putten.get(p.get("refEnd"))
            if begin is None or eind is None:
                continue
            vorm, b, h = _doorsnede(p, dschaal)
            z1 = bob.get((begin["naam"], p.get("name")), begin["sump"])
            z2 = bob.get((eind["naam"], p.get("name")), eind["sump"])
            if z1 is None or z2 is None:
                continue
            leidingen.append({
                "naam": p.get("name"),
                "van": (begin["x"], begin["y"], z1 + h / 2),
                "naar": (eind["x"], eind["y"], z2 + h / 2),
                "vorm": vorm,
                "breedte": b,
                "hoogte": h,
                "bob_begin": z1,
                "bob_eind": z2,
            })
        uit.append({
            "naam": net.get("name", "Pipe network"),
            "type": net.get("pipeNetType", ""),
            "putten": list(putten.values()),
            "leidingen": leidingen,
        })
    return uit


def _boog(start, centrum, eind, draai):
    """Punten op een cirkelboog; draai is 'cw' of 'ccw'."""
    cx, cy = centrum[0], centrum[1]
    r = math.hypot(start[0] - cx, start[1] - cy)
    a0 = math.atan2(start[1] - cy, start[0] - cx)
    a1 = math.atan2(eind[1] - cy, eind[0] - cx)
    if draai == "cw":
        sweep = -((a0 - a1) % (2 * math.pi))
    else:
        sweep = (a1 - a0) % (2 * math.pi)
    n = max(4, math.ceil(abs(sweep) / math.radians(2)))
    return [(cx + r * math.cos(a0 + sweep * i / n), cy + r * math.sin(a0 + sweep * i / n), None)
            for i in range(1, n + 1)]


def _bezier(start, pi, eind, n=24):
    """Benadering van een overgangsboog (clothoïde) via een kwadratische Bézier door het PI."""
    uit = []
    for i in range(1, n + 1):
        t = i / n
        a, b, c = (1 - t) ** 2, 2 * (1 - t) * t, t ** 2
        uit.append((a * start[0] + b * pi[0] + c * eind[0], a * start[1] + b * pi[1] + c * eind[1], None))
    return uit


def lees_coordgeom(cg, schaal):
    """Zet Line/Curve/Spiral-elementen om in één puntenlijst (x, y, z of None)."""
    punten = []

    def voeg_toe(p):
        if not punten or math.hypot(p[0] - punten[-1][0], p[1] - punten[-1][1]) > 1e-6:
            punten.append(p)
        elif p[2] is not None:
            punten[-1] = p

    for el in cg:
        t = _tag(el)
        start, eind = _kind(el, "Start"), _kind(el, "End")
        if start is None or eind is None:
            continue
        s, e = _ne(start, schaal), _ne(eind, schaal)
        voeg_toe(s)
        if t == "Curve" and _kind(el, "Center") is not None:
            c = _ne(_kind(el, "Center"), schaal)
            boog = _boog(s, c, e, el.get("rot", "ccw"))
            for p in boog[:-1]:
                voeg_toe(p)
        elif t == "Spiral" and _kind(el, "PI") is not None:
            pi = _ne(_kind(el, "PI"), schaal)
            for p in _bezier(s, pi, e)[:-1]:
                voeg_toe(p)
        voeg_toe(e)
    return punten


def lees_profiel(alignment, schaal):
    """Geeft een functie station -> hoogte terug, of None als er geen profiel is."""
    profiel = _kind(alignment, "Profile")
    if profiel is None:
        return None
    ontwerp = _kind(profiel, "ProfAlign")
    if ontwerp is not None:
        pvis = []  # (station, hoogte, lengte verticale boog)
        for el in ontwerp:
            t = _tag(el)
            if t in ("PVI", "ParaCurve", "CircCurve", "UnsymParaCurve"):
                w = _getallen(el.text)
                if len(w) >= 2:
                    pvis.append((w[0] * schaal, w[1] * schaal, float(el.get("length", 0)) * schaal))
        if len(pvis) >= 2:
            return _ontwerpprofiel(pvis)
    maaiveld = _kind(profiel, "ProfSurf")
    if maaiveld is not None:
        lijst = _kind(maaiveld, "PntList2D")
        w = _getallen(lijst.text if lijst is not None else "")
        paren = [(w[i] * schaal, w[i + 1] * schaal) for i in range(0, len(w) - 1, 2)]
        if len(paren) >= 2:
            return lambda s: _lineair(paren, s)
    return None


def _lineair(paren, s):
    if s <= paren[0][0]:
        return paren[0][1]
    for (s0, z0), (s1, z1) in zip(paren, paren[1:]):
        if s <= s1:
            return z0 + (z1 - z0) * (s - s0) / (s1 - s0) if s1 > s0 else z1
    return paren[-1][1]


def _ontwerpprofiel(pvis):
    """Hellingen tussen de PVI's, met paraboolbogen van de opgegeven lengte."""
    paren = [(p[0], p[1]) for p in pvis]

    def hoogte(s):
        for i in range(1, len(pvis) - 1):
            ps, pz, lengte = pvis[i]
            if lengte <= 0 or abs(s - ps) > lengte / 2:
                continue
            g1 = (pz - pvis[i - 1][1]) / (ps - pvis[i - 1][0])
            g2 = (pvis[i + 1][1] - pz) / (pvis[i + 1][0] - ps)
            begin = ps - lengte / 2
            x = s - begin
            return pz - g1 * lengte / 2 + g1 * x + (g2 - g1) / (2 * lengte) * x * x
        return _lineair(paren, s)

    return hoogte


def lees_alignments(root, schaal):
    uit = []
    for al in root.iter():
        if _tag(al) != "Alignment":
            continue
        cg = _kind(al, "CoordGeom")
        if cg is None:
            continue
        punten = lees_coordgeom(cg, schaal)
        if len(punten) < 2:
            continue
        profiel = lees_profiel(al, schaal)
        station = float(al.get("staStart", 0)) * schaal
        driedim = []
        for i, (x, y, _) in enumerate(punten):
            if i:
                station += math.hypot(x - punten[i - 1][0], y - punten[i - 1][1])
            driedim.append((x, y, profiel(station) if profiel else 0.0))
        uit.append({"naam": al.get("name", "Alignment"), "punten": driedim, "profiel": profiel is not None})
    return uit


def lees_featurelines(root, schaal):
    uit = []
    for pf in root.iter():
        if _tag(pf) != "PlanFeature":
            continue
        cg = _kind(pf, "CoordGeom")
        if cg is None:
            continue
        punten = lees_coordgeom(cg, schaal)
        if len(punten) < 2:
            continue
        # Punten zonder hoogte (bogen) krijgen de hoogte lineair tussen de bekende punten.
        bekend = [(i, p[2]) for i, p in enumerate(punten) if p[2] is not None]
        if not bekend:
            bekend = [(0, 0.0)]
        paren = [(float(i), z) for i, z in bekend]
        punten = [(x, y, z if z is not None else _lineair(paren, float(i))) for i, (x, y, z) in enumerate(punten)]
        uit.append({"naam": pf.get("name", "Feature line"), "punten": punten})
    return uit


def lees_landxml(pad):
    root = ET.parse(pad).getroot()
    schaal, dschaal = lees_eenheden(root)
    return {
        "surfaces": lees_surfaces(root, schaal),
        "netwerken": lees_pipe_networks(root, schaal, dschaal),
        "alignments": lees_alignments(root, schaal),
        "featurelines": lees_featurelines(root, schaal),
    }


def alle_xy(data):
    for s in data["surfaces"]:
        yield from ((p[0], p[1]) for p in s["punten"])
    for n in data["netwerken"]:
        yield from ((p["x"], p["y"]) for p in n["putten"])
    for lijn in data["alignments"] + data["featurelines"]:
        yield from ((p[0], p[1]) for p in lijn["punten"])


def voorstel_nulpunt(data):
    """Midden van alle punten, afgerond op 100 m zodat het nulpunt makkelijk te onthouden is."""
    punten = list(alle_xy(data)) or [(0.0, 0.0)]
    xs, ys = zip(*punten)
    mx, my = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    return (round(mx / 100) * 100, round(my / 100) * 100)


# ---------------------------------------------------------------------------
# Opbouwen in Blender
# ---------------------------------------------------------------------------

def _materiaal(sleutel):
    naam = "LandXML " + sleutel
    mat = bpy.data.materials.get(naam)
    if mat is None:
        mat = bpy.data.materials.new(naam)
        kleur = KLEUREN.get(sleutel, KLEUREN["leiding"])
        mat.diffuse_color = kleur
        if not mat.use_nodes:
            mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf is not None:
            bsdf.inputs["Base Color"].default_value = kleur
            bsdf.inputs["Roughness"].default_value = 0.8
    return mat


def _collectie(naam, ouder):
    col = bpy.data.collections.new(naam)
    ouder.children.link(col)
    return col


def _object(naam, data, col, mat=None):
    obj = bpy.data.objects.new(naam, data)
    if mat is not None:
        obj.data.materials.append(mat)
    col.objects.link(obj)
    return obj


def haal_nulpunt(scene):
    obj = bpy.data.objects.get(NULPUNT_NAAM)
    if obj is not None and "rd_x" in obj:
        return obj["rd_x"], obj["rd_y"]
    return None


def zet_nulpunt(scene, ox, oy):
    obj = bpy.data.objects.get(NULPUNT_NAAM)
    if obj is None:
        obj = bpy.data.objects.new(NULPUNT_NAAM, None)
        obj.empty_display_type = "ARROWS"
        obj.empty_display_size = 5
        scene.collection.objects.link(obj)
    obj["rd_x"], obj["rd_y"] = ox, oy
    return obj


def _mesh_surface(s, ox, oy, col):
    mesh = bpy.data.meshes.new(s["naam"])
    punten = [(x - ox, y - oy, z) for x, y, z in s["punten"]]
    mesh.from_pydata(punten, [], s["vlakken"])
    mesh.validate()
    mesh.update()
    return _object(s["naam"], mesh, col, _materiaal("maaiveld"))


def _mesh_put(put, ox, oy, col):
    bodem, top = put["sump"], put["rim"]
    if bodem is None and top is None:
        bodem, top = 0.0, 1.5
    elif bodem is None:
        bodem = top - 1.5
    elif top is None:
        top = bodem + 1.5
    hoogte = max(top - bodem, 0.05)
    bm = bmesh.new()
    if put["vorm"] == "recht":
        bmesh.ops.create_cube(bm, size=1.0)
        bmesh.ops.scale(bm, vec=(put["breedte"], put["lengte"], hoogte), verts=bm.verts)
    else:
        bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=put["breedte"] / 2,
                              radius2=put["breedte"] / 2, depth=hoogte)
    mesh = bpy.data.meshes.new(put["naam"])
    bm.to_mesh(mesh)
    bm.free()
    obj = _object(put["naam"], mesh, col, _materiaal("put"))
    obj.location = (put["x"] - ox, put["y"] - oy, bodem + hoogte / 2)
    obj["maaiveld"] = top
    obj["bodem"] = bodem
    return obj


def _curve(naam, punten, dikte, col, mat):
    curve = bpy.data.curves.new(naam, "CURVE")
    curve.dimensions = "3D"
    spline = curve.splines.new("POLY")
    spline.points.add(len(punten) - 1)
    for p, (x, y, z) in zip(spline.points, punten):
        p.co = (x, y, z, 1.0)
    curve.bevel_depth = dikte
    curve.bevel_resolution = 4
    curve.use_fill_caps = True
    return _object(naam, curve, col, mat)


def _leiding(l, ox, oy, col, mat):
    punten = [(l["van"][0] - ox, l["van"][1] - oy, l["van"][2]),
              (l["naar"][0] - ox, l["naar"][1] - oy, l["naar"][2])]
    obj = _curve(l["naam"], punten, max(l["breedte"], l["hoogte"]) / 2, col, mat)
    obj["breedte"] = l["breedte"]
    obj["hoogte"] = l["hoogte"]
    obj["bob_begin"] = l["bob_begin"]
    obj["bob_eind"] = l["bob_eind"]
    return obj


def bouw_scene(data, context, naam="LandXML", nulpunt=None):
    scene = context.scene
    if nulpunt is None:
        nulpunt = haal_nulpunt(scene) or voorstel_nulpunt(data)
    ox, oy = nulpunt
    zet_nulpunt(scene, ox, oy)

    hoofd = _collectie(naam, scene.collection)
    telling = {"surfaces": 0, "putten": 0, "leidingen": 0, "alignments": 0, "featurelines": 0}

    if data["surfaces"]:
        col = _collectie("Surfaces", hoofd)
        for s in data["surfaces"]:
            if s["vlakken"]:
                _mesh_surface(s, ox, oy, col)
                telling["surfaces"] += 1

    for net in data["netwerken"]:
        col = _collectie(net["naam"], hoofd)
        soort = net["type"] if net["type"] in KLEUREN else "leiding"
        mat = _materiaal(soort)
        for put in net["putten"]:
            _mesh_put(put, ox, oy, col)
            telling["putten"] += 1
        for l in net["leidingen"]:
            _leiding(l, ox, oy, col, mat)
            telling["leidingen"] += 1

    if data["alignments"]:
        col = _collectie("Alignments", hoofd)
        for al in data["alignments"]:
            punten = [(x - ox, y - oy, z) for x, y, z in al["punten"]]
            obj = _curve(al["naam"], punten, 0.15, col, _materiaal("alignment"))
            obj["heeft_profiel"] = al["profiel"]
            telling["alignments"] += 1

    if data["featurelines"]:
        col = _collectie("Feature lines", hoofd)
        for fl in data["featurelines"]:
            punten = [(x - ox, y - oy, z) for x, y, z in fl["punten"]]
            _curve(fl["naam"], punten, 0.05, col, _materiaal("featureline"))
            telling["featurelines"] += 1

    # Grote modellen vallen anders buiten het zichtbereik van de viewport.
    scherm = getattr(context, "screen", None)
    for gebied in scherm.areas if scherm else []:
        if gebied.type == "VIEW_3D":
            gebied.spaces.active.clip_end = max(gebied.spaces.active.clip_end, 20000)

    return nulpunt, telling


# ---------------------------------------------------------------------------
# Add-on
# ---------------------------------------------------------------------------

class IMPORT_OT_landxml(bpy.types.Operator, ImportHelper):
    """Importeer een LandXML-bestand uit Civil 3D"""

    bl_idname = "import_scene.landxml"
    bl_label = "Importeer LandXML"
    bl_options = {"REGISTER", "UNDO"}

    filename_ext = ".xml"
    filter_glob: StringProperty(default="*.xml", options={"HIDDEN"})
    nulpunt_x: FloatProperty(
        name="Nulpunt X",
        description="RD-X van het lokale nulpunt; 0 = automatisch (of het nulpunt dat al in de scène staat)",
        default=0.0,
    )
    nulpunt_y: FloatProperty(
        name="Nulpunt Y",
        description="RD-Y van het lokale nulpunt; 0 = automatisch (of het nulpunt dat al in de scène staat)",
        default=0.0,
    )

    def execute(self, context):
        try:
            data = lees_landxml(self.filepath)
        except ET.ParseError as fout:
            self.report({"ERROR"}, f"Geen geldig XML-bestand: {fout}")
            return {"CANCELLED"}
        nulpunt = (self.nulpunt_x, self.nulpunt_y) if (self.nulpunt_x or self.nulpunt_y) else None
        naam = bpy.path.display_name_from_filepath(self.filepath)
        (ox, oy), telling = bouw_scene(data, context, naam, nulpunt)
        self.report({"INFO"}, _samenvatting(ox, oy, telling))
        return {"FINISHED"}


def _samenvatting(ox, oy, telling):
    delen = ", ".join(f"{v} {k}" for k, v in telling.items() if v)
    return f"LandXML geïmporteerd ({delen or 'niets gevonden'}); nulpunt X={ox:.0f} Y={oy:.0f}"


def _menu(self, context):
    self.layout.operator(IMPORT_OT_landxml.bl_idname, text="LandXML (.xml)")


def register():
    bpy.utils.register_class(IMPORT_OT_landxml)
    bpy.types.TOPBAR_MT_file_import.append(_menu)


def unregister():
    bpy.types.TOPBAR_MT_file_import.remove(_menu)
    bpy.utils.unregister_class(IMPORT_OT_landxml)


def _opdrachtregel(argv):
    if len(argv) < 1:
        print("Gebruik: blender --background --python landxml_import.py -- invoer.xml [uitvoer.blend]")
        return
    data = lees_landxml(argv[0])
    (ox, oy), telling = bouw_scene(data, bpy.context, bpy.path.display_name_from_filepath(argv[0]))
    print(_samenvatting(ox, oy, telling))
    if len(argv) > 1:
        bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(argv[1]))


if __name__ == "__main__":
    if "--" in sys.argv:
        _opdrachtregel(sys.argv[sys.argv.index("--") + 1:])
    else:
        register()
