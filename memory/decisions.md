# Beslutningslog · QuistLine.ai

- **2026-08-11**: Oprettet Chief Workspace med Groq model-vælger.
- **2026-08-11**: Implementeret 2-trins godkendelsesflow (Chief foreslår -> Owner godkender via knap -> Engineer bygger).
- **2026-08-11**: Etableret automatisk lagring af opgaver i `src/tasks.json` og rapporter i `/reports/`.
- **2026-08-12**: Trin 0 gennemført — cto.new-branding fjernet, stopgap-auth/rate-limit/model-allowlist tilføjet.
- **2026-08-12**: Trin 1a gennemført — Postgres (`pg`, ingen ORM) erstatter Mongoose. Hash-kæden i `event`-tabellen er scoped **pr. business**, ikke globalt — begrundelse: proveniens (pkt. 66.1) skal kunne udskilles og verificeres pr. projekt ved salg, hvilket en global kæde ville umuliggøre. Se `reports/2026-08-12_trin1a_datamodel.md` for fulde antagelser/risici.
- **2026-08-12**: `src/tasks.json` slettet — var dødt seed-data, blev aldrig læst af `/api/tasks` selv før Postgres-skiftet.
