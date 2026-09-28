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


if __name__ == "__main__":
    for naam, functie in list(globals().items()):
        if naam.startswith("test_"):
            functie()
            print("ok ", naam)
    print("Alle tests geslaagd.")
