# QuistLine.ai · Workspace

Komplet Agent Workspace med Chief (Lead Agent) og Engineer (Worker) drevet af Groq Inference Engine.

## Quickstart

Kræver Node ≥ 22.14 (bruger `--env-file-if-exists`, indbygget i Node — ingen `dotenv`-afhængighed).

1. Åbn terminalen i mappen `QuistLine Ai` og installer afhængigheder:
   ```bash
   npm install
   ```

2. Kopiér `.env.example` til `.env` og udfyld værdierne (se kommentarer i filen):
   ```bash
   cp .env.example .env
   ```

3. Kør migrationerne mod din Postgres-database (Railway eller lokal):
   ```bash
   npm run migrate
   ```

4. Start serveren lokalt:
   ```bash
   npm start
   ```

Serveren kører derefter på `http://localhost:3000` (eller den port, du har sat i `PORT`).

## Status

Se `/spec/INDEX.md` for den fulde, aktuelle spec-status. Kort version:
- Trin 0, 1a, 2.1 og 3.1–3.3 er gennemført **og verificeret mod en rigtig
  Postgres** (se `reports/2026-08-12_lokal_postgres_verifikation.md`).
- Frontend (`src/public/index.html`) og backend (`src/server.js`) er
  forbundet — chat, hyr-Engineer-flow, task-board og aktivitets-strøm
  kalder alle rigtige endpoints.
- Det eneste ikke-verificerede stykke er selve Groq-kaldet (kræver en
  rigtig `GROQ_API_KEY`) — alt omkring det (database-skrivning,
  fejlhåndtering) er bekræftet.

## Sikkerhed

`/api/tasks` og `/api/agent` kræver en `x-owner-key`-header, der matcher
`OWNER_API_KEY` fra `.env`. Uden denne variabel sat er endpointerne åbne —
sæt den, før du deployer noget offentligt tilgængeligt.
