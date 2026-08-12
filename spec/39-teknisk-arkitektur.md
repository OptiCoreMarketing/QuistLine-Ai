# QuistLine.ai — Addendum: Samlet teknisk arkitekturforslag

*Tilføjet: 12. august 2026*
*Status: **FORSLAG** — kræver Owner-godkendelse punkt for punkt, jf. spec
pkt. 0 og addendum pkt. 24–25. Intet heraf er besluttet.*
*Tags: `#arkitektur #agenter #datamodel #ui #tooling`*

*Kontekst: Owner har bedt om et samlet bud på, hvordan hele platformen
ville se ud bygget — agenter der "bor" i hvert modul, Chief der vurderer
om et projekt kræver 1 eller 10 workers, fuld gennemsigtighed i alle
agent-samtaler, og et UI der er behageligt at arbejde i dagligt.*

---

## 39. Antagelser, alternativer og risici (jf. pkt. 25)

**Antagelser jeg bygger på:**
1. Kun én bruger (Owner) i overskuelig fremtid — ingen multi-tenant-krav
2. Projekter er små-til-mellem web-produkter (landingssider, værktøjer),
   ikke systemer der kører kritisk produktion for kunder
3. Budget er begrænset og bevidst — gratis tiers (Groq/Gemini) bruges hvor
   det giver mening, jf. pkt. 3.6
4. Eksisterende stack (GitHub, Vercel, Railway/Postgres, MongoDB) beholdes
   hvor muligt frem for nye leverandører

**Vigtigste risiko ved hele designet:** overengineering. Der er reel fare
for at bygge en platform, der er sværere at vedligeholde end de produkter,
den skal bygge. Modforanstaltning: pkt. 49's byggerækkefølge starter med
det mindste, der reelt virker — ikke med hele arkitekturen på én gang.

---

## 40. Grundprincippet: én append-only event-log som rygrad

Dette er den vigtigste enkeltbeslutning i hele forslaget. Alt andet følger
af den.

**Idé:** Alt hvad der sker på platformen — hver agent-besked, hvert
tool-kald, hver godkendelse, hvert nødstop, hvert token forbrugt — skrives
som en **uforanderlig hændelse (event)** i én tabel. Intet slettes, intet
overskrives.

```
event {
  id, business_id, task_id, agent_id, parent_event_id,
  type,        // message | thought | tool_call | tool_result |
               // approval_request | approval_granted | report |
               // kill_switch | cost | file_change
  payload,     // JSONB
  model, provider, tokens_in, tokens_out, cost_usd,
  created_at
}
```

**Hvorfor det løser flere krav på én gang:**

| Krav fra spec/addendum | Hvordan event-loggen løser det |
|---|---|
| "Jeg skal kunne følge med i alle samtaler mellem alle agenter" | Owner-feed = et filter på event-strømmen. Ingen særskilt logging-mekanisme |
| Audit-log for tool-kald (pkt. 30.12) | `type = tool_call` — findes automatisk, kan ikke omgås |
| Fuld rapport ved nødstop (pkt. 3.4) | Hele forløbet kan afspilles hændelse for hændelse |
| Finance/Usage (pkt. 10–11) | Cost-felter ligger på hver enkelt hændelse → aggregering pr. agent/projekt/model er et SQL-kald |
| Traceability (pkt. 30.4) | `parent_event_id` giver kæden: Owner-besked → Chief-beslutning → worker-handling → commit |
| Rapporter (pkt. 9) | Rapporten er en *afledt visning* af hændelser, ikke en fil nogen skal huske at skrive |

**Konsekvens, der er værd at forstå:** Chiefs opsummering til dig er ikke
"sandheden" — den er en *bekvem visning*. Den rå sandhed er hændelserne.
Det betyder, at Chief aldrig kan skjule noget for dig ved at formulere sig
uheldigt, hvilket er præcis det, cto.new ikke kan tilbyde dig (der ser du
kun, hvad deres UI vælger at vise).

**Alternativ overvejet og fravalgt:** at logge til filer i `/reports` som
primær kilde (som repoet gør i dag). Fravalgt fordi filer ikke kan
forespørges på tværs, ikke kan streames til UI'en i realtid, og let kan
overskrives af en agent. Filerne bevares — men som *eksport* af
event-loggen, ikke som kilden.

---

## 41. Kørselsarkitektur — hvor tingene faktisk kører

### 41.1 Problemet med det nuværende setup
`vercel.json` ruter i dag al trafik til `src/server.js` som serverless
funktion. Det virker til en chat-forespørgsel, men bryder sammen for det,
du beskriver:
- Et team på 5 workers arbejder i timer — serverless funktioner har
  tidsgrænse
- Godkendelses-gates betyder, at arbejdet **pauser på ubestemt tid**,
  indtil du svarer. Der findes ingen HTTP-request at holde åben imens
- Warden skal være always-on (pkt. 3.2) — det er per definition ikke
  serverless

### 41.2 Foreslået opdeling

```
┌─ Vercel ──────────────────────────────────────┐
│  Next.js frontend + tynde API-routes          │
│  (læser data, sender kommandoer, streamer UI) │
└───────────────┬───────────────────────────────┘
                │
┌─ Railway ─────┴───────────────────────────────┐
│  1. Orchestrator (always-on Node-proces)      │
│     - kører agent-loops                       │
│     - Warden bor her                          │
│  2. Job-kø (pg-boss, oven på Postgres)        │
│  3. Postgres — system of record               │
└───────────────┬───────────────────────────────┘
                │
┌─ Sandkasse-udbyder ───────────────────────────┐
│  Isoleret miljø pr. projekt (se pkt. 47)      │
└───────────────────────────────────────────────┘
```

**Hvorfor `pg-boss` frem for Redis/BullMQ:** du har allerede Postgres på
Railway. pg-boss lægger jobkøen i selve databasen — én mindre tjeneste at
betale for og overvåge. Ved dit forventede volumen (få samtidige projekter)
er der ingen reel performance-grund til Redis.

**Hvorfor Postgres frem for MongoDB som primær:** næsten alt i denne
platform er relationelt og skal være konsistent — task hører til business,
event hører til task, cost hører til event, godkendelse blokerer task.
Dertil kommer, at Finance-modulet (pkt. 10) er ren aggregering, hvilket SQL
er bygget til. **Forslag:** Postgres bliver system of record; MongoDB
udfases eller beholdes kun til ustrukturerede artefakter. Dette modsiger
repoets nuværende Mongoose-opsætning bevidst — det er en strukturel
beslutning (jf. pkt. 30.9, "dyr at ændre senere"), og derfor værd at tage
nu frem for om seks måneder.

### 41.3 Agent-loops som genoptagelige tilstandsmaskiner
Hver task er en række i databasen med en tilstand:

```
DRAFT → AWAITING_TOOL_APPROVAL → AWAITING_HIRE_APPROVAL → RUNNING
      → BLOCKED_ON_DEPENDENCY → AWAITING_OWNER_REVIEW
      → APPROVED → AWAITING_DEPLOY_APPROVAL → DONE
      (eller: KILLED når som helst)
```

Det afgørende: når en task rammer en `AWAITING_*`-tilstand, **stopper
processen helt** og gemmer sin tilstand. Der brænder ingen tokens, mens du
sover. Når du godkender i UI'en, lægges et nyt job i køen, som samler
tråden op. Det er sådan godkendelses-gatene i pkt. 3.3, 7 og 26 bliver
teknisk umulige at omgå — de er ikke en instruktion i en systemprompt, de
er en tilstand, koden ikke kan komme videre fra.

---

## 42. To kanaler: kommando (smal) og observation (bred)

Dit ønske om at følge med i *alle* agent-samtaler støder umiddelbart mod
spec pkt. 3.3 (kun Chief og Warden taler med Owner). Løsningen er at
adskille de to ting, der er blevet blandet sammen:

| | Kommando-kanal | Observations-kanal |
|---|---|---|
| Retning | Tovejs | Kun læsning |
| Hvem | Kun Chief og Warden | Alle agenter, alle workers |
| Formål | Beslutninger, godkendelser, opgaver | Indsigt, kontrol, fejlfinding |
| UI | Chief-chat (højre panel) | Global aktivitets-stream + tråd pr. agent |

**Reglen:** du kan se alt, men du kan kun *skrive* til Chief og Warden.
Vil du korrigere en worker midt i arbejdet, skriver du til Chief, som
griber ind. Det bevarer kommandostrukturen (ingen worker forvirres af to
chefer), samtidig med at intet er skjult for dig.

**Praktisk i UI'et:** klikker du på en worker i team-canvaset, åbner dens
fulde tråd — tanker, tool-kald, filændringer — som read-only. Der er ikke
noget skrivefelt. I stedet en knap: **"Bed Chief om at gribe ind her"**,
som forudfylder Chief-chatten med kontekst om netop den hændelse.

---

## 43. Hvordan en agent "bor" i et modul

En platform-agent er ikke en chat-session, der starter forfra hver gang.
Konkret består den af fire dele, der ligger i databasen:

1. **Charter** (fast) — systemprompt, ansvar, grænser. Versioneret. Ændres
   kun af dig, aldrig af agenten selv
2. **Stående kontekst** (langsom) — agentens egen `memory`: hvad den har
   lært om platformen over tid. Fx husker Finans-agenten, hvilke
   projekttyper der historisk blev urentable
3. **Arbejdshukommelse** (hurtig) — kun relevant for den aktuelle
   forespørgsel, kasseres bagefter
4. **Permissions + tool-adgang** (fast, jf. pkt. 34.4/26) — hvad den må
   røre ved

Når du åbner Finance-siden, er agenten der allerede med sin historik — den
"bor" der i den forstand, at dens hukommelse er knyttet til modulet, ikke
til din session.

**Triggere pr. agent** er allerede specificeret i addendum pkt. 33; de
implementeres som jobs i køen (periodiske eller hændelsesdrevne), ikke som
noget, du skal starte manuelt.

---

## 44. Chiefs vurdering: 1 worker eller 10?

Dette er den beslutning, der afgør, om platformen føles intelligent eller
irriterende. Forslag til hvordan Chief skal træffe den:

**Trin 1 — Chief scorer opgaven på fire akser** (som en struktureret
JSON-vurdering, ikke fritekst):

| Akse | Lav (1) | Høj (5) |
|---|---|---|
| Ukendthed | Kendt mønster, gjort før | Nyt marked/domæne, kræver research |
| Visuel vægt | Internt værktøj, udseende ligegyldigt | Kundevendt, salgsafgørende |
| Tekstmængde | Få labels | Fuld salgsside, SEO-vigtig |
| Teknisk omfang | Én side | Flere sider, integrationer, database |

**Trin 2 — rollerne udledes af scoren, ikke af mavefornemmelse:**
- Ukendthed ≥ 3 → Researcher tilføjes
- Visuel vægt ≥ 3 → Designer tilføjes
- Tekstmængde ≥ 3 → Copywriter (+ SEO ved ≥ 4)
- Teknisk omfang ≥ 4 → Engineer opdeles i flere (fx frontend/backend)
- Alt scorer 1–2 → **én Engineer alene.** Dette er vigtigt: standarden
  skal være det lille team, ikke det store

**Trin 3 — Chief fremlægger scoren for dig sammen med teamforslaget.** Du
ser altså *hvorfor* Chief vil have fem roller, ikke bare at den vil.
Uenig? Du skærer en rolle væk i selve godkendelsen, og Chief noterer
konsekvensen (fx "uden Researcher bygger vi på antagelser om målgruppen").

Dette er direkte overlegent i forhold til cto.new, hvor teamet er givet på
forhånd (lead + engineer) uanset opgavens karakter.

---

## 45. Tool-laget og integrationer

### 45.1 Anbefalede integrationer, og hvorfor
| Behov | Forslag | Begrundelse |
|---|---|---|
| Kodeopbevaring | GitHub API | Allerede i din stack, pkt. 7 kræver det |
| Deploy/preview | Vercel API | Allerede i din stack |
| Betalinger | Stripe Connect | Kræves af Marketplace (pkt. 12) — **først i fase 2**, ikke ved v1 |
| Research/web | Web-søgning + hentning af sider | Researcher-rollen er værdiløs uden |
| Isoleret kørsel | Sandkasse-udbyder (pkt. 47) | Agent-genereret kode må aldrig køre på din egen maskine eller i din platform-proces |

**Anbefalet mønster: MCP som standard-interface for alle tools.** I stedet
for at skrive en ny integration pr. tjeneste, taler agenterne MCP, og hver
integration er en MCP-server. Fordelen er, at tool-godkendelses-gaten
(pkt. 26) så bliver ét sted i koden — en whitelist pr. agent over hvilke
MCP-servere den må kalde — frem for spredt logik pr. integration.

### 45.2 Tool-gaten teknisk
Før en task går til `RUNNING`, sammenlignes `toolsRequired` med agentens
godkendte liste. Er der noget nyt, sættes tilstanden til
`AWAITING_TOOL_APPROVAL`, og du får ét spørgsmål med: hvilket tool, hvorfor,
hvilken adgang. Ingen agent kan kalde et tool, der ikke står på listen —
det håndhæves i router-laget, ikke i systemprompten.

---

## 46. Model-router

Ét sted i koden, som alle agenter kalder — ingen agent taler direkte med
en provider-SDK.

```
callModel({ agentId, taskId, purpose, messages, tools })
  → vælger provider/model efter agentens konfiguration
  → normaliserer tool-use på tværs af Claude/Groq/Gemini
  → skriver cost-event til event-loggen (pkt. 40)
  → håndterer retry og fallback ved provider-nedbrud
```

**Hvorfor det skal være ét lag:** ellers er cost-sporing (pkt. 10) umulig
at holde komplet, og modelskift pr. agent (pkt. 3.6) bliver til søg-og-erstat
i hele kodebasen. Til normalisering på tværs af providere er Vercel AI SDK
et rimeligt valg, da du allerede er på Vercel — alternativt et tyndt eget
lag oven på de tre officielle SDK'er.

**Modelliste:** dynamisk hentet pr. provider og cachet, jf. addendum pkt.
18.3-A. Ingen hardcodede modelnavne i UI'en.

**Til projekt-workers, der skriver kode,** er det værd at undersøge, om et
færdigt agent-framework med indbygget fil-/terminal-værktøj er bedre end
at bygge tool-loopet selv. Anthropic har SDK'er til den slags — tjek
docs.claude.com for den aktuelle situation, da dette område ændrer sig
hurtigt, og min viden kan være forældet.

---

## 47. Sandkasse og live preview

**Hård regel:** agent-genereret kode kører aldrig i orchestrator-processen
og aldrig på din egen maskine. Én isoleret sandkasse pr. projekt (pkt. 6).

Realistiske muligheder, i stigende kompleksitet:
1. **Kun GitHub + Vercel preview-deploys** — worker skriver kode, committer
   til en branch, Vercel bygger en preview-URL. Ingen selvstændig
   sandkasse-infrastruktur overhovedet. **Anbefalet til v1** — det giver
   dig præcis det, pkt. 6 beder om (offentligt HTTPS-preview fra enhver
   enhed) uden nogen ny leverandør
2. **Container pr. projekt** (Railway/Fly) — nødvendigt, hvis workers skal
   køre tests og terminalkommandoer i et levende miljø
3. **Dedikeret sandkasse-udbyder** (fx E2B, Daytona, Modal) — relevant
   først, hvis mange projekter kører samtidig

Mulighed 1 dækker sandsynligvis dine første mange projekter. Spring 2 og 3
over, indtil du reelt mangler dem.

---

## 48. Frontend — sider og visuel opbygning

### 48.1 Overordnet greb
Tre faste zoner i business-workspace, som matcher hvordan du reelt
arbejder:

```
┌──────────────────────────────────────────────────────────┐
│  Topbar: business · fase · forbrug · [!] afventer dig 2  │
├────────────┬───────────────────────────┬─────────────────┤
│  Venstre   │  Midte (skiftende)        │  Højre          │
│  Navigation│  Team-canvas / Site /     │  Chief-chat     │
│  + status  │  Filer / Finans           │  (kommando)     │
│            │                           │                 │
│            ├───────────────────────────┤                 │
│            │  Aktivitets-stream        │                 │
│            │  (observation, alle)      │                 │
└────────────┴───────────────────────────┴─────────────────┘
```

Den vandrette deling i midten er nøglen: **øverst hvad der bygges, nederst
hvad der sker.** Det er samme idé som cto.new's terminal-log, men gjort
læsbar frem for kun statuslinjer (jf. addendum pkt. 21.4).

### 48.2 Aktivitets-streamen — det, der gør platformen bedre end cto.new
Én kronologisk strøm af hændelser fra alle agenter, med:
- **Filtre**: pr. agent, pr. type (tanker/handlinger/rapporter/fejl), pr. task
- **"Kun det, der kræver mig"-visning** — det eneste filter, der reelt
  betyder noget på en travl dag
- **Sammenklappede tanke-blokke**: overskrift synlig, ræsonnement foldet
  ud på klik. Ellers drukner de faktiske handlinger i tekst
- **Kæde-visning**: klik på en hændelse → se hele kæden fra din oprindelige
  besked til den (via `parent_event_id`)

### 48.3 Team-canvas
Noder for hver aktiv rolle, med fase-farve (venter / arbejder / afventer
dig / færdig), model-vælger pr. node og en linje ned til de artefakter,
rollen har produceret. Klik på en node → dens fulde tråd, read-only (pkt.
42).

Vigtig detalje: **vis afhængighederne som pile mellem roller** (Research →
Design → Copy). Det gør fase-modellen fra pkt. 37.2 synlig i stedet for
skjult i logikken, og du kan se med det samme, hvem der venter på hvem.

### 48.4 Læsbarhed — bindende krav
Alt i addendum pkt. 20–22 gælder for begge tekstpaneler: mindst 13px
brødtekst, linjeafstand 1.5–1.65, 12–16px mellem blokke, 60–75 tegn pr.
linje, tydelig visuel forskel på tanke / svar / handling / fejl. Chat- og
stream-panelet skal begge kunne trækkes i bredden.

**Én bevidst afvigelse fra cto.new-skitsen:** ingen låse-ikoner, ingen
"FREE"-badge, ingen upgrade-boks, ingen sponsorater (jf. addendum pkt. 15).
Hele venstre sidebars nederste tredjedel, som cto.new bruger på upsell,
bruges her på **dagens forbrug og hvad der afventer dig** — information, du
faktisk har brug for.

### 48.5 Globale sider
- **Headquarters** — alle businesses, status, hvad der afventer dig, samlet
  på tværs af projekter
- **Foundry (Warden)** — aktive sager øverst, historik nedenunder (foreslår
  hermed at lukke åbent spørgsmål 14.1 med "begge dele")
- **Finance / Usage** — begge aggregeringer over samme cost-events
- **Integrations** — eget modul, ikke gemt under Settings (jf. gap-analysen
  i pkt. 16)
- **Marketplace** — sidst, jf. pkt. 49

---

## 49. Byggerækkefølge — den mindste vej til noget, der reelt virker

Efter side-for-side-metoden med gates (fokusområde A–G):

| # | Hvad | Hvorfor her |
|---|---|---|
| 0 | Rens repoet: fjern cto.new-branding, lock-ikoner, sponsorater | Jf. pkt. 15. Skal ske før alt andet, ellers bygges der oven på fremmed brand |
| 1 | Datamodel + event-log + Postgres | Alt andet afhænger af den. Dyrest at ændre senere |
| 2 | Orchestrator + kø + tilstandsmaskine, **kun Chief og én Engineer** | Beviser hele loopet uden team-kompleksitet |
| 3 | Chief-chat + aktivitets-stream med rigtig læsbarhed | Her sidder du længst — skal være rigtigt tidligt |
| 4 | Godkendelses-gates (hire, tool, færdig, deploy) | Gør systemet sikkert at lade køre |
| 5 | GitHub + Vercel preview | Giver det første rigtige produkt ud af den anden ende |
| 6 | Bibliotekar + rapport-validering | Håndhæver dokumentationsdisciplinen fra pkt. 27–28 |
| 7 | Team-model: flere roller, faser, afhængigheder | Først når én worker beviseligt virker |
| 8 | Finance + Usage | Har brug for reelle cost-events at aggregere |
| 9 | Warden/Foundry | Har brug for en rapport-strøm at overvåge |
| 10 | Marketplace + Stripe | Sidst — kræver alt andet stabilt |

**Bemærk trin 2:** Chief + én Engineer først, selvom hele pointen er teams
på op til 10. Det er bevidst — hvis loopet ikke virker rent med to agenter,
bliver det ikke bedre af at tilføje otte mere.

---

## 50. Hvad dette forslag *ikke* løser (ærlige huller)

1. **Kvalitetskontrol af det byggede.** Tre testniveauer (pkt. 7) fanger
   om koden kører — ikke om produktet er godt. Der findes ingen mekanisme
   i specen for "dette er teknisk fejlfrit, men ville ingen købe"
2. **Chief som flaskehals.** Alt går gennem Chief. Ved mange samtidige
   projekter bliver Chief enten langsom eller overfladisk. Muligt svar
   senere: én Chief-instans pr. business frem for én global
3. **Omkostningen ved gennemsigtighed.** At logge hver tanke fra ti agenter
   producerer meget tekst. Uden gode filtre bliver aktivitets-streamen
   støj, ikke indsigt — filtrene i pkt. 48.2 er derfor ikke pynt
4. **Din egen tid.** Hver gate kræver et svar fra dig. Med ti workers på
   tre projekter kan du blive den langsomste del af systemet. Det er
   præcis derfor, åbent punkt 10 (permanent tool-godkendelse) bør lukkes,
   før teams tages i brug

---

## 51. Nye åbne punkter (tilføjes til spec pkt. 14)

13. Skal Postgres erstatte MongoDB som system of record (pkt. 41.2)? Dette
    er en strukturel beslutning, dyr at omgøre senere
14. Skal Chief være én global instans eller én pr. business (pkt. 50.2)?
15. Hvor længe skal event-loggen gemmes fuldt ud, før gamle hændelser
    komprimeres til opsummeringer? Uendelig opbevaring er enkelt, men
    vokser uden loft

---
*Tilføjet til projektets vidensbase som forslag. Udvider spec pkt. 2–13 og
addendum pkt. 32–38 — erstatter intet, før hvert punkt er eksplicit
godkendt af Owner.*
