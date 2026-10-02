# Speeltuin: Project Root

## Project Overview
Speeltuin is een verzamelplek voor kleine experimenten. Het eerste project is het VCA-VOL Oefenplein (`vca-vol/`): een leer- en oefenomgeving voor het VCA-VOL-examen, met lesstof, borden en symbolen, gevaren spotten, oefenvragen en een proefexamen.

## Repository Structure
```
/
├── vca-vol/             # VCA-VOL Oefenplein: index.html, app.js, lesstof.js, vragen.js, borden.js, scenes.js
├── docs/                # Plannen en beslisdocumenten (zie "Plan en besluit")
├── memory/              # Geheugenarchief (MEMORY.md is de index)
└── CLAUDE.md            # Dit bestand
```

## Tech Stack
| Laag | Technologie |
|---|---|
| Frontend | HTML, CSS en vanilla JavaScript, zonder build-stap |
| Data | JS-bestanden in `vca-vol/` (lesstof, vragenbank, borden, scènes) |
| Opslag | localStorage in de browser van de gebruiker |
| Backend | geen |
| CI/CD | geen |
| Hosting | {{...}} |

## Architectuur
- Geen build-stap en geen afhankelijkheden: `vca-vol/index.html` werkt direct in de browser (alleen de lettertypen komen van Google Fonts).
- Voortgang wordt alleen in de browser bewaard (localStorage); er is geen server en er gaan geen gegevens weg.
- Vragenbank in `vca-vol/vragen.js` heeft het formaat `[onderwerp, vraag, [juist, fout, fout], uitleg]`: het juiste antwoord staat altijd eerst.

---

## Git-regels
- Altijd een worktree: elke implementatietaak krijgt een eigen worktree-branch, nooit direct op de hoofdbranch.
- {{Taal van commit messages, welke tak de hoofdtak is.}}
- Nooit `--force` zonder expliciete toestemming.

## Testing Strategy
Er is nog geen geautomatiseerde testsuite en geen CI. Controle gebeurt nu door `vca-vol/index.html` in de browser te openen.

---

## Gedragsregels
- Vraag door bij twijfel; nooit aannames doen over intentie of scope.
- Leg na elke wijziging kort uit wat en waarom.
- Werk in stappen: één logische eenheid per keer, niet alles ineens.
- Vraag altijd bevestiging vóór destructieve acties.

## Plan en besluit
<!-- brbnt-plan-regel: v1 -->
- Bij een nieuwe functie, een wijziging die uit meer dan één fase bestaat, een schema- of architectuurwijziging, of wanneer de gebruiker erom vraagt: stel eerst een plan en een beslisdocument op met de skill `brbnt-plan`, ook wanneer je in plan mode werkt. Bij een kleine, afgebakende fix is dat niet nodig.
- Bouw nooit voordat de beslisser akkoord heeft gegeven voor die fase in het beslisdocument. Ontbreekt het akkoord, of is het niet expliciet genoeg, dan stel je voor om het eerst op te halen in plaats van te beginnen.
- Plannen en beslisdocumenten staan in `docs/` als `<naam>.plan.md` en `<naam>.beslis.md`. Zoek eerst in `plan-beslis-index.md`, lees dan het beslisdocument, en open het plan alleen als je techniek nodig hebt.
- Commit-berichten voor planwerk beginnen met de fase-prefix uit het plan, bijvoorbeeld `F2:`.

## Scope-grenzen
{{Welke map hoort bij welke verantwoordelijkheid, bijv. of elke submap een los project is.}}

## Conventies die worden afgedwongen (niet alleen gedocumenteerd)
Afgedwongen:
- (nog geen)

Nog niet afgedwongen, wel afgesproken:
- In `vca-vol/vragen.js` staat het juiste antwoord altijd eerst: alleen een afspraak, nog niet getest.
