# Speeltuin: Project Root

<!--
  DOEL VAN DIT BESTAND
  Dit is laag 1 van de methode: statische werkregels die bij ELKE sessie
  automatisch meekomen. Houd het kort en stabiel. Alles wat vaak verandert,
  incidenteel is, of een "waarom" nodig heeft, hoort in memory/MEMORY.md (laag 2),
  niet hier.
-->

## Project Overview
"Speeltuin" is een verzameling losse projecten, elk in een eigen map. Op dit moment is er één: `vca-vol/`, de **VCA-VOL Oefenplein**, een leer- en oefenomgeving (lesstof, borden, gevaren spotten, oefenvragen, proefexamen) voor het VCA-VOL-examen. Het is een leerhulpmiddel, geen officieel examenmateriaal; de inhoud moet wel feitelijk kloppen met de VCA-VOL-stof.

## Repository Structure
```
/
├── .claude/skills/   # BRBNT-skills: project-setup, memory, skill-scaffold, parallel-setup
├── memory/           # Laag 2: geheugenarchief, index in MEMORY.md
├── vca-vol/          # VCA-VOL Oefenplein (statische webapp)
│   ├── index.html    #   pagina, alle CSS, laadt de scripts
│   ├── app.js        #   navigatie, oefenmodus, proefexamen, quiz, gevaren spotten
│   ├── lesstof.js    #   lesstof per onderwerp en schema's
│   ├── vragen.js     #   vragenbank
│   ├── borden.js     #   borden en GHS-pictogrammen als SVG
│   ├── scenes.js     #   scènes voor gevaren spotten, met klikgebieden
│   └── README.md
└── CLAUDE.md         # Dit bestand
```

## Tech Stack
| Laag | Technologie |
|---|---|
| Frontend | Plain HTML, CSS en JavaScript (geen framework, geen modules, geen build-stap) |
| Data | JavaScript-bestanden die elk één globale `window.VCA_*` zetten |
| Opslag | `localStorage` in de browser van de gebruiker |
| Lettertypen | Google Fonts (Barlow Condensed, Source Sans 3, IBM Plex Mono) met systeemfallbacks |
| CI/CD | Geen |
| Hosting | Geen; `vca-vol/index.html` openen in een browser |

## Architectuur
- **Scriptvolgorde:** gewone `<script>`-tags. `index.html` laadt in vaste volgorde `vragen.js`, `borden.js`, `scenes.js`, `lesstof.js` en als laatste `app.js`. Elk databestand is een IIFE die één globale zet; `app.js` leest die en valt terug op lege waarden als een bestand ontbreekt.
- **Datavormen:**
  - `window.VCA_VRAGEN` (`vragen.js`): `[modId, vraag, [juist, fout, fout(, fout)], uitleg]`. Het **juiste antwoord staat altijd op index 0**; `app.js` schudt de opties bij het tonen (`prep`).
  - `window.VCA_LESSTOF` (`lesstof.js`): `{ MODS, DIAG }`. `MODS` = onderwerpen (`id`, `t`, `k`, `fig`, `secs`), `DIAG` = functies die schema-HTML teruggeven. Sectievelden: `h` kop, `p` alinea (HTML), `d` schema vóór de lijst, `l` opsomming, `o` stappen, `d2` schema na de lijst.
  - `window.VCA_BORDEN` (`borden.js`): `{ CAT, SIGNS, svg(id), shape(cat) }`. Een bord = entry in `SIGNS` (`id`, `cat`, `naam`, `uitleg`) + een symboolfunctie in `SYM[id]`; het kader komt uit `FRAME[cat]`. SVG's: viewBox `0 0 100 100`, vaste kleuren, geen id's/defs/`<style>`.
  - `window.VCA_SCENES` (`scenes.js`): lijst scènes `{ id, titel, intro, viewBox, svg, hazards }`. `svg` is binnen-markup opgebouwd met tekenhulpjes; elk gevaar is een klikrechthoek `{ id, x, y, w, h, titel, uitleg }` in viewBox-coördinaten (800×460).
- **Koppelingen tussen bestanden:**
  - Het eerste veld van een vraag moet een bestaand `MODS[].id` uit `lesstof.js` zijn; vragen met een onbekend onderwerp worden stilzwijgend weggefilterd.
  - **Vraag-id's zijn positioneel**: `app.js` maakt ze als `<modId>-<volgnummer binnen dat onderwerp>`. Ze staan in localStorage (lijst met eigen fouten). Een vraag tussenvoegen, verwijderen of verplaatsen binnen een onderwerp verschuift de id's van de vragen erna; nieuwe vragen dus bij voorkeur achteraan het onderwerp toevoegen.
- **`app.js` (één IIFE):**
  - **State:** één object `S` in localStorage onder sleutel `vca-vol-oefenplein.v1` (`read`, `stats` per onderwerp `{g,n}`, `wrong`, `exams` (max 12), `found` per scène). Altijd via `save()` wegschrijven; lezen en schrijven staan in try/catch.
  - **Weergave:** vijf tabs (`TABS`) met elk een `#v-<tab>`-container en een renderfunctie in `RENDER`. Renderfuncties bouwen HTML-strings en zetten `innerHTML` opnieuw; gebruikersgerichte tekst door `esc()` halen (lesstof-velden zijn bewust HTML).
  - **Interactie:** één gedelegeerde click-listener op `[data-act]`; de actie staat in `ACT[data-act]` en krijgt `data-arg` mee. Nieuwe knoppen: voeg een `ACT`-entry toe in plaats van eigen listeners. Toetsenbord: A–D / 1–4 kiest een antwoord, pijltjes navigeren in het examen.
  - **Proefexamen:** `EX = {n:70, min:105}`, slagen bij 70% (49 van 70). Vragen worden evenwichtig over de onderwerpen getrokken. Afronden registreert elke vraag in `stats`/`wrong`.
  - **Gevaren spotten:** klikposities worden via `getScreenCTM()` omgezet naar viewBox-coördinaten en met 6 px marge getest tegen de `hazards`-rechthoeken.
- **Opmaak** staat volledig in `index.html`: CSS-variabelen op `:root` met een donkere variant (`prefers-color-scheme` en `[data-theme="dark"]`). Gebruik die tokens in plaats van losse kleuren.

---

## Git-regels
- Commitberichten in het Nederlands.
- Direct committen op `main` is toegestaan.
- Nooit `--force` zonder expliciete toestemming.

## Testing Strategy
Er zijn geen tests, geen linter en geen CI. Controleren gaat zo:

- **App draaien:** `vca-vol/index.html` openen in een browser, of `python3 -m http.server` in `vca-vol/` en dan `http://localhost:8000`. Een tab direct openen kan met een hash: `#leren`, `#borden`, `#spotten`, `#oefenen`, `#examen`.
- **Databestanden parsen en tellen** (vanuit `vca-vol/`):
  ```sh
  node -e 'global.window={};for(const f of ["vragen","borden","scenes","lesstof"])require("./"+f+".js");console.log(window.VCA_VRAGEN.length,window.VCA_BORDEN.SIGNS.length,window.VCA_SCENES.length,window.VCA_LESSTOF.MODS.length)'
  ```
- **`app.js`** kun je zo niet laden (gebruikt `document`/`localStorage`); controleer die met `node --check app.js` en in de browser.

## Opslagregels (localStorage)
- Er is geen database. De voortgang staat in localStorage onder `vca-vol-oefenplein.v1`.
- Wijzig je de vorm van `S`, verhoog dan de sleutelversie of maak de defaults in de `Object.assign` compatibel, zodat bestaande voortgang niet breekt.

---

## Gedragsregels
- Alle teksten in de apps (UI, lesstof, vragen) en de code-commentaren zijn Nederlands; houd dat zo.
- Vraag door bij twijfel; nooit aannames doen over intentie of scope.
- Leg na elke wijziging kort uit wat en waarom.
- Werk in stappen: één logische eenheid per keer, niet alles ineens.
- Vraag altijd bevestiging vóór destructieve acties.

## Scope-grenzen
- Elk project leeft in een eigen top-level map en is op zichzelf staand; `vca-vol/` verwijst niet naar bestanden buiten die map.

## Conventies die worden afgedwongen (niet alleen gedocumenteerd)
<!--
  Dit is de brug naar laag 3: zodra een conventie belangrijk genoeg is om hier
  te noemen, overweeg hem vast te leggen in een test (architectuurtest via
  reflectie, contractest, linter-regel), zodat naleving niet van geheugen
  afhangt. Noteer hier waar die test staat.
-->
- Nog geen: er zijn geen tests of lint-regels die conventies afdwingen.
- {{Regel}}: afgedwongen door `{{pad naar test/lint-regel}}`
