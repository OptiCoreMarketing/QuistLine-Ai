# Task Rapport: Chief får individuel samtalehukommelse pr. business

**Task:** TASK-112
**Udført af:** Claude (denne session)
**Dato:** 12. august 2026
**Status:** FÆRDIG, verificeret mod rigtig Postgres + rigtigt Groq-kald.

---

## Status

Owner bad om, at "et projekt har sin egen Chief, og hver gang der laves et
nyt, er det en ny Chief — chatten hører individuelt til." Event-loggen var
allerede korrekt isoleret pr. business (spec pkt. 54.1, besluttet tidligere)
— men **Chief havde reelt ingen hukommelse overhovedet**: hvert Groq-kald
sendte kun den seneste besked, uden samtalehistorik. Chief kunne derfor
ikke huske noget som helst, selv inden for samme projekt.

## Ændringer

**`src/server.js`:**
- Ny `getChiefConversationHistory(businessId)` — henter de seneste 20
  `message`-hændelser for **netop denne** business, ordnet kronologisk,
  formateret som Groq chat-beskeder (`owner` → `user`, `chief` → `assistant`)
- Koblet ind i begge steder, Chief taler: den almindelige chat i
  `/api/agent`, og Chiefs svar efter et gennemført hire-flow i
  `/api/tasks/:taskId/approve-hire`
- Historik hentes **før** den nuværende besked skrives til loggen, så den
  ikke optræder dobbelt

## Antagelser, alternativer og risici (jf. pkt. 25)

**Antaget — historik afgrænset til de seneste 20 `message`-hændelser.**
Ubegrænset historik ville vokse token-forbruget pr. kald uden loft. 20
beskeder (~10 udvekslinger) er en pragmatisk grænse; ægte komprimering af
ældre historik (pkt. 55.3) er ikke bygget endnu — det er en fremtidig
forbedring, ikke et krav for at hukommelsen virker nu.

**Antaget — kun `message`-typen indgår i historikken**, ikke rapporter,
godkendelser eller tilstandsskift. Begrundelse: dette er samtalen mellem
Owner og Chief (kommandokanalen, pkt. 42) — Chief skal huske, hvad der
blev *sagt*, ikke genopleve hele observationskanalen som beskeder.

**Risiko, accepteret:** flere samtidige beskeder til samme business (ikke
sandsynligt ved nuværende enkelt-bruger-brug) kunne teoretisk læse
historik, der endnu ikke inkluderer hinandens beskeder. Ingen låsning er
tilføjet — samme risikoniveau som resten af den nuværende synkrone flow,
og reelt uproblematisk indtil en orchestrator med reel parallelitet findes.

## Tests

**Automatiseret:** `npm test` (17 tests) uændret grøn.

**Manuel, mod rigtig Postgres + rigtigt Groq-kald:**
1. Nyt projekt "HukommelsesTest": bad Chief huske et kodeord ("BLAA
   ELEFANT 42"), bekræftede
2. Samme projekt, ny besked: spurgte "hvad var kodeordet" — **Chief svarede
   korrekt** med kodeordet, uden det blev gentaget i selve spørgsmålet
3. Helt nyt, andet projekt "EtHeltAndetProjekt": spurgte samme spørgsmål —
   Chief svarede korrekt **"jeg har ikke modtaget noget kodeord... dette er
   vores første samtale"** — fuld isolation bekræftet, intet lækage mellem
   projekter
4. Hire-flow med hukommelse aktiveret: sendte en besked, hyrede Engineer,
   godkendte — Chiefs afsluttende svar var korrekt og fejlfrit
5. Hash-kæden forblev gyldig (`{"valid":true,"eventCount":12}`) efter al
   den nye aktivitet

## Anbefaling

Ingen nye åbne spørgsmål. Naturlig fremtidig udvidelse (ikke nu): når
event-loggen bliver stor, bør historikken komprimeres i stedet for bare
afskåret ved 20 (pkt. 55.3) — men det kræver reel volumen at være relevant.
