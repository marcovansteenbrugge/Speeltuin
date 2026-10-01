# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository

"Speeltuin" is een verzameling losse projecten, elk in een eigen map. Op dit moment is er één: `vca-vol/`, de **VCA-VOL Oefenplein**, een leer- en oefenomgeving voor het VCA-VOL-examen. Alle teksten in de app (UI, lesstof, vragen) en de code-commentaren zijn Nederlands; houd dat zo.

## vca-vol: draaien en controleren

Statische site zonder dependencies, zonder build-stap en zonder tests. Openen: `vca-vol/index.html` in een browser (of `python3 -m http.server` in `vca-vol/` en dan `http://localhost:8000`). Een tab direct openen kan met een hash: `#leren`, `#borden`, `#spotten`, `#oefenen`, `#examen`.

Snelle controle dat alle databestanden parsen en wat ze opleveren (vanuit `vca-vol/`):

```sh
node -e 'global.window={};for(const f of ["vragen","borden","scenes","lesstof"])require("./"+f+".js");console.log(window.VCA_VRAGEN.length,window.VCA_BORDEN.SIGNS.length,window.VCA_SCENES.length,window.VCA_LESSTOF.MODS.length)'
```

`app.js` kun je zo niet laden (gebruikt `document`/`localStorage`); controleer die met `node --check app.js` en in de browser.

## vca-vol: architectuur

Gewone `<script>`-tags, geen modules. `index.html` laadt in vaste volgorde `vragen.js`, `borden.js`, `scenes.js`, `lesstof.js` en als laatste `app.js`. Elk databestand is een IIFE die één globale zet; `app.js` leest die en valt terug op lege waarden als een bestand ontbreekt:

| Globale | Bron | Vorm |
| --- | --- | --- |
| `window.VCA_VRAGEN` | `vragen.js` | `[modId, vraag, [juist, fout, fout(, fout)], uitleg]` — het **juiste antwoord staat altijd op index 0**; `app.js` schudt de opties bij het tonen (`prep`) |
| `window.VCA_LESSTOF` | `lesstof.js` | `{ MODS, DIAG }`: `MODS` = onderwerpen (`id`, `t`, `k`, `fig`, `secs`), `DIAG` = functies die schema-HTML teruggeven. Sectievelden: `h` kop, `p` alinea (HTML), `d` schema vóór de lijst, `l` opsomming, `o` stappen, `d2` schema na de lijst |
| `window.VCA_BORDEN` | `borden.js` | `{ CAT, SIGNS, svg(id), shape(cat) }`. Een bord = entry in `SIGNS` (`id`, `cat`, `naam`, `uitleg`) + een symboolfunctie in `SYM[id]`; het kader komt uit `FRAME[cat]`. SVG's: viewBox `0 0 100 100`, vaste kleuren, geen id's/defs/`<style>` |
| `window.VCA_SCENES` | `scenes.js` | lijst scènes `{ id, titel, intro, viewBox, svg, hazards }`; `svg` is binnen-markup opgebouwd met tekenhulpjes, elk gevaar is een klikrechthoek `{ id, x, y, w, h, titel, uitleg }` in viewBox-coördinaten (800×460) |

Koppelingen tussen bestanden:
- Het eerste veld van een vraag moet een bestaand `MODS[].id` uit `lesstof.js` zijn; vragen met een onbekend onderwerp worden stilzwijgend weggefilterd.
- **Vraag-id's zijn positioneel**: `app.js` maakt ze als `<modId>-<volgnummer binnen dat onderwerp>`. Ze staan in localStorage (lijst met eigen fouten). Een vraag tussenvoegen, verwijderen of verplaatsen binnen een onderwerp verschuift de id's van de vragen erna; nieuwe vragen dus bij voorkeur achteraan het onderwerp toevoegen.

`app.js` (één IIFE):
- **State**: één object `S` in localStorage onder sleutel `vca-vol-oefenplein.v1` (`read`, `stats` per onderwerp `{g,n}`, `wrong`, `exams` (max 12), `found` per scène). Altijd via `save()` wegschrijven; lees/schrijf staat in try/catch. Wijzig je de vorm, bump dan de sleutelversie of maak de defaults in de `Object.assign` compatibel.
- **Weergave**: vijf tabs (`TABS`) met elk een `#v-<tab>`-container en een renderfunctie in `RENDER`. Renderfuncties bouwen HTML-strings en zetten `innerHTML` opnieuw; gebruikersgerichte tekst door `esc()` halen (lesstof-velden zijn bewust HTML).
- **Interactie**: één gedelegeerde click-listener op `[data-act]`; de actie staat in `ACT[data-act]` en krijgt `data-arg` mee. Nieuwe knoppen: voeg een `ACT`-entry toe in plaats van eigen listeners. Toetsenbord: A–D / 1–4 kiest een antwoord, pijltjes navigeren in het examen.
- **Proefexamen**: `EX = {n:70, min:105}`, slagen bij 70% (49 van 70). Vragen worden evenwichtig over de onderwerpen getrokken. Afronden registreert elke vraag in `stats`/`wrong`.
- **Gevaren spotten**: klikposities worden via `getScreenCTM()` omgezet naar viewBox-coördinaten en met 6 px marge tegen de `hazards`-rechthoeken getest.

Opmaak staat volledig in `index.html`: CSS-variabelen op `:root` met een donkere variant (`prefers-color-scheme` en `[data-theme="dark"]`); gebruik die tokens in plaats van losse kleuren. Lettertypen komen van Google Fonts met systeemfallbacks.

De app is een leerhulpmiddel, geen officieel examenmateriaal; inhoud moet wel feitelijk kloppen met de VCA-VOL-stof.
