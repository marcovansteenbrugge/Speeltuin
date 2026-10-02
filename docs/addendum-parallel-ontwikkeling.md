# Addendum: parallel ontwikkelen (laag 5 van de methode)

## Bij elke implementatietaak
Vraag/bepaal expliciet: draait dit **direct op de hoofdbranch**, of in een
**aparte worktree-branch**? Vuistregel voor dit project: **altijd een worktree**.
Elke implementatietaak krijgt een eigen worktree-branch, ongeacht duur of
gelijktijdig ander werk.

## Worktree-lifecycle
1. Maak branch `worktree-<naam>`.
2. Poort-slot claimen: n.v.t. voor dit project (zie Poort-registry).
3. Omgevingsvariabelen per slot: n.v.t. (geen dev-server, geen backend).
4. Werk en test: open `vca-vol/index.html` in de browser. Er is (nog) geen
   build-stap en geen geautomatiseerde testsuite.
5. Bij conflictvrije merge: mergen naar de hoofdbranch, en pushen naar de remote
   (GitHub). Er is geen runtime-data in git: de app bewaart voortgang alleen in
   de localStorage van de browser. Zolang er geen build en tests zijn, is er geen
   automatische controle; bij conflicten: niet automatisch, mens erbij halen.
6. `git worktree remove`.

## Poort-registry
**N.v.t. voor dit project** (bevestigd op 2026-10-02): Speeltuin bestaat uit
statische HTML/JS die direct in de browser wordt geopend, zonder dev-server,
backend of gedeelde services. Er is daarom geen poortformule en geen
registry-bestand. Komt er later een dev-server bij, vul dit dan aan.

| Component | Poortformule | Voorbeeld (slot 1) |
|---|---|---|
| Frontend (`vca-vol/`) | geen eigen poort: statisch bestand in de browser | n.v.t. |
| Backend API | bestaat niet | n.v.t. |
| Gedeelde services, remote | bestaan niet | n.v.t. |
| Gedeelde services, lokale state | bestaan niet | n.v.t. |
| Runtime-data die de app zelf schrijft en die in git staat | geen: voortgang staat in localStorage, buiten git | n.v.t. |

## Frictie wegnemen (permissies)
Zet veelgebruikte, ongevaarlijke commando's (git status/diff/log, en later
build, test en lint als die er komen) op een allowlist in de tool-settings,
zodat niet elke sessie opnieuw om toestemming vraagt. Destructieve commando's
(force-push, reset --hard) NOOIT op de allowlist; die blijven altijd een
expliciete bevestiging vereisen.
