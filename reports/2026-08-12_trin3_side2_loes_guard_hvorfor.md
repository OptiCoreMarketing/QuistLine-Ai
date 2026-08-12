# Task Rapport: Trin 3, side 3.2 — Løs Vagtpost-stop + "Hvorfor?"

**Task:** TASK-106
**Udført af:** Claude (denne session, direkte filredigering + browser-test)
**Dato:** 12. august 2026
**Status:** FÆRDIG for den afgrænsede side, med ét scope-korrigeret kriterie
(se "Kursændring undervejs") og samme DB-forbehold som tidligere sider.

---

## Status

Side 3.1 efterlod et reelt hul: Vagtposten kan sætte en task i
`AWAITING_OWNER_REVIEW`, men intet i UI'et kunne få den ud igen. Denne side
lukker det, plus to andre pkt.58-funktioner, der havde reel data at virke
på (i modsætning til kommandopalet/detaljeniveauer, stadig udskudt).

## Acceptkriterier (låst før byggeri, jf. pkt. 77)
1. Et `guard_violation`-kort i skibsjournalen har "Fortsæt"/"Stop
   opgaven"-knapper, der bruger den eksisterende tilstandsmaskine — ingen
   ny risikoklasse-/budget-logik (det er trin 4)
2. Klik på "Hvorfor?" på en hvilken som helst hændelse viser hele kæden
   op til Owners oprindelige besked via `parent_event_id` (pkt. 58.2)
3. ~~"Kun det, der kræver mig"-filter som default på skibsjournalen~~ —
   se kursændring nedenfor
4. Ingen JS-fejl, læsbarhed (pkt. 21) og signalflag-farver (pkt. 57.2) bevares

## Kursændring undervejs (opdaget under byggeri, ikke før)

Kriterie 3 var forkert scopet. Pkt. 55.4's "kræver mig"-filter er skrevet
for **aktivitets-streamen** — den globale, tværgående observationskanal
(pkt. 42, 48.2). Chief-chatten er derimod **kommandokanalen**: en samtale
mellem Owner og Chief, ikke en støj-fyldt strøm, der skal filtreres. At
filtrere normale Chief-svar væk fra selve samtalen ville have løst det
forkerte problem og gjort chatten forvirrende at bruge.

**Rettelse:** i stedet er sidebarens allerede eksisterende "Afventer
dig"-boks (bygget i side 3.1) gjort klikbar — den hopper til og fremhæver
den relevante hændelse i skibsjournalen (`jumpToTask()`). Det giver
"kræver mig"-konceptets reelle værdi (find hurtigt det, der venter på dig)
uden at bryde kommandokanalens grundprincip. En rigtig aktivitets-stream
med detaljeniveauer hører til en senere side, når der er nok volumen og
flere agenter til, at filtrering reelt løser et problem.

## Ændringer

**Backend:** `POST /api/tasks/:taskId/transition` — blotlægger
`transitionTask()` direkte for Owner. Afviser ulovlige overgange med 400
og tilstandsmaskinens egen fejltekst (samme validering som resten af
systemet, ingen dublet logik).

**Frontend (`src/public/index.html`):**
- `guard_violation`-kort har nu "Fortsæt opgaven" (→ `RUNNING`) og "Stop
  opgaven" (→ `KILLED`) — kalder det nye endpoint, genindlæser workspace
- Hver hændelse har en "🔗"-knap ("Hvorfor?"). Klik åbner en modal med
  hele kæden, bygget ved at følge `parent_event_id` baglæns gennem de
  allerede indlæste hændelser — ingen ny backend-forespørgsel nødvendig
- HQ-sidebarens "Afventer dig"-liste er klikbar (`jumpToTask()`) og
  scroller til + fremhæver den tilknyttede hændelse i skibsjournalen
- `CURRENT_EVENTS`/`CURRENT_TASKS` gemmes nu som modul-tilstand, så
  kæde-visning og hop-til-opgave kan arbejde på allerede hentet data

## Antagelser, alternativer og risici (jf. pkt. 25)

**Antaget — "Fortsæt" sætter status til `RUNNING`, ikke `APPROVED`.**
Tilstandsmaskinen tillader begge fra `AWAITING_OWNER_REVIEW`. `RUNNING`
valgt, fordi de nuværende guard-stop (kontraktvalidering,
hemmeligheds-scanner) er kvalitetsproblemer i selve arbejdet — at
"godkende" et output, der manglede påkrævede sektioner, ville være
misvisende. `APPROVED` passer bedre, når trin 4 tilføjer rigtige
godkendelses-gates for i øvrigt korrekt arbejde.

**Risiko, uændret fra side 3.1:** ingen server-side kontrol af, at task'en
reelt er i `AWAITING_OWNER_REVIEW`, før knapperne vises — hvis en anden
proces allerede har flyttet den, afviser tilstandsmaskinen forsøget
korrekt (400 + tydelig fejl), men knappen forbliver synlig på et
forældet kort, indtil workspacet genindlæses. Mindre UX-ridse, ikke en
korrekthedsfejl (databasen er stadig den eneste sandhed).

## Tests

**Automatiseret:** `npm test` (17 eksisterende) stadig grønne — den nye
route ændrede ikke eksisterende adfærd.

**Manuel browser-test (kørt i denne session, med seedet mock-data i
`CURRENT_EVENTS`/`CURRENT_TASKS` — ingen database i byggemiljøet):**
- Guard-kort renderer korrekt med begge handlingsknapper
- `showChain('ev-3')` viste alle 3 hændelser i kæden (owner → rapport →
  guard_violation) i korrekt rækkefølge; `closeChain()` skjulte modalen igen
- `jumpToTask('task-1')` fandt det rigtige element og satte en synlig
  outline
- `resolveGuardTask()` verificeret (med stubbet `api()` for at undgå
  netværkskald i et miljø uden database): kalder
  `POST /api/tasks/task-1/transition` med korrekt body, og genindlæser
  workspacet bagefter
- Ingen JS-fejl i konsollen ud over de forventede 500'ere fra manglende
  `DATABASE_URL`

**Ikke testet:** hele vejen mod rigtig Postgres (samme forbehold, nu for
fjerde side i træk — se anbefaling).

## Nye åbne spørgsmål
Ingen nye — denne side afklarede mere, end den åbnede (kursændringen
ovenfor var en selv-opdaget fejl, ikke et nyt spørgsmål til dig).

## Anbefaling

1. **Dette er den fjerde side i træk, der kun er logik-testet, ikke
   database-testet.** Værdien af at fortsætte at bygge visuelt aftager,
   indtil mindst én fuld, rigtig gennemkørsel er bekræftet. Stærk
   anbefaling: kør `npm run migrate` + test den fulde vej (søsæt → chat →
   hyr Engineer → udløs en guard-overtrædelse med vilje, fx en kunstigt
   kort test-prompt → bekræft Fortsæt/Stop virker) før næste side.
2. Brug siden selv (Gate G).
3. Herefter: side 3.3 (aktivitets-stream/detaljeniveauer) er stadig lav
   prioritet uden mere volumen. Side 2.2 (orchestrator) og trin 4
   (godkendelses-gates) er de naturlige næste skridt, men begge kræver en
   beslutning fra dig, ikke bare mere kode.
