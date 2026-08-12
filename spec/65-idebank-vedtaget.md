# QuistLine.ai — Addendum: Idébanken vedtaget (beslutning)

*Tilføjet: 12. august 2026*
*Status: **BESLUTTET** af Owner 12. august 2026 — hele brainstorm-
dokumentet vedtages som retning.*
*Tags: `#beslutning #identitet #datamodel #produkt #byggerækkefølge`*

*Overskriver: brainstorm-dokumentets status som "idéer, intet besluttet".
Idéerne flytter hermed fra idébank til beslutningsspor, jf. pkt. 24 og
30.1.*

---

## 65. Hvad "vedtaget" betyder her — tre grader

Hele idébanken er vedtaget, men ikke alt kan vedtages i samme forstand.
Uden denne skelnen ville byggerækkefølgen (pkt. 49/63) vokse fra 10 til
40 trin, og overengineering-risikoen fra pkt. 39 ville blive til
virkelighed.

| Grad | Betyder | Hvornår bygges det |
|---|---|---|
| **1. Arkitektonisk forpligtelse** | Pladsen reserveres i datamodellen NU. Funktionen kan komme senere, men feltet, relationen eller hash-kæden skal findes fra første række i databasen | Datamodellen: trin 1. Funktionen: senere |
| **2. Designretning** | Bindende for al UI, der bygges fra nu af. Kræver ingen database-ændring, koster intet ekstra at følge fra start | Løbende, fra første side der bygges |
| **3. Vedtaget i princippet** | Besluttet som retning, planlagt til et konkret senere trin. Skal ikke gentages som diskussion — kun udføres når turen kommer | Planlagt trin, se pkt. 70 |

**Grundreglen, der gør "ja til alt" forsvarligt:** det, der er dyrt at
eftermontere, er *strukturen* — ikke funktionen. En hash-kæde over
event-loggen koster nogle få linjer kode i dag og er praktisk talt umulig
at tilføje troværdigt om et år. En kirkegårdsside kan bygges når som helst.

---

## 66. Grad 1 — arkitektoniske forpligtelser (skal med i datamodellen fra trin 1)

### 66.1 Proveniens som vare (brainstorm C1)
**Beslutning:** event-loggen designes fra start til at kunne udskilles og
sælges sammen med et projekt.

Konsekvenser for datamodellen:
- **Hash-kæde:** hver event gemmer hash af den foregående event. Det gør
  loggen *beviseligt* uændret efter det skete. Dette er hele fundamentet
  under "belæg" som vare — og det er den ene ting, der er umulig at
  tilføje bagefter, fordi ingen kan vide, om historikken blev redigeret,
  før kæden fandtes
- **`transferable`-flag pr. event-type:** research, beslutninger, tests,
  acceptkriterier og filændringer **følger med** ved salg. Dine
  cost-tal, marginer, budgetkuverter og interne agent-vurderinger gør
  **ikke** — de er dine, ikke købers
- **`provenance_manifest`:** ét dokument pr. projekt, genereret af
  loggen, som er det køberen faktisk får udleveret

**Åbent, men ikke blokerende:** om manifestet skal signeres kryptografisk
med en nøgle, der beviser QuistLine.ai som udsteder. Kan tilføjes senere,
så længe hash-kæden findes.

### 66.2 Flåden nedarver (brainstorm C2)
**Beslutning:** projekter har en stamtavle, og genbrug er data-drevet, ikke
mavefornemmelse.

Konsekvenser for datamodellen:
- `businesses.lineage_parent_id` — hvilket projekt et nyt projekt stammer
  fra, hvis det er afledt
- **`artifacts`-tabel:** genbrugelige komponenter (bookingflow, formular,
  prisblok) med `origin_business_id` og målte resultater
  (konvertering, indtjening), så Chief kan sige *hvilken* variant der
  virkede — ikke bare at der findes en
- **Chiefs faste flow (pkt. 32.2) udvides:** før teamforslag skal Chief
  slå op i stamtavlen. Håndhæves af Bibliotekaren som en udvidelse af
  "læs før du bygger" (pkt. 4), nu på tværs af projekter, ikke kun inden
  for ét

### 66.3 Lærlinge-modellen (brainstorm C4)
**Beslutning:** permissions er dynamiske og optjenes. Erstatter den
statiske model i pkt. 34.4 for projekt-workers (platform-agenter
beholder faste, brede tilladelser).

Konsekvenser for datamodellen:
- **`agent_trust_levels`:** pr. kombination af rolle + model + charter-
  version. Niveauer: `under opsyn` → `betroet` → `selvkørende`
- **Track record udledes af event-loggen**, ikke af en separat vurdering:
  antal guard-overtrædelser (pkt. 60.1), underkendte rapporter, budget-
  overskridelser, falske færdigmeldinger
- **Forfremmelse og degradering:** tillid kan *falde*. En incident sætter
  rollen tilbage til forrige niveau. Uden degradering er systemet kun en
  optimistisk envejsrampe
- **Tærskler ejes af dig**, aldrig af en agent — samme princip som
  guard-reglerne i pkt. 59.6, og af samme grund: en agent har en indbygget
  interesse i mere autonomi

**Ufravigelig sikkerhedsregel (gælder over alt andet i dette punkt):**
tillidsniveau kan flytte handlinger mellem **grøn** og **gul** klasse
(pkt. 56.1). **Rød klasse auto-godkendes aldrig — uanset tillidsniveau,
uanset track record, uanset hvor længe noget har virket.** Deploy,
betaling, salg og sletning kræver dig, hver gang, for evigt.

---

## 67. Grad 2 — designretning (bindende for al UI fra nu af)

Følgende er vedtaget og skal følges af enhver side, der bygges fra i dag.
Ingen af dem koster ekstra, hvis de følges fra start:

1. **Rederi-sproget** (brainstorm A) — Flåden, Søsætning, Tørdokken,
   Skibsjournalen, Ophugget. Opdateres i `memory/glossary.md` som
   platformens officielle vokabular. Kode og UI bruger samme ord
2. **Signalflag-logikken** (B1) — skarpt adskilte tilstandsfarver, høj
   mætning kun hvor der er signal. Erstatter ikke farvetabellen i pkt.
   57.2, men er dens formsprog
3. **Søkort-paletten** (B2) — blækblå, kridtpapir, oxideret messing.
   Bevidst væk fra sort/neongrøn-standarden
4. **To læsemiljøer** (B3) — "Dæk" (dag, papir, serif, til læsning) og
   "Nat" (aften, dæmpet, til overvågning). Ikke light/dark mode, men to
   arbejdsformer
5. **Litterær typografi til agent-prosa** (B4) — serif og bogsætning til
   det tænkte, monospace til det maskinelle. Dette er det bærende svar på
   to-dages-kravet i pkt. 21.5
6. **Den tomme stol** (E2) — fravalgte roller vises som grå noder med
   begrundelse
7. **Konfidens som visuel vægt** (E6) — usikkert arbejde ser provisorisk
   ud, ikke som en procentsats
8. **Agent-stemmer** (E1) — hver rolle har en genkendelig skrivestil,
   defineret i dens charter (pkt. 43, punkt 1)

---

## 68. Grad 3 — vedtaget i princippet, planlagt til senere trin

Disse skal ikke diskuteres igen. De udføres, når turen kommer (pkt. 70):

| Idé | Planlagt til |
|---|---|
| Djævelens advokat (E3) | Sammen med kvalitets-gaten, pkt. 53.2 — det er samme mekanisme |
| Pre-mortem (E4) | Sammen med acceptkriterier, pkt. 53.1 |
| Agenternes karakterbog (E5) | Efter Usage/Finance — kræver historik at måle på |
| To-minutters-morgenen (D1) | Sammen med den globale godkendelseskø (58.5) |
| Stilhed (D2), Hviledagen (D3) | Sammen med budgetkuverten (56.3) |
| Lufthavns-tilstanden (D4) | Sammen med røde gates — mobil er et krav, ikke en bonus |
| Dagens oplæsning (D5) | Efter to-minutters-morgenen findes |
| Kirkegården (C3) | Når første projekt dør. Datamodellen understøtter det allerede via `lineage` + dødsårsag-felt |
| Solnedgangs-review (C5) | Sammen med Finance |
| Skrogene (C6) | Efter tre projekter — før det er der intet mønster at destillere |
| Skrubberen (F1), Spøgelset (F2) | Efter aktivitets-streamen. Gratis oven på event-loggen |
| Årbogen (F3) | Årligt, første gang efter 12 måneders drift |
| Efterfølger-tilstanden (F4) | Løbende — påbegyndes med det samme som en fil, platformen selv opdaterer |
| Flåden som billede (B5) | Ved mindst 10 projekter. Tabellen er indtil da den sande visning |

**De vilde skud (brainstorm G)** — rådsmødet, auktionen, brøkdels-salg,
pladsen i køen, modstandsdygtighed mod dig selv — vedtages som **aktiv
idébank med status `overvejes`**, ikke som byggeplan. De genbesøges ved
hvert spec-sundhedstjek (pkt. 30.5). Grunden er ærlig: flere af dem
(særligt brøkdels-salg) har juridiske konsekvenser for LLC/holding/trust-
strukturen, som skal afklares uden for platformen først.

---

## 69. Konsekvens for datamodellen samlet

Tilføjes til skemaet fra pkt. 40/63:

```
event            + prev_event_hash, event_hash, transferable (bool)
business         + lineage_parent_id, hull_id (skrog), death_reason
artifacts        ny: id, origin_business_id, type, metrics (JSONB)
agent_trust      ny: role, model, charter_version, level,
                     violations, promotions, demotions, updated_at
provenance       ny: business_id, manifest (JSONB), generated_at
```

Alle fem er billige at oprette nu og dyre at eftermontere — særligt
`prev_event_hash`, som mister sin beviskraft fuldstændigt, hvis den
tilføjes efter at historikken allerede findes.

---

## 70. Revideret byggerækkefølge (erstatter pkt. 49 og 63's rækkefølge)

| # | Hvad | Nyt i forhold til pkt. 49/63 |
|---|---|---|
| 0 | Rens repoet for cto.new-branding | Uændret |
| 1 | Datamodel + event-log + **hash-kæde + stamtavle + trust-tabel** | Udvidet med grad 1-felterne |
| 2 | Orchestrator + kø + tilstandsmaskine + **Vagtposten** (lag 1) | Uændret fra pkt. 63 |
| 3 | Chief-chat + aktivitets-stream, **søkort-palette, to læsemiljøer, litterær typografi** | Designretningen gælder fra denne side |
| 4 | Godkendelses-gates + **risikoklasser + budgetkuvert + trust-niveauer** | Lærlinge-modellen bygges her, ikke senere |
| 5 | GitHub + Vercel preview | Uændret |
| 6 | Bibliotekar + rapport-validering + **stamtavle-opslag før teamforslag** | Udvidet |
| 7 | Team-model: roller, faser, **den tomme stol, agent-stemmer** | Udvidet |
| 8 | Finance + Usage + **Sporhunden** (lag 2) + solnedgangs-review | Uændret + C5 |
| 9 | Warden/Foundry + kirkegård + skrubber | Udvidet |
| 10 | Marketplace + Stripe + **proveniens-manifest som vare** | Her bliver C1 til en faktisk funktion |

**Bemærk:** trin 1 og 4 vokser. Alt andet er stort set uændret, fordi
resten af idébanken enten er designretning (gratis at følge) eller
funktioner, der lander i trin, som allerede fandtes.

---

## 71. Ærlig note om omfang

Dette er nu en stor plan. Det er værd at sige højt: rækkefølgen i pkt. 70
er ikke en to-ugers plan, og trin 1–5 er stadig det eneste, der skal
virke, før platformen kan bruges til noget. Trin 6–10 er udbygning.

Modgiften mod overengineering (pkt. 39) er uændret: **byg trin 1–5 færdigt
og brug platformen til ét rigtigt projekt**, før noget fra trin 6 og
opefter påbegyndes. Idébanken løber ingen steder — den er skrevet ned nu,
præcis så den ikke behøver bygges nu.

---

## 72. Nye åbne punkter (tilføjes til spec pkt. 14)

19. Hvilke event-typer er `transferable` ved salg, og hvilke er dine
    alene? Forslag i pkt. 66.1 skal gennemgås type for type, før
    Marketplace bygges
20. Tærskler for forfremmelse i lærlinge-modellen — hvor mange rene
    opgaver før `under opsyn` → `betroet`?
21. Skal skrogene (C6) kunne sælges som selvstændig vare, eller er de kun
    til internt genbrug? Berører hele Marketplace-modellen

---
*Vedtaget af Owner. Flytter brainstorm-dokumentets idéer til besluttet
retning, med de tre grader beskrevet i pkt. 65. Erstatter pkt. 49 og 63's
byggerækkefølge.*
