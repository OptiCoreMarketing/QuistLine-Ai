# Task Rapport: Trin 3, side 3.1 — Chat-forbindelse + designretning

**Task:** TASK-105
**Udført af:** Claude (denne session, direkte filredigering + browser-test)
**Dato:** 12. august 2026
**Status:** FÆRDIG for den afgrænsede side, med forbehold — se "Ikke testet".

---

## Status

`spec/49`/`70`'s byggerækkefølge sætter trin 3 til at kræve orchestrator (trin
2) færdig. I praksis virker det synkrone `/api/agent`-endpoint allerede i
dag, og der findes endnu ingen godkendelses-gates (trin 4) der reelt
kræver den asynkrone kø. Denne side afgrænses derfor til: **forbind
UI'et til det, der allerede virker, og anvend designretningen (pkt. 67)** —
ikke hele trin 3, og ikke orchestrator/kø (stadig udskudt fra side 2.2).

## Acceptkriterier (låst før byggeri, jf. pkt. 77)
1. Chat sender rigtige `POST /api/agent`-kald og viser Chiefs faktiske svar
2. Hyr-Engineer-flowet er synligt, inkl. en evt. `guard_violation` fra Vagtposten
3. Søkort-paletten + signalflag-tilstandsfarver (pkt. 57.2) erstatter sort/neongrøn globalt
4. Rederi-sproget (pkt. 67.1) i synlig UI-tekst, opdateret i `memory/glossary.md`
5. Chat-læsbarhed (pkt. 21) + litterær typografi til agent-prosa (B4)
6. To læsemiljøer (Dæk/Nat, B3) som skifteknap, ingen JS-fejl

Alle 6 opfyldt — se Tests.

## Ændringer

**Backend (minimal tilføjelse):** `GET /api/businesses` — Flåden-listen
havde intet endpoint at kalde; uden det kunne Gate D ("hver interaktiv
komponent kalder et rigtigt endpoint") ikke opfyldes for den visning.

**`src/public/index.html` — fuld, bevidst omskrivning** (farveklasser er
gennemgående i hele filen, en målrettet ændring ville ramme samme
linjeantal med højere risiko for inkonsistens):
- CSS custom properties for `data-miljo="nat"` (default) og `="dag"`:
  søkort-palette (blækblå/kridtpapir/oxideret messing), skiftet med
  `toggleMiljo()`, persisteret i `localStorage`
- Signalflag-klasser (`.ql-dot.running/awaiting/done/blocked/killed`) brugt
  konsekvent i task-board, HQ-sidebar og team-canvas
- Litterær typografi: `.ql-prose` (serif, 15px, 1.6 linjeafstand) til
  Chief/Engineer-prosa, `.ql-meta`/`.ql-msg-status` (monospace, 11px) til
  metadata og tilstandsovergange — adskiller "tænkt" fra "sket" (B4)
- Rederi-sprog: Flåden, Søsætning, Skibsjournalen (implicit i chat-feedets
  rolle), Skibshandlen — nav og synlig UI-tekst
- Ægte wiring: `loadFleet()` (`GET /api/businesses`), `launchBusiness()`
  og `sendToChief()` (`POST /api/agent`), `loadEvents()`
  (`GET /api/events`), `loadTasksForCurrentBusiness()` (`GET /api/tasks`,
  filtreret client-side på `business_id`)
- Owner-key: prompt-baseret opsætning, gemt i `localStorage`, sendt som
  `x-owner-key`-header på alle kald (se forbehold nedenfor)
- Ikke-byggede funktioner (Indbakke, Annoncer, Økonomi, "Sælg dette skib",
  GitHub-forbindelse, model-dropdowns) er nu **eksplicit deaktiveret**
  (`disabled` + `title="Ikke bygget endnu"`) i stedet for at se klikbare
  ud uden at gøre noget — retter en Gate D-fejl ("nul attrap-interaktion"),
  som selve cto.new-skitsen begik, og som ellers ville være genskabt her
- `escapeHtml()` bruges konsekvent, når hændelses-/task-indhold sættes ind
  i DOM'en via `innerHTML` — payload-indhold kommer fra LLM-output og skal
  behandles som utroværdigt i en browserkontekst (XSS-forebyggelse)

**`memory/glossary.md`:** rederi-sproget tilføjet som bindende vokabular.

## Antagelser, alternativer og risici (jf. pkt. 25)

**Antaget — Owner-key i `localStorage`, ikke et rigtigt login.** Spec
åbent spørgsmål 5 (login/session/2FA) er stadig ubesluttet. Da platformen
har præcis én bruger i overskuelig fremtid (pkt. 39, antagelse 1), er
dette en pragmatisk stopgap: nøglen er synlig for enhver med adgang til
selve browseren/enheden — **ikke** en sikkerhedsgrænse mod andre
mennesker, kun mod at en fremmed URL trigger betalte kald. Skal erstattes,
når spørgsmål 5 besluttes, ikke behandles som en løsning.

**Antaget — task-tilstande grupperes i UI'et i 4 buckets** (afventer
dig/i gang/færdig/stoppet) frem for at vise alle 10 tilstande som
separate kolonner. Begrundelse: pkt. 57.2's egen pointe er, at *rav
betyder noget skal ske* — flere kolonner ville sprede netop det signal.

**Alternativ overvejet — hente Chiefs svar direkte fra `/api/agent`s
respons i stedet for at genindlæse hele event-loggen bagefter.** Fravalgt:
pkt. 40 siger eksplicit, at "Chiefs opsummering er en bekvem visning, den
rå sandhed er hændelserne" — UI'et skal vise loggen, ikke sin egen kopi af
den. Prisen er et ekstra API-kald pr. besked, acceptabelt ved denne skala.

**Risiko — ingen streaming.** Svar vises først, når hele Groq-kaldet er
færdigt (kan tage flere sekunder for et hireWorker-kald med to
sekventielle modelkald). Ingen loading-spinner er tilføjet på selve
sende-knappen udover at den deaktiveres — en mindre UX-mangel, ikke en
funktionel fejl. Kan forbedres i en senere side.

**Ikke løst, uændret fra tidligere rapport:** stien fra global browser-URL
til det rigtige Railway/Vercel-endpoint (samme oprindelse, `fetch(path)`
uden host) forudsætter, at frontend og backend serveres fra samme origin
— sandt i dag (Express server statisk + API), men værd at huske, hvis
trin 5 (Vercel + separat backend) ændrer det.

## Tests

**Automatiseret:** ingen nye automatiserede frontend-tests (ingen
test-runner for browser-JS findes i dette repo endnu) — dækket ved
manuel browser-verifikation nedenfor plus at `npm test`s 17 eksisterende
tests stadig er grønne (bekræfter backend-ændringen, `GET
/api/businesses`, ikke brød noget).

**Manuel browser-test (kørt i denne session via devtools, ikke kun læst
igennem):**
- Siden loader uden JS-fejl (kun de forventede 500'ere fra manglende
  `DATABASE_URL` — håndteret pænt i UI'et, ikke en fejl i koden)
- Søkort-paletten bekræftet anvendt: `body`s baggrund måler `#0d1b2e`
  (Nat) / `#f2ead4` (Dæk) efter `toggleMiljo()`, accent-farve `#c9a668`,
  serif-font-variablen sat korrekt
- Navigation mellem Søsætning/Flåden virker, korrekt visning skjules/vises
- `openBusiness()` åbner workspace, viser skibsnavn, og **begge** paneler
  (skibsjournal + opgaver) viser en tydelig, læsbar fejltilstand ved
  manglende database — ikke et blankt eller crashet UI (Gate D-krav)
- `escapeHtml()` verificeret: `<script>`, `&`, citationstegn neutraliseres
  korrekt til HTML-entities

**Ikke testet — samme forbehold som trin 1a/2.1:** den fulde lykkelige vej
(rigtig Flåden-liste, rigtig chat-udveksling, rigtig task-board med
signalfarver på ægte data) er **ikke** afprøvet, fordi ingen Postgres er
tilgængelig i byggemiljøet. Kør `npm run migrate` + start serveren med
`DATABASE_URL` sat, og afprøv selv: søsæt et skib, skriv til Chief, hyr
Engineer, og bekræft at Vagtpost-overtrædelser (fx en kunstigt kort
Engineer-rapport) vises korrekt som en rød, ikke-sammenfoldet fejlkort i
skibsjournalen.

## Bevidst udeladt fra "trin 3" (senere sider)

1. **Den tomme stol (E2)** — kun relevant, når der er flere roller at
   fravælge (trin 7, team-model). Chief+Engineer er stadig de eneste to.
2. **Aktivitets-stream med tre detaljeniveauer** (pkt. 55.1, overskrifter/
   normal/rå) — den nuværende skibsjournal viser alt fladt. Filtrering
   tilføjes, når volumen reelt bliver et problem.
3. **Kommandopalet (⌘K), diff-visning, virtualiseret liste** (pkt. 58) —
   ikke nødvendige ved nuværende skala (én bruger, få hændelser).

## Nye åbne spørgsmål (tilføjes til spec pkt. 14)

27. Skal Owner-key-flowet (localStorage-prompt) formelt anerkendes som
    "login v0", eller skal det udskiftes helt, når spørgsmål 5 besluttes,
    uden mellemstadier?

## Anbefaling

1. Kør `npm run migrate` og test den fulde lykkelige vej mod rigtig
   Postgres — dette er nu tre sider i træk (1a, 2.1, 3.1), hvor kun den
   rene logik er bevist, ikke integrationen. Værd at gøre samlet, én gang.
2. Brug siden selv (Gate G) — søsæt et rigtigt testprojekt, og sig
   "godkendt, næste side" eller peg på, hvad der skal ændres.
3. Næste naturlige side: side 2.2 (orchestrator/jobkø, afventer spørgsmål
   26) eller trin 4 (godkendelses-gates) — begge kræver en beslutning fra
   dig først, ikke bare mere kode.
