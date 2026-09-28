"""LandXML-importer voor Blender.

Leest een LandXML-bestand uit Civil 3D (Uitvoer > Exporteren naar LandXML) en
zet het om naar Blender-objecten:

- Surfaces (TIN)        -> mesh
- Pipe networks         -> leidingen (buizen) en putten
- Alignments + profiel  -> 3D-lijn over het lengteprofiel
- Feature lines         -> 3D-lijn

Surfaces krijgen een materiaal op basis van hun naam (gras, asfalt, zetsteen, ...);
opnieuw toepassen kan met "Object > Materialen op naam (surfaces)".
"Object > Luchtfoto draperen (PDOK)" legt de luchtfoto van PDOK op de
geselecteerde surfaces, op de juiste RD-coördinaten.

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
    "version": (1, 2, 0),
    "blender": (3, 6, 0),
    "location": "File > Import > LandXML (.xml); Object > Luchtfoto draperen (PDOK)",
    "description": "Importeert surfaces, pipe networks, alignments en feature lines uit LandXML "
                   "en legt de PDOK-luchtfoto op surfaces",
    "category": "Import-Export",
}

import math
import sys
import xml.etree.ElementTree as ET

import bpy
import bmesh  # na bpy: bij de losse bpy-module bestaat bmesh pas daarna
from bpy.props import BoolProperty, EnumProperty, FloatProperty, IntProperty, StringProperty
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

# Kleur van een surface op basis van een woord in de naam. De volgorde telt: het
# eerste woord dat past wint, dus specifieke woorden (bermverharding, zetsteen)
# staan vóór algemene (berm, talud). Kleuren zijn lineair, zoals Blender ze rekent.
OPPERVLAKKEN = [
    ("ontgraving", ("ontgrav",), (0.20, 0.13, 0.07), 0.95),
    ("bermverharding", ("bermverharding", "grasbeton", "grastegel"), (0.16, 0.19, 0.11), 0.9),
    ("beheerstrook", ("beheerstrook",), (0.16, 0.28, 0.07), 0.95),
    ("fietspad", ("fietspad",), (0.30, 0.05, 0.035), 0.85),
    ("asfalt", ("asfalt", "rijbaan", "weg"), (0.045, 0.045, 0.05), 0.85),
    ("steen", ("zetsteen", "breuksteen", "stortsteen", "steen", "bekleding"), (0.17, 0.17, 0.18), 0.75),
    ("beton", ("beton",), (0.42, 0.42, 0.40), 0.8),
    ("klinker", ("klinker", "bestrating"), (0.28, 0.09, 0.05), 0.85),
    ("klei", ("klei",), (0.24, 0.16, 0.09), 0.95),
    ("zand", ("zand",), (0.52, 0.42, 0.25), 0.95),
    ("water", ("water", "sloot", "watergang"), (0.02, 0.07, 0.10), 0.1),
    ("gras", ("teelaarde", "gras", "berm", "talud", "beloop", "kruin"), (0.09, 0.20, 0.04), 0.95),
    ("maaiveld", ("maaiveld", "bestaand", "terrein", "eg"), (0.12, 0.18, 0.07), 0.95),
]
# Voor namen zonder bekend woord: rustige kleuren die onderling goed te onderscheiden zijn.
OPPERVLAK_REST = [
    (0.45, 0.30, 0.15), (0.20, 0.30, 0.45), (0.40, 0.40, 0.20), (0.35, 0.20, 0.35), (0.25, 0.40, 0.35),
]


def oppervlak_voor_naam(naam):
    """Geeft (sleutel, kleur, roughness) terug voor een surfacenaam."""
    woorden = naam.lower().replace("-", "_").replace(" ", "_")
    delen = set(woorden.split("_"))
    for sleutel, sleutelwoorden, kleur, ruwheid in OPPERVLAKKEN:
        for w in sleutelwoorden:
            # Korte woorden (zoals "eg") alleen als los woord, anders passen ze te vaak.
            if (w in delen) if len(w) <= 3 else (w in woorden):
                return sleutel, kleur, ruwheid
    return None


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


# Materialen per soort oppervlak. "ruis": natuurlijk oppervlak met vlekken van
# ongeveer `vlek` meter en fijne structuur; "blokken": steenzetting of tegels met
# afmetingen in meters. Alles op echte schaal, omdat de surfaces in meters staan.
TEXTUREN = {
    "gras": {"type": "ruis", "c1": (0.05, 0.13, 0.02), "c2": (0.10, 0.20, 0.035),
             "donker": (0.03, 0.07, 0.015), "vlek": 25, "fijn": 4.0, "bump": 0.15},
    "beheerstrook": {"type": "ruis", "c1": (0.11, 0.20, 0.045), "c2": (0.17, 0.25, 0.06),
                     "donker": (0.08, 0.13, 0.03), "vlek": 15, "fijn": 6.0, "bump": 0.1},
    "maaiveld": {"type": "ruis", "c1": (0.06, 0.12, 0.03), "c2": (0.12, 0.18, 0.045),
                 "donker": (0.04, 0.08, 0.02), "vlek": 40, "fijn": 4.0, "bump": 0.15},
    "ontgraving": {"type": "ruis", "c1": (0.17, 0.10, 0.05), "c2": (0.26, 0.17, 0.09),
                   "donker": (0.09, 0.05, 0.03), "vlek": 8, "fijn": 5.0, "bump": 0.3},
    "klei": {"type": "ruis", "c1": (0.21, 0.14, 0.08), "c2": (0.28, 0.20, 0.12),
             "donker": (0.13, 0.09, 0.05), "vlek": 10, "fijn": 6.0, "bump": 0.2},
    "zand": {"type": "ruis", "c1": (0.46, 0.36, 0.21), "c2": (0.58, 0.48, 0.30),
             "donker": (0.36, 0.28, 0.17), "vlek": 10, "fijn": 20.0, "bump": 0.05},
    "asfalt": {"type": "ruis", "c1": (0.035, 0.035, 0.04), "c2": (0.06, 0.06, 0.065),
               "donker": (0.02, 0.02, 0.022), "vlek": 12, "fijn": 60.0, "bump": 0.05},
    "fietspad": {"type": "ruis", "c1": (0.24, 0.04, 0.03), "c2": (0.33, 0.06, 0.04),
                 "donker": (0.15, 0.03, 0.02), "vlek": 12, "fijn": 60.0, "bump": 0.05},
    "beton": {"type": "ruis", "c1": (0.35, 0.35, 0.33), "c2": (0.45, 0.45, 0.43),
              "donker": (0.25, 0.25, 0.24), "vlek": 6, "fijn": 30.0, "bump": 0.05},
    "water": {"type": "ruis", "c1": (0.015, 0.05, 0.07), "c2": (0.025, 0.07, 0.09),
              "donker": (0.01, 0.03, 0.05), "vlek": 30, "fijn": 1.5, "bump": 0.2},
    "steen": {"type": "blokken", "c1": (0.05, 0.05, 0.055), "c2": (0.11, 0.11, 0.115),
              "voeg": (0.015, 0.015, 0.015), "donker": (0.035, 0.045, 0.025),
              "breedte": 0.4, "hoogte": 0.35, "voegmaat": 0.025, "bump": 0.5},
    "bermverharding": {"type": "blokken", "c1": (0.30, 0.30, 0.28), "c2": (0.36, 0.36, 0.33),
                       "voeg": (0.08, 0.18, 0.04), "donker": (0.18, 0.20, 0.15),
                       "breedte": 0.6, "hoogte": 0.4, "voegmaat": 0.10, "bump": 0.3},
    "klinker": {"type": "blokken", "c1": (0.25, 0.08, 0.04), "c2": (0.32, 0.12, 0.06),
                "voeg": (0.20, 0.20, 0.18), "donker": (0.15, 0.06, 0.03),
                "breedte": 0.21, "hoogte": 0.105, "voegmaat": 0.006, "bump": 0.3},
}


def _socket(node, naam, soort=None, uitgang=False):
    """Zoekt een socket op naam; bij de Mix-node bestaan dezelfde namen voor meerdere typen."""
    lijst = [s for s in (node.outputs if uitgang else node.inputs)
             if s.name == naam and (soort is None or s.type == soort)]
    actief = [s for s in lijst if s.enabled]
    return (actief or lijst)[0]


def _verbind(links, doel, bron):
    """Koppelt een socket, of zet een vaste waarde als de bron geen socket is."""
    if isinstance(bron, bpy.types.NodeSocket):
        links.new(bron, doel)
    elif isinstance(bron, tuple) and len(bron) == 3:
        doel.default_value = (*bron, 1.0)
    else:
        doel.default_value = bron


def _mix_kleur(nodes, links, factor, a, b, x, y):
    mix = nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.location = (x, y)
    _verbind(links, _socket(mix, "Factor", "VALUE"), factor)
    _verbind(links, _socket(mix, "A", "RGBA"), a)
    _verbind(links, _socket(mix, "B", "RGBA"), b)
    return _socket(mix, "Result", "RGBA", uitgang=True)


def _ruis(nodes, links, vector, schaal, detail, x, y):
    ruis = nodes.new("ShaderNodeTexNoise")
    ruis.location = (x, y)
    links.new(vector, ruis.inputs["Vector"])
    ruis.inputs["Scale"].default_value = schaal
    ruis.inputs["Detail"].default_value = detail
    return ruis.outputs["Fac"]


def _vlekken(nodes, links, fac, van, tot, x, y):
    """Maakt van ruis losse vlekken: onder `van` niets, boven `tot` volledig."""
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.location = (x, y)
    ramp.color_ramp.elements[0].position = van
    ramp.color_ramp.elements[1].position = tot
    links.new(fac, ramp.inputs["Fac"])
    return ramp.outputs["Color"]


def bouw_textuur(mat, spec, ruwheid):
    """Bouwt het node-netwerk voor een materiaal volgens een spec uit TEXTUREN."""
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = ruwheid
    coord = nodes.new("ShaderNodeTexCoord")
    coord.location = (-1400, 0)
    vector = coord.outputs["Object"]  # in meters, en doorlopend over alle surfaces

    fijn = _ruis(nodes, links, vector, spec.get("fijn", 3.0), 8.0, -1150, -300)
    if spec["type"] == "blokken":
        steen = nodes.new("ShaderNodeTexBrick")
        steen.location = (-900, 200)
        links.new(vector, steen.inputs["Vector"])
        for naam, waarde in (("Color1", spec["c1"]), ("Color2", spec["c2"]), ("Mortar", spec["voeg"])):
            steen.inputs[naam].default_value = (*waarde, 1.0)
        steen.inputs["Scale"].default_value = 1.0
        steen.inputs["Mortar Size"].default_value = spec["voegmaat"]
        steen.inputs["Brick Width"].default_value = spec["breedte"]
        steen.inputs["Row Height"].default_value = spec["hoogte"]
        kleur, hoogte, omkeren = steen.outputs["Color"], steen.outputs["Fac"], True
    else:
        groot = _ruis(nodes, links, vector, 1.0 / spec["vlek"], 3.0, -1150, 200)
        kleur = _mix_kleur(nodes, links, groot, spec["c1"], spec["c2"], -700, 200)
        hoogte, omkeren = fijn, False

    # Verwering of plukken donkerder gras, zodat het niet egaal oogt.
    vlek = _vlekken(nodes, links, fijn, 0.5, 0.8, -700, -200)
    kleur = _mix_kleur(nodes, links, vlek, kleur, spec["donker"], -450, 100)
    links.new(kleur, bsdf.inputs["Base Color"])

    bump = nodes.new("ShaderNodeBump")
    bump.location = (-450, -300)
    bump.invert = omkeren  # bij blokken ligt de voeg lager dan de steen
    bump.inputs["Strength"].default_value = spec["bump"]
    links.new(hoogte, bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])


def oppervlak_materiaal(naam, rest_index=0, textuur=True):
    """Gedeeld materiaal per soort oppervlak, bijvoorbeeld "Oppervlak gras".

    Met textuur=True krijgt het materiaal een patroon (gras, steenzetting, asfalt),
    anders een effen kleur ("Kleur gras"). Bestaat het materiaal al, dan wordt het
    hergebruikt, zodat zelf aangepaste instellingen bewaard blijven en alle
    surfaces van dezelfde soort mee veranderen.
    """
    soort = oppervlak_voor_naam(naam)
    if soort is None:
        nummer = rest_index % len(OPPERVLAK_REST)
        sleutel, kleur, ruwheid = f"overig {nummer + 1}", OPPERVLAK_REST[nummer], 0.9
    else:
        sleutel, kleur, ruwheid = soort
    spec = TEXTUREN.get(sleutel) if textuur else None
    matnaam = ("Oppervlak " if spec else "Kleur ") + sleutel
    mat = bpy.data.materials.get(matnaam)
    if mat is None:
        mat = bpy.data.materials.new(matnaam)
        if spec:
            kleur = tuple((a + b) / 2 for a, b in zip(spec["c1"], spec["c2"]))
        mat.diffuse_color = (*kleur, 1.0)  # ook in de grijze weergave (Solid) de goede kleur
        mat.roughness = ruwheid
        if not mat.use_nodes:
            mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if spec:
            bouw_textuur(mat, spec, ruwheid)
        elif bsdf is not None:
            bsdf.inputs["Base Color"].default_value = (*kleur, 1.0)
            bsdf.inputs["Roughness"].default_value = ruwheid
    return mat, soort is not None


def kleur_surfaces(objecten, textuur=True):
    """Geeft elke surface een materiaal op basis van zijn naam.

    Objecten met een luchtfoto worden overgeslagen. Geeft (gekleurd, overgeslagen) terug.
    """
    gekleurd, overgeslagen, rest = 0, 0, 0
    for obj in sorted(objecten, key=lambda o: o.name):
        if obj.type != "MESH":
            continue
        if any(m is not None and m.name.startswith("Luchtfoto") for m in obj.data.materials):
            overgeslagen += 1
            continue
        mat, herkend = oppervlak_materiaal(obj.name, rest, textuur)
        if not herkend:
            rest += 1
        obj.data.materials.clear()
        obj.data.materials.append(mat)
        gekleurd += 1
    return gekleurd, overgeslagen


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
    return _object(s["naam"], mesh, col)


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
        surfaces = [_mesh_surface(s, ox, oy, col) for s in data["surfaces"] if s["vlakken"]]
        kleur_surfaces(surfaces)
        telling["surfaces"] = len(surfaces)

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
# Luchtfoto van PDOK draperen
# ---------------------------------------------------------------------------

PDOK_WMS = "https://service.pdok.nl/hwh/luchtfotorgb/wms/v1_0"
PDOK_LAGEN = [
    ("Actueel_ortho25", "Actueel, 25 cm", "Meest recente luchtfoto met pixels van 25 cm"),
    ("Actueel_orthoHR", "Actueel, 8 cm", "Meest recente luchtfoto in hoge resolutie (pixels van ongeveer 8 cm)"),
]
PDOK_MAX_TEGEL = 2000  # PDOK levert maximaal 2500 pixels per verzoek


def luchtfoto_url(laag, x0, y0, x1, y1, breedte, hoogte):
    """WMS-verzoek in RD (EPSG:28992); bij WMS 1.3.0 is de volgorde voor RD x,y."""
    return (
        f"{PDOK_WMS}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS={laag}&STYLES="
        f"&CRS=EPSG:28992&BBOX={x0:.3f},{y0:.3f},{x1:.3f},{y1:.3f}"
        f"&WIDTH={breedte}&HEIGHT={hoogte}&FORMAT=image/jpeg"
    )


def plan_luchtfoto(x0, y0, x1, y1, pixel, max_pixels, max_tegel=PDOK_MAX_TEGEL):
    """Verdeelt het gebied in tegels. Geeft (pixelgrootte, breedte, hoogte, tegels) terug.

    Elke tegel is (px, py, breedte, hoogte, (x0, y0, x1, y1)), met py geteld vanaf de
    onderkant, zoals Blender de pixels van een afbeelding opslaat.
    """
    pixel = max(pixel, (x1 - x0) / max_pixels, (y1 - y0) / max_pixels)
    breedte = max(1, math.ceil((x1 - x0) / pixel))
    hoogte = max(1, math.ceil((y1 - y0) / pixel))
    tegels = []
    for py in range(0, hoogte, max_tegel):
        for px in range(0, breedte, max_tegel):
            b, h = min(max_tegel, breedte - px), min(max_tegel, hoogte - py)
            vak = (x0 + px * pixel, y0 + py * pixel, x0 + (px + b) * pixel, y0 + (py + h) * pixel)
            tegels.append((px, py, b, h, vak))
    return pixel, breedte, hoogte, tegels


def _download(url):
    import urllib.request

    with urllib.request.urlopen(url, timeout=120) as antwoord:
        soort = antwoord.headers.get("Content-Type", "")
        inhoud = antwoord.read()
    if not soort.startswith("image/"):
        raise RuntimeError("PDOK gaf geen afbeelding terug: " + inhoud[:300].decode("utf-8", "replace"))
    return inhoud


def haal_luchtfoto(laag, x0, y0, x1, y1, pixel, max_pixels, map_, download=_download):
    """Haalt de luchtfoto op in tegels, plakt ze aan elkaar en slaat het resultaat op als JPEG."""
    import os
    import numpy as np

    pixel, breedte, hoogte, tegels = plan_luchtfoto(x0, y0, x1, y1, pixel, max_pixels, PDOK_MAX_TEGEL)
    geheel = np.zeros((hoogte, breedte, 4), dtype=np.float32)
    tijdelijk = os.path.join(map_, "_pdok_tegel.jpg")
    for px, py, b, h, vak in tegels:
        with open(tijdelijk, "wb") as f:
            f.write(download(luchtfoto_url(laag, *vak, b, h)))
        tegel = bpy.data.images.load(tijdelijk)
        pixels = np.empty(b * h * 4, dtype=np.float32)
        tegel.pixels.foreach_get(pixels)
        geheel[py:py + h, px:px + b] = pixels.reshape(h, b, 4)
        bpy.data.images.remove(tegel)
    os.remove(tijdelijk)

    naam = f"luchtfoto_{laag}_{x0:.0f}_{y0:.0f}.jpg"
    beeld = bpy.data.images.new(naam, breedte, hoogte, alpha=False)
    beeld.pixels.foreach_set(geheel.ravel())
    beeld.filepath_raw = os.path.join(map_, naam)
    beeld.file_format = "JPEG"
    beeld.save()
    beeld.pack()  # zit daarna in het .blend-bestand, ook als het los bestand verdwijnt
    return beeld, pixel


def _wereld_punten(obj):
    import numpy as np

    punten = np.empty(len(obj.data.vertices) * 3, dtype=np.float64)
    obj.data.vertices.foreach_get("co", punten)
    punten = punten.reshape(-1, 3)
    m = np.array(obj.matrix_world, dtype=np.float64)
    return punten @ m[:3, :3].T + m[:3, 3]


def zet_uv_bovenaanzicht(obj, x0, y0, x1, y1, naam="Luchtfoto"):
    """UV-map waarbij elke vertex de plek van zijn lokale x,y op de luchtfoto krijgt."""
    import numpy as np

    mesh = obj.data
    uv = mesh.uv_layers.get(naam) or mesh.uv_layers.new(name=naam)
    punten = _wereld_punten(obj)
    index = np.empty(len(mesh.loops), dtype=np.int64)
    mesh.loops.foreach_get("vertex_index", index)
    u = (punten[index, 0] - x0) / (x1 - x0)
    v = (punten[index, 1] - y0) / (y1 - y0)
    uv.data.foreach_set("uv", np.column_stack([u, v]).astype(np.float32).ravel())
    return uv


def luchtfoto_materiaal(beeld, uv_naam="Luchtfoto"):
    mat = bpy.data.materials.new("Luchtfoto")
    mat.diffuse_color = (0.35, 0.40, 0.30, 1.0)
    if not mat.use_nodes:
        mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = 1.0
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = beeld
    tex.extension = "EXTEND"
    tex.location = (-400, 300)
    uvnode = nodes.new("ShaderNodeUVMap")
    uvnode.uv_map = uv_naam
    uvnode.location = (-650, 300)
    links.new(uvnode.outputs["UV"], tex.inputs["Vector"])
    links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    return mat


def drapeer_luchtfoto(objecten, laag="Actueel_ortho25", pixel=0.25, max_pixels=4096, marge=10.0,
                      download=_download):
    """Legt de PDOK-luchtfoto op de meegegeven mesh-objecten. Geeft (beeld, pixelgrootte) terug."""
    import os
    import tempfile

    nulpunt = haal_nulpunt(bpy.context.scene)
    if nulpunt is None:
        raise RuntimeError("Geen RD-nulpunt in de scène; importeer eerst een LandXML-bestand")
    ox, oy = nulpunt

    xs, ys = [], []
    for obj in objecten:
        p = _wereld_punten(obj)
        xs += [p[:, 0].min(), p[:, 0].max()]
        ys += [p[:, 1].min(), p[:, 1].max()]
    x0, y0 = min(xs) - marge, min(ys) - marge
    x1, y1 = max(xs) + marge, max(ys) + marge

    map_ = os.path.dirname(bpy.data.filepath) if bpy.data.filepath else tempfile.gettempdir()
    beeld, pixel = haal_luchtfoto(laag, x0 + ox, y0 + oy, x1 + ox, y1 + oy, pixel, max_pixels, map_, download)

    # De foto kan door afronding op hele pixels iets groter zijn dan gevraagd.
    x1, y1 = x0 + beeld.size[0] * pixel, y0 + beeld.size[1] * pixel
    mat = luchtfoto_materiaal(beeld)
    for obj in objecten:
        zet_uv_bovenaanzicht(obj, x0, y0, x1, y1)
        obj.data.materials.clear()
        obj.data.materials.append(mat)
    return beeld, pixel


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


class OBJECT_OT_luchtfoto_pdok(bpy.types.Operator):
    """Leg de luchtfoto van PDOK op de geselecteerde surfaces, op de juiste RD-coördinaten"""

    bl_idname = "object.luchtfoto_pdok"
    bl_label = "Luchtfoto draperen (PDOK)"
    bl_options = {"REGISTER", "UNDO"}

    laag: EnumProperty(name="Luchtfoto", items=PDOK_LAGEN, default="Actueel_ortho25")
    pixel: FloatProperty(
        name="Pixelgrootte (m)",
        description="Gewenste scherpte; bij een groot gebied wordt dit automatisch grover",
        default=0.25, min=0.05, max=10.0,
    )
    max_pixels: IntProperty(
        name="Maximale afmeting (px)",
        description="Grootste breedte of hoogte van de foto; groter kost veel geheugen",
        default=4096, min=512, max=16384,
    )
    marge: FloatProperty(name="Marge (m)", description="Extra rand rondom de surfaces", default=10.0, min=0.0)

    @classmethod
    def poll(cls, context):
        return any(o.type == "MESH" for o in context.selected_objects)

    def invoke(self, context, event):
        return context.window_manager.invoke_props_dialog(self)

    def execute(self, context):
        objecten = [o for o in context.selected_objects if o.type == "MESH"]
        try:
            beeld, pixel = drapeer_luchtfoto(objecten, self.laag, self.pixel, self.max_pixels, self.marge)
        except Exception as fout:  # netwerk- of PDOK-fout: laat de melding zien in plaats van te crashen
            self.report({"ERROR"}, f"Luchtfoto ophalen mislukt: {fout}")
            return {"CANCELLED"}
        b, h = beeld.size
        self.report({"INFO"}, f"Luchtfoto op {len(objecten)} object(en) gelegd: {b}x{h} px, {pixel:.2f} m per pixel")
        return {"FINISHED"}


class OBJECT_OT_kleuren_op_naam(bpy.types.Operator):
    """Geef de geselecteerde surfaces een materiaal op basis van hun naam (gras, asfalt, zetsteen, ...)"""

    bl_idname = "object.kleuren_op_naam"
    bl_label = "Materialen op naam (surfaces)"
    bl_options = {"REGISTER", "UNDO"}

    textuur: BoolProperty(
        name="Met textuur",
        description="Gras, steenzetting en asfalt met patroon; uit = effen kleuren",
        default=True,
    )

    @classmethod
    def poll(cls, context):
        return any(o.type == "MESH" for o in context.selected_objects)

    def execute(self, context):
        gekleurd, overgeslagen = kleur_surfaces(context.selected_objects, self.textuur)
        melding = f"{gekleurd} surface(s) een materiaal gegeven"
        if overgeslagen:
            melding += f"; {overgeslagen} met luchtfoto overgeslagen"
        self.report({"INFO"}, melding)
        return {"FINISHED"}


def _samenvatting(ox, oy, telling):
    delen = ", ".join(f"{v} {k}" for k, v in telling.items() if v)
    return f"LandXML geïmporteerd ({delen or 'niets gevonden'}); nulpunt X={ox:.0f} Y={oy:.0f}"


def _menu(self, context):
    self.layout.operator(IMPORT_OT_landxml.bl_idname, text="LandXML (.xml)")


def _menu_object(self, context):
    self.layout.separator()
    self.layout.operator(OBJECT_OT_kleuren_op_naam.bl_idname, icon="COLOR")
    self.layout.operator(OBJECT_OT_luchtfoto_pdok.bl_idname, icon="IMAGE_DATA")


def register():
    bpy.utils.register_class(IMPORT_OT_landxml)
    bpy.utils.register_class(OBJECT_OT_luchtfoto_pdok)
    bpy.utils.register_class(OBJECT_OT_kleuren_op_naam)
    bpy.types.TOPBAR_MT_file_import.append(_menu)
    bpy.types.VIEW3D_MT_object.append(_menu_object)


def unregister():
    bpy.types.VIEW3D_MT_object.remove(_menu_object)
    bpy.types.TOPBAR_MT_file_import.remove(_menu)
    bpy.utils.unregister_class(OBJECT_OT_kleuren_op_naam)
    bpy.utils.unregister_class(OBJECT_OT_luchtfoto_pdok)
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
