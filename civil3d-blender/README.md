# Civil 3D naar Blender (LandXML-import)

Een gratis Blender-add-on die de **LandXML-export van Civil 3D** inleest. Je hebt geen FBX- of IFC-export nodig: LandXML zit in elke Civil 3D.

![Voorbeeld: maaiveld, as met boog, riolering en band](voorbeeld/voorbeeld.png)

## Wat wordt ingelezen

| Civil 3D | In Blender |
| --- | --- |
| Surface (TIN) | Mesh, met gaten en randen zoals in Civil 3D |
| Pipe network | Putten (rond of rechthoekig, van bodem tot deksel) en leidingen op de juiste BOB |
| Alignment + ontwerpprofiel | 3D-lijn over het lengteprofiel, inclusief verticale bogen |
| Feature line | 3D-lijn |

Leidingen en putten krijgen hun gegevens mee als eigenschappen (BOB begin/eind, diameter, maaiveld, bodem): selecteer een object en kijk bij *Object Properties > Custom Properties*.

## 1. Exporteren uit Civil 3D

1. Tabblad **Uitvoer** (*Output*) > **Exporteren naar LandXML** (*Export to LandXML*).
2. Vink aan wat je mee wilt nemen: surfaces, alignments, pipe networks, feature lines.
3. Sla op als `.xml`.

Werk in meters. Andere eenheden (voet, inch, millimeter voor diameters) worden automatisch omgerekend.

## 2. Add-on installeren in Blender

1. Download `landxml_import.py`.
2. Blender: **Edit > Preferences > Add-ons**, klik rechtsboven op het pijltje ▾ > **Install from Disk…**
3. Kies `landxml_import.py` en zet het vinkje aan bij *LandXML-import (Civil 3D)*.

Daarna staat **LandXML (.xml)** in *File > Import*.

## 3. Importeren

*File > Import > LandXML (.xml)* en kies het bestand.

### Het nulpunt

Blender rekent onnauwkeurig met grote getallen zoals RD-coördinaten (X=155000, Y=463000): het model gaat trillen en flikkeren. De importer verschuift alles daarom naar een lokaal nulpunt: het midden van het model, afgerond op 100 m. Hoogtes (NAP) blijven zoals ze zijn.

- Het nulpunt staat in de scène als object **RD-nulpunt**, met de RD-waarden als eigenschappen `rd_x` en `rd_y`.
- Een volgende import in dezelfde scène gebruikt hetzelfde nulpunt, zodat meerdere bestanden op elkaar aansluiten.
- Wil je zelf een nulpunt kiezen, vul dan *Nulpunt X* en *Nulpunt Y* in het importvenster in.

Een punt in Blender terugrekenen naar RD: `RD-X = Blender-X + rd_x`, `RD-Y = Blender-Y + rd_y`.

## Opdrachtregel

Zonder de Blender-interface, bijvoorbeeld voor een reeks bestanden of als Claude het aanstuurt:

```
blender --background --python landxml_import.py -- invoer.xml uitvoer.blend
```

## Beperkingen

- Overgangsbogen (clothoïdes) in alignments worden benaderd met een vloeiende boog door het snijpunt. Voor visualisatie is dat ruim voldoende, voor maatvoering niet.
- Alignments zonder ontwerpprofiel komen op hoogte 0 te liggen, tenzij er een maaiveldprofiel in het bestand staat.
- Rechthoekige en eivormige leidingen worden als ronde buis getekend, met de grootste maat als diameter.
- Leidingen lopen van hart put tot hart put.
- Corridors staan niet als 3D-model in LandXML. Exporteer de corridor-surfaces (bijvoorbeeld *Top* en *Datum*) als surface, dan komen ze wel mee.

## Testen

`voorbeeld/voorbeeld.xml` is een verzonnen bestand in hetzelfde formaat als een Civil 3D-export. De test draait met de Blender Python-module (`pip install bpy`) of met Blender zelf:

```
python test_landxml.py
blender --background --python test_landxml.py
```
