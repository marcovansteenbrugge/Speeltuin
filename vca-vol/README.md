# VCA-VOL Oefenplein

Een leer- en oefenomgeving voor het VCA-VOL-examen (Veiligheid voor Operationeel Leidinggevenden).

## Onderdelen

- **Leren**: 14 onderwerpen met de kern van de lesstof, kerncijfers, schema's en examentips.
- **Borden & symbolen**: veiligheidsborden en CLP/GHS-pictogrammen, met zelftest en quiz.
- **Gevaren spotten**: werkplekscènes waarop je de onveilige situaties aantikt.
- **Oefenen**: vragen per onderwerp met directe uitleg, plus een lijst met je eigen fouten.
- **Proefexamen**: 70 vragen in 105 minuten, 49 goed nodig, met nakijken en score per onderwerp.

Je voortgang wordt alleen in je eigen browser bewaard (localStorage).

## Gebruiken

Open `index.html` in een browser. Er is geen build-stap nodig.

## Bestanden

| Bestand | Inhoud |
| --- | --- |
| `index.html` | Pagina en opmaak |
| `app.js` | Navigatie, oefenmodus, proefexamen, quiz en gevaren spotten |
| `lesstof.js` | Lesstof per onderwerp en schema's |
| `vragen.js` | Vragenbank: `[onderwerp, vraag, [juist, fout, fout], uitleg]`, het juiste antwoord staat altijd eerst |
| `borden.js` | Borden en pictogrammen als SVG |
| `scenes.js` | Scènes voor gevaren spotten, met klikgebieden |

Deze tool is een leerhulpmiddel en geen officieel examenmateriaal.
