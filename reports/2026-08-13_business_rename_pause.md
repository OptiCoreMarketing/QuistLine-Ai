# Task Rapport: Omdøb + pause/genoptag skib (Flåden-håndtering)

**Task:** TASK-114
**Udført af:** Claude (denne session)
**Dato:** 12.–13. august 2026
**Status:** FÆRDIG, verificeret mod rigtig Postgres + browser-klik.

---

## Status

`business.status` har eksisteret som kolonne siden trin 1a
(`migrations/001_init.sql`) med default `'active'`, men intet i koden har
nogensinde læst eller skrevet til den ud over ved oprettelse — feltet var
reelt dødt. Denne omgang giver det en funktion: omdøbning og
pause/genoptag af et skib, begge dele direkte fra workspace-headeren.

## Ændringer

**`migrations/003_business_status.sql`:** CHECK-constraint på
`business.status` (`'active'`/`'paused'`), samme mønster som
`task.status` fik i migration 002.

**`src/server.js`:** ny `PATCH /api/businesses/:businessId` — accepterer
`name` og/eller `status`, validerer begge (tomt navn afvises, status skal
være en af de to gyldige værdier), og håndterer navnesammenstød pænt
(Postgres' unique-violation-kode `23505` → 409 med en forklarende besked,
ikke et generisk 500).

**`src/public/index.html`:**
- Ny blyant-ikon ved skibsnavnet i workspace-headeren → `prompt()` for nyt
  navn → `PATCH`-kald
- Ny Pause/Genoptag-knap i headeren, med signalflag-farve på statuslabel
  (rav = pauset, jf. pkt. 57.2's "rav betyder noget at gøre")
- Flåden-listens statuspunkt viste tidligere altid grøn ("done"), uanset
  faktisk status — en reel, hidtil ubemærket fejl. Rettet til at afspejle
  `active`/`paused` korrekt
- HQ-sidebarens "Seneste opgaver"-liste er nu klikbar (samme mønster som
  "Afventer dig" fik i en tidligere rapport) — konsistens, ikke en ny idé

## Antagelser, alternativer og risici (jf. pkt. 25)

**Antaget — kun to statusser (`active`/`paused`).** "Ophugget" (C3,
kirkegården, pkt. 59.3/68) er en langt større funktion (dødsårsag,
arkivering, aldrig at kunne genoptages) og hører til en senere, dedikeret
side — ikke gættet på her.

**Antaget — business-ændringer (omdøbning, pause) skrives ikke til
event-loggen.** Ingen af de eksisterende event-typer (message, report,
state_transition m.fl.) passer semantisk til "business omdøbt/pauset" —
at tvinge det ind i en forkert type ville være at gætte på et skema, der
ikke er besluttet. Dette er en administrativ Owner-handling på selve
projektet, ikke en agent-handling i samtalen. Disclosed som en kendt
mangel, ikke en fejl: hvis fuld audit-sporing af business-metadata senere
bliver et krav, kræver det en bevidst skema-beslutning (ny event-type
eller en separat log), ikke en genbrug af det eksisterende.

## Tests

**Automatiseret:** `npm test` (20 tests) uændret grøn — ingen af de
eksisterende tests rørt.

**Manuel, mod rigtig Postgres:**
- `curl`: pause, omdøb, og afvisning af ugyldig status alle bekræftet
  med korrekte HTTP-koder og fejlbeskeder
- Browser, rigtige klik: pause/genoptag-knappen skifter korrekt frem og
  tilbage; omdøbning opdaterer både UI og database; Flåden-listens
  statuspunkt viser nu korrekt rav for et pauset skib
- Database-tilstand bekræftet direkte via API efter browser-interaktion —
  matcher UI'et 1:1
- Ingen JS-fejl i konsollen

## Anbefaling

Ingen nye åbne spørgsmål. Ingen umiddelbar handling påkrævet.
