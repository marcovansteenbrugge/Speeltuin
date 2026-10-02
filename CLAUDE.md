# Speeltuin: Project Root

## Project Overview
Speeltuin is een verzamelrepo voor kleine, losse projecten, elk in een eigen map. Op dit moment staat er één project in: `vca-vol/`, het VCA-VOL Oefenplein, een statische leer- en oefenomgeving voor het VCA-VOL-examen.

## Repository Structure
```
/
├── vca-vol/             # VCA-VOL Oefenplein: statische app (index.html + JS-modules)
├── .claude/skills/      # BRBNT-skills voor dit project
├── docs/                # Plannen en beslisdocumenten (zie "Plan en besluit")
├── memory/              # Geheugenarchief (laag 2), index in MEMORY.md
└── CLAUDE.md            # Dit bestand
```

## Tech Stack
| Laag | Technologie |
|---|---|
| Frontend | Vanilla HTML, CSS en JavaScript, zonder build-stap (`vca-vol/index.html`) |
| Backend | Geen |
| Data | Inhoud in JS-modules (`vca-vol/vragen.js`, `lesstof.js`, `borden.js`, `scenes.js`); voortgang alleen in `localStorage` van de browser |
| Database | Geen |
| CI/CD | Nog geen |
| Hosting | {{...}} |

## Architectuur
- Elk project is zelfstandig en staat in een eigen top-level map; projecten delen geen code.
- `vca-vol/` draait volledig in de browser: openen van `index.html` is genoeg, er is geen server of build.
- In `vca-vol/vragen.js` heeft elke vraag de vorm `[onderwerp, vraag, [juist, fout, fout], uitleg]`; het juiste antwoord staat altijd eerst.

---

## Git-regels
- Commit-berichten in het Nederlands.
- Werk altijd op een eigen tak en breng wijzigingen via een pull request naar `main`; nooit direct op `main`.
- Nooit `--force` zonder expliciete toestemming.

## Testing Strategy
Er zijn nog geen geautomatiseerde tests en geen CI-pijplijn. Controle gebeurt nu door de app in de browser te openen.

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
- Elk project staat in een eigen top-level map (zoals `vca-vol/`). Een wijziging voor een project raakt alleen die map, en nooit de map van een ander project.
- Projectspecifieke regels mogen in een eigen CLAUDE.md in die map (bijvoorbeeld `vca-vol/CLAUDE.md`); dit bestand bevat alleen regels voor de hele repo.

## Conventies die worden afgedwongen (niet alleen gedocumenteerd)
Afgedwongen:
- _(nog geen)_

Nog niet afgedwongen, wel afgesproken:
- In `vca-vol/vragen.js` staat het juiste antwoord altijd eerst: alleen een afspraak, nog niet getest.
- Wijzigingen via een pull request naar `main`: alleen een afspraak, nog niet afgedwongen.
