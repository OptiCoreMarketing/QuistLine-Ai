# Task Rapport: Trin 2, side 2.1 — Tilstandsmaskine + Vagtpost lag 1

**Task:** TASK-104
**Udført af:** Claude (denne session, direkte filredigering)
**Dato:** 12. august 2026
**Status:** FÆRDIG for den afgrænsede side. Trin 2 er IKKE færdigt — se
"Bevidst udeladt" nedenfor.

---

## Status

`spec/73-byggevejledning.md` pkt. 74 kræver én side ad gangen med låste
acceptkriterier — ikke ét helt trin på én gang. "Trin 2" i byggerækkefølgen
(pkt. 70) dækker faktisk flere sider: tilstandsmaskine, jobkø,
always-on orchestrator og Vagtposten lag 1. At bygge dem alle samtidig ville
også betyde at beslutte hosting-arkitektur (always-on Railway-proces,
pg-boss) uden at spørge — en beslutning med reelle omkostnings- og
infrastruktur-konsekvenser, som Owner bør tage stilling til eksplicit.

**Denne side afgrænset til:** tilstandsmaskinen for `task` (pkt. 41.3) og
alle 8 Vagtpost-regler fra lag 1 (pkt. 60.1), med tærsklerne fra pkt. 84.

## Acceptkriterier (låst før byggeri, jf. pkt. 77)
1. `task.status` kan kun antage de tilstande, tilstandsmaskinen definerer,
   håndhævet ved DB CHECK-constraint **og** applikationskode
2. Enhver tilstandsovergang skriver en `state_transition`-event
3. Alle 8 Vagtpost-regler findes som rene, deterministiske, testede
   funktioner med pkt. 84's tærskler
4. Kontraktvalidering og hemmeligheds-scanner kobles på den eksisterende
   `/api/agent`-flow (hireWorker)
5. De 4 regler uden en live call-site i den nuværende arkitektur
   (masse-sletning, løkke-værn, budget-værn, sti-værn) bygges og testes
   som funktioner, men forbliver ukoblede — dokumenteres som bevidst, ikke
   glemt
6. Alt dækket af unit-tests: normal brug tillades, overtrædelse blokeres

Alle 6 er opfyldt.

## Ændringer

**`migrations/002_state_machine.sql`:**
- `task.status`: ny default `DRAFT` (var `RUNNING` fra trin 1a's forenklede
  2-tilstandsmodel), ny CHECK-constraint med de 10 tilstande fra pkt. 41.3
- `event.type`: CHECK-constraint udvidet med `state_transition` og
  `guard_violation`

**`src/taskStateMachine.js`:**
- `ALLOWED_TRANSITIONS` — den ene kilde til sandhed om lovlige overgange
- `isValidTransition` / `assertValidTransition` — rene funktioner
- `transitionTask` — låser task-rækken (`SELECT ... FOR UPDATE`), validerer,
  opdaterer, skriver `state_transition`-event. Ingen skrivning sker uden om
  event-loggen (Gate B's krav)

**`src/guards.js`:**
- Alle 8 regler fra pkt. 60.1 som rene funktioner: `checkMassDeletion`,
  `checkFileDeletion`, `checkLoopGuard`, `checkBudgetGuard`,
  `checkTimeoutGuard`, `checkPathGuard`, `checkSecretScanner`,
  `checkContractValidation` (generisk) + `checkEngineerReportContract`
  (specifik for ENGINEER_PROMPT's 5 påkrævede sektioner)
- `recordGuardViolation` — skriver `guard_violation`-event og flytter task
  til `AWAITING_OWNER_REVIEW`

**`src/server.js`:** hireWorker-flowet opretter nu task i `DRAFT`, går
eksplicit til `RUNNING` via `transitionTask`, kører kontraktvalidering +
hemmeligheds-scanner på Engineer-outputtet **før** `DONE`. Ved
overtrædelse: `guard_violation`-event, task til `AWAITING_OWNER_REVIEW`,
og responsen til Owner viser `guardViolation` i stedet for et Chief-svar
(Vagtposten "fortolker ikke, reparerer ikke" — den stopper bare, pkt. 60.1).

## Antagelser, alternativer og risici (jf. pkt. 25)

**Antaget — alle guard-overtrædelser mapper til `AWAITING_OWNER_REVIEW`.**
Pkt. 60.1 skelner sprogligt mellem "stop, kræv menneskeligt blik" og
"blokér altid", men tilstandsmaskinen (pkt. 41.3) har ingen tilstand
specifikt for "stoppet af en guard". `AWAITING_OWNER_REVIEW` er semantisk
tættest på begge formuleringer. **Bør bekræftes** — se nyt åbent spørgsmål.

**Antaget — budget-værnets tærskel er i kr., ikke i `cost_usd`.** Pkt. 84
angiver "25 kr pr. task" eksplicit, men vores eneste cost-felt er
`cost_usd`, som stadig er `null` (ingen prismodel findes, jf.
trin 1a-rapporten). `checkBudgetGuard` tager derfor `spentDkk`/`estimateDkk`
og er **ikke koblet til noget endnu** — der er intet at konvertere fra.
Løses naturligt, når en prismodel og en USD→DKK-kurs findes (trin 4).

**Alternativ overvejet — vente med hele Vagtposten til orchestratoren
findes.** Fravalgt: pkt. 60.1 siger eksplicit reglerne er "billige at
bygge", og to af dem (kontraktvalidering, hemmeligheds-scanner) har en
reel anvendelse allerede i dag. At vente ville udskyde værdi uden grund.

**Risiko — sti-værnet er en heuristik, ikke hærdet.** `checkPathGuard`
sammenligner normaliserede stier tekstuelt. Den er ikke afprøvet mod et
rigtigt filsystem eller symlinks, fordi der endnu ikke findes en sandkasse
at skrive i. Skal genvurderes, når sandkassen bygges (pkt. 47).

**Risiko — hemmeligheds-scanneren er bevidst ufuldstændig.** Den fanger
kendte nøgle-præfikser (Groq, Anthropic, OpenAI, GitHub, AWS) og et
generisk `key=`/`secret=`-mønster. Den fanger ikke enhver tænkelig
hemmelighed. Dette er en heuristik, ikke en garanti — pkt. 60.1's "ingen
acceptabel mængde" er målet, ikke noget denne version af scanneren beviser.

## Tests

Tre testfiler, alle grønne (`npm test`):
- `tests/server.test.js` — uændret fra trin 1a (hash-kæde)
- `tests/stateMachine.test.js` — 4 unit-tests af overgangsvalidering +
  én DB-gated integrationstest (opretter task, skifter tilstand, bekræfter
  event og afvist ulovlig overgang)
- `tests/guards.test.js` — 9 unit-tests, én pr. regel, hver med både et
  tilladt og et blokeret tilfælde, ved de eksakte pkt. 84-tærskler
  (fx præcis 50/150 linjer, præcis 2×/25 kr, præcis 3 identiske kald)

**Kørt i denne session:** alle 17 tests bestået. Serveren startet lokalt
uden `DATABASE_URL` og bekræftet at stadig boote og svare korrekt (500 med
tydelig fejl, ikke crash).

**Ikke testet — samme forbehold som trin 1a-rapporten:** migration 002 og
de DB-gatede integrationstests (`transitionTask` mod rigtig Postgres) er
ikke kørt mod en rigtig database, da ingen er tilgængelig i byggemiljøet.
De rene unit-tests (17 af 17 i denne session) dækker al logik, der ikke
kræver databasen.

## Bevidst udeladt fra "trin 2" (næste sider)

1. **Orchestrator (always-on Node-proces på Railway) + jobkø (pg-boss).**
   Dette er en hosting-/arkitekturbeslutning (pkt. 41.1–41.2), ikke en ren
   kodeopgave — kræver stillingtagen til, om der skal provisioneres en ny
   Railway-service. Bør besluttes eksplicit, ikke antages.
2. **De 4 ukoblede Vagtpost-regler** (masse-sletning, løkke-værn,
   budget-værn, sti-værn) forbliver ukoblede, indtil der findes et
   tool-kalds-loop og en sandkasse for dem at vogte.
3. **Sporhunden (lag 2)** — eksplicit trin 8 i byggerækkefølgen, ikke trin 2.

## Nye åbne spørgsmål (tilføjes til spec pkt. 14)

25. Skal alle Vagtpost-overtrædelser mappe til `AWAITING_OWNER_REVIEW`, eller
    skal "blokér altid"-reglerne (sti-værn, hemmeligheds-scanner,
    kontraktvalidering) have en anden, strengere tilstand end
    "kræv menneskeligt blik"-reglerne (masse-sletning, løkke-værn m.fl.)?
26. Hvornår besluttes orchestrator/jobkø-arkitekturen (pkt. 41.2) konkret —
    er Railway-projektet klar til en always-on service, eller skal det
    afklares først?

## Anbefaling

1. Kør `npm run migrate` (kører nu migration 001 **og** 002) mod rigtig
   Postgres, og kør `npm test` med `DATABASE_URL` sat — samme forbehold som
   trin 1a, nu udvidet til tilstandsmaskinen.
2. Bekræft eller korrigér antagelsen om `AWAITING_OWNER_REVIEW` (spørgsmål 25).
3. Beslut orchestrator/jobkø-siden (spørgsmål 26) som en selvstændig,
   eksplicit godkendt side, før den bygges — det er den eneste resterende
   del af "trin 2", der ændrer hosting/arkitektur, ikke kun tilføjer kode.
