// VCA-VOL lesstof: onderwerpen (MODS) en schema's (DIAG).
// Sectievelden: h = kop, p = alinea (HTML), d = schema vóór de lijst, l = opsomming, o = genummerde stappen, d2 = schema na de lijst.
(function(){
"use strict";

const MODS = [
{
  id:"wet", t:"Wetgeving & verantwoordelijkheden",
  k:"Wie moet wat doen volgens de Arbowet, en wie controleert dat?",
  fig:[["Arbowet","kaderwet: doelen en plichten"],["Arbobesluit","regels per onderwerp"],["Arboregeling","technische details"],["NLA","toezicht en handhaving"]],
  secs:[
    {h:"Opbouw van de wetgeving", p:"De Arbeidsomstandighedenwet (Arbowet) is een <b>kaderwet</b>: hij noemt de doelen en de plichten. De uitwerking staat in lagere regels.",
     l:["<b>Arbobesluit</b>: concrete regels, bijvoorbeeld over valgevaar, lawaai en gevaarlijke stoffen.","<b>Arbeidsomstandighedenregeling</b> (Arboregeling): technische details en getallen.","<b>Arbocatalogus</b>: afspraken per branche over hoe je aan de doelen voldoet.","Daarnaast gelden milieuregels en de regels van de opdrachtgever op de locatie."]},
    {h:"Plichten van de werkgever",
     l:["Zorgt voor veilige en gezonde arbeidsomstandigheden en voert een arbobeleid.","Maakt een <b>RI&amp;E</b> (risico-inventarisatie en -evaluatie) met een plan van aanpak.","Geeft <b>voorlichting en onderricht</b> (instructie) over risico’s en maatregelen.","Verstrekt de nodige <b>PBM kosteloos</b> en ziet erop toe dat ze gebruikt worden.","Wijst een <b>preventiemedewerker</b> aan en organiseert de <b>bedrijfshulpverlening (BHV)</b>.","Meldt ernstige ongevallen direct bij de Nederlandse Arbeidsinspectie en houdt een ongevallenregister bij."]},
    {h:"Plichten van de werknemer",
     l:["Werkt zorgvuldig en volgt de instructies op.","Gebruikt machines, gereedschap en gevaarlijke stoffen op de juiste manier.","Gebruikt de verstrekte PBM juist en bergt ze goed op.","Haalt geen beveiligingen weg en verandert ze niet.","Werkt mee aan voorlichting en onderricht, zoals toolboxmeetings.","Meldt gevaren die hij ziet direct aan zijn leidinggevende."]},
    {h:"Werk stilleggen", p:"Bij <b>ernstig en onmiddellijk dreigend gevaar</b> mag een werknemer het werk onderbreken als de leidinggevende niet op tijd maatregelen neemt. Hij meldt dit meteen en mag hiervoor niet benadeeld worden."},
    {h:"Toezicht en handhaving",
     l:["De <b>Nederlandse Arbeidsinspectie (NLA)</b> controleert of de regels worden nageleefd.","Zij kan een eis tot naleving geven, een <b>boete</b> opleggen (ook aan werknemers), het <b>werk stilleggen</b> of proces-verbaal opmaken.","Een ernstig ongeval (ziekenhuisopname, blijvend letsel of overlijden) meldt de werkgever direct bij de NLA.","De bedrijfsarts meldt beroepsziekten bij het Nederlands Centrum voor Beroepsziekten."]}
  ],
  tip:"Bij ‘wie is verantwoordelijk’ is de werkgever bijna altijd de eindverantwoordelijke. Werknemers hebben wel eigen plichten en kunnen ook een boete krijgen."
},
{
  id:"risico", t:"Gevaren, risico’s en ongevallen",
  k:"Het verschil tussen gevaar en risico, hoe je maatregelen kiest en waarom je incidenten meldt.",
  fig:[["R = K × E","risico = kans × effect"],["1 : 600","ernstig ongeval : bijna-ongevallen"],["RI&E","verplicht voor elk bedrijf"]],
  secs:[
    {h:"Gevaar en risico",
     l:["Een <b>gevaar</b> is iets dat schade kan veroorzaken: een open put, een giftige stof, spanning.","Een <b>risico</b> is de kans dat dat gevaar tot schade leidt, gecombineerd met de ernst van de gevolgen.","Je verkleint een risico door de kans kleiner te maken, de gevolgen te beperken, of allebei."]},
    {h:"De arbeidshygiënische strategie", p:"Maatregelen kies je in deze volgorde. Pas als een stap redelijkerwijs niet mogelijk is, ga je naar de volgende.", d:"strategie"},
    {h:"RI&E en plan van aanpak",
     l:["Elke werkgever moet een schriftelijke RI&amp;E hebben.","In het <b>plan van aanpak</b> staat welke maatregelen genomen worden, door wie en wanneer.","De RI&amp;E moet actueel blijven, bijvoorbeeld na een ongeval of bij nieuwe werkmethoden."]},
    {h:"Oorzaken van ongevallen",
     l:["<b>Directe oorzaken</b>: onveilige handelingen (gedrag) en onveilige situaties.","<b>Achterliggende oorzaken</b>: gebrek aan kennis of instructie, tijdsdruk, slechte planning, cultuur.","Bij de meeste ongevallen speelt menselijk gedrag een rol."]},
    {h:"De ongevallenpiramide", p:"Volgens Bird staan tegenover één ernstig ongeval veel kleinere incidenten. Wie de onderkant van de piramide aanpakt, voorkomt ook de top.", d:"bird",
     l:["Een <b>incident</b> is elke ongewenste gebeurtenis; een <b>bijna-ongeval</b> is een incident zonder letsel of schade.","Meld ook bijna-ongevallen: zo leer je ervan voordat het misgaat."]}
  ],
  tip:"Een bronmaatregel (het gevaar wegnemen of vervangen) is altijd de beste keuze. PBM zijn het laatste redmiddel."
},
{
  id:"vol", vol:true, t:"Leidinggeven aan veiligheid",
  k:"Extra stof voor VOL: wat je als operationeel leidinggevende doet om je ploeg veilig te laten werken.",
  fig:[["Voorbeeld","je eigen gedrag telt het zwaarst"],["Toolbox","korte veiligheidsbijeenkomst"],["VTDC","vertellen · tonen · doen · controleren"]],
  secs:[
    {h:"Jouw rol",
     l:["Je vertaalt de RI&amp;E en de projectregels naar de werkplek.","Je zorgt dat je ploeg de juiste instructie, PBM, vergunningen en materialen heeft.","Je geeft het goede voorbeeld en spreekt onveilig gedrag direct aan, ook bij onderaannemers en uitzendkrachten.","Je houdt toezicht, vooral op nieuwe en onervaren medewerkers: zij zijn vaker betrokken bij ongevallen."]},
    {h:"Instructie geven", p:"Werk volgens <b>vertellen, tonen, laten doen, controleren</b>. Kijk daarna of de werkmethode ook in de praktijk wordt gevolgd."},
    {h:"Toolboxmeeting",
     l:["Korte bijeenkomst over één veiligheidsonderwerp, liefst op of bij de werkplek.","Doel: kennis overdragen, ervaringen en incidenten bespreken, betrokkenheid vergroten.","Leg vast wie er was en wat er besproken is, en volg afgesproken acties op."]},
    {h:"Werkplekinspectie",
     l:["Gepland en met een checklist.","Bespreek wat je ziet met de mensen ter plekke.","Leg bevindingen vast, neem maatregelen en controleer of ze zijn uitgevoerd."]},
    {h:"Ongevalsonderzoek",
     o:["Verzamel de feiten: wie, wat, waar, wanneer en hoe. Spreek betrokkenen en getuigen.","Zoek naar directe én achterliggende oorzaken, niet naar een schuldige.","Neem maatregelen die herhaling voorkomen.","Koppel de uitkomst terug aan de ploeg."]},
    {h:"Inleners en onderaannemers",
     l:["Voor uitzendkrachten is het <b>inlenende bedrijf</b> verantwoordelijk voor veilig werken.","Onderaannemers volgen dezelfde projectregels. Stem de risico’s van elkaars werk op elkaar af."]}
  ],
  tip:"Bij VOL-vragen is het goede antwoord vaak: zelf actie nemen, aanspreken en het goede voorbeeld geven. ‘Afwachten’ of ‘later melden’ is vrijwel nooit goed."
},
{
  id:"procedures", t:"Werkvergunning, TRA en LMRA",
  k:"Hoe je risicovol werk voorbereidt, vrijgeeft en veilig afrondt.",
  fig:[["TRA","vooraf, per taakstap"],["LMRA","vlak voor de start, door jezelf"],["KLIC","verplicht vóór graafwerk"]],
  secs:[
    {h:"Werkvergunning", p:"Voor werk met extra risico’s, zoals heet werk, werken in besloten ruimten of aan installaties, geeft de installatie-eigenaar een werkvergunning af.",
     l:["De vergunning noemt de risico’s, de maatregelen, de geldigheidsduur en de betrokkenen.","Lees de vergunning, houd hem op de werkplek en volg alle maatregelen op.","<b>Verandert de situatie?</b> Stop en neem contact op met de vergunningverlener.","Bij een <b>noodsignaal</b> vervalt de vergunning. Na de noodsituatie moet hij opnieuw worden vrijgegeven.","Na afloop: werkplek opgeruimd achterlaten en de vergunning afmelden."]},
    {h:"TRA en LMRA",
     l:["<b>TRA</b> (Taak Risico Analyse): vóór het werk deel je de taak op in stappen en bepaal je per stap de risico’s en maatregelen.","<b>LMRA</b> (Laatste Minuut Risico Analyse): vlak voor de start kijk je zelf of je het werk veilig kunt doen. Twijfel? Stop en overleg."]},
    {h:"Installaties afsluiten (LOTO)",
     l:["Afschakelen, vergrendelen met je <b>eigen slot</b>, labelen en testen of de installatie echt energievrij is.","Iedereen die aan de installatie werkt, hangt een eigen slot. Alleen jij haalt jouw slot eraf."]},
    {h:"Heet werk en graafwerk",
     l:["Heet werk (lassen, slijpen, branden): brandbaar materiaal weg of afgedekt, blusmiddel binnen handbereik, zo nodig gasmeting en brandwacht, nacontrole na afloop.","Graafwerk: vooraf een <b>KLIC-melding</b> voor de ligging van kabels en leidingen. Graaf bij kabels en leidingen met de hand."]},
    {h:"Orde en netheid", p:"Struikelen, uitglijden en vallen op dezelfde hoogte horen bij de meest voorkomende ongevallen. Ruim op, houd looproutes vrij en leg kabels en slangen zo dat niemand erover valt."}
  ],
  tip:"Twijfel over de vergunning of een veranderde situatie? Het antwoord is altijd: stoppen en overleggen met de vergunningverlener."
},
{
  id:"nood", t:"Noodsituaties en eerste hulp",
  k:"Wat je doet bij een ongeval, brand, gaslek of ontruiming.",
  fig:[["112","alarmnummer (of het interne nummer)"],["15 min","ogen spoelen"],["10 min","brandwond koelen"]],
  secs:[
    {h:"Bij een ongeval",
     o:["Let op <b>je eigen veiligheid</b> en die van omstanders.","Haal het slachtoffer alleen uit de gevarenzone als dat veilig kan.","<b>Alarmeer</b>: intern alarmnummer of BHV, of 112.","Verleen <b>eerste hulp</b> binnen je kunnen.","Vang de hulpdiensten op en <b>meld</b> het ongeval."]},
    {h:"Ontruiming",
     l:["Stop het werk en laat installaties en gereedschap veilig achter, als dat zonder gevaar kan.","Volg de vluchtroute naar de <b>verzamelplaats</b>. Gebruik geen lift.","Meld je bij de verzamelplaats, zodat duidelijk is wie er mist.","Ga pas terug na toestemming. Werkvergunningen moeten opnieuw worden vrijgegeven."]},
    {h:"Gaslek of giftige wolk",
     l:["Waarschuw anderen en volg de instructies van de locatie.","Vlucht <b>dwars op de windrichting</b>, weg van de wolk. Let op de windzak.","Vermijd lage plekken: veel gassen zijn zwaarder dan lucht."]},
    {h:"Eerste hulp",
     l:["Stof in de ogen: direct <b>minstens 15 minuten</b> spoelen met lauw water.","Brandwond: <b>minstens 10 minuten</b> koelen met zacht stromend lauw water.","Elektrisch ongeval: eerst de spanning uitschakelen, pas dan het slachtoffer aanraken.","Persoon in brand: laten rollen of afdekken met een blusdeken.","De <b>BHV’er</b> verleent eerste hulp, bestrijdt beginnende branden en leidt de ontruiming."]}
  ],
  tip:"Je eigen veiligheid gaat altijd voor. Een tweede slachtoffer helpt niemand."
},
{
  id:"stoffen", t:"Gevaarlijke stoffen",
  k:"Etiketten lezen, gevaren herkennen en veilig werken met stoffen.",
  fig:[["9","CLP-gevarenpictogrammen"],["16","rubrieken in het VIB"],["H / P","gevaren / voorzorg"],["8 uur","tijdgewogen grenswaarde"]],
  secs:[
    {h:"Het etiket (CLP)",
     l:["<b>Gevarenpictogrammen</b>: rode ruit, wit vlak, zwart symbool.","<b>Signaalwoord</b>: ‘Gevaar’ (ernstig) of ‘Waarschuwing’ (minder ernstig).","<b>H-zinnen</b> beschrijven het gevaar (hazard), <b>P-zinnen</b> de voorzorgsmaatregelen (precaution).","Naam van de stof en gegevens van de leverancier."], p:"Alle negen pictogrammen oefen je bij <b>Borden &amp; symbolen</b>."},
    {h:"Veiligheidsinformatieblad (VIB)", p:"De leverancier moet een VIB leveren. Het heeft 16 rubrieken, met onder meer de gevaren, de benodigde PBM, opslag, wat te doen bij brand, lekkage of blootstelling, en eerste hulp. Zorg dat het op de werkplek beschikbaar is."},
    {h:"Hoe stoffen je lichaam binnenkomen",
     l:["<b>Inademen</b>: de belangrijkste route (gassen, dampen, nevels, stof, rook).","<b>Via de huid</b>: opname of beschadiging, bijvoorbeeld door oplosmiddelen en bijtende stoffen.","<b>Inslikken</b>: vaak door slechte hygiëne. Eet, drink en rook niet op de werkplek en was je handen."]},
    {h:"Effecten en grenswaarden",
     l:["<b>Acuut</b>: direct effect (bedwelming, verbranding). <b>Chronisch</b>: schade na langere tijd (bijvoorbeeld kanker of hersenschade door oplosmiddelen).","<b>CMR-stoffen</b> zijn kankerverwekkend, mutageen of schadelijk voor de voortplanting.","De <b>grenswaarde</b> is de maximale concentratie in de lucht waaraan je gemiddeld over 8 uur (of 15 minuten) blootgesteld mag worden.","Vertrouw niet op je neus: <b>H₂S</b> (rotte eieren) verdooft bij hogere concentraties je reukzin."]},
    {h:"Opslag en gebruik",
     l:["Bewaar stoffen in de originele, goed geëtiketteerde verpakking. Nooit in drinkflessen.","Sla stoffen die met elkaar reageren gescheiden op, bijvoorbeeld oxiderend en brandbaar.","Gebruik een lekbak en meld lekkages.","Vermoed je <b>asbest</b>? Stop direct, verlaat de ruimte en meld het."]},
    {h:"Gasflessen", p:"De kleur van de schouder (bovenkant) geeft het gevaar aan.", d:"gasfles",
     l:["Rechtop en vastgezet, met beschermkap op het ventiel.","Niet in een besloten ruimte laten staan; na het werk mee naar buiten.","Zuurstof nooit in contact met olie of vet: kans op brand."]}
  ],
  tip:"Pictogrammen herkennen levert makkelijke punten op. Let op het verschil tussen de vlam (ontvlambaar) en de vlam boven een cirkel (oxiderend)."
},
{
  id:"brand", t:"Brand en explosie",
  k:"Hoe brand ontstaat, hoe je het voorkomt en welk blusmiddel je kiest.",
  fig:[["3","zijden van de branddriehoek"],["OEG – BEG","explosiegebied"],["A B C D F","brandklassen"]],
  secs:[
    {h:"Branddriehoek", d:"brand", p:"Voor brand zijn <b>brandbare stof</b>, <b>zuurstof</b> en <b>ontstekingstemperatuur</b> nodig. De brandvijfhoek voegt daar de <b>juiste mengverhouding</b> en een <b>katalysator</b> (kettingreactie) aan toe. Blussen is één van die voorwaarden wegnemen: koelen, afdekken of verstikken, brandstof weghalen of de kettingreactie verbreken."},
    {h:"Ontstekingsbronnen",
     l:["Open vuur, roken, lassen en slijpen (vonken).","Hete oppervlakken en wrijving.","Elektrische vonken en <b>statische elektriciteit</b>."]},
    {h:"Vlampunt en explosiegrenzen",
     l:["<b>Vlampunt</b>: de laagste temperatuur waarbij een vloeistof genoeg damp afgeeft om met een ontstekingsbron te ontbranden.","<b>Zelfontbrandingstemperatuur</b>: de temperatuur waarbij een stof vanzelf gaat branden, zonder vlam of vonk.","<b>Explosiegrenzen</b>: alleen tussen de onderste (OEG/LEL) en bovenste explosiegrens (BEG/UEL) kan een mengsel ontbranden of exploderen."], d2:"explosie"},
    {h:"Brandklassen en blusmiddelen", d:"blus"},
    {h:"Explosiegevaar (ATEX)",
     l:["In zones met explosiegevaar hangt het <b>Ex-bord</b>: een gele driehoek met ‘EX’.","Daar gebruik je alleen goedgekeurd (Ex-)materieel en vonkvrij gereedschap. Niet roken, geen open vuur.","Ook fijn stof, zoals meel, houtstof of metaalstof, kan exploderen."]},
    {h:"Blussen met een draagbaar toestel",
     l:["Blus alleen een <b>beginnende brand</b>, en alleen als het veilig kan. Houd een vluchtweg in je rug.","Blus met de <b>wind in de rug</b>, gericht op de <b>basis van de vlammen</b>.","Gasbrand: eerst de toevoer dichtdraaien.","Frituurvet of olie (klasse F): nooit water. Gebruik een deksel, blusdeken of vetblusser."]}
  ],
  tip:"Veelgestelde vraag: CO₂ is geschikt voor elektrische apparatuur, water en schuim zijn dat niet."
},
{
  id:"elektra", t:"Elektriciteit",
  k:"Wat stroom met je lichaam doet en hoe je je ertegen beschermt.",
  fig:[["30 mA","aardlekschakelaar schakelt af"],["50 V","max. veilige wisselspanning"],["5","veiligheidsregels"]],
  secs:[
    {h:"Gevaren",
     l:["Stroom door je lichaam kan leiden tot hartritmestoornissen (hartfibrilleren), spierkramp (niet kunnen loslaten) en inwendige brandwonden.","Secundaire ongevallen: schrikken en vallen, bijvoorbeeld van een ladder.","Brand door kortsluiting of oververhitting, en vlambogen.","De ernst hangt af van de <b>stroomsterkte</b>, de <b>weg door het lichaam</b> en de <b>tijdsduur</b>."]},
    {h:"Beschermingsmaatregelen",
     l:["<b>Isolatie</b> en <b>dubbele isolatie</b> (klasse II): symbool van twee vierkanten in elkaar.","<b>Aarding</b> (randaarde) en een <b>aardlekschakelaar</b> die bij een lekstroom van 30 mA binnen een fractie van een seconde afschakelt.","<b>Veilige spanning</b> (maximaal 50 V wisselspanning) of een <b>scheidings- of veiligheidstransformator</b>, vooral in natte en besloten, geleidende ruimten. De transformator staat buiten die ruimte."]},
    {h:"Werken met elektrisch gereedschap",
     l:["Controleer voor gebruik snoer, stekker en behuizing, en kijk of het keuringslabel geldig is.","Beschadigd? Niet gebruiken, uit de roulatie halen en melden. Niet zelf repareren met tape.","Rol een kabelhaspel helemaal af: opgerold kan hij oververhit raken.","Leg kabels niet door water of over scherpe randen."]},
    {h:"Werken aan installaties", p:"Alleen <b>deskundige, aangewezen personen</b> (NEN 3140 / NEN-EN 50110) werken aan elektrische installaties. Zij volgen de vijf veiligheidsregels:",
     o:["Vrijschakelen","Beveiligen tegen herinschakelen","Spanningsloosheid controleren","Aarden en kortsluiten","Afschermen van nabijgelegen delen onder spanning"]},
    {h:"Bovengrondse hoogspanningslijnen", p:"Houd met kranen, hoogwerkers en kiepwagens ruim afstand. Spanning kan overslaan zonder dat je de lijn raakt."}
  ],
  tip:"De aardlekschakelaar beschermt jou tegen lekstroom via je lichaam. Een zekering beschermt de installatie tegen overbelasting en kortsluiting, niet jou."
},
{
  id:"gereedschap", t:"Gereedschap en machines",
  k:"Veilig werken met handgereedschap, elektrisch gereedschap en machines.",
  fig:[["CE","voldoet aan Europese eisen"],["LOTO","uitschakelen en vergrendelen"],["Noodstop","altijd bereikbaar"]],
  secs:[
    {h:"Algemene regels",
     l:["Gebruik het juiste gereedschap voor het werk, en alleen waarvoor het bedoeld is.","Controleer het voor gebruik. Beschadigd gereedschap gebruik je niet.","Haal nooit beveiligingen of afschermkappen weg.","Onderhoud, schoonmaken en storingen verhelpen alleen bij een <b>uitgeschakelde en vergrendelde</b> machine."]},
    {h:"Machines",
     l:["De <b>CE-markering</b> betekent dat de fabrikant verklaart dat de machine aan de Europese veiligheidseisen voldoet.","Ken de plaats van de <b>noodstop</b>.","Draaiende delen: geen loszittende kleding, sieraden of los haar, en <b>geen handschoenen</b> bij bijvoorbeeld een kolomboor of draaibank."]},
    {h:"Slijpen en zagen",
     l:["Het maximale toerental van de schijf moet minstens gelijk zijn aan dat van de machine.","Gebruik de beschermkap en draag oog- en gehoorbescherming.","Let op vonken: brandgevaar."]},
    {h:"Perslucht en hogedruk", p:"Blaas nooit met perslucht je kleding of huid schoon. Lucht kan via de huid in je lichaam dringen. Richt een hogedrukspuit nooit op mensen."},
    {h:"Mobiele arbeidsmiddelen", p:"Heftrucks, verreikers en hoogwerkers bedien je alleen als je daarvoor bent opgeleid en aangewezen. Neem geen passagiers mee en houd voetgangers uit de buurt."}
  ],
  tip:"Onderhoud aan een draaiende machine is altijd fout. Eerst uitschakelen, vergrendelen en controleren."
},
{
  id:"hoogte", t:"Werken op hoogte",
  k:"Vallen van hoogte is een van de belangrijkste oorzaken van dodelijke ongevallen.",
  fig:[["2,5 m","valgevaar: maatregelen verplicht"],["65–75°","stahoek ladder"],["1 m","ladder boven uitstapplaats"],["1 m · 0,5 m · 15 cm","leuning · tussenregel · kantplank"]],
  secs:[
    {h:"Wanneer maatregelen?",
     l:["Bij valgevaar van <b>2,5 meter</b> of meer zijn maatregelen verplicht.","Ook lager bij bijzondere gevaren: vallen in water, op scherpe voorwerpen, in een put of in een machine.","Denk ook aan <b>vallende voorwerpen</b>: zet het gebied eronder af en draag een helm."]},
    {h:"Volgorde van maatregelen",
     o:["Werk zo mogelijk vanaf de grond, bijvoorbeeld met voormontage.","<b>Collectieve</b> beveiliging: randbeveiliging, steigers, hoogwerkers.","<b>Persoonlijke</b> valbeveiliging: harnasgordel met vanglijn en valdemper."],
     p:"Randbeveiliging bestaat uit een <b>leuning op 1 m</b>, een tussenregel op 0,5 m en een <b>kantplank van 15 cm</b>."},
    {h:"Ladders", d:"ladder",
     l:["Alleen voor kortdurend, licht werk. Anders een steiger of hoogwerker.","Stahoek <b>65–75°</b>: de voet staat ongeveer een kwart van de hoogte van de muur af.","Laat de ladder <b>1 meter</b> boven de uitstapplaats uitsteken en zet hem vast tegen wegglijden.","Houd <b>driepuntscontact</b>: klim niet met gereedschap of materiaal in je handen."]},
    {h:"Steigers",
     l:["Alleen deskundige steigerbouwers bouwen, wijzigen en keuren steigers.","<b>Steigerkaart</b>: groen is vrijgegeven, rood is niet gebruiken.","Zie je een gebrek of ontbrekende leuning? Niet gebruiken en melden. Niet zelf aanpassen.","Rolsteiger: wielen op de rem, stabilisatoren uit, nooit verrijden met personen erop."]},
    {h:"Persoonlijke valbeveiliging",
     l:["Gebruik een <b>harnasgordel</b>, geen heupgordel.","Bevestig aan een sterk <b>ankerpunt, bij voorkeur boven je</b>, zodat de valafstand klein blijft.","Zorg voor een reddingsplan: lang hangen in een gordel is levensgevaarlijk (hangtrauma).","Na een val worden gordel en vanglijn afgekeurd."]}
  ],
  tip:"Onthoud de getallen: 2,5 m, 65–75°, 1 m uitsteken, leuning 1 m, kantplank 15 cm."
},
{
  id:"besloten", t:"Besloten ruimten",
  k:"Tanks, putten, kelders en kruipruimtes: de lucht kan er dodelijk zijn zonder dat je het merkt.",
  fig:[["± 21%","zuurstof in normale lucht"],["Vooraf + tijdens","gasmeting"],["Mangatwacht","altijd bij de ingang"]],
  secs:[
    {h:"Wat is een besloten ruimte?", p:"Een ruimte met beperkte in- en uitgangen, die niet gemaakt is om in te verblijven en waar de ventilatie slecht is. Denk aan tanks, silo’s, putten, riolen en kruipruimtes."},
    {h:"Gevaren",
     l:["<b>Zuurstoftekort</b>, bijvoorbeeld doordat stikstof of een ander gas de zuurstof verdringt.","<b>Giftige gassen</b> (zoals H₂S of CO) en <b>explosieve</b> mengsels.","Te veel zuurstof: sterk verhoogd brandgevaar.","Beknelling, verdrinking, hitte en een moeilijke redding.","Zware gassen zakken naar het laagste punt: putten en kelders zijn extra gevaarlijk."]},
    {h:"Maatregelen",
     l:["Werkvergunning en een reddingsplan.","Installatie afsluiten en leidingen blinderen of loskoppelen; ruimte reinigen.","Ventileren met <b>buitenlucht</b>. Nooit met zuivere zuurstof.","<b>Gasmeting vooraf en tijdens</b> het werk: zuurstof, explosiegevaar en giftige stoffen.","Elektrisch gereedschap op veilige spanning; de transformator staat buiten de ruimte."]},
    {h:"De mangatwacht",
     l:["Staat de hele tijd bij de ingang en houdt contact met de mensen binnen.","Doet geen ander werk en verlaat zijn post niet.","Slaat alarm bij problemen en gaat <b>niet zelf naar binnen</b> zonder bescherming en aflossing."]}
  ],
  tip:"Veel slachtoffers in besloten ruimten zijn redders die zonder bescherming naar binnen gingen. Alarmeren gaat voor."
},
{
  id:"hijsen", t:"Hijsen en heffen",
  k:"Veilig hijsen draait om goed materiaal, duidelijke communicatie en afstand.",
  fig:[["WLL","maximale werklast"],["≤ 120°","maximale tophoek stroppen"],["1 persoon","geeft de aanwijzingen"]],
  secs:[
    {h:"Hoofdregels",
     l:["<b>Nooit onder een hangende last.</b> Zet het hijsgebied af.","Eén aangewezen <b>hijsbegeleider</b> geeft aanwijzingen aan de machinist, met afgesproken handsignalen of via de portofoon.","De kraanmachinist is daarvoor gecertificeerd.","Stuur de last bij met een <b>stuurlijn</b>, niet met je handen.","Stop het hijswerk bij te veel wind of slecht zicht."]},
    {h:"Hijsmiddelen",
     l:["Kettingen, stroppen, sluitingen en hijsbanden zijn gekeurd en gemarkeerd met de <b>WLL</b> (Working Load Limit: maximale werklast).","Controleer ze voor gebruik. Beschadigd? Afkeuren en melden.","Hoe groter de <b>tophoek</b> tussen twee stroppen, hoe zwaarder elke strop belast wordt. Houd de tophoek maximaal 120°, liefst kleiner."], d2:"tophoek"},
    {h:"Hijsen bij hoogspanning", p:"Houd voldoende afstand van bovengrondse hoogspanningslijnen en overleg vooraf met de netbeheerder."}
  ],
  tip:"Bij een tophoek van 120° draagt elke strop net zoveel als de hele last. Daarom is een kleine tophoek veiliger."
},
{
  id:"fysiek", t:"Fysieke belasting en omgeving",
  k:"Tillen, lawaai, trillingen, klimaat, straling en biologische agentia.",
  fig:[["23 kg","max. tilgewicht bij ideale omstandigheden"],["80 / 85 dB(A)","actiewaarden lawaai"],["+3 dB","twee keer zoveel geluidsenergie"]],
  secs:[
    {h:"Tillen en dragen",
     l:["Onder ideale omstandigheden maximaal <b>23 kg</b> (NIOSH). Hoe verder van je lichaam, hoe minder.","Gebruik hulpmiddelen of til met z’n tweeën.","Houd de last dicht bij je lichaam, rug recht, til vanuit je knieën en draai niet met je romp."]},
    {h:"Lawaai", d:"geluid",
     l:["Vanaf <b>80 dB(A)</b>: voorlichting en gehoorbescherming beschikbaar stellen.","Vanaf <b>85 dB(A)</b>: gehoorbescherming dragen is verplicht; de lawaaizone wordt gemarkeerd.","<b>87 dB(A)</b>: grenswaarde, gemeten achter de gehoorbescherming.","Elke 3 dB meer betekent twee keer zoveel geluidsenergie.","Lawaaidoofheid is blijvend. Oorsuizen (tinnitus) is een waarschuwing."]},
    {h:"Trillingen",
     l:["Hand-armtrillingen (trilgereedschap): witte vingers, gevoelloosheid, gewrichtsklachten.","Lichaamstrillingen (voertuigen, trilplaten): rugklachten.","Kies trillingsarm gereedschap, beperk de duur en wissel af."]},
    {h:"Klimaat",
     l:["Hitte: drink regelmatig water, neem pauzes in de schaduw en bescherm je tegen de zon (UV).","Kou: draag warme, droge kleding en neem pauzes in een warme ruimte."]},
    {h:"Straling",
     l:["<b>Ioniserende straling</b> (röntgen, radioactieve bronnen): je ziet, ruikt of voelt het niet. Bescherm je met <b>tijd</b> (kort), <b>afstand</b> (groot) en <b>afscherming</b>.","Kom niet in een afgezet stralingsgebied. Alleen bevoegde personen met dosimeter.","Niet-ioniserend: UV (lasflits), laser, infrarood. Gebruik de juiste afscherming en PBM."]},
    {h:"Biologische agentia",
     l:["Bacteriën, virussen en schimmels, bijvoorbeeld legionella, tetanus en de ziekte van Weil (via rattenurine in water of grond).","Goede hygiëne: handen wassen, wondjes afdekken, handschoenen dragen."]}
  ],
  tip:"Onthoud: bij 80 dB(A) beschikbaar stellen, bij 85 dB(A) verplicht dragen."
},
{
  id:"pbm", t:"PBM en veiligheidssignalering",
  k:"Persoonlijke beschermingsmiddelen en wat de vorm en kleur van borden betekenen.",
  fig:[["CE","verplicht op PBM"],["I · II · III","categorieën PBM"],["Kosteloos","werkgever betaalt"]],
  secs:[
    {h:"Regels voor PBM",
     l:["PBM zijn het <b>laatste redmiddel</b>: ze nemen het gevaar niet weg en beschermen alleen de drager.","De werkgever verstrekt ze <b>kosteloos</b>; de werknemer gebruikt en bewaart ze goed.","Ze moeten passen, bij het gevaar horen en een <b>CE-markering</b> hebben.","<b>Categorie III</b>: bescherming tegen dodelijke of onherstelbare schade, zoals valbeveiliging en adembescherming. Hiervoor is training verplicht."]},
    {h:"Soorten",
     l:["<b>Hoofd</b>: veiligheidshelm. Vervangen na een harde klap of als hij verouderd is.","<b>Ogen en gezicht</b>: veiligheidsbril, ruimzichtbril (tegen spatten), gelaatsscherm, laskap.","<b>Gehoor</b>: oordoppen, otoplastieken of oorkappen.","<b>Handen</b>: handschoenen die bij het gevaar passen (snijden, chemicaliën, warmte).","<b>Voeten</b>: veiligheidsschoenen met neus en anti-perforatiezool.","<b>Lichaam</b>: signaalkleding, vlamvertragende kleding, chemiepak."]},
    {h:"Adembescherming",
     l:["<b>Filtermasker</b>: alleen bij voldoende zuurstof en als je weet welke stof er is.","<b>Onafhankelijke adembescherming</b> (perslucht of verse lucht) bij zuurstoftekort, onbekende stoffen of hoge concentraties."], d2:"filters"},
    {h:"Vorm en kleur van borden", d:"borden", p:"Aan de vorm en kleur zie je al wat een bord betekent, ook als je het symbool niet kent."}
  ],
  tip:"Verwar ‘gebod’ (blauw en rond: je moet) niet met ‘verbod’ (rode rand met balk: het mag niet)."
}
];

// ---------- Schema's ----------
const DIAG = {
  strategie(){
    const s=[["Bron","Gevaar wegnemen of vervangen: een stillere machine, een minder giftige stof."],
             ["Collectief","Maatregelen voor iedereen: afscherming, afzuiging, leuningen."],
             ["Individueel","Maatregelen per persoon: werktijd beperken, rouleren, afstand houden."],
             ["PBM","Persoonlijke bescherming: helm, masker, gordel. Het laatste redmiddel."]];
    return `<ol class="stair" aria-label="Arbeidshygiënische strategie">${s.map(([a,b],i)=>`<li style="--w:${100-i*11}%;--m:${34-i*8}%"><b>${a}</b><span>${b}</span></li>`).join("")}</ol>`;
  },
  bird(){
    const L=[["1","ernstig of dodelijk ongeval","--p1"],["10","ongevallen met licht letsel","--p2"],["30","ongevallen met schade","--p3"],["600","bijna-ongevallen","--p4"]];
    const ys=[14,58,102,146,190], cx=112, half=y=>(y-14)*(100/176);
    let s=`<svg class="diag" viewBox="0 0 470 204" style="max-width:520px" role="img" aria-label="Ongevallenpiramide van Bird: 1, 10, 30, 600">`;
    L.forEach((l,i)=>{
      const y1=ys[i],y2=ys[i+1],ym=(y1+y2)/2+(i===0?8:0);
      s+=`<polygon points="${cx-half(y1)},${y1} ${cx+half(y1)},${y1} ${cx+half(y2)},${y2} ${cx-half(y2)},${y2}" style="fill:var(${l[2]});stroke:var(--paper);stroke-width:3"/>`;
      const xr=cx+half(ym)+6;
      s+=`<line x1="${xr}" y1="${ym}" x2="236" y2="${ym}" style="stroke:var(--line);stroke-width:1.5"/>`;
      s+=`<text x="244" y="${ym+5}"><tspan class="db" style="font:700 17px var(--mono)">${l[0]}</tspan>  ${l[1]}</text>`;
    });
    return s+"</svg>";
  },
  brand(){
    const fl="M50 10c4 14 22 24 22 46 0 16-10 30-22 30S28 72 28 56c0-10 5-17 10-22 0 8 3 13 8 15-2-14 0-28 4-39z";
    return `<svg class="diag" viewBox="0 0 340 240" style="max-width:380px" role="img" aria-label="Branddriehoek: brandbare stof, zuurstof, ontstekingstemperatuur">
      <polygon points="170,24 292,192 48,192" style="fill:none;stroke:var(--hivis);stroke-width:12;stroke-linejoin:round"/>
      <g transform="translate(142 88) scale(.56)"><path d="${fl}" style="fill:var(--bad)"/></g>
      <text x="98" y="104" text-anchor="end" class="db">Brandbare</text><text x="98" y="122" text-anchor="end" class="db">stof</text>
      <text x="242" y="113" class="db">Zuurstof</text>
      <text x="170" y="224" text-anchor="middle" class="db">Ontstekingstemperatuur</text></svg>`;
  },
  explosie(){
    return `<svg class="diag" viewBox="0 0 600 132" role="img" aria-label="Explosiegebied tussen onderste en bovenste explosiegrens">
      <rect x="20" y="46" width="180" height="34" rx="4" style="fill:var(--paper-2)"/>
      <rect x="200" y="46" width="200" height="34" style="fill:var(--hivis)"/>
      <rect x="400" y="46" width="180" height="34" rx="4" style="fill:var(--paper-2)"/>
      <text x="110" y="68" text-anchor="middle">te arm</text>
      <text x="300" y="68" text-anchor="middle" style="fill:#1A1400;font-weight:700">explosief</text>
      <text x="490" y="68" text-anchor="middle">te rijk</text>
      <line x1="200" y1="34" x2="200" y2="92" style="stroke:var(--ink);stroke-width:2"/>
      <line x1="400" y1="34" x2="400" y2="92" style="stroke:var(--ink);stroke-width:2"/>
      <text x="200" y="26" text-anchor="middle" class="dm">OEG / LEL</text>
      <text x="400" y="26" text-anchor="middle" class="dm">BEG / UEL</text>
      <text x="20" y="114" class="dm">0%</text>
      <text x="580" y="114" text-anchor="end" class="dm">100% brandbaar gas</text>
      <text x="300" y="114" text-anchor="middle" class="dm">aardgas: ± 5 – 15 vol%</text></svg>`;
  },
  blus(){
    const r=[["A","Vaste stoffen: hout, papier, textiel","Water, schuim, ABC-poeder"],
             ["B","Vloeistoffen: benzine, olie, verf","Schuim, poeder, CO₂"],
             ["C","Gassen: propaan, aardgas","Eerst de toevoer dicht; poeder"],
             ["D","Metalen: magnesium, aluminiumpoeder","Speciaal metaalbrandpoeder (D), droog zand"],
             ["F","Spijsvetten en -oliën","Vetblusser (F), blusdeken, deksel. Nooit water"],
             ["⚡","Elektrische apparatuur onder spanning","CO₂ (of poeder). Spanning eraf als dat kan"]];
    return `<div class="tbl"><table><thead><tr><th>Klasse</th><th>Wat brandt er</th><th>Geschikt blusmiddel</th></tr></thead><tbody>${r.map(x=>`<tr><td class="kl">${x[0]}</td><td>${x[1]}</td><td>${x[2]}</td></tr>`).join("")}</tbody></table></div>`;
  },
  ladder(){
    const tan=Math.tan(70*Math.PI/180), fx=200-130/tan, tx=200+64/tan;
    const ax=-9.4, ay=-3.4;
    let rungs="";
    for(let t=0.07;t<0.99;t+=0.085){const x=fx+(tx-fx)*t, y=240-194*t; rungs+=`<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x+ax).toFixed(1)}" y2="${(y+ay).toFixed(1)}"/>`;}
    return `<svg class="diag" viewBox="0 0 340 270" style="max-width:360px" role="img" aria-label="Ladder: stahoek 65 tot 75 graden, 1 meter uitsteken">
      <rect x="200" y="110" width="90" height="130" style="fill:var(--line)"/>
      <line x1="10" y1="240" x2="330" y2="240" style="stroke:var(--ink-3);stroke-width:2"/>
      <g style="stroke:var(--ink);stroke-width:4;stroke-linecap:round">
        <line x1="${fx.toFixed(1)}" y1="240" x2="${tx.toFixed(1)}" y2="46"/>
        <line x1="${(fx+ax).toFixed(1)}" y1="${240+ay}" x2="${(tx+ax).toFixed(1)}" y2="${46+ay}"/>
      </g>
      <g style="stroke:var(--ink);stroke-width:2.5">${rungs}</g>
      <path d="M${(fx+32).toFixed(1)} 240 A32 32 0 0 0 ${(fx+32*Math.cos(70*Math.PI/180)).toFixed(1)} ${(240-32*Math.sin(70*Math.PI/180)).toFixed(1)}" style="fill:none;stroke:var(--bad);stroke-width:2.5"/>
      <text x="${(fx+36).toFixed(1)}" y="222" class="db" style="fill:var(--bad)">65–75°</text>
      <g style="stroke:var(--info);stroke-width:1.8">
        <line x1="258" y1="110" x2="258" y2="46"/><line x1="252" y1="110" x2="264" y2="110"/><line x1="252" y1="46" x2="264" y2="46"/>
        <line x1="306" y1="110" x2="306" y2="240"/><line x1="300" y1="110" x2="312" y2="110"/><line x1="300" y1="240" x2="312" y2="240"/>
        <line x1="${fx.toFixed(1)}" y1="256" x2="200" y2="256"/><line x1="${fx.toFixed(1)}" y1="250" x2="${fx.toFixed(1)}" y2="262"/><line x1="200" y1="250" x2="200" y2="262"/>
      </g>
      <text x="268" y="83" class="dm" style="fill:var(--info)">± 1 m</text>
      <text x="314" y="180" class="dm" style="fill:var(--info)">h</text>
      <text x="${((fx+200)/2).toFixed(1)}" y="268" text-anchor="middle" class="dm" style="fill:var(--info)">¼ h</text>
      <text x="206" y="104" class="dm">dakrand</text></svg>`;
  },
  geluid(){
    const x=d=>20+(d-60)*11.2;
    let ticks="";
    for(let d=60;d<=110;d+=10) ticks+=`<line x1="${x(d)}" y1="72" x2="${x(d)}" y2="78" style="stroke:var(--ink-3);stroke-width:1.5"/><text x="${x(d)}" y="93" text-anchor="middle" class="dm">${d}</text>`;
    return `<svg class="diag" viewBox="0 0 600 150" role="img" aria-label="Geluidsschaal met actiewaarden 80, 85 en grenswaarde 87 dB(A)">
      <rect x="${x(60)}" y="48" width="${x(80)-x(60)}" height="24" style="fill:var(--ok)"/>
      <rect x="${x(80)}" y="48" width="${x(85)-x(80)}" height="24" style="fill:var(--hivis)"/>
      <rect x="${x(85)}" y="48" width="${x(110)-x(85)}" height="24" style="fill:var(--bad)"/>
      ${ticks}
      <line x1="${x(80)}" y1="30" x2="${x(80)}" y2="72" style="stroke:var(--ink);stroke-width:2"/>
      <line x1="${x(85)}" y1="30" x2="${x(85)}" y2="72" style="stroke:var(--ink);stroke-width:2"/>
      <line x1="${x(87)}" y1="48" x2="${x(87)}" y2="112" style="stroke:var(--ink);stroke-width:2;stroke-dasharray:3 3"/>
      <text x="${x(80)-6}" y="26" text-anchor="end"><tspan class="db">80</tspan> beschikbaar stellen</text>
      <text x="${x(85)+6}" y="26"><tspan class="db">85</tspan> verplicht dragen</text>
      <text x="${x(87)+6}" y="118"><tspan class="db">87</tspan> grenswaarde (achter de bescherming)</text>
      <text x="${x(60)}" y="142" class="dm">gesprek ≈ 60</text>
      <text x="${x(100)}" y="142" text-anchor="middle" class="dm">haakse slijper ≈ 100</text>
      <text x="580" y="142" text-anchor="end" class="dm">dB(A)</text></svg>`;
  },
  gasfles(){
    const c=[["#C8281E","Rood: brandbaar"],["#7CB9E8","Lichtblauw: oxiderend"],["#F2C200","Geel: giftig en/of bijtend"],["#4CBB47","Heldergroen: inert (verstikkend)"],["#FFFFFF","Wit: zuurstof"],["#7B3F2A","Kastanjebruin: acetyleen"]];
    return `<div class="sw">${c.map(([k,t])=>`<span><i style="background:${k}"></i>${t}</span>`).join("")}</div>`;
  },
  filters(){
    const c=[["#8B5A2B","A · bruin: organische dampen"],["#8E959B","B · grijs: anorganische gassen"],["#F2C200","E · geel: zure gassen"],["#3E9B4F","K · groen: ammoniak"],["#FFFFFF","P · wit: stof, nevel, rook"]];
    return `<p class="small muted" style="margin-top:10px">Filterkleuren</p><div class="sw">${c.map(([k,t])=>`<span><i style="background:${k}"></i>${t}</span>`).join("")}</div>`;
  },
  tophoek(){
    const one=(deg,f)=>{
      const a=deg/2*Math.PI/180, L=58, dx=L*Math.sin(a), dy=L*Math.cos(a), y2=10+dy;
      const w=Math.max(2*dx+16,40);
      return `<figure><svg viewBox="0 0 120 ${Math.ceil(y2+30)}" aria-hidden="true">
        <circle cx="60" cy="8" r="4" style="fill:var(--ink)"/>
        <line x1="60" y1="10" x2="${(60-dx).toFixed(1)}" y2="${y2.toFixed(1)}" style="stroke:var(--ink);stroke-width:3"/>
        <line x1="60" y1="10" x2="${(60+dx).toFixed(1)}" y2="${y2.toFixed(1)}" style="stroke:var(--ink);stroke-width:3"/>
        <rect x="${(60-w/2).toFixed(1)}" y="${y2.toFixed(1)}" width="${w.toFixed(1)}" height="18" rx="2" style="fill:var(--ink-3)"/>
      </svg><figcaption><b>${deg}° → ${f}</b>× de last per strop</figcaption></figure>`;
    };
    return `<div class="minis">${one(60,"0,58")}${one(90,"0,71")}${one(120,"1,0")}</div>`;
  },
  borden(){
    const B=window.VCA_BORDEN;
    if(!B||!B.CAT) return "";
    return `<div class="legend" style="margin-block:12px">${Object.keys(B.CAT).map(c=>`<div class="lg">${B.shape(c)}<b>${B.CAT[c].naam}</b><span>${B.CAT[c].vorm}</span></div>`).join("")}</div>
      <button class="btn" data-act="tab" data-arg="borden">Oefen alle borden →</button>`;
  }
};

window.VCA_LESSTOF = { MODS, DIAG };
})();
