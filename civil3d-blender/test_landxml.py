"""Test voor landxml_import.py.

Draaien met de Blender Python-module (pip install bpy):
    python test_landxml.py
of met Blender zelf:
    blender --background --python test_landxml.py
"""

import math
import os
import sys
import tempfile

import bpy

HIER = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HIER)

import landxml_import as lx  # noqa: E402

VOORBEELD = os.path.join(HIER, "voorbeeld", "voorbeeld.xml")


def ongeveer(a, b, marge=1e-3):
    assert abs(a - b) < marge, f"{a} != {b}"


def test_inlezen():
    data = lx.lees_landxml(VOORBEELD)

    s = data["surfaces"][0]
    assert s["naam"] == "Maaiveld"
    assert len(s["punten"]) == 36
    assert len(s["vlakken"]) == 48, "onzichtbare vlakken (i=1) horen overgeslagen te worden"

    net = data["netwerken"][0]
    assert net["type"] == "storm"
    put1, put2 = net["putten"]
    ongeveer(put1["breedte"], 1.0)  # 1000 mm
    ongeveer(put2["breedte"], 1.2)
    ongeveer(put2["lengte"], 0.8)
    leiding = net["leidingen"][0]
    ongeveer(leiding["breedte"], 0.4)  # 400 mm
    ongeveer(leiding["van"][2], -0.2 + 0.2)  # binnenonderkant + straal
    ongeveer(leiding["naar"][2], -0.45 + 0.2)

    al = data["alignments"][0]
    assert al["profiel"]
    ongeveer(al["punten"][0][2], 1.5)
    # Boog: alle tussenpunten liggen op 20 m van het middelpunt.
    cx, cy = 155000.0, 462980.0
    boog = [p for p in al["punten"] if 155000.0 < p[0] < 155020.0 and p[1] < 462980.0]
    assert boog
    for x, y, _ in boog:
        ongeveer(math.hypot(x - cx, y - cy), 20.0)

    fl = data["featurelines"][0]
    ongeveer(fl["punten"][0][2], 1.65)
    ongeveer(fl["punten"][-1][2], 1.85)

    assert lx.voorstel_nulpunt(data) == (155000, 463000)


def test_profiel():
    hoogte = lx._ontwerpprofiel([(0, 1.5, 0), (50, 2.5, 20), (130, 2.1, 0)])
    ongeveer(hoogte(0), 1.5)
    ongeveer(hoogte(40), 2.3)  # begin verticale boog sluit aan op de helling
    ongeveer(hoogte(50), 2.4375)  # boog rondt de knik af
    ongeveer(hoogte(60), 2.45)  # eind boog sluit aan op de tweede helling
    ongeveer(hoogte(130), 2.1)


def test_eenheden():
    import xml.etree.ElementTree as ET
    root = ET.fromstring(
        '<LandXML xmlns="http://www.landxml.org/schema/LandXML-1.2"><Units>'
        '<Imperial linearUnit="USSurveyFoot" diameterUnit="inch"/></Units></LandXML>'
    )
    lengte, diameter = lx.lees_eenheden(root)
    ongeveer(lengte, 0.3048006)
    ongeveer(diameter, 0.0254)


def test_blender():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    lx.register()
    try:
        bpy.ops.import_scene.landxml(filepath=VOORBEELD)
        bpy.ops.import_scene.landxml(filepath=VOORBEELD)  # tweede keer: zelfde nulpunt
    finally:
        lx.unregister()

    nulpunt = bpy.data.objects[lx.NULPUNT_NAAM]
    assert (nulpunt["rd_x"], nulpunt["rd_y"]) == (155000, 463000)

    maaiveld = bpy.data.objects["Maaiveld"]
    assert len(maaiveld.data.polygons) == 48
    xs = [v.co.x for v in maaiveld.data.vertices]
    ongeveer(min(xs), -50.0)
    ongeveer(max(xs), 50.0)

    put = bpy.data.objects["Put 1"]
    ongeveer(put.location.x, -30.0)
    ongeveer(put.location.z, (-0.3 + 1.6) / 2)
    ongeveer(put.dimensions.z, 1.9)
    ongeveer(bpy.data.objects["Put 2"].dimensions.x, 1.2)

    leiding = bpy.data.objects["Leiding 1"]
    ongeveer(leiding.data.bevel_depth, 0.2)
    ongeveer(leiding["bob_eind"], -0.45)

    assert bpy.data.objects["Maaiveld.001"], "tweede import hoort een eigen kopie te geven"
    ongeveer(bpy.data.objects["Put 1.001"].location.x, -30.0)

    with tempfile.TemporaryDirectory() as tmp:
        pad = os.path.join(tmp, "test.blend")
        bpy.ops.wm.save_as_mainfile(filepath=pad)
        assert os.path.getsize(pad) > 0


def test_kleur_op_naam():
    # Namen zoals ze uit een echt Civil 3D-dijkontwerp komen.
    verwacht = {
        "SURF_-_Prototype_-_Ontgraven_buitenzijde": "ontgraving",
        "SURF_-_Prototype_-_Ontgraving_Binnenzijde": "ontgraving",
        "SURF_-_Prototype_Kruin_-_Binnentalud_Beheerstrook": "beheerstrook",
        "SURF_-_Prototype_Kruin_-_Binnentalud_Berm": "gras",
        "SURF_-_Prototype_Kruin_-_Binnentalud_Onderbeloop": "gras",
        "SURF_-_Prototype_Kruin_-_Binnentalud_Teelaarde": "gras",
        "SURF_-_Prototype_Kruin_-_Bovenbeloop_Teelaarde": "gras",
        "SURF_-_Prototype_Kruin_-_Buitentalud_Zetsteen": "steen",
        "SURF_-_Prototype_Kruin_-_Kruin_Asfalt": "asfalt",
        "SURF_-_Prototype_Kruin_-_Kruin_Bermverharding": "bermverharding",
        "Maaiveld": "maaiveld",
        "EG": "maaiveld",
        "Weg_links": "asfalt",
        "Wegberm": "gras",  # korte woorden zoals "weg" tellen alleen als los woord
        "Legger": None,  # "eg" midden in een woord telt niet
        "Dijkvak 02": None,
    }
    for naam, sleutel in verwacht.items():
        uit = lx.oppervlak_voor_naam(naam)
        assert (uit[0] if uit else None) == sleutel, f"{naam}: {uit}"


def test_kleuren_in_blender():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    namen = ["Buitentalud_Zetsteen", "Binnentalud_Teelaarde", "Buitentalud_Berm", "Dijkvak 02", "Onbekend"]
    objecten = []
    for naam in namen:
        mesh = bpy.data.meshes.new(naam)
        mesh.from_pydata([(0, 0, 0), (1, 0, 0), (0, 1, 0)], [], [(0, 1, 2)])
        obj = bpy.data.objects.new(naam, mesh)
        bpy.context.scene.collection.objects.link(obj)
        objecten.append(obj)
    foto = bpy.data.objects.new("Met foto", bpy.data.meshes.new("Met foto"))
    foto.data.materials.append(bpy.data.materials.new("Luchtfoto"))
    objecten.append(foto)

    assert lx.kleur_surfaces(objecten) == (5, 1)
    mat = {o.name: o.data.materials[0].name for o in objecten}
    assert mat["Buitentalud_Zetsteen"] == "Oppervlak steen"
    assert mat["Binnentalud_Teelaarde"] == mat["Buitentalud_Berm"] == "Oppervlak gras"
    assert mat["Dijkvak 02"] != mat["Onbekend"], "onbekende namen horen verschillende kleuren te krijgen"
    assert mat["Met foto"] == "Luchtfoto", "luchtfoto hoort te blijven staan"

    # Opnieuw toepassen maakt geen dubbele materialen en houdt eigen aanpassingen.
    gras = bpy.data.materials["Oppervlak gras"]
    gras.diffuse_color = (1, 0, 0, 1)
    lx.kleur_surfaces(objecten)
    assert objecten[1].data.materials[0] == gras and tuple(gras.diffuse_color)[:3] == (1, 0, 0)
    assert "Oppervlak gras.001" not in bpy.data.materials


def test_tegelplan():
    pixel, b, h, tegels = lx.plan_luchtfoto(0, 0, 100, 50, 0.02, 10000, max_tegel=2000)
    assert (b, h) == (5000, 2500)
    assert len(tegels) == 3 * 2
    assert sum(t[2] * t[3] for t in tegels) == b * h, "tegels horen het hele beeld precies te bedekken"
    ongeveer(max(t[4][2] for t in tegels), 100.0)
    ongeveer(max(t[4][3] for t in tegels), 50.0)
    # Te groot gebied: pixelgrootte wordt grover zodat de foto binnen max_pixels past.
    pixel, b, h, _ = lx.plan_luchtfoto(0, 0, 5000, 1000, 0.25, 4096)
    assert b <= 4096 and ongeveer(pixel, 5000 / 4096) is None


def _nep_pdok(url):
    """Geeft een effen tegel terug met de linkeronderhoek (RD) in de kleur verwerkt."""
    from urllib.parse import parse_qs, urlparse

    q = {k: v[0] for k, v in parse_qs(urlparse(url).query).items()}
    x0, y0, _, _ = (float(w) for w in q["BBOX"].split(","))
    b, h = int(q["WIDTH"]), int(q["HEIGHT"])
    beeld = bpy.data.images.new("nep", b, h)
    rood = 1.0 if x0 >= 155000 else 0.0  # rechterhelft rood
    groen = 1.0 if y0 >= 463000 else 0.0  # bovenhelft groen
    beeld.pixels.foreach_set([rood, groen, 0.0, 1.0] * (b * h))
    with tempfile.TemporaryDirectory() as tmp:
        pad = os.path.join(tmp, "nep.png")
        beeld.filepath_raw = pad
        beeld.file_format = "PNG"
        beeld.save()
        bpy.data.images.remove(beeld)
        with open(pad, "rb") as f:
            return f.read()


def test_luchtfoto_draperen():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    lx.bouw_scene(lx.lees_landxml(VOORBEELD), bpy.context, "voorbeeld")
    maaiveld = bpy.data.objects["Maaiveld"]

    oud = lx.PDOK_MAX_TEGEL
    lx.PDOK_MAX_TEGEL = 50  # veel kleine tegels, om het aan elkaar plakken te testen
    try:
        beeld, pixel = lx.drapeer_luchtfoto([maaiveld], pixel=1.0, marge=0.0, download=_nep_pdok)
    finally:
        lx.PDOK_MAX_TEGEL = oud

    assert beeld.packed_file is not None, "foto hoort in het .blend-bestand te zitten"
    assert tuple(beeld.size) == (100, 100)  # 100 m bij 1 m per pixel
    import numpy as np
    px = np.empty(100 * 100 * 4, dtype=np.float32)
    beeld.pixels.foreach_get(px)
    px = px.reshape(100, 100, 4)
    # Pixelrij 0 is de onderkant (zuiden) in Blender.
    assert px[10, 10, 0] < 0.5 and px[10, 10, 1] < 0.5, "linksonder: zuidwest"
    assert px[10, 90, 0] > 0.5 and px[10, 90, 1] < 0.5, "rechtsonder: zuidoost"
    assert px[90, 10, 0] < 0.5 and px[90, 10, 1] > 0.5, "linksboven: noordwest"

    mat = maaiveld.data.materials[0]
    assert mat.name.startswith("Luchtfoto")
    uv = maaiveld.data.uv_layers["Luchtfoto"]
    for lus in maaiveld.data.loops:
        co = maaiveld.data.vertices[lus.vertex_index].co
        u, v = uv.data[lus.index].uv
        ongeveer(u, (co.x + 50) / 100)
        ongeveer(v, (co.y + 50) / 100)


def test_luchtfoto_pdok_echt():
    """Echte download van één kleine tegel; wordt overgeslagen zonder internet."""
    try:
        inhoud = lx._download(lx.luchtfoto_url("Actueel_ortho25", 155000, 463000, 155050, 463050, 200, 200))
    except OSError as fout:
        print("   overgeslagen (geen verbinding met PDOK):", fout)
        return
    assert inhoud[:2] == b"\xff\xd8", "PDOK hoort een JPEG terug te geven"


if __name__ == "__main__":
    for naam, functie in list(globals().items()):
        if naam.startswith("test_"):
            functie()
            print("ok ", naam)
    print("Alle tests geslaagd.")
