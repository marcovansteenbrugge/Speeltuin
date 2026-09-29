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


def maak_tiff(a, nodata=None, rijen_per_strook=16):
    """Schrijft een float32-TIFF zoals PDOK: deflate met 'floating point predictor', in stroken."""
    import struct
    import zlib
    import numpy as np

    h, w = a.shape
    stroken = []
    for y in range(0, h, rijen_per_strook):
        rijen = []
        for rij in a[y:y + rijen_per_strook].astype(">f4"):
            b = rij.view(np.uint8).reshape(w, 4).T.ravel()  # byte-vlakken, meest significant eerst
            rijen.append(np.diff(b, prepend=np.uint8(0)).astype(np.uint8).tobytes())
        stroken.append(zlib.compress(b"".join(rijen)))
    tags = [(256, 3, [w]), (257, 3, [h]), (258, 3, [32]), (259, 3, [8]), (262, 3, [1]),
            (273, 4, None), (277, 3, [1]), (278, 3, [rijen_per_strook]),
            (279, 4, [len(s) for s in stroken]), (317, 3, [3]), (339, 3, [3])]
    if nodata is not None:
        tags.append((42113, 2, str(nodata).encode() + b"\0"))
    codes = {3: "H", 4: "I"}
    kop = 8
    ifd_lengte = 2 + 12 * len(tags) + 4
    extra, extra_plek = b"", kop + ifd_lengte
    waarden = {}
    # Eerst plaats voor lange waarden reserveren; daarna komen de stroken.
    for tag, soort, w_ in tags:
        if tag == 273:
            continue
        ruw = w_ if soort == 2 else struct.pack("<" + codes[soort] * len(w_), *w_)
        if len(ruw) > 4:
            waarden[tag] = ("plek", extra_plek + len(extra))
            extra += ruw
        else:
            waarden[tag] = ("direct", ruw.ljust(4, b"\0"))
    offsets_plek = extra_plek + len(extra)
    extra += b"\0" * 4 * len(stroken)
    data_plek = extra_plek + len(extra)
    offsets = []
    for s in stroken:
        offsets.append(data_plek)
        data_plek += len(s)
    extra = extra[:offsets_plek - extra_plek] + struct.pack("<" + "I" * len(offsets), *offsets)
    waarden[273] = ("plek", offsets_plek) if len(offsets) > 1 else ("direct", struct.pack("<I", offsets[0]))
    ifd = struct.pack("<H", len(tags))
    for tag, soort, w_ in tags:
        aantal = len(w_) if tag != 273 else len(stroken)
        wijze, waarde = waarden[tag]
        ifd += struct.pack("<HHI", tag, soort, aantal) + (struct.pack("<I", waarde) if wijze == "plek" else waarde)
    ifd += b"\0\0\0\0"
    return b"II*\0" + struct.pack("<I", kop) + ifd + extra + b"".join(stroken)


def test_tiff_lezen():
    import numpy as np

    rng = np.random.default_rng(1)
    a = (rng.normal(5, 3, (37, 23))).astype(np.float32)
    a[3, 4] = -9999
    uit = lx.lees_tiff_float(maak_tiff(a, nodata=-9999, rijen_per_strook=10))
    assert np.isnan(uit[3, 4])
    a[3, 4] = np.nan
    assert np.array_equal(np.isnan(uit), np.isnan(a))
    assert np.allclose(uit[~np.isnan(a)], a[~np.isnan(a)], atol=0), "waarden horen exact gelijk te zijn"


def _hoogtekaart(x0, y0, x1, y1, soort):
    """Verzonnen AHN: maaiveld 1 m, bomen van 12 en 18 m, en een 'gebouw' zonder maaiveldwaarde."""
    import numpy as np

    p = lx.AHN_PIXEL
    xs = np.arange(x0 + p / 2, x1, p)
    ys = np.arange(y1 - p / 2, y0, -p)
    X, Y = np.meshgrid(xs, ys)
    dtm = np.full(X.shape, 1.0)
    gebouw = (np.abs(X - 155030) < 5) & (np.abs(Y - 463030) < 5)
    if soort == "dtm_05m":
        dtm[gebouw] = np.nan
        return dtm
    dsm = dtm.copy()
    for bx, by, h, r in ((154980, 462980, 12.0, 4.0), (155020, 462990, 18.0, 5.0)):
        dsm = np.maximum(dsm, 1.0 + h * np.clip(1 - ((X - bx) ** 2 + (Y - by) ** 2) / (r * r), 0, None) ** 0.3)
    dsm[gebouw] = 9.0
    return dsm


def _nep_ahn(url, verwacht=None):
    import re

    dekking = re.search(r"CoverageId=(\w+)", url).group(1)
    x0, x1 = map(float, re.search(r"subset=x\(([^,]+),([^)]+)\)", url).groups())
    y0, y1 = map(float, re.search(r"subset=y\(([^,]+),([^)]+)\)", url).groups())
    return maak_tiff(_hoogtekaart(x0, y0, x1, y1, dekking), nodata=-9999)


def test_bomen_vinden():
    dsm, gx0, gy1 = lx.haal_ahn("dsm_05m", 154950, 462950, 155050, 463050, _nep_ahn)
    dtm, _, _ = lx.haal_ahn("dtm_05m", 154950, 462950, 155050, 463050, _nep_ahn)
    bomen = lx.vind_bomen(dsm, dtm)
    assert len(bomen) == 2, bomen  # het 'gebouw' telt niet: daar heeft het maaiveld geen waarde
    gevonden = sorted((gx0 + (k + 0.5) * 0.5, gy1 - (r + 0.5) * 0.5, h, s) for r, k, h, s in bomen)
    (x1, y1, h1, s1), (x2, y2, h2, s2) = gevonden
    assert abs(x1 - 154980) <= 0.5 and abs(y1 - 462980) <= 0.5 and abs(h1 - 12) < 0.5
    assert abs(x2 - 155020) <= 0.5 and abs(y2 - 462990) <= 0.5 and abs(h2 - 18) < 0.5
    assert 2.0 <= s1 <= 5.0 and 3.0 <= s2 <= 6.0, (s1, s2)


def test_ahn_tegels():
    """Een gebied over meer tegels heen hoort naadloos aan elkaar te sluiten."""
    import numpy as np

    oud = lx.AHN_TEGEL
    lx.AHN_TEGEL = 30.0
    try:
        a, gx0, gy1 = lx.haal_ahn("dsm_05m", 154950.2, 462950.3, 155049.9, 463049.6, _nep_ahn)
    finally:
        lx.AHN_TEGEL = oud
    heel = _hoogtekaart(154950, 462950, 155050, 463050, "dsm_05m")
    assert (gx0, gy1) == (154950.0, 463050.0) and a.shape == heel.shape
    assert np.allclose(a, heel.astype(np.float32))


def _pand(nummer, x, y, dak_hoogte):
    """Eén pand als CityJSON-feature: een doos met een plat dak (in millimeters, zoals de 3D BAG)."""
    v = [(x, y, 0), (x + 5000, y, 0), (x + 5000, y + 4000, 0), (x, y + 4000, 0)]
    v += [(a, b, dak_hoogte) for a, b, _ in v]
    vlakken = [[[0, 3, 2, 1]], [[4, 5, 6, 7]], [[0, 1, 5, 4]], [[1, 2, 6, 5]], [[2, 3, 7, 6]], [[3, 0, 4, 7]]]
    return {
        "type": "CityJSONFeature", "id": f"NL.IMBAG.Pand.{nummer}", "vertices": v,
        "CityObjects": {
            f"NL.IMBAG.Pand.{nummer}": {"type": "Building", "geometry": []},
            f"NL.IMBAG.Pand.{nummer}-0": {"type": "BuildingPart", "geometry": [{
                "type": "Solid", "lod": "2.2", "boundaries": [vlakken],
                "semantics": {"surfaces": [{"type": "GroundSurface"}, {"type": "RoofSurface"},
                                           {"type": "WallSurface"}],
                              "values": [[0, 1, 2, 2, 2, 2]]},
            }]},
        },
    }


def _nep_3dbag(url, verwacht=None):
    import json

    tweede = "offset" in url
    pagina = {
        "type": "FeatureCollection",
        "metadata": {"transform": {"scale": [0.001, 0.001, 0.001], "translate": [155000.0, 463000.0, 0.0]}},
        "features": [_pand(2 if tweede else 1, 10000 if tweede else 0, 0, 6000)],
        "links": [] if tweede else [{"rel": "next", "href": url + "&offset=100"}],
    }
    return json.dumps(pagina).encode()


def test_3dbag_omzetten():
    paginas = lx.haal_3dbag(154900, 462900, 155100, 463100, _nep_3dbag)
    assert len(paginas) == 2, "de volgende pagina hoort opgehaald te worden"
    punten, vlakken, soorten, aantal = lx.gebouwen_uit_3dbag(paginas, "2.2", 155000, 463000)
    assert aantal == 2
    assert soorten.count(1) == 2 and soorten.count(2) == 8, "per pand 1 plat dak en 4 gevels, geen grondvlak"
    dak = [punten[i] for i in vlakken[soorten.index(1)]]
    assert all(abs(z - 6.0) < 1e-6 for _, _, z in dak)
    assert min(p[0] for p in dak) == 0.0 and max(p[0] for p in dak) == 5.0
    assert lx.gebouwen_uit_3dbag(paginas, "1.2")[3] == 0, "LoD 1.2 zit niet in dit nepbestand"


def test_gebouwen_en_bomen_in_blender():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    lx.zet_nulpunt(bpy.context.scene, 155000, 463000)
    sc = bpy.context.scene
    # Maaiveld van 100 x 100 m op 1 m NAP, en een 'ontwerp' dat de oostelijke helft bedekt.
    for naam, x0, x1, z in (("Maaiveld", -50, 50, 1.0), ("Ontwerp", 0, 50, 2.0)):
        me = bpy.data.meshes.new(naam)
        me.from_pydata([(x0, -50, z), (x1, -50, z), (x1, 50, z), (x0, 50, z)], [], [(0, 1, 2, 3)])
        sc.collection.objects.link(bpy.data.objects.new(naam, me))
    maaiveld = bpy.data.objects["Maaiveld"]

    obj, geplaatst, gevonden = lx.plaats_bomen([maaiveld], download=_nep_ahn)
    assert gevonden == 2 and geplaatst == 1, "de boom onder het ontwerp hoort weggelaten te worden"
    zs = [v.co.z for v in obj.data.vertices]
    ongeveer(min(zs), 1.0, 0.01)  # stam staat op het maaiveld
    ongeveer(max(zs), 13.0, 1.0)  # 12 m boom op 1 m NAP
    assert obj.data.materials[0].name == "Boom kruin"

    obj, _, _ = lx.plaats_bomen([maaiveld], alleen_op_selectie=False, download=_nep_ahn)
    assert len(obj.data.vertices) > 0 and obj.name == "Bomen (AHN).001"

    obj, aantal = lx.plaats_gebouwen([maaiveld], download=_nep_3dbag)
    assert aantal == 2 and len(obj.data.polygons) == 10
    assert [m.name for m in obj.data.materials] == ["Gebouw dak", "Gebouw plat dak", "Gebouw gevel"]


def _strook(naam, x0, z0, x1, z1, lengte=200.0):
    me = bpy.data.meshes.new(naam)
    me.from_pydata([(x0, -lengte / 2, z0), (x1, -lengte / 2, z1), (x1, lengte / 2, z1), (x0, lengte / 2, z0)],
                   [], [(0, 1, 2, 3)])
    obj = bpy.data.objects.new(naam, me)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def test_aankleden():
    import numpy as np

    bpy.ops.wm.read_factory_settings(use_empty=True)
    stroken = [
        _strook("Binnentalud_Teelaarde", -20, 0.0, -2, 4.0),
        _strook("Kruin_Asfalt", -2, 4.0, 2, 4.0),
        _strook("Buitentalud_Berm", 2, 4.0, 20, 0.0),
        _strook("Ontwerp_Zetsteen", 2, 4.5, 20, 0.5, lengte=100.0),  # ligt over de helft van de berm
    ]
    lx.kleur_surfaces(stroken)
    telling = lx.aankleden(stroken, schapen_per_ha=30, autos_per_100m=2, mensen_per_100m=3)
    assert telling["schapen"] > 20 and telling["auto's"] >= 2 and telling["mensen"] > 3, telling

    autos = bpy.data.objects["Auto's"]
    p = np.array([v.co[:] for v in autos.data.vertices])
    assert np.abs(p[:, 0]).max() < 2.3, "auto's horen (bijna) binnen de 4 m brede weg te staan"
    assert abs(p[:, 2].min() - 4.0) < 0.05, "banden horen op het asfalt te staan"

    schapen = bpy.data.objects["Schapen"]
    p = np.array([v.co[:] for v in schapen.data.vertices])
    assert np.abs(p[:, 0]).min() > 1.0, "geen schapen op de weg"
    oost = p[p[:, 0] > 2]
    assert len(oost) == 0 or (np.abs(oost[:, 1]) > 49).all(), "geen schapen onder het ontwerp"

    # Opnieuw uitvoeren vervangt de vorige aankleding.
    lx.aankleden(stroken, variatie=2)
    assert "Schapen.001" not in bpy.data.objects and bpy.data.objects["Schapen"].users_collection


def test_pdok_en_3dbag_echt():
    """Echte AHN- en 3D BAG-gegevens rond het RD-nulpunt in Amersfoort; overgeslagen zonder internet."""
    import numpy as np

    try:
        dsm, _, _ = lx.haal_ahn("dsm_05m", 155000, 463000, 155060, 463040)
        dtm, _, _ = lx.haal_ahn("dtm_05m", 155000, 463000, 155060, 463040)
        paginas = lx.haal_3dbag(155000, 463000, 155060, 463040)
    except OSError as fout:
        print("   overgeslagen (geen verbinding):", fout)
        return
    assert dsm.shape == (80, 120)
    assert np.nanmin(dsm) > -10 and np.nanmax(dsm) < 150, "hoogtes horen in NAP-meters te staan"
    verschil = dsm - dtm
    assert np.nanmedian(verschil) >= -0.2, "DSM hoort op of boven het maaiveld te liggen"
    punten, vlakken, soorten, aantal = lx.gebouwen_uit_3dbag(paginas, "2.2", 155000, 463000)
    assert aantal > 0 and (0 in soorten or 1 in soorten)


if __name__ == "__main__":
    for naam, functie in list(globals().items()):
        if naam.startswith("test_"):
            functie()
            print("ok ", naam)
    print("Alle tests geslaagd.")
