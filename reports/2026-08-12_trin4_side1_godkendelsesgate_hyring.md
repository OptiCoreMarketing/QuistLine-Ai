# Task Rapport: Trin 4, side 4.1 — Rigtig godkendelses-gate for hyring

**Task:** TASK-109
**Udført af:** Claude (denne session, direkte filredigering + verifikation mod rigtig Postgres)
**Dato:** 12. august 2026
**Status:** FÆRDIG. Tre reelle fejl fundet og rettet under verifikationen.

---

## Status

`CHIEF_PROMPT` har hele tiden sagt "spørg ALTID om lov før du hyrer en
Engineer" — men det var kun en instruktion i en systemprompt. Intet
teknisk forhindrede `/api/agent` i at køre Engineer-kaldet øjeblikkeligt,
uanset hvad prompten sagde. Det er præcis den svaghed, pkt. 41.3 selv
navngiver: en gate, der kun er en instruktion, kan omgås; en gate, der er
en tilstand i databasen, kan det ikke.

Denne side afgrænses til: **hyring (gul klasse, pkt. 56.1) som en rigtig,
teknisk håndhævet gate** — ikke hele trin 4's risikoklasse-/budget-system.

## Acceptkriterier (låst før byggeri, jf. pkt. 77)
1. `hireWorker: true` opretter en task i `AWAITING_HIRE_APPROVAL` og et
   `approval_request`-event — **intet Groq-kald sker**, før Owner svarer
2. Ny endpoint besvarer anmodningen: godkendt → udfører det tidligere
   øjeblikkelige Engineer-kald + Vagtpost-check + Chief-svar; afvist →
   `KILLED`, intet Groq-kald sker nogensinde
3. UI viser et tydeligt godkend/afvis-kort i Chief-chatten (kommandokanalen
   — det er en beslutning, ikke observation)
4. Ingen JS-fejl, testet mod rigtig database

Alle 4 opfyldt.

## Ændringer

**`src/server.js`:**
- `/api/agent`s `hireWorker`-gren opretter nu kun task + `AWAITING_HIRE_APPROVAL`
  + `approval_request`-event, returnerer øjeblikkeligt
- Ny `POST /api/tasks/:taskId/approve-hire` — flytter selve Engineer-kaldet,
  Vagtpost-checket og Chief-svaret hertil, udført kun ved godkendelse
- Tjekker `task.status === 'AWAITING_HIRE_APPROVAL'` før noget sker —
  et allerede afgjort kort giver en tydelig 409, ikke et uklart 500

**`src/public/index.html`:**
- `approval_request`/`approval_granted` gjort til en del af kommandokanalen
  (chat-feed), ikke aktivitets-strømmen
- Godkend/Afvis-kort, der kun viser aktive knapper, hvis den tilhørende
  task **stadig** er `AWAITING_HIRE_APPROVAL` — historiske anmodninger
  viser i stedet "Afgjort — status: X"
- `respondToHireApproval()`/`resolveGuardTask()` genindlæser nu altid
  workspacet (`finally`), uanset om kaldet lykkedes eller fejlede

## Tre reelle fejl fundet og rettet (alle via rigtig gennemkørsel, ikke kodelæsning)

### 1. Task kunne blive fanget i `RUNNING` for evigt
Hvis Groq-kaldet efter en godkendelse fejlede (afprøvet med en ugyldig
nøgle), var der intet, der ændrede task'ens tilstand — den stod tilbage i
`RUNNING` uden nogen forklaring og uden mulighed for at komme videre af
sig selv. **Rettet:** en indre `try/catch` omkring hele udførelsen sætter
nu task til `KILLED` med en sporbar årsag (`execution_failed: <fejl>`),
hvis noget går galt efter godkendelsen.

### 2. Godkendelseskort forblev aktive for evigt i UI'et
Fundet ved at seede flere hyrings-anmodninger og observere, at et klik på
en "Afvis"-knap ramte en **forkerte, allerede afgjorte** anmodning (samme
fejlklasse som "kræver mig"-filteret i den forrige verifikationsrapport).
**Rettet:** et godkendelseskort viser kun knapper, hvis dens task stadig
faktisk afventer — ellers vises tydeligt hvilken status den endte med.

### 3. UI'et opdaterede sig ikke, når godkendelse "lykkedes men fejlede"
Når godkendelse udløste et Groq-kald, der fejlede, returnerede serveren
korrekt en fejl (500) — **men havde allerede ændret databasen** (task sat
til `KILLED`, jf. fejl #1's rettelse). Frontendens fejl-håndtering kaldte
kun `alert()`, aldrig en gen-indlæsning, så kortet stod og så aktivt ud,
selvom opgaven reelt var afgjort. **Rettet:** `finally`-blok genindlæser
altid workspacet, uanset om kaldet lykkedes eller ej.

Alle tre er eksempler på det samme mønster: **en handling, der delvist
lykkes server-side, men rapporteres som en fejl, skal stadig afspejles i
UI'et** — en generisk `alert()`-og-stop er ikke nok.

## Tests

**Automatiseret:** `npm test` (17 tests) grøn, både før og efter rettelserne.

**Manuel, mod rigtig Postgres (samme lokale instans som forrige rapport):**
- `hireWorker: true` → task i `AWAITING_HIRE_APPROVAL`, ingen Groq-fejl
  (fordi intet Groq-kald sker) — bekræftet via `curl`
- Afvisning via `curl` → `KILLED`, ingen event uden om tilstandsmaskinen
- Godkendelse via `curl` → `RUNNING` → (Groq fejler med testnøgle) → `KILLED`
  med sporbar årsag — bekræftet efter rettelse #1
- Dobbelt-afgørelse af samme anmodning → tydelig 409, ikke 500 — bekræftet
- Browser: godkend/afvis-kort renderer korrekt med rigtig prompt-tekst;
  et rigtigt (ikke stubbet) klik på "Afvis" og "Godkend" begge verificeret;
  gamle, afgjorte kort viser korrekt ingen knapper efter rettelse #2;
  UI genindlæses korrekt efter en fejlet godkendelse efter rettelse #3
- Ingen JS-fejl i konsollen ud over de forventede (fake-nøgle-relaterede) 500'ere

## Bevidst udeladt fra "trin 4"

Resten af trin 4 (risikoklasser grøn/gul/rød generelt, budgetkuvert,
trust-niveauer, samlet godkendelseskø pkt. 56.4) er **ikke** bygget —
denne side løser kun det ene, konkrete hul (hyring), som allerede fandtes
i koden. Et generelt risikoklasse-framework bør vente, til der er flere
klassificerede handlinger at generalisere fra (i dag er hyring den eneste
reelle "gul" handling, der findes i systemet).

## Anbefaling

1. Brug siden selv (Gate G) — godkend og afvis et par rigtige hyringer
2. Overvej om `AWAITING_HIRE_APPROVAL` bør have en tilsvarende Fortsæt/Stop-
   visning i Opgaver-fanen, ikke kun i chatten — nu er den kun synlig i
   chat-feedet, da det er en kommando-kanal-handling
3. Næste naturlige skridt i trin 4: beslut spørgsmål #17 (budgetkuvert
   kr. vs. tokens), som blokerer et generelt budget-værn
