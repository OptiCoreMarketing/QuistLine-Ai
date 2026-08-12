# Task Rapport: Token-forbrug synligt i UI'et

**Task:** TASK-115
**Udført af:** Claude (denne session)
**Dato:** 13. august 2026
**Status:** FÆRDIG, verificeret mod rigtig Postgres + reelle Groq-tokens.

---

## Status

`tokens_in`/`tokens_out` er blevet skrevet til hvert event siden trin 1a,
men intet i UI'et har nogensinde vist tallene. Matcher direkte den
nyligt vedtagne beslutning (spec pkt. 95: budget måles i tokens) og
pkt. 58.6 (løbende omkostningsmåler) — data fandtes allerede, kun
visningen manglede.

## Ændringer

**`src/public/index.html`:**
- Ny `renderTokenUsage()`: summerer `tokens_in + tokens_out` over alle
  `CURRENT_EVENTS` for det åbne skib, vist i workspace-headeren
- Ny `taskTokenTotal(taskId)`: samme summering, filtreret til én task —
  vist på opgavekortet (`renderTaskCard`) ved siden af statuslabelen
- Alt beregnet **client-side** af data, der allerede var hentet — ingen
  nye backend-kald eller -ændringer

## Fejl fundet og rettet under implementeringen (ikke i produktion endnu)

Opdagede en race condition, **jeg selv introducerede** i denne ændring,
før den blev pushet: `loadTasksForCurrentBusiness()` og `loadEvents()`
kører parallelt (`Promise.all`), og opgavekortene skulle nu læse
`CURRENT_EVENTS` for deres token-tal — men `renderTaskBoard` blev kaldt
*inde i* `loadTasksForCurrentBusiness()`, altså muligvis før
`loadEvents()` var færdig. Resultatet ville have været forældede eller
manglende token-tal på opgavekortene ved første indlæsning.

**Rettet:** `loadTasksForCurrentBusiness()` henter nu kun data. Selve
renderingen (`renderTaskBoardFromState()`) er flyttet til
`refreshWorkspace()`, efter **begge** kald er afsluttet — samme mønster
som chat-feed og aktivitets-strøm allerede brugte.

## Tests

**Automatiseret:** `npm test` (20 tests) uændret grøn.

**Manuel, mod rigtig Postgres med reelle Groq-token-tal fra tidligere
sessioner:**
- Åbnede "HukommelsesTest" (business med rigtig samtalehistorik) —
  header viste "1.923 tokens"
- Krydstjekkede direkte mod `/api/events`: summen af alle
  `tokens_in`+`tokens_out` for den business var **præcis** 1.923 — 1:1 match
- Opgavekortet for den ene task i business'en viste korrekt "Færdig ·
  1.224 tokens"
- Ingen JS-fejl i konsollen

## Anbefaling

Ingen nye åbne spørgsmål. Naturlig fremtidig udvidelse (ikke nu): når
budgetkuverten (pkt. 56.3, trin 4.2) bygges, kan dette tal bruges direkte
som "forbrug hidtil" mod den ramme, Owner sætter ved projektstart.
