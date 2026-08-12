# QuistLine.ai — INDEX

*Jf. pkt. 30.2. Dette er indgangen til hele specen. Læs denne først.*
*Sidst opdateret: 12. august 2026*

**Projektstatus: BYGGERI I GANG.** Trin 0, 1a, 2.1, 3.1–3.3 og 4.1 er
gennemført, verificeret mod en rigtig Postgres **og et rigtigt Groq-kald**,
og pushet — intet tilbageværende uverificeret stykke. Hyring er nu en
rigtig, teknisk håndhævet godkendelses-gate (side 4.1) — ikke kun en
instruktion i en prompt. Seks reelle fejl er fundet og rettet under
verifikationerne, se de seneste rapporter. Spørgsmål 17 (budgetkuvert:
tokens, ikke kroner) er lukket — side 4.2 kan påbegyndes. Side 2.2
(orchestrator/jobkø) er bevidst udskudt — kræver en hosting-beslutning,
se spørgsmål 26.

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
| `95-beslutning-budgetkuvert-enhed.md` | 95–96 | Beslutning: budgetkuvert + budget-værn måles i tokens, ikke kroner | **BESLUTTET** |

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
| 1a | Datamodel: business/task/event + hash-kæde fra start | **Færdig, verificeret mod rigtig Postgres** 2026-08-12 |
| 1b | + stamtavle, artifacts, agent_trust, provenance | Efter 1a, kan ikke starte før 1a virker |
| 2.1 | Tilstandsmaskine (task) + Vagtpost lag 1 (8 regler) | **Færdig, verificeret mod rigtig Postgres** 2026-08-12. Kun 2 af 8 regler koblet til en live call-site, se rapportens "Bevidst udeladt" |
| 2.2 | Orchestrator (always-on) + jobkø (pg-boss) | **Ikke påbegyndt** — kræver eksplicit hosting-beslutning (spm. 26), ikke kun kode |
| 3.1 | Chat/hire-flow forbundet + søkort-palette/rederi-sprog/signalflag | **Færdig, verificeret** mod rigtig Postgres + ægte HTTP/browser-kald 2026-08-12 |
| 3.2 | Løs Vagtpost-stop (Fortsæt/Stop) + "Hvorfor?"-kæde + klikbar "afventer dig" | **Færdig, verificeret** — se "To reelle fejl fundet" i rapport 2026-08-12_lokal_postgres_verifikation |
| 3.3 | To-kanal-model: separat aktivitets-strøm (observation) fra Chief-chat (kommando), jf. pkt.42/48 | **Færdig, verificeret** mod ægte data, inkl. et reelt knap-klik |
| 3.4 | Detaljeniveauer i strømmen, kommandopalet, virtualisering | Ikke påbegyndt — lav prioritet uden mere volumen |
| 4.1 | Rigtig godkendelses-gate for hyring (gul klasse, pkt.56.1) | **Færdig, verificeret** mod rigtig Postgres + browser 2026-08-12 — se rapport 2026-08-12_trin4_side1, tre fejl fundet og rettet |
| 4.2 | Generelle risikoklasser + budgetkuvert + trust-niveauer | Ikke påbegyndt — spm. 17 lukket (pkt. 95), ingen blokering tilbage |
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
| 17 | Budgetkuvert i kroner eller tokens? | **Lukket** — tokens, pkt. 95 |
| 18 | Maks. løbetid for stående godkendelse? | pkt. 64 |
| 19 | Hvilke event-typer er `transferable` ved salg? | pkt. 72 — før trin 10 |
| 20 | Tærskler for forfremmelse i lærlinge-modellen | **Lukket** — pkt. 85 |
| 21 | Kan skrogene sælges selvstændigt? | pkt. 72 |
| 22 | Skal server.js's badge-rendering og /branding-servering laves rigtigt (dynamisk), eller er hardcoded nok? | Rapport 2026-08-12, trin 0 |
| 23 | Hvilken ekstern forankrings-metode for hash-kæden, før Marketplace? | pkt. 92 |
| 24 | Er hash-kædens scope (pr. business, ikke globalt) korrekt? | Rapport 2026-08-12_trin1a — antaget, afventer bekræftelse før 1b |
| 25 | Skal alle Vagtpost-overtrædelser mappe til `AWAITING_OWNER_REVIEW`, eller skal "blokér altid"-regler have en strengere tilstand? | Rapport 2026-08-12_trin2_side1 |
| 26 | Hvornår besluttes orchestrator/jobkø-arkitekturen (pkt. 41.2) konkret? | Rapport 2026-08-12_trin2_side1 — blokerer side 2.2 |
| 27 | Skal Owner-key i localStorage anerkendes som "login v0", eller udskiftes helt uden mellemstadier når spm. 5 besluttes? | Rapport 2026-08-12_trin3_side1 |

**Ingen blokeringer tilbage for trin 0–4.1, og ingen blokering for side
4.2 længere.** #13, #16, #17, #20 lukket i addendum 83/95. #6, #7
statusrettet i sundhedstjekket (pkt. 87). #8 retired. Side 2.2
(orchestrator/jobkø) afventer stadig spørgsmål 26.

---

## Vedligeholdelse af dette dokument

Opdateres ved hver session, der ændrer status (pkt. 24, 30.2, 30.5).
Konkret: når et trin skifter status, når et åbent spørgsmål lukkes, eller
når et nyt addendum tilføjes.
