# QuistLine.ai · Workspace

Komplet Agent Workspace med Chief (Lead Agent) og Engineer (Worker) drevet af Groq Inference Engine.

## Quickstart

1. Åbn terminalen i mappen `QuistLine Ai` og installer afhængigheder:
   ```bash
   npm install
   ```

2. Kopiér `.env.example` til `.env` og udfyld værdierne (se kommentarer i filen):
   ```bash
   cp .env.example .env
   ```

3. Start serveren lokalt:
   ```bash
   npm start
   ```

Serveren kører derefter på `http://localhost:3000` (eller den port, du har sat i `PORT`).

## Status

Se `/spec/INDEX.md` for den fulde, aktuelle spec-status. Kort version:
frontend (`src/public/index.html`) og backend (`src/server.js`) er endnu
ikke forbundet — se addendum "repo-status-gap" for detaljer.

## Sikkerhed

`/api/tasks` og `/api/agent` kræver en `x-owner-key`-header, der matcher
`OWNER_API_KEY` fra `.env`. Uden denne variabel sat er endpointerne åbne —
sæt den, før du deployer noget offentligt tilgængeligt.
