---
name: brbnt-project-setup
description: Richt laag 1 en 2 van het BRBNT-systeem in voor het huidige project, een CLAUDE.md-instructiebestand en een memory/-archief (MEMORY.md), ingevuld op basis van wat er al in de codebase staat. Bestaat er al een instructiebestand, dan migreert deze skill het: back-up eerst, daarna een nieuw gestandaardiseerd CLAUDE.md, met incidentele regels verplaatst naar het geheugenarchief. Gebruik dit wanneer iemand vraagt om een instructiebestand, geheugensysteem of CLAUDE.md op te zetten of te migreren, "laag 1 en 2 van BRBNT" wil inrichten, net gestart is met Module 1 van de BRBNT-workshop, of vraagt "zet mijn project klaar voor AI-samenwerking". Dit is een eenmalige actie per project (niet: elke keer opnieuw aanroepen).
---

# BRBNT project-setup: CLAUDE.md + memory/

Dit is de eerste van vier BRBNT-skills (`brbnt-project-setup`, `brbnt-memory`,
`brbnt-skill-scaffold`, `brbnt-parallel-setup`) die samen de zeven trainingssjablonen
uit de starter-kit vervangen: in plaats van dat de gebruiker zelf `.template`-bestanden
kopieert, hernoemt en met de hand invult, doet deze skill dat gericht, op basis van
wat er in het project staat, en met bevestiging vooraf.

## Wat dit doet
Zet **laag 1** (CLAUDE.md, statische werkregels) en **laag 2** (memory/MEMORY.md, het
opvraagbare archief) op voor het huidige project. Werkt in twee scenario's, die de
skill zelf herkent in stap 1:

- **Geen bestaand instructiebestand (route B):** inspecteert het project, vult de
  sjabloonsecties in, vraagt gericht naar de resterende beleidskeuzes, en schrijft
  pas na bevestiging.
- **Bestaand instructiebestand (route A):** back-upt het origineel eerst, altijd,
  zonder te vragen. Combineert daarna de bestaande inhoud met een verse
  projectinspectie tot een nieuw gestandaardiseerd CLAUDE.md, en verplaatst
  incidentele regels (uitzonderingen, eenmalige besluiten) naar een gemigreerd
  geheugenbestand in `memory/`, in plaats van ze in laag 1 te laten staan.

Beide routes sluiten af met een rapport, zodat het resultaat altijd te controleren
en (bij route A dankzij de back-up) terug te draaien is.

## Contract (hard, niet onderhandelbaar binnen deze skill)
- **Een bestaand CLAUDE.md wordt nooit zonder back-up overschreven.** Bestaat het
  bestand al, dan wordt het als allereerste actie gekopieerd naar
  `CLAUDE.md.backup-<YYYY-MM-DD>` in de project-root (bestaat die naam al vandaag:
  oplopend suffix `-2`, `-3`, ...), vóórdat er iets wordt herschreven. Dit vervangt
  het vroegere "stop en vraag": in plaats van te weigeren, maakt de skill het
  resultaat altijd terugdraaibaar, en gaat daarna gewoon door.
- **Geen enkele regel uit het oude bestand gaat verloren.** Alles wat niet
  expliciet als stabiel is geclassificeerd, wordt letterlijk (niet herschreven of
  samengevat) overgenomen in het gemigreerde geheugenbestand.
- **Classificatie stabiel/incidenteel wordt herleid, niet verzonnen.** Een regel
  telt als incidenteel wanneer die een uitzondering, een eenmalig besluit of een
  specifiek incident beschrijft (bijv. begint met "behalve wanneer", verwijst naar
  een datum of eenmalige gebeurtenis, of geldt duidelijk niet universeel).
  Twijfelgevallen worden als stabiel behandeld: verlies van informatie is erger
  dan een regel die net op de verkeerde plek staat.
- **De Why van gemigreerde incidentele items wordt nooit verzonnen, maar wél
  overgenomen als hij er al staat.** Elke regel die een concrete datum of
  tijdsverwijzing bevat telt als een aanwezige Why, ongeacht de exacte formulering:
  "sinds we op {datum} X deden", "vastgelegd op {datum}", "besloten op {datum}",
  "op {datum} gebeurde X" zijn allemaal gelijkwaardig. Bij twijfel of een
  tijdsverwijzing concreet genoeg is: wél als aanwezige Why behandelen, dat is
  veiliger dan een echte Why overschrijven. Alleen wanneer een regel géén enkele
  datum of tijdsverwijzing bevat, krijgt het item de markering "Why onbekend,
  gemigreerd op {datum} vanuit het oude CLAUDE.md, aan te vullen via de
  `brbnt-memory`-skill zodra de context bekend is". Nooit het omgekeerde: een al
  aanwezige Why vervangen door "onbekend".
- **Nul incidentele items is een geldige uitkomst, geen fout.** Classificeert
  alles als stabiel, dan wordt er geen `memory/project_gemigreerd_<datum>.md`
  aangemaakt en geen regel aan `memory/MEMORY.md` toegevoegd (er is niets om naar
  te verwijzen). Dit wordt wél expliciet in het rapport genoemd ("0 incidentele
  items, geen migratiebestand nodig"), nooit stilzwijgend overgeslagen: het
  verschil tussen "bewust niets gevonden" en "deze stap vergeten" moet voor de
  gebruiker altijd zichtbaar zijn.
- **Repository Structure toont de daadwerkelijke top-level indeling, nooit een
  vaste aanname over `tests/` of `docs/` op root-niveau.** Veel projecten nesten
  hun tests en docs onder een applicatiemap (bijv. `app/test/`, `app/docs/`) in
  plaats van op root. Neem over wat er werkelijk staat; laat een map weg als hij
  niet bestaat in plaats van hem te verzinnen omdat het sjabloon hem noemt.
- **Een stabiele claim die de projectinspectie niet kan bevestigen, wordt
  overgenomen mét een vlag, nooit stilzwijgend als geverifieerd feit gepresenteerd
  en nooit stilzwijgend weggelaten.** Bijvoorbeeld: het oude bestand noemt een
  backend die niet als aparte mapstructuur wordt aangetroffen. Neem de claim over,
  voeg een korte, zichtbare aantekening toe dat de inspectie dit niet kon
  bevestigen.
- **Placeholders die een beleids- of ontwerpbeslissing vereisen (git-regels,
  scope-grenzen, welke conventie als test wordt afgedwongen) worden nooit
  verzonnen.** Zijn ze niet af te leiden uit het project én niet al aanwezig in
  een bestaand CLAUDE.md, dan wordt er kort en gericht naar gevraagd, of blijft
  het een `{{...}}`-placeholder.
- **`memory/` wordt aangemaakt als die nog niet bestaat**, met `MEMORY.md` als
  index. Bij route A krijgt die index meteen een regel die naar het gemigreerde
  bestand wijst; bij route B blijft de index leeg (dat vult zichzelf pas met de
  tijd, via `brbnt-memory`).
- **Route B blijft read-only tot expliciete bevestiging.** Er is bij route B niets
  om te verliezen (geen bestaand bestand), maar de beleidsplaceholders vereisen
  nog steeds een menselijke keuze: toon het voorstel, schrijf pas na akkoord.

## Stappenplan

1. **Check op een bestaand instructiebestand.** Zoek naar `CLAUDE.md` in de
   project-root (en, als dat ontbreekt, naar vergelijkbare bestanden als
   `AGENTS.md` of `.cursorrules`, en meld dat expliciet). Bestaat het al: ga naar
   **route A**. Bestaat het niet: ga naar **route B**.

### Route A: migratie van een bestaand instructiebestand

2. **Maak de back-up direct**, vóór enige andere actie: kopieer het bestaande
   bestand naar `CLAUDE.md.backup-<YYYY-MM-DD>` (oplopend suffix bij
   naamsconflict). Dit gebeurt altijd, zonder te vragen: dit is de garantie die
   de rest van deze route veilig maakt.

3. **Inspecteer het project**, zoals in route B stap 2: `package.json`,
   `*.csproj`/`*.sln`, `requirements.txt`/`pyproject.toml`, `go.mod`, `Gemfile`,
   CI-config, en de top-level directorystructuur. Neem de indeling over zoals hij
   werkelijk is (zie Contract: geen vaste `tests/`/`docs/`-aanname).

4. **Classificeer elke inhoudelijke regel uit het oude bestand** als stabiel of
   incidenteel, volgens de regel in het Contract hierboven.

5. **Stel het nieuwe CLAUDE.md samen**: `assets/CLAUDE.md.template`, ingevuld met
   de projectinspectie én de stabiele regels uit het oude bestand. Ontbrekende
   beleidsplaceholders: kort en gericht navragen (net als in route B stap 3), niet
   aannemen.

6. **Schrijf het gemigreerde geheugenbestand, tenzij er 0 incidentele items
   zijn** (zie Contract): `memory/project_gemigreerd_<YYYY-MM-DD>.md`, elk
   incidenteel item letterlijk overgenomen, met Why (overgenomen of "onbekend"
   per item).

7. **Schrijf `CLAUDE.md`** (het bestand dat in stap 2 al gebackupt is). Was er
   een gemigreerd geheugenbestand (stap 6), werk dan ook `memory/MEMORY.md` bij
   met een regel die ernaar wijst; was er geen (0 incidenteel), laat
   `memory/MEMORY.md` dan ongewijzigd.

8. **Rapporteer**, met precies deze vier onderdelen:
   - back-up gemaakt (bestandsnaam + locatie)
   - nieuwe/bijgewerkte bestanden neergezet (welke)
   - items aangemerkt als stabiel (opgesomd)
   - items aangemerkt als incidenteel en verplaatst (opgesomd, met verwijzing naar
     het gemigreerde bestand); staat dit aantal op 0, meld dat dan expliciet
     ("0 incidentele items, geen migratiebestand nodig") in plaats van dit
     onderdeel gewoon leeg te laten

### Route B: fris project, nog geen instructiebestand

2. **Inspecteer het project.** Lees wat redelijkerwijs de tech stack en structuur
   verraadt: `package.json`, `*.csproj`/`*.sln`, `requirements.txt`/`pyproject.toml`,
   `go.mod`, `Gemfile`, een CI-configbestand (`.github/workflows/*`), en de
   top-level directorystructuur. Doel: de `Tech Stack`-tabel, `Repository Structure`
   en `Testing Strategy`-secties van het sjabloon zoveel mogelijk zelf invullen in
   plaats van de gebruiker dat te laten doen. Repository Structure toont de
   daadwerkelijke indeling (zie Contract: geen vaste `tests/`/`docs/`-aanname);
   nest het project die ergens anders (bijv. onder een applicatiemap), neem dat
   dan over.

3. **Vul `assets/CLAUDE.md.template` in** met de afgeleide waarden. Laat elke
   placeholder die een menselijke beslissing vereist (git-regels, scope-grenzen,
   welke conventie als test wordt afgedwongen) staan, of stel er één gerichte vraag
   over. Niet meer dan nodig: dit hoeft geen volledig interview te worden.

4. **Toon het voorstel** (het volledige concept-bestand, of een duidelijke
   samenvatting per sectie als het bestand lang is) en vraag expliciete bevestiging
   vóór stap 5.

5. **Schrijf `CLAUDE.md`** naar de project-root, pas na bevestiging.

6. **Maak `memory/`** aan als die nog niet bestaat, en plaats daarin
   `assets/MEMORY.md.template` als `memory/MEMORY.md`, met alleen `{{Projectnaam}}`
   ingevuld. De inhoud blijft verder leeg: dat is bewust, laag 2 vult zichzelf pas
   met de tijd, via de `brbnt-memory`-skill, niet in één keer vooraf.

7. **Rapporteer**: welk bestand is aangemaakt, welke placeholders de gebruiker zelf
   nog moet invullen (met bestandsnaam + sectie, niet alleen "er staan nog wat
   dingen open"), en één zin over wat er nu anders is (laag 1 en 2 staan; het
   project heeft een stabiel instructiebestand en een plek voor het opvraagbare
   archief).

## Materiaal
- `assets/CLAUDE.md.template`: bron voor route A stap 5 / route B stap 3, identiek
  aan `starter-kit/CLAUDE.md.template` in de hoofdrepo.
- `assets/MEMORY.md.template`: bron voor route B stap 6. Deze versie wijkt bewust af
  van `starter-kit/MEMORY.md.template`: de starter-kit-versie toont voorbeeld-bullets
  (`{{Titel}}` placeholders) omdat een mens 'm met de hand invult; deze versie start
  leeg-met-labels, omdat een net aangemaakt project nog geen memories heeft om in te
  vullen.
- Route A schrijft geen los template, maar een gevuld bestand
  (`memory/project_gemigreerd_<datum>.md`) met dezelfde structuur als
  `starter-kit/memory-project.md.template` (regel/feit + Why + How to apply), alleen
  met de Why expliciet als onbekend gemarkeerd per item in plaats van ingevuld.
