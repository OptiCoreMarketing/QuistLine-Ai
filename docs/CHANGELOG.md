# Changelog · QuistLine.ai

## [Unreleased] - 2026-08-13
### Rettet
- **`GET /api/tasks` hentede altid alle tasks på tværs af alle businesses** — tilføjet valgfrit `?businessId=`-filter (samme mønster som `GET /api/events`), frontend opdateret til at bruge det i stedet for client-side filtrering.
- **Rate limiter-Map'en (`requestLog`) voksede ubegrænset** — tilføjet periodisk oprydning af udløbne IP-poster.
- **`console.warn` om manglende `OWNER_API_KEY` blev logget ved hver request** — logges nu kun én gang pr. proces-levetid.
- **"Hvorfor?"-kædemodalen kunne vise forældede, klikbare handlingsknapper** (Godkend/Afvis, Fortsæt/Stop) for allerede-afgjorte opgaver — `renderEvent()` har nu et `interactive`-flag, som kæde-modalen sætter til `false`. Fandt samtidig, at `guard_violation`-kortet (i modsætning til `approval_request`) manglede den "er opgaven stadig afventende?"-kontrol fra side 3.2 — rettet til samme mønster. Se `reports/2026-08-13_debug_optimering.md`.
### Tilføjet
- `PATCH /api/businesses/:businessId` — omdøb og/eller pause/genoptag et skib. `migrations/003_business_status.sql` giver `business.status` en håndhævet CHECK (`active`/`paused`), samme mønster som `task.status`.
- Omdøb-blyant og Pause/Genoptag-knap i workspace-headeren; Flåden-listens statuspunkt viser nu korrekt aktiv/pauset (viste tidligere altid grøn uanset faktisk status).
- HQ-sidebarens "Seneste opgaver"-liste er nu klikbar (samme mønster som "Afventer dig").
- **Token-forbrug vist i UI'et** — samlet i workspace-headeren, pr. opgave på opgavekortet. `tokens_in`/`tokens_out` har eksisteret på hvert event siden trin 1a, men blev aldrig vist. Beregnet client-side, ingen backend-ændring. Fandt og rettede en race condition, jeg selv introducerede undervejs (opgavekort kunne vise forældede token-tal, hvis events endnu ikke var indlæst) — rettet før push.

## [Unreleased] - 2026-08-12
### Tilføjet
- Trin 0: fjernet cto.new-branding fra `index.html` og `branding/badge.json`.
- Stopgap-auth (`OWNER_API_KEY`), IP rate limiting og model allow-list på `/api/agent` og `/api/tasks`.
- Trin 1a: Postgres-datamodel (`business`, `task`, `event`) med append-only, hash-kædet event-log (`migrations/001_init.sql`, `src/db.js`, `src/eventLog.js`).
- `npm run migrate` til at køre database-migrationer.
- `GET /api/events` og `GET /api/events/verify` til at læse og verificere hash-kæden.
- Trin 2, side 2.1: task-tilstandsmaskine (`src/taskStateMachine.js`, `migrations/002_state_machine.sql`) og alle 8 Vagtpost lag 1-regler (`src/guards.js`), jf. spec pkt. 41.3/60.1/84.
- Kontraktvalidering + hemmeligheds-scanner koblet på `/api/agent`s hireWorker-flow.
- Trin 3, side 3.1: `GET /api/businesses`, og `src/public/index.html` omskrevet — søkort-palette + to læsemiljøer (Dæk/Nat), signalflag-tilstandsfarver, rederi-sprog, chat/hire-flow forbundet til rigtige endpoints.
- Trin 3, side 3.2: `POST /api/tasks/:taskId/transition`; UI kan nu Fortsætte/Stoppe en task, Vagtposten har sat i `AWAITING_OWNER_REVIEW`; "Hvorfor?"-kæde-modal (parent_event_id); klikbar "Afventer dig"-liste, der hopper til hændelsen.
- Trin 3, side 3.3: separat Aktivitets-strøm-panel (observationskanal, alle hændelsestyper, "kun det der kræver mig"-default-filter) — adskilt fra Chief-chatten (kommandokanal, kun Owner/Chief-beskeder), jf. spec pkt. 42/48.
- `package.json`: `--env-file-if-exists=.env` på alle scripts, `engines.node >= 22.14.0`.
- Trin 4, side 4.1: `POST /api/tasks/:taskId/approve-hire` — hyring er nu en rigtig godkendelses-gate (`AWAITING_HIRE_APPROVAL` → godkend/afvis), ikke kun en instruktion i CHIEF_PROMPT. Godkend/afvis-kort i Chief-chatten.
### Rettet
- **`.env` blev aldrig indlæst** — intet i koden læste filen, selvom README instruerede `cp .env.example .env`. Rettet via Node's `--env-file-if-exists`.
- **"Kræver mig"-filteret i aktivitets-strømmen frigav aldrig en løst `guard_violation`** — den blev vist for evigt, uanset om opgaven stadig afventede. Fundet ved verifikation mod rigtig Postgres, se `reports/2026-08-12_lokal_postgres_verifikation.md`.
- **En task kunne blive fanget i `RUNNING` for evigt**, hvis Groq-kaldet efter en godkendt hyring fejlede. Sættes nu til `KILLED` med sporbar årsag.
- **Godkendelseskort i UI'et forblev aktive for evigt**, selv efter afgørelse — samme fejlklasse som "kræver mig"-filteret. Viser nu korrekt "Afgjort — status: X".
- **UI'et opdaterede sig ikke, når en godkendelse "lykkedes server-side men rapporteredes som fejl"** (task blev sat til KILLED, men klienten fik kun en 500). `finally`-genindlæsning tilføjet.
### Verificeret
- Ægte Groq-kald (plain chat + fuldt hire-flow) kørt end-to-end mod rigtig Postgres. Intet resterende uverificeret stykke i trin 0–4.1. Se `reports/2026-08-12_groq_end_to_end_verifikation.md`.
### Ændret
- **Budgetkuvert/budget-værn måles nu i tokens, ikke kroner** (lukker åbent spørgsmål #17, spec pkt. 95). `checkBudgetGuard` i `src/guards.js` omdøbt `spentDkk/estimateDkk` → `spentTokens/estimateTokens`, fallback-loft 25 kr → 20.000 tokens pr. task.
- Opgavekort i Opgaver-fanen er nu klikbare (hopper til tråden i aktivitets-strømmen) og viser Godkend/Afvis eller Fortsæt/Stop direkte på kortet, når opgaven afventer en beslutning.
- **Chief har nu individuel samtalehukommelse pr. business** — et projekt husker sin egen samtale (seneste 20 beskeder), et nyt projekt starter helt forfra, ingen historik lækker mellem projekter.
- Generaliseret til `src/agentMemory.js` (`getAgentConversationHistory(agentId, businessId)`) — klar til enhver fremtidig pr.-business-agent, ikke kun Chief. Globalt scopede agenter (Warden) kræver bevidst en anden løsning senere, se ny `tests/agentMemory.test.js`.
### Fjernet
- Mongoose/MongoDB — erstattet af Postgres som system of record (spec pkt. 83).
- `src/tasks.json` — dødt seed-data, blev ikke brugt af nogen kode.

## [1.0.0] - 2026-08-11
### Tilføjet
- Initialisering af projektstruktur.
- Express backend med Groq AI routing.
- UI med split-screen (Chief Terminal + Task Board/Reports).
- Godkendelsesbar for Worker-hyring.
