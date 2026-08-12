# Task Rapport: Trin 1a — Datamodel + event-log med hash-kæde

**Task:** TASK-103
**Udført af:** Claude (denne session, direkte filredigering — platformens
egen orchestrator/tilstandsmaskine findes ikke endnu, det er trin 2)
**Dato:** 12. august 2026
**Status:** FÆRDIG, MED ÉT VÆSENTLIGT FORBEHOLD (se "Ikke testet" nedenfor)

---

## Status

Scope var afgrænset til trin 1a, som defineret i
`spec/87-spec-sundhedstjek.md` pkt. 93: tabellerne `business`, `task`,
`event` (med `prev_event_hash`/`event_hash` fra første række), plus en
grundlæggende migration. Stamtavle, `artifacts`, `agent_trust` og
`provenance` (trin 1b) er bevidst **ikke** rørt — de kræver ikke, at 1a
allerede er i produktion, jf. samme punkt.

Testbarhedskravet fra pkt. 93 ("en task kan oprettes, og hændelser kan
skrives/læses i kæde") er opfyldt af koden og bekræftet af unit-tests, men
**ikke afprøvet mod en rigtig Postgres-instans** — se forbeholdet nedenfor.

## Ændringer

**Ny database-lag:**
- `migrations/001_init.sql` — opretter `business`, `task`, `event`
- `scripts/migrate.js` — kører migrationer i rækkefølge, sporet i
  `schema_migrations`, idempotent (springer allerede kørte filer over)
- `src/db.js` — `pg`-connection pool, læser `DATABASE_URL`
- `src/eventLog.js` — `appendEvent`, `getEventsForBusiness`, `verifyChain`,
  `computeEventHash`

**`src/server.js` omskrevet fra Mongoose til Postgres:**
- Mongoose/MongoDB-koden er fjernet helt (jf. anbefalingen i pkt. 83.5: "to
  databaser er to ting at holde ved lige")
- `GET /api/tasks` læser nu fra `task`-tabellen (joinet med `business`)
- `POST /api/agent` opretter/finder en `business` pr. `projectName`, skriver
  et `message`-event for Owners forespørgsel, og — ved `hireWorker` — et
  `report`-event for Engineerens output og et `message`-event for Chiefs
  svar, alle kædet via `parent_event_id`
- Nye endpoints: `GET /api/events?businessId=` (læs kæden) og
  `GET /api/events/verify?businessId=` (genberegn og verificér kæden)
- Ny `requireDatabase`-middleware: uden `DATABASE_URL` svarer begge
  endpoints nu med en tydelig 500-fejl frem for den gamle stiltiende
  tomme-liste-adfærd fra Mongoose-koden — der er ikke længere en
  meningsfuld degraderet tilstand, når Postgres er system of record
- Eksisterende stopgap-auth, rate limiting og model-allowlist fra trin 0 er
  bevaret uændret

**Fjernet:**
- `mongoose`-afhængighed (erstattet af `pg`)
- `src/tasks.json` — dødt seed-data, blev aldrig læst af nogen kode, heller
  ikke før dette skift

**Dokumentation:** `docs/README.md` (migrate-step + status), `docs/CHANGELOG.md`,
`memory/decisions.md`, `spec/INDEX.md` (byggerækkefølge + rettede en
duplikeret #8-række fundet undervejs i "tilføjet senere"-tabellen).

## Antagelser, alternativer og risici (jf. pkt. 25)

**Antaget — hash-kæden er scoped pr. business, ikke global.** Spec pkt. 40
og 69 specificerer feltet, men ikke kædens omfang. Begrundelse for valget:
pkt. 66.1 kræver, at proveniens kan "udskilles og sælges sammen med et
projekt" — en global kæde på tværs af alle businesses ville gøre det
umuligt at verificere ét projekts historik isoleret, fordi verifikation af
event N ville kræve at kende alle andre projekters events imellem. Prisen
ved dette valg: en køber kan ikke bruge kæden til at bevise, at intet
projekt blev indsat/fjernet i forhold til andre projekter — kun at det
enkelte projekts egen historik er intern konsistent. Det vurderes
acceptabelt, fordi det er præcis den garanti, pkt. 66.1 faktisk beder om.
**Bør bekræftes eksplicit af Owner**, da det er en strukturel beslutning
(dyr at ændre, jf. pkt. 30.9) — se nyt åbent spørgsmål nedenfor.

**Antaget — `task` har kun to statusser (`RUNNING`/`DONE`) i 1a.** Den
fulde tilstandsmaskine (`DRAFT → AWAITING_TOOL_APPROVAL → ...`, pkt. 41.3)
er eksplicit trin 2's ansvar. At bygge den nu ville være den scope creep,
pkt. 93 selv blev skrevet for at undgå.

**Antaget — `cost_usd` er `null` indtil videre.** Der findes endnu ingen
prismodel-tabel for Groq/Claude-tokens i specen. At opfinde tal her ville
være mere skadeligt end at lade feltet stå tomt. Kolonnen findes allerede
i skemaet, så intet skal eftermonteres, når priser besluttes.

**Alternativ overvejet — ORM (Prisma/Drizzle) frem for rå `pg` +
hånd-skrevne SQL-migrationer.** Fravalgt: projektet er solo-drevet og
skemaet er simpelt (3 tabeller). En ORM tilføjer en afhængighed og en
indlæringskurve, som ikke står mål med den nuværende kompleksitet — kan
genovervejes, hvis skemaet vokser markant i 1b/senere trin.

**Risiko identificeret og lukket under implementering:** `computeEventHash`
serialiserede oprindeligt `payload` med almindelig `JSON.stringify`.
Postgres' `jsonb`-lagring garanterer ikke at bevare objekt-nøglers
indsættelsesrækkefølge, hvilket ville have givet en anden hash ved læsning
end ved skrivning af **samme, uændrede** data — dvs. falske
manipulations-alarmer. Rettet ved en nøgle-sorteret, stabil
serialisering (`stableStringify`), testet eksplicit (se Tests).

**Risiko identificeret og lukket:** to samtidige `POST /api/agent`-kald for
samme `business` kunne have læst samme "forrige hash" og skrevet to
grene i stedet for én kæde. Løst med en Postgres advisory lock
(`pg_advisory_xact_lock`) pr. `business_id` inde i `appendEvent`s
transaktion.

## Tests

**Unit-tests (kører altid, ingen database krævet):**
- `computeEventHash` er deterministisk
- `computeEventHash` er uafhængig af objekt-nøglerækkefølge i payload
  (den konkrete jsonb-risiko beskrevet ovenfor)
- `computeEventHash` opdager ændret payload
- `computeEventHash` indregner `prevEventHash` (selve kædens pointe)

Alle fire bekræftet bestået, se kørsel nedenfor.

**Integrationstest (kun hvis `DATABASE_URL` er sat):** opretter en
midlertidig business, skriver to kædede events, læser dem tilbage,
verificerer kæden, manipulerer én hændelse direkte i databasen, og
bekræfter at `verifyChain` opdager det. Rydder op efter sig selv.

**Kørt i denne session:**
```
✓ computeEventHash er deterministisk
✓ computeEventHash er uafhængig af objekt-nøglerækkefølge
✓ computeEventHash opdager ændret payload
✓ computeEventHash indregner prevEventHash (selve kæden)
… DATABASE_URL ikke sat — springer integrationstest af hash-kæden over.
✓ Alle tests bestået.
```

**Manuelt afprøvet:** serveren startet lokalt uden `DATABASE_URL`; bekræftet
at `/api/tasks` og `/api/agent` nu fejler med en tydelig
`{"error":"DATABASE_URL er ikke sat..."}` i stedet for at fejle stille
eller crashe. `index.html` blev fortsat serveret korrekt (200).

**Ikke testet — væsentligt forbehold:** der er ingen Postgres-instans
tilgængelig i dette byggemiljø. `migrations/001_init.sql` og
`scripts/migrate.js` er derfor kun syntakstjekket og kodegennemgået, **ikke
kørt mod en rigtig database**. Integrationstesten af selve hash-kæden
(skriv/læs/verificér mod ægte Postgres) har heller ikke kørt. Dette er den
egentlige test af, om trin 1a's acceptkriterie er opfyldt — anbefalingen
nedenfor adresserer det direkte.

## Nyt åbent spørgsmål (tilføjes til spec pkt. 14)

24. Skal hash-kæden være scoped pr. business (som implementeret) eller
    global på tværs af platformen? Se antagelsen ovenfor — vurderes rigtig,
    men er en strukturel beslutning, der bør bekræftes eksplicit, før 1b
    (som bygger videre på event-skemaet) påbegyndes.

## Anbefaling

1. **Kør `npm run migrate` mod din Railway-Postgres og kør `npm test` med
   `DATABASE_URL` sat**, før trin 1a betragtes som reelt bevist — ikke kun
   kodegennemgået. Meld tilbage, hvis migrationen eller integrationstesten
   fejler.
2. Bekræft (eller korrigér) antagelsen om per-business hash-kæde-scope,
   inden 1b bygges ovenpå.
3. Herefter kan trin 2 (orchestrator + kø + tilstandsmaskine + Vagtposten)
   påbegyndes uden at vente på 1b, jf. pkt. 93.
