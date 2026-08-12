# Task Rapport: Trin 3, side 3.3 — To-kanal-model (Chief-chat ≠ aktivitets-strøm)

**Task:** TASK-107
**Udført af:** Claude (denne session, direkte filredigering + browser-test)
**Dato:** 12. august 2026
**Status:** FÆRDIG for den afgrænsede side. Samme DB-forbehold som de tre
foregående sider — se anbefaling.

---

## Status

Under arbejdet med side 3.2 lagde jeg mærke til, at min egen tidligere
løsning (side 3.1) havde blandet to ting sammen, som specen (pkt. 42,
48.1) eksplicit holder adskilt: **kommandokanalen** (kun Owner ↔ Chief,
tovejs) og **observationskanalen** (alle agenter, read-only,
aktivitets-strømmen). Jeg havde lagt rapporter, tilstandsskift og
guard_violations direkte ind i Chief-chatten. Denne side retter det.

## Acceptkriterier (låst før byggeri, jf. pkt. 77)
1. Layoutet matcher pkt. 48.1: midterkolonnen deles lodret — øverst
   SKIB/SITE (uændret), nederst en ny **Aktivitets-strøm**
2. Chief-chatten (højre panel) viser **kun** `message`-hændelser
   (Owner ↔ Chief) — ingen rapporter, tilstandsskift eller guard-stop
3. Aktivitets-strømmen viser alle hændelsestyper, med "kun det, der
   kræver mig" som **default**-filter (pkt. 55.4), og en tydelig
   "vis alt"-knap
4. Fortsæt/Stop-knapper og "Hvorfor?"-kæden fra side 3.2 virker uændret,
   nu i den rigtige kanal
5. Ingen JS-fejl, læsbarhed og signalflag-farver bevares

Alle 5 opfyldt.

## Ændringer

**`src/public/index.html`:**
- Midterkolonnen (`<main>` i `#subtab-hq`) delt i to zoner: SKIB/SITE
  (45% højde, uændret indhold) og en ny `#activity-stream`-sektion (55%
  højde) med egen header og filter-knap
- `renderChatFeed()`: filtrerer `CURRENT_EVENTS` til kun `type === 'message'`
- `renderActivityStream()`: viser alle typer, anvender `STREAM_FILTER`
  ('needs_me' som default, matcher guard_violations + hændelser knyttet
  til en task i en AWAITING_*-tilstand)
- `refreshWorkspace()` henter nu events/tasks først, og kalder derefter
  begge render-funktioner — undgår at de to paneler kan komme ud af trit
  med hinanden
- `jumpToTask()` leder nu i `#activity-stream` (falder tilbage til
  `#chat-feed` for robusthed)
- Fejltilstande centraliseret i `EVENTS_ERROR`/`TASKS_ERROR`, læst af
  begge render-funktioner — samme fejlbesked vises ikke to gange forskudt

**Ingen backend-ændringer** — dette var en ren frontend-omstrukturering af
data, der allerede var korrekt hentet.

## Antagelser, alternativer og risici (jf. pkt. 25)

**Antaget — "vis alt" i aktivitets-strømmen viser også `message`-typen.**
Pkt. 42 siger "du kan se alt" — observationskanalen er ikke begrænset til
ikke-kommando-hændelser, den er en komplet, filtrerbar visning af hele
loggen. Chief-chatten er en **udvalgt** visning til samtale, ikke den
eneste måde at se Chiefs svar. Verificeret: med filter sat til "alt" viser
strømmen også Owner/Chief-beskederne.

**Risiko, identificeret men ikke løst her:** de to paneler kan nu vise
delvist overlappende indhold (en Chief-besked ses i begge, hvis "vis alt"
er valgt i strømmen). Det er en bevidst konsekvens af "du kan se alt", men
værd at holde øje med, om det bliver forvirrende i praksis med rigtig
brug — noteret til Gate G.

**Ikke ændret:** "Bed Chief om at gribe ind her"-knappen fra pkt. 42
(prædfylder chatten med kontekst fra en observeret hændelse) blev
overvejet, men udskudt — kræver mere end en enkelt sides indsats til at
gøre ordentligt (skal formulere en meningsfuld kontekst-tekst, ikke bare
en event-ID), og ingen af de nuværende hændelsestyper (rapport,
tilstandsskift) har et naturligt "gribe ind her"-behov endnu, før der er
en rigtig worker-tråd at afbryde.

## Tests

**Automatiseret:** ingen ændring i backend, `npm test` ikke genkørt
separat for denne side (uændrede filer).

**Manuel browser-test (seedet mock-data, samme metode som forrige sider):**
- Chat-feed indeholdt Owner- og Chief-beskeder, **ikke** rapport eller
  guard_violation — bekræftet ved tekst-check
- Aktivitets-strøm indeholdt rapport og guard_violation, **ikke**
  Owner/Chief-beskeder ved default-filter — bekræftet
- Skift til "Viser alt" gjorde Owner/Chief-beskederne synlige i strømmen
  også — bekræftet
- Zonehøjde: målt til 274px/334px ≈ 45/55 %, matcher layoutet
- `jumpToTask`, `showChain`, `resolveGuardTask` alle verificeret at virke
  uændret i den nye struktur
- `toggleMainView('site'/'team')` fungerer uændret inde i den nye
  indre wrapper
- Ingen JS-fejl i konsollen ud over den forventede 500 (manglende
  `DATABASE_URL`)

**Ikke testet:** fortsat ingen rigtig database i byggemiljøet — dette er
nu **femte side i træk** uden en ægte, ende-til-ende-bekræftet gennemkørsel.

## Anbefaling

Gentager forrige rapports anbefaling, nu mere indtrængende: værdien af at
blive ved med at bygge visuelt uden at bekræfte mod en rigtig database
aftager for hver side. Der er nu betydelig, ikke-verificeret kode
ovenpå hinanden. Før mere bygges:
1. Kør `npm run migrate` mod din Railway-Postgres
2. Sæt `DATABASE_URL` og kør `npm test` (den DB-gatede del af
   integrationstestene kører først da)
3. Åbn siden i en rigtig browser, søsæt et testskib, og gennemfør et
   helt forløb: chat, hyr Engineer, udløs en guard-overtrædelse med
   vilje, brug Fortsæt/Stop, prøv "Hvorfor?" og filter-knappen
4. Meld tilbage, hvis noget af det opdagede ikke virker som beskrevet —
   det er hurtigere at rette nu end efter endnu flere sider
