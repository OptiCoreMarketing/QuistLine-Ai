# Changelog · QuistLine.ai

## [Unreleased] - 2026-08-12
### Tilføjet
- Trin 0: fjernet cto.new-branding fra `index.html` og `branding/badge.json`.
- Stopgap-auth (`OWNER_API_KEY`), IP rate limiting og model allow-list på `/api/agent` og `/api/tasks`.
- Trin 1a: Postgres-datamodel (`business`, `task`, `event`) med append-only, hash-kædet event-log (`migrations/001_init.sql`, `src/db.js`, `src/eventLog.js`).
- `npm run migrate` til at køre database-migrationer.
- `GET /api/events` og `GET /api/events/verify` til at læse og verificere hash-kæden.
### Fjernet
- Mongoose/MongoDB — erstattet af Postgres som system of record (spec pkt. 83).
- `src/tasks.json` — dødt seed-data, blev ikke brugt af nogen kode.

## [1.0.0] - 2026-08-11
### Tilføjet
- Initialisering af projektstruktur.
- Express backend med Groq AI routing.
- UI med split-screen (Chief Terminal + Task Board/Reports).
- Godkendelsesbar for Worker-hyring.
