# QuistLine.ai — INDEX

*Jf. pkt. 30.2. Dette er indgangen til hele specen. Læs denne først.*
*Sidst opdateret: 12. august 2026*

**Projektstatus: BYGGERI I GANG.** Trin 0 (repo-oprydning) og trin 1a
(datamodel + event-log med hash-kæde, Postgres) er gennemført og pushet.
Se byggerækkefølgen nedenfor for status pr. trin.

---

## Sådan bruges specen

1. Læs dette dokument
2. Læs `00-master-spec.md` (grundreglerne, pkt. 0–14)
3. Læs det addendum, der dækker din opgave (se tabellen nedenfor)
4. Følg `73-byggevejledning.md` — den er bindende for alt byggeri

**Regel:** punktnumre er globale og løber på tværs af filer. En reference
til "pkt. 56.1" findes altid ét og kun ét sted.

---

## Filer i læserækkefølge

| Fil | Punkter | Indhold | Status |
|---|---|---|---|
| `00-master-spec.md` | 0–14 | Grundspec: moduler, agenter, mappestruktur, deploy, åbne spørgsmål | Gældende. Statuslinjen om "ingen kode" korrigeret af pkt. 15 |
| `15-repo-status-gap.md` | 15–16 | Faktisk repo-status + gap-analyse mod cto.new | Gældende |
| `16-logbog-gemini-spa.md` | — | Gemini-sessionens logbog, bevaret som reference | Historisk reference |
| `17-model-provider-claude.md` | 17–19 | Claude API side om side med Groq, dynamisk modelliste | Forslag, afventer godkendelse |
| `20-chat-laesbarhed.md` | 20–22 | Læsbarhedskrav til Chief/agent-chat | Gældende, bindende |
| `23-governance-dokumentation.md` | 23–29 | Dokumentationslag, session-protokol, tool-gate | Gældende |
| `30-15-forbedringer.md` | 30–31 | 15 forbedringer til log- og projektdisciplin | Vedtaget som retning |
| `32-agent-arkitektur.md` | 32–36 | Chief, platform-agenter, projekt-workers | Gældende |
| `37-team-model.md` | 37–38 | Team-hiring, faser, samarbejde via artefakter | Gældende |
| `39-teknisk-arkitektur.md` | 39–51 | Event-log, kørselsarkitektur, to kanaler, model-router | Forslag |
| `52-flaskehalse-foundry.md` | 52–64 | Flaskehals-løsninger, risikoklasser, Foundry, tre fejlfangst-lag | Forslag |
| `64-fri-brainstorm.md` | A–H | Idébank: rederi-metafor, visuel identitet, produktidéer | Vedtaget via pkt. 65 |
| `65-idebank-vedtaget.md` | 65–72 | Beslutning: idébanken vedtaget i tre grader + revideret byggerækkefølge | **BESLUTTET** |
| `73-byggevejledning.md` | 73–82 | Gates, definition of done, testniveauer, startprompt | Bindende under byggeri |
| `83-beslutninger-database-taerskler.md` | 83–86 | Postgres som system of record, vagtpost-tærskler, tillidstærskler | **BESLUTTET** |
| `87-spec-sundhedstjek.md` | 87–94 | Første kørte spec-sundhedstjek: nummerhul, statusrettelser, hash-kæde-forbehold, trin 1 delt i 1a/1b | **RETTET** |

---

## De vigtigste enkeltregler (findes fuldt beskrevet i filerne)

| Regel | Punkt | Kort |
|---|---|---|
| Ingen kode før spec godkendt | 0 | Dokumentation før implementering |
| Kun Chief og Warden taler med Owner | 3.3 | Workers rapporterer opad, aldrig til dig |
| Nødstop er øjeblikkeligt, reparation er det aldrig | 3.4 | Kun stoppet er uden godkendelse |
| Læs før du bygger | 4 | Obligatorisk læserækkefølge, håndhævet i task-loopet |
| Færdig ≠ deploy | 7 | To separate spørgsmål, altid |
| Rød klasse auto-godkendes aldrig | 56.1, 66.3 | Uanset tillidsniveau, for evigt |
| Alt skrives til event-loggen | 40 | Rapporter er visninger, ikke kilden |
| Hash-kæde fra første række | 66.1 | Umulig at eftermontere troværdigt |
| Én side ad gangen, syv gates | 74 | Ingen parallel bygning |

---

## Byggerækkefølge (fuld version i pkt. 70)

| # | Trin | Status |
|---|---|---|
| 0 | Rens repoet for cto.new-branding | **Færdig** — pushet 2026-08-12 |
| 1a | Datamodel: business/task/event + hash-kæde fra start | **Færdig** — se rapport 2026-08-12_trin1a, pushet til GitHub. Migration ikke afprøvet mod rigtig Postgres endnu, se rapportens forbehold |
| 1b | + stamtavle, artifacts, agent_trust, provenance | Efter 1a, kan ikke starte før 1a virker |
| 2 | Orchestrator + kø + tilstandsmaskine + Vagtposten | **Næste** — kan påbegyndes, kræver ikke 1b |
| 3 | Chief-chat + aktivitets-stream + designretning | Ikke påbegyndt |
| 4 | Godkendelses-gates + risikoklasser + budgetkuvert + trust-niveauer | Ikke påbegyndt |
| 5 | GitHub + Vercel preview | Ikke påbegyndt |
| 6 | Bibliotekar + rapport-validering + stamtavle-opslag | Ikke påbegyndt |
| 7 | Team-model: roller, faser, den tomme stol, agent-stemmer | Ikke påbegyndt |
| 8 | Finance + Usage + Sporhunden + solnedgangs-review | Ikke påbegyndt |
| 9 | Warden/Foundry + kirkegård + skrubber | Ikke påbegyndt |
| 10 | Marketplace + Stripe + proveniens-manifest | Ikke påbegyndt |

**Stop efter trin 5.** Brug platformen til ét rigtigt projekt, før trin 6
og opefter påbegyndes (pkt. 71).

---

## Åbne spørgsmål — samlet liste

Oprindelige (pkt. 14):

| # | Spørgsmål | Status |
|---|---|---|
| 1 | Foundry: historik eller kun aktive sager? | **Lukket** — begge, pkt. 59.2 |
| 2 | Hyrer Chief også platform-agenterne? | Forslag: nej (pkt. 35), afventer dit ja |
| 3 | Always-on vs. on-demand pr. agent | Afventer bekræftelse |
| 4 | Marketplace: prismodel, kvalitetskontrol, hvem må købe | Åben |
| 5 | Login: metode, session, 2FA | Åben |
| 6 | Permissions-listens omfang | **Delvist lukket** — platform-agenter uændret (pkt. 3.5, nu markeret), projekt-workers lukket af pkt. 66.3 |
| 7 | Data-arkitektur mod eksisterende stack | **Lukket** — konsekvens af #13's lukning, pkt. 89 |
| 8 | *(retired — aldrig defineret, forfatterfejl. Ikke genbrugt.)* | Lukket som tom, pkt. 88 |

Tilføjet senere:

| # | Spørgsmål | Fra |
|---|---|---|
| 9 | Dynamisk eller statisk modelliste i v1? | pkt. 19 |
| 10 | Tool-godkendelse pr. task eller permanent? | **Lukket** — stående godkendelser m. udløb, pkt. 56.2 |
| 11 | Worker-roller: lukket liste eller fri definition? | pkt. 36 |
| 12 | Skal fase-rækkefølgen håndhæves teknisk? | pkt. 38 |
| 13 | Postgres som system of record frem for MongoDB? | **Lukket** — ja, pkt. 83 |
| 14 | Chief global eller pr. business? | **Lukket** — pr. business, pkt. 54.1 |
| 15 | Hvor længe gemmes event-loggen råt? | **Lukket** — 90 dage, derefter komprimering, pkt. 55.3 |
| 16 | Tærskelværdier for Vagtposten | **Lukket** — pkt. 84 |
| 17 | Budgetkuvert i kroner eller tokens? | pkt. 64 |
| 18 | Maks. løbetid for stående godkendelse? | pkt. 64 |
| 19 | Hvilke event-typer er `transferable` ved salg? | pkt. 72 — før trin 10 |
| 20 | Tærskler for forfremmelse i lærlinge-modellen | **Lukket** — pkt. 85 |
| 21 | Kan skrogene sælges selvstændigt? | pkt. 72 |
| 22 | Skal server.js's badge-rendering og /branding-servering laves rigtigt (dynamisk), eller er hardcoded nok? | Rapport 2026-08-12, trin 0 |
| 23 | Hvilken ekstern forankrings-metode for hash-kæden, før Marketplace? | pkt. 92 |

**Ingen blokeringer tilbage for trin 0–2.** #13, #16, #20 lukket i
addendum 83. #6, #7 statusrettet i sundhedstjekket (pkt. 87). #8 retired.

---

## Vedligeholdelse af dette dokument

Opdateres ved hver session, der ændrer status (pkt. 24, 30.2, 30.5).
Konkret: når et trin skifter status, når et åbent spørgsmål lukkes, eller
når et nyt addendum tilføjes.
