# Task Rapport: Debug og optimering

**Task:** TASK-116
**Udført af:** Claude (denne session)
**Dato:** 13. august 2026
**Status:** FÆRDIG, verificeret mod rigtig Postgres + browser.

---

## Baggrund

Owner bad om en debug- og optimeringsgennemgang — ikke nye funktioner.
Hele `src/server.js` og `src/public/index.html` blev læst systematisk
igennem (samt `src/eventLog.js`, `src/taskStateMachine.js`, `src/db.js`
som en sidste kontrol — ingen fund dér). Fire konkrete fund, alle rettet.

## Fund og rettelser

1. **`GET /api/tasks` hentede ALTID alle tasks på tværs af alle
   businesses**, uanset hvilket skib der var åbent — klienten filtrerede
   selv bagefter. Voksende spild af båndbredde og DB-arbejde efterhånden
   som antal projekter/tasks stiger. Endpointet understøtter nu et
   valgfrit `?businessId=`-filter, samme mønster som `GET /api/events`
   allerede brugte. `loadTasksForCurrentBusiness()` i frontend'en er
   opdateret til at sende filteret i stedet for at filtrere client-side.

2. **Rate limiter-Map'en (`requestLog`) voksede ubegrænset** — hver IP,
   der nogensinde havde ramt serveren, blev siddende i hukommelsen resten
   af processens levetid, selv længe efter dens 60-sekunders vindue var
   udløbet. Tilføjet et `setInterval`, der fejer udløbne poster væk med
   samme interval som selve vinduet (`.unref()` sat, så det ikke holder
   processen kunstigt i live).

3. **`console.warn` om manglende `OWNER_API_KEY` blev skrevet ved HVER
   eneste ubeskyttet request** — logstøj-risiko ved høj trafik uden
   nøgle sat. Skrives nu kun én gang pr. proces-levetid.

4. **"Hvorfor?"-kædemodalen kunne vise forældede, klikbare
   handlingsknapper** — `renderEvent()` bruges både til den levende
   chat/aktivitets-strøm og til den historiske kæde-visning (pkt. 58.2),
   men skelnede ikke mellem dem. Et `approval_request`- eller
   `guard_violation`-kort inde i "Hvorfor?"-modalen ville stadig vise
   Godkend/Afvis eller Fortsæt/Stop, selvom opgaven for længst var
   afgjort — og hvis man klikkede, ville handlingen godt nok gå igennem,
   men selve modal-indholdet ville ikke opdatere sig og blive ved med at
   vise de nu-ugyldige knapper. Rettet: `renderEvent(ev, interactive)` har
   nu et andet parameter (default `true`); kæde-modalen kalder med
   `interactive=false`, hvilket fjerner "Hvorfor?"-linket (ingen grund til
   at kunne åbne en kæde inde i en kæde) og altid viser "Afgjort — status:
   X" i stedet for aktive knapper. Samtidig fandt jeg, at
   `guard_violation`-kortet — i modsætning til `approval_request` — aldrig
   havde fået den samme "er opgaven stadig afventende?"-kontrol i side
   3.2's rettelse; det viste Fortsæt/Stop-knapper blot fordi hændelsen
   havde en `taskId`, uanset opgavens faktiske status. Rettet til samme
   mønster (tjekker `AWAITING_OWNER_REVIEW` mod `CURRENT_TASKS`).

## Tests

**Automatiseret:** `npm test` (20 tests) kørt mod lokal Postgres — alle
bestået, uændret.

**Manuel, mod rigtig Postgres + browser:**
- `curl` mod `/api/tasks` uden filter: 12 tasks på tværs af 4 businesses.
- `curl` mod `/api/tasks?businessId=<HukommelsesTest>`: præcis 1 task,
  alle rækker matcher det angivne business_id.
- Åbnede "HukommelsesTest" i browseren — netværksloggen viser
  `GET /api/tasks?businessId=32568f06-...` (200 OK), ikke det gamle
  ufiltrerede kald.
- Klikkede "Hvorfor?" på et allerede-afgjort `approval_request`
  (hyring, status DONE) — modal-indholdet viser nu "Afgjort — status:
  Færdig" uden knapper og uden et nyt "Hvorfor?"-link, i stedet for de
  tidligere altid-aktive Godkend/Afvis-knapper.
- Ingen nye JS-fejl i konsollen (de to 401'ere i loggen stammer fra
  siden inden Owner-key blev sat i denne test-session, ikke fra
  ændringerne).

## Ikke rettet (bevidst)

- Rate-limitingens in-memory-model er stadig kun korrekt for én proces
  (ikke flere samtidige serverless-instanser) — uændret, kendt
  begrænsning, dokumenteret i koden allerede; den rigtige løsning er
  budgetkuverten (trin 4.2), ikke denne debug-omgang.
- Ingen nye funktioner er tilføjet — kun rettelser og optimering, jf.
  Owners instruks.

## Anbefaling

Ingen nye åbne spørgsmål. Ingen resterende kendte fejl fundet i denne
gennemgang.
