# Task Rapport: Klikbare opgavekort i Opgaver-fanen

**Task:** TASK-111
**Udført af:** Claude (denne session)
**Dato:** 12. august 2026
**Status:** FÆRDIG, verificeret mod rigtig Postgres + rigtigt AI-kald.

---

## Status

Opgaver-fanens kort var indtil nu rent visuelle — ingen klik-handling.
Alle handlinger (godkend hyring, fortsæt/stop efter et Vagtpost-stop) fandtes
kun i Chief-chatten/aktivitets-strømmen. Denne omgang gør selve
opgavekortene handlingsdygtige, så Opgaver-fanen bliver et reelt sted at
arbejde fra, ikke kun et overblik.

## Ændringer

**`src/public/index.html`:**
- Nyt `renderTaskCard(t)`: hvert kort er nu klikbart (hopper til opgavens
  tråd i aktivitets-strømmen via `jumpToTask`) og viser handlingsknapper
  direkte på kortet, afledt af taskens **aktuelle status** (ikke en
  event-opslag som i chat-kortene — enklere og lige så korrekt, da
  `task.status` allerede er hentet):
  - `AWAITING_HIRE_APPROVAL` → Godkend/Afvis (samme endpoint som chat-kortet)
  - `AWAITING_OWNER_REVIEW` → Fortsæt/Stop (samme endpoint som guard-kortet)
  - Alle andre statusser → intet knap, kun klikbart for at se tråden
- `jumpToTask()` forbedret: hvis målet ikke findes under "kun det der
  kræver mig"-filteret (fx en allerede afsluttet opgave), skifter den nu
  selv til "vis alt", så et klik altid fører et sted hen i stedet for at
  være et stille no-op

## Tests

**Automatiseret:** `npm test` (17 tests) uændret grøn — ingen backend-ændringer.

**Manuel, mod rigtig Postgres + rigtigt Groq-kald:**
- Sendte en ny hyrings-anmodning, skiftede til Opgaver-fanen, bekræftede
  Godkend/Afvis-knapperne var til stede direkte på kortet
- Klikkede "Godkend" **på kortet** (ikke i chatten) — bekræftet via
  direkte API-opslag at task korrekt gik igennem hele forløbet
  (`AWAITING_HIRE_APPROVAL` → `RUNNING` → `DONE`) med et rigtigt
  Engineer- og Chief-kald
- Klik på selve kortet (ikke en knap) skiftede korrekt til Hovedkvarter-
  fanen og fremhævede den relevante hændelse
- `event.stopPropagation()` bekræftet virkende: klik på en knap udløste
  ikke også kortets egen klik-handler
- Ingen JS-fejl i konsollen

## Anbefaling

Samme stående anbefaling som tidligere rapporter: brug siden selv (Gate G).
Naturlige næste skridt kræver stadig en beslutning fra dig — side 4.2
(generelle risikoklasser, ingen blokering tilbage) eller side 2.2
(orchestrator, afventer spm. 26).
