# Changelog · QuistLine.ai

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
### Fjernet
- Mongoose/MongoDB — erstattet af Postgres som system of record (spec pkt. 83).
- `src/tasks.json` — dødt seed-data, blev ikke brugt af nogen kode.

## [1.0.0] - 2026-08-11
### Tilføjet
- Initialisering af projektstruktur.
- Express backend med Groq AI routing.
- UI med split-screen (Chief Terminal + Task Board/Reports).
- Godkendelsesbar for Worker-hyring.
