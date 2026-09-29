# Workflow: van Civil 3D-ontwerp naar beeld

Stappenplan om een ontwerp uit Civil 3D (bijvoorbeeld een dijkvak) om te zetten naar een render met de echte omgeving eromheen. De knoppen komen uit de add-on `landxml_import.py`; zie de [handleiding](README.md) voor de details per knop.

```
Civil 3D ──LandXML──▶ Blender ──▶ materialen ──▶ omgeving ──▶ aankleden ──▶ licht + camera ──▶ render ──▶ (AI-impressie)
                                                 luchtfoto
                                                 gebouwen
                                                 bomen
```

## 0. Eenmalig instellen

- [ ] Blender installeren: blender.org, **LTS-versie**.
- [ ] Add-on installeren: *Edit → Preferences → Add-ons → ▾ → Install from Disk* → `landxml_import.py`, vinkje aan. Herstart Blender. Voor een nieuwe versie doe je hetzelfde.
- [ ] Voor snelle renders met Cycles: *Edit → Preferences → System → Cycles Render Devices* → je videokaart (NVIDIA: **OptiX**).

## 1. Civil 3D: exporteren

- [ ] Geef surfaces een naam met een herkenbaar woord: *Teelaarde*, *Berm*, *Beheerstrook*, *Zetsteen*, *Asfalt*, *Bermverharding*, *Ontgraving*, … Dan krijgen ze in Blender vanzelf het goede materiaal.
- [ ] Werk in meters.
- [ ] *Uitvoer → Exporteren naar LandXML*. Vink aan: surfaces, alignments, pipe networks, feature lines. Sla op als `.xml`.

## 2. Blender: importeren

- [ ] Nieuw bestand. Verwijder de standaardkubus (klik erop, **Delete**).
- [ ] *File → Import → LandXML (.xml)*.
- [ ] Muis in het grote beeld, toets **Home**: alles in beeld.
- [ ] **Meteen opslaan** (*File → Save As*). Het RD-nulpunt staat nu in het bestand.

## 3. Opruimen

- [ ] Surfaces die je niet wilt zien (bijvoorbeeld *Ontgraving*): in de lijst rechtsboven het **oogje** én het **camera-icoontje** uit. Of verwijderen: rechtermuisknop → *Delete*.
- [ ] Flikkerende strepen betekenen dat twee surfaces op elkaar liggen. Zet er één uit.

## 4. Materialen

- [ ] Surfaces krijgen bij de import al een materiaal op basis van hun naam. Bij een ouder bestand: **A** (alles selecteren) → *Object → Materialen op naam (surfaces)*.
- [ ] Kleur of uiterlijk bijstellen: pas het gedeelde materiaal aan (*Oppervlak gras*, *Oppervlak steen*, …). Alle surfaces van die soort veranderen mee.
- [ ] Bekijken: toets **Z** → *Material Preview*.

## 5. Omgeving

Selecteer telkens **alleen het bestaande maaiveld** (in ons voorbeeld *Dijkvak 02*).

- [ ] *Object → Luchtfoto draperen (PDOK)*: kies 25 cm of 8 cm.
- [ ] *Object → Gebouwen laden (3D BAG)*: LoD 2.2, marge 50 m.
- [ ] *Object → Bomen plaatsen (AHN)*: minimale hoogte 3 m, "Alleen op de selectie" aan.

## 6. Aankleden

- [ ] **A** (alles selecteren) → *Object → Aankleden (schapen, mensen, auto's)*.
- [ ] Andere verdeling: opnieuw uitvoeren met een ander getal bij **Variatie**. Alleen wat je plaatst wordt vervangen; zet een soort op 0 om die te laten staan.

## 7. Licht en lucht

- [ ] Tabblad **World** (rood wereldbolletje) → geel bolletje bij *Color* → **Sky Texture**. Zet *Strength* op 0,1–0,3 en de zon op ca. 30° hoogte.
  Alternatief: een echte fotolucht (HDRI) van polyhaven.com via *Environment Texture*.
- [ ] Gebruik de Sky Texture of een zon-lamp, niet allebei.
- [ ] Kleuren precies zoals gekozen? *Render Properties → Color Management → View Transform: Standard* (AgX geeft een natuurlijker, maar fletser beeld).

## 8. Camera

- [ ] Eerst het formaat: *Output Properties* (printer-icoontje) → 1920 × 1080 (of 3840 × 2160).
- [ ] Beeld goed zetten (draaien: middelste muisknop, schuiven: Shift + middelste muisknop, zoomen: scrollwiel).
- [ ] *Add → Camera*, daarna *View → Align View → Align Active Camera to View*.
- [ ] Bijstellen: **N** → tabblad *View* → *Camera to View* aan, bijschuiven, weer uit.
- [ ] Valt er iets weg in de verte: camera selecteren → groen camera-icoontje → *Clip End* 5000 m.

## 9. Renderen

- [ ] *Render Properties* → Render Engine **EEVEE** (snel) of **Cycles** (mooiste; *GPU Compute*, 128 samples, Denoise aan). **Niet Workbench**: die toont geen materialen.
- [ ] Controle vooraf: vierde bolletje rechtsboven (*Rendered*).
- [ ] **F12** → in het render-venster *Image → Save As* → PNG (kwaliteit) of JPEG (klein).
- [ ] Het `.blend`-bestand opslaan (**Ctrl + S**): camera en instellingen blijven bewaard voor een volgende versie van het ontwerp.

Snelle variant zonder camera: *View → Viewport Render Image* (overlays eerst uit).

## 10. AI-impressie (optioneel)

- [ ] Toestemming: mag het ontwerp naar een externe (Amerikaanse of Chinese) dienst? Check contract en beleid.
- [ ] Collectie **Aankleding uitzetten** (camera-icoontje). AI-tools nemen maquettefiguren anders letterlijk over. Beschrijf schapen, auto's en mensen in de prompt.
- [ ] Render of camerafilmpje als basis naar bijvoorbeeld **Seedance 2.5** (via Dreamina, met Blender-plugin), of Runway, Kling of Luma.
- [ ] Echte foto's als begin- en eindbeeld: camera in Blender op dezelfde plek, foto's op hetzelfde moment van de dag (zelfde zonrichting).
- [ ] Label het resultaat als **"AI-impressie"**. Laat voor besluiten ook het Blender-beeld zien; dat is maatvast.

## 11. Bronvermelding bij delen

> Luchtfoto: Beeldmateriaal Nederland (PDOK). Gebouwen: 3D BAG (3DGI / TU Delft). Bomen en hoogte: AHN (PDOK).

---

## Als het niet doet wat je verwacht

| Wat je ziet | Oorzaak | Oplossing |
| --- | --- | --- |
| Alles grijs, kleuren veranderen niet | Weergave staat op *Solid* | **Z** → *Material Preview* |
| Materiaalpaneel heeft geen *Surface*-deel | Render engine staat op *Workbench* | *Render Properties* → **EEVEE** |
| Render is anders dan het beeld (bijvoorbeeld alles groen) | Een surface is met het oogje verborgen, maar zit nog in de render | Ook het **camera-icoontje** uitzetten |
| Donkere strepen die flikkeren | Twee surfaces liggen precies op elkaar | Eén van de twee uitzetten |
| Surfaces kwijt hun kleur na de luchtfoto | De luchtfoto gaat op **alle** geselecteerde objecten | Alleen het maaiveld selecteren; herstellen met *Materialen op naam* |
| Dijk heel klein in het camerabeeld | Camera staat nog op de standaardplek | Uit camerabeeld (middelste muisknop), beeld goed zetten, *Align Active Camera to View* |
| Render donker | Geen of te zwak licht | Sky Texture of zon (Strength ca. 4) |
| Materiaal verandert op alle surfaces tegelijk | Het materiaal is gedeeld | Op het getal naast de materiaalnaam klikken: eigen kopie |
| Luchtfoto niet te zien | Weergave of render engine | *Material Preview* en EEVEE; of Solid-weergave → ▾ → Color: *Texture* |
