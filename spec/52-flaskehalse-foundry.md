# QuistLine.ai — Addendum: Flaskehals-løsninger, optimering og Foundry-arkitektur

*Tilføjet: 12. august 2026*
*Status: **FORSLAG** — kræver Owner-godkendelse, jf. spec pkt. 0.*
*Tags: `#arkitektur #foundry #warden #ui #governance #flaskehalse`*

*Kontekst: Lukker de fire ærlige huller fra pkt. 50, udvider den visuelle
og funktionelle plan, og designer Foundry med Warden plus to automatiske
fejlfangst-lag under den.*

---

## 52. Vigtig rettelse først: Postgres er ikke et alternativ til Railway

Der var en misforståelse i sidste besked, som er værd at rydde af vejen,
før der besluttes noget på et forkert grundlag:

- **Railway** = hosting-platformen. Det sted, tingene *kører*. Sammenlignelig
  med Vercel.
- **Postgres** = selve databasen. Softwaren der *gemmer* data.

De to konkurrerer ikke — **Postgres kører på Railway**, og det gør din
allerede i dag. Der skal altså ikke vælges mellem dem.

Den reelle beslutning i pkt. 41.2 var mellem **to databaser**: Postgres
(som du allerede har på Railway) vs. MongoDB (som repoets `server.js`
bruger i dag). Forslaget er at bruge Postgres som primær kilde, fordi alt
i platformen hænger sammen relationelt (task → event → cost → godkendelse),
og fordi Finance-modulet er ren talaggregering, hvilket SQL er skabt til.
MongoDB kan enten udfases eller beholdes til ustrukturerede artefakter.

**Ændrer intet ved din hosting.** Vercel = frontend, Railway = database +
always-on orchestrator. Præcis den stack, du allerede betaler for.

---

## 53. Flaskehals 1 løst: kvalitetskontrol af det byggede

**Problemet:** de tre testniveauer (pkt. 7) beviser at koden *kører* —
ikke at produktet er *godt*. Et teknisk fejlfrit produkt, ingen ville
købe, består alle tests.

Løsningen er fire mekanismer, ingen af dem en ny agent-rolle (jf. pkt.
34.2, hvor separat QA blev fravalgt) — kvalitet bliver en **gate**, ikke
en stilling:

### 53.1 Acceptkriterier skrives før byggeriet, ikke efter
Ved task-oprettelse formulerer Chief sammen med dig 3–7 konkrete,
efterprøvbare kriterier ("en besøgende kan booke et møde uden at scrolle",
"siden loader under 2 sekunder på mobil"). De **låses**, når du godkender
opgaven, og kan ikke ændres af en agent bagefter.

Dette er det vigtigste enkeltgreb: definitionen af "godt" fastlægges,
mens ingen endnu har en interesse i at sænke barren. En agent, der ikke
kan nå målet, må rapportere det som blokeret — ikke omdefinere målet.

### 53.2 Modstander-review med en anden model
Den agent, der reviewer, kører på en **anden provider/model** end den, der
byggede. En model deler blinde vinkler med sig selv; to forskellige gør
det sjældnere. Reviewet er billigt (Groq/Gemini gratis tier er nok til
dette) og kører automatisk som testniveau 4.

Reviewets eneste opgave: forsøg at få opgaven **underkendt** mod
acceptkriterierne. Ikke at rose.

### 53.3 Visuel verifikation, ikke kun kode-verifikation
Efter build tages et screenshot af sandkasse-previewet (Playwright), som
sendes til en vision-model sammen med branding-kravene (pkt. 5) og
læsbarhedskravene (pkt. 21). Fanger den klasse af fejl, hvor koden er
korrekt, men siden ser i stykker ud — noget ingen unit-test opdager.

### 53.4 Køber-perspektivet som eksplicit trin
Sidste gate før "færdig": en vurdering op mod `docs/research.md` (pkt.
37.3) — ville den målgruppe, Researcheren beskrev, faktisk betale for
dette? Svaret er en anbefaling til dig, ikke en blokering. Men det
**skal** stå skrevet, så beslutningen om at sælge alligevel er bevidst.

---

## 54. Flaskehals 2 løst: Chief som flaskehals

**Problemet:** alt går gennem Chief. Ved flere samtidige projekter bliver
Chief enten langsom eller overfladisk.

### 54.1 Én Chief pr. business (lukker åbent punkt 14)
Chief bliver **ikke** én global instans. Hver business får sin egen Chief
med egen kontekst og egen hukommelse. Fordelene:
- Kontekstvinduet forbliver lille og billigt — Chief for projekt A skal
  ikke bære projekt B's historik rundt
- To projekter kan arbejde samtidig uden at vente på hinanden
- En Chief, der kører løbsk, rammer kun ét projekt

### 54.2 Det globale lag er en *visning*, ikke en agent
Headquarters samler ikke flere Chiefs under en super-Chief — det ville
bare flytte flaskehalsen ét niveau op. I stedet er den globale side en
**forespørgsel** på tværs af alle businesses' event-logs: hvad afventer
dig, hvad kører, hvad koster. Ingen ekstra agent, ingen ekstra tokens.

### 54.3 Kapacitetsloft frem for kvalitetsfald
Hver Chief har et loft for samtidige `RUNNING`-tasks (foreslået: 3).
Rammes loftet, **kø-sættes** næste opgave synligt i UI'en frem for at
Chief begynder at arbejde overfladisk på fem ting. Du kan altid hæve
loftet manuelt, men så er det dit bevidste valg.

### 54.4 Warden forbliver global
Modsat Chief skal Warden netop se på tværs — en fejl, der optræder i tre
projekter samtidig, er et mønster, ikke tre uheld. Én Warden-instans for
hele platformen.

---

## 55. Flaskehals 3 løst: gennemsigtighed uden støj

**Problemet:** ti agenters tanker logget råt er ikke indsigt, det er en
mur af tekst.

### 55.1 Tre detaljeniveauer på samme data
Alt gemmes råt (pkt. 40, uændret) — men streamen viser som standard kun
det øverste niveau:

| Niveau | Viser | Standard |
|---|---|---|
| **Overskrifter** | Beslutninger, godkendelser, fejl, færdige rapporter | ✔ default |
| **Normal** | + tool-kald, filændringer, delrapporter | Ved fejlsøgning |
| **Rå** | + hver enkelt tanke/ræsonnement | Kun ved dyb undersøgelse |

Niveauet skiftes med én knap. Data er de samme — det er kun filteret,
der ændrer sig.

### 55.2 Gentagelser foldes automatisk sammen
Fem næsten identiske tanker i træk vises som én linje med "×5" og kan
foldes ud. Agenter, der kører i ring, bliver dermed *synlige* frem for at
drukne feedet — og det er samtidig et signal til Sentinel-laget (pkt.
60.2).

### 55.3 Efterfølgende komprimering
Når en task er DONE, skriver systemet en kompakt digest af forløbet. Rå
hændelser bevares i en periode (foreslået: 90 dage), hvorefter tanke-
hændelser komprimeres til digesten, mens beslutninger, tool-kald,
godkendelser og cost **aldrig** slettes. Lukker åbent punkt 15 med et
konkret forslag.

### 55.4 Standardfilteret er "kræver mig"
Streamen åbner altid på det eneste filter, der betyder noget på en travl
dag. Alt andet er et klik væk, men ikke i vejen.

---

## 56. Flaskehals 4 løst: dig som den langsomste del

**Problemet, og det alvorligste:** hver gate kræver et svar fra dig. Med
ti workers på tre projekter bliver godkendelser til et fuldtidsjob, og så
begynder du enten at klikke "ja" uden at læse (værre end ingen gate) eller
alt står stille.

### 56.1 Risikoklasser — ikke alle gates fortjener samme friktion
Hver godkendelse klassificeres efter, hvor dyrt det er at fortryde (jf.
pkt. 30.9):

| Klasse | Eksempler | Behandling |
|---|---|---|
| **Grøn** — reversibel, kun i sandkasse, ingen ekstern effekt | Læse filer, køre tests, skrive i sandkassen, bruge et allerede godkendt tool | **Auto-godkendt**, logget. Du kan altid annullere bagefter |
| **Gul** — koster penge eller ny kapacitet | Hyre worker, nyt tool, modelskift til dyrere model, forbrug over dagsestimat | **Samlet godkendelse** i batch, ikke afbrydelse |
| **Rød** — irreversibel eller ekstern | Deploy til produktion, betaling, salg, sletning af filer, kommunikation ud af huset | **Altid enkeltvis, altid eksplicit.** Aldrig batch, aldrig stående, aldrig timeout-godkendt |

Dette er kernen i løsningen: den nuværende spec behandler alle
godkendelser ens, hvilket garanterer godkendelsestræthed. Rød klasse
beholder den fulde strenghed fra pkt. 3.4/7 — grøn klasse fjerner den
friktion, der ikke beskytter mod noget.

### 56.2 Stående godkendelser med omfang og udløb (lukker åbent punkt 10)
Når du godkender et tool eller en rolle, vælger du samtidig rækkevidden:
- **Kun denne gang** (default for rød)
- **Dette projekt** — fx GitHub-adgang for hele denne business
- **Alle projekter, 30 dage** — fornys aktivt, udløber af sig selv
- **Permanent** — kun muligt for grøn klasse

Alle stående godkendelser står samlet på ét sted i Settings og kan
trækkes tilbage med ét klik. Uden udløbsdato ville listen bare vokse i det
uendelige uden at nogen genbesøgte den.

### 56.3 Budget-kuvert frem for godkendelse pr. handling
Ved projektstart tildeler du en ramme: "dette projekt må bruge 40 kr og
maks. 5 workers." Inden for kuverten handler Chief uden at spørge (grøn og
gul klasse). Rammes loftet, pauser projektet automatisk og beder om mere —
dette er samtidig svaret på gap-analysens punkt om cto.new's automatiske
pause ved forbrugsgrænse (pkt. 16).

Du godkender altså **rammen én gang** i stedet for tredive enkelthandlinger
inde i rammen.

### 56.4 Samlet godkendelseskø, ikke afbrydelser
Gule gates afbryder dig ikke. De samler sig i én kø, som du gennemgår, når
det passer dig — med tastatur-genveje (godkend/afvis/åbn detaljer), så
tyve godkendelser tager to minutter, ikke tyve kontekstskift. Imens
arbejder de workers, der ikke er blokeret, videre.

### 56.5 Timeout med sikker standard
Svarer du ikke:
- **Grøn**: fortsætter (var auto-godkendt alligevel)
- **Gul**: venter 24 timer, derefter pauses opgaven og forbruget stopper
- **Rød**: venter i det uendelige. Går aldrig videre uden dig

Ingen tokens brænder, mens noget venter — det følger direkte af
tilstandsmaskinen i pkt. 41.3.

### 56.6 Notifikation ved rød gate
Kun rød klasse må sende dig en push-notifikation. Alt andet venter i
køen. Ellers bliver notifikationer selv en ny form for støj.

---

## 57. Visuel plan — grundig gennemgang

### 57.1 Det bærende designprincip
Platformens ene job, når du åbner den: **svar på "hvad kræver mig nu, og
hvad koster det?" inden for to sekunder.** Alt andet i UI'et er
underordnet det spørgsmål. cto.new bruger den mest værdifulde plads
(sidebar-bunden, topbanner) på upsell og sponsorater; her bruges den på
netop det svar.

### 57.2 Farve som tilstandssprog, ikke dekoration
Hver tilstand i tilstandsmaskinen (pkt. 41.3) får **én** farve, som
bruges konsekvent overalt — i node-canvas, i task-lister, i streamen, i
topbaren:

| Tilstand | Farve | Betydning |
|---|---|---|
| RUNNING | rolig blå/cyan | Arbejder, kræver intet |
| AWAITING_* | rav/amber | Venter på dig — den eneste farve der "kalder" |
| DONE / APPROVED | dæmpet grøn | Færdig, ingen handling |
| BLOCKED | grå | Venter på noget andet, ikke på dig |
| KILLED / fejl | rød | Nødstop, altid øverst |

Konsekvensen: rav = "gør noget". Ser du intet rav på skærmen, er der intet
at gøre. Det er hele visningens vigtigste signal, og derfor må ingen
dekorativ knap bruge rav.

### 57.3 Typografisk stemme pr. hændelsestype (udvider pkt. 21.2)
| Type | Behandling |
|---|---|
| Chiefs svar til dig | Fuld kontrast, 14–15px, normal vægt, max 70 tegn/linje |
| Agent-tanke | 13px, dæmpet farve, venstre hårlinje-markering, foldet sammen som standard |
| Tool-kald | Monospace-badge + ikon, én linje, aldrig blandet i prosa |
| Rapport | Kort med tydelig ramme, struktureret felt for felt |
| Fejl/nødstop | Rød venstrekant, aldrig sammenfoldet, altid fuld kontrast |
| Godkendelses-anmodning | Eget kort med knapper indlejret — besvares hvor den står, ikke et andet sted |

### 57.4 To densitets-tilstande
- **Komfort** (default): den fulde luft fra pkt. 21 — til lange
  arbejdsdage
- **Kompakt**: mindre lodret afstand til når du skimmer en lang historik

Skiftes med ét tastetryk. Skriftstørrelsen ændres **ikke** mellem
tilstandene — kun afstandene. Under 13px går vi aldrig (pkt. 21.3).

### 57.5 Bevægelse kun ved tilstandsskift
Animation bruges udelukkende til at vise, at *noget ændrede sig*: en node
der skifter farve, et kort der glider ind i godkendelseskøen. Ingen
ambient bevægelse, ingen pulserende ikoner, ingen dekorative overgange —
i et panel du kigger på i to dage, bliver ethvert løbende loop til
irritation. `prefers-reduced-motion` respekteres.

### 57.6 Streamen skal kunne holde til titusinder af hændelser
Virtualiseret liste (kun det synlige renderes), stabil scroll-position når
nye hændelser ankommer nedenfra, og "spring til nyeste"-knap frem for
tvungen auto-scroll. Auto-scroll, der river dig væk fra det, du læste, er
den hurtigste vej til et panel, man lukker.

### 57.7 Kvalitetsgulv
Tastaturfokus synligt overalt, kontrast mindst WCAG AA på al brødtekst
(det dæmpede grå i den nuværende skitse, `#64748b` på mørk baggrund,
består ikke), fuldt brugbar på mobil for godkendelser — du rejser
permanent, og en rød gate skal kunne besvares fra en telefon i en lufthavn.

---

## 58. Funktionel optimering

### 58.1 Kommandopalet (⌘K)
Ét indgangspunkt til alt: skift business, åbn task, godkend næste i køen,
skriv til Chief, søg i hele event-loggen. Ved daglig brug er dette
hurtigere end enhver navigation, og det fjerner behovet for at fylde
sidebaren med genveje.

### 58.2 "Hvorfor?" på enhver hændelse
Ét klik på hvad som helst en agent gjorde → hele kæden op til din
oprindelige besked (via `parent_event_id`). Dette er den funktion, der
gør gennemsigtigheden reelt brugbar frem for teoretisk: du skal aldrig
lede efter, hvorfor noget skete.

### 58.3 Tørkørsel før pengene bruges
Før en større opgave sættes i gang, kan Chief køre en **plan uden
udførelse**: hvilke roller, hvilke tools, estimeret token-forbrug og pris,
estimeret varighed. Du godkender et estimat frem for et blankt løfte —
og estimatet gemmes, så det senere kan sammenlignes med det faktiske
forbrug (input til Efficiency-agenten, pkt. 11).

### 58.4 Diff-visning ved alle filændringer
Ingen filændring vises som "filen blev opdateret". Altid som diff, med
Selv-reviewets advarsler (pkt. 8, niveau 3) markeret direkte i diffen.
Uforklarlige sletninger skal være umulige at overse.

### 58.5 Global godkendelseskø på tværs af businesses
Én liste. Sorteret rød først, derefter ældst. Tastaturnavigation. Dette er
den side, du reelt vil bruge mest, når platformen kører — den fortjener at
være ét tastetryk væk, ikke begravet i et projekt.

### 58.6 Løbende omkostningsmåler
Altid synlig i topbaren: dagens forbrug, projektets forbrug mod
budgetkuvert (pkt. 56.3), og hvad der brænder lige nu. Skifter til rav
ved 80 % af rammen, rød ved 100 %.

---

## 59. Foundry — opbygning og indhold

Foundry er ikke "Wardens chatvindue". Det er platformens driftscentral.
Hvad der skal være derinde:

### 59.1 Sundhedsoverblik (øverst, altid synligt)
Trafiklys pr. dimension: pr. business, pr. platform-agent, pr. provider
(Claude/Groq/Gemini), pr. integration (GitHub/Vercel/Stripe). Grønt felt
= intet at se, og det skal være den normale tilstand.

### 59.2 Aktive sager (lukker åbent punkt 14.1: både aktive og historik)
Hver sag er et kort med:
- Hvad udløste den, og **hvilket lag** der fangede den (pkt. 60)
- Hvornår, hvor længe, og om den er stoppet nu
- **Blast radius** — hvilke tasks, workers og businesses er berørt
- Foreslået rettelse fra Warden+Chief i fællesskab
- Godkendelsesstatus for rettelsen (jf. pkt. 3.4: reparation kræver altid
  dit ja)

### 59.3 Historik og postmortem
Afsluttede sager arkiveres med: hvad var årsagen, hvad blev gjort, hvad
forhindrer gentagelse. En sag kan ikke lukkes uden det sidste felt udfyldt
— ellers lærer platformen intet, og du får de samme fejl igen om en måned.

### 59.4 Nødstop-log
Hvert kill-switch, med hvem/hvad der udløste det, og — vigtigt — om det
**bagefter blev vurderet som korrekt eller falsk alarm**. Uden dette felt
kan ingen justere følsomheden, og du ender enten med en Warden, der stopper
alt for tit, eller en, du er begyndt at ignorere.

### 59.5 Mønsterbibliotek
Gentagne fejl, der er set før, med den kendte løsning. Når samme signatur
optræder igen, foreslår Warden direkte den tidligere virksomme rettelse i
stedet for at analysere forfra. Dette er Wardens stående hukommelse (jf.
pkt. 43, punkt 2).

### 59.6 Regel- og tærskelpanel
Alle automatiske regler fra lag 1 og 2 (pkt. 60) står her, med deres
tærskelværdier, hvor ofte de har udløst, og hvor stor andel der var falsk
alarm. Justeres af dig, aldrig af en agent.

---

## 60. De tre fejlfangst-lag — alle med Foundry som fælles landingssted

Warden alene er ikke nok: den er en model, der ræsonnerer, og derfor
langsom, dyr og i sidste ende gættende. To deterministiske lag under den
fanger det meste, før Warden overhovedet skal tænke.

Alle tre lag skriver til den **samme event-log** (pkt. 40) og lander samme
sted i UI'et (Foundry). Forskellen er, *hvornår* de kigger, og *hvad* de
kan se.

### 60.1 Lag 1 — Vagtposten (synkron, deterministisk, blokerende)
Kører **inde i** eksekveringen, før hver enkelt handling. Ingen model,
ingen tokens, svartid i millisekunder. Kan ikke tales fra sin beslutning,
fordi den ikke er en model.

Regler:
- **Kontraktvalidering** — agentens output matcher det påkrævede skema
  (fx rapport uden `toolsRequired` afvises, jf. pkt. 28)
- **Tool-whitelist** — kald til et ikke-godkendt tool blokeres (pkt. 45.2)
- **Sti-værn** — skrivning uden for projektets tilladte mapper blokeres
- **Masse-sletnings-værn** — over X fjernede linjer/filer i én ændring
  stopper og kræver menneskeligt blik (håndhæver pkt. 8 som kode, ikke
  som anbefaling)
- **Hemmeligheds-scanner** — en API-nøgle på vej ind i en fil eller et
  commit blokeres altid
- **Løkke-værn** — samme tool med samme argumenter N gange i træk = agenten
  kører i ring, stop
- **Budget-værn** — task overskrider sit token-loft, stop
- **Timeout-værn** — task har kørt længere end sit estimat ×2

Vagtposten **stopper skaden før den sker**. Den udløser en
`guard_violation`-hændelse og pauser opgaven — men den fortolker ikke,
den vurderer ikke, og den forsøger ikke at reparere.

### 60.2 Lag 2 — Sporhunden (asynkron, statistisk, opdagende)
Kører periodisk (fx hvert minut) hen over event-loggen og leder efter
mønstre, som ingen **enkelt** hændelse afslører. Ingen eller meget billig
model.

Signaler:
- **Omkostnings-anomali** — denne task koster 3× medianen for lignende
  opgaver
- **Stilstand** — task står i RUNNING, men ingen hændelser i X minutter
  (agenten hænger)
- **Gentagne fejl på tværs** — samme test fejler i flere tasks/projekter
- **Faldende beståelsesrate** — build/test lykkes sjældnere end i sidste uge
- **Charter-drift** — en agents adfærd afviger fra dens beskrevne rolle
  (fx: Bibliotekaren godkender rapporter med tomme felter — dens
  compliance-rate falder)
- **Provider-degradering** — fejlrate hos én provider stiger → foreslå
  omdirigering til en anden
- **Godkendelse forsømt** — en gate har ventet på dig i over X timer.
  Dette er bevidst: laget overvåger også, når **du** er den blokerende
  del af systemet (pkt. 56)

Sporhunden **opdager mønstre**, stopper som udgangspunkt ikke noget selv
(undtagen ved cost-anomali over en hård grænse), men rejser en sag.

### 60.3 Lag 3 — Warden (dømmende, model-baseret)
Modtager guard-overtrædelser, anomalier og rapportstrømmen. Wardens
egentlige arbejde er det, kun en model kan gøre:
- Afgøre om tre signaler er tre uheld eller **ét underliggende problem**
- Skrive den menneskeligt læsbare sag: hvad skete der, hvorfor, hvad nu
- Vurdere blast radius på tværs af projekter
- Foreslå rettelse sammen med Chief (pkt. 3.4, uændret)
- Udløse nødstop ved reelt problematiske forhold

Warden er altså **ikke** førstelinjen. Den er dommeren, der kommer på
banen, når de billige lag har fanget noget.

### 60.4 Hvorfor tre lag frem for én stærk Warden
| | Vagtpost | Sporhund | Warden |
|---|---|---|---|
| Reagerer | Før handlingen | Minutter efter | Når en sag rejses |
| Omkostning | Nul | Nær nul | Tokens pr. sag |
| Kan tage fejl? | Nej — deterministisk | Statistisk, kan give falsk alarm | Ja, det er en vurdering |
| Fanger | Kendte, farlige handlinger | Ukendte mønstre over tid | Sammenhæng og betydning |

Det billigste og mest pålidelige lag kigger oftest. Det dyreste og mest
fejlbarlige lag kigger sjældnest. Det er hele pointen.

---

## 61. Hvem vogter Warden

Et overvågningssystem, der ikke overvåger sig selv, har et blindt punkt
netop det sted, hvor det gør mest skade.

- **Vagtposten gælder også Warden** — Warden kan ikke kalde tools uden om
  sin egen whitelist
- **Sporhunden overvåger Wardens livstegn** — Warden sender et hjerteslag;
  udebliver det, rejses en sag
- **Dødmandsknap** — er Warden tavs ud over en grænse, får du besked
  **direkte**, uden om Chief. Dette er den eneste tilladte undtagelse fra
  pkt. 3.3's kommandostruktur, fordi det ikke er en agent, der taler til
  dig — det er platformen, der melder, at dens vagt er faldet om
- **Wardens egne nødstop revideres** — hvert stop får bagefter et
  "korrekt/falsk alarm"-flag (pkt. 59.4)

---

## 62. Falske alarmer skal styres aktivt

Den hurtigste måde at ødelægge Foundry på er at lade den råbe for tit.
Efter tre falske alarmer holder man op med at kigge, og så er hele laget
værdiløst.

Derfor: hver regel i lag 1 og 2 har en **udløsningsstatistik** (hvor ofte
den fyrer, og hvor stor andel du afviste som ikke-problem). Regler over en
falsk-alarm-grænse markeres synligt i regelpanelet (pkt. 59.6) som
kandidater til justering. Tærskler ændres kun af dig — aldrig af en agent,
da en agent har en indbygget interesse i færre stop.

---

## 63. Konsekvenser for datamodel og byggerækkefølge

**Datamodel — nye typer i event-loggen (pkt. 40):**
```
type: guard_violation | anomaly | incident | incident_resolution
      | approval_scope_granted | budget_envelope | dry_run_estimate
```
**Nye tabeller:** `approval_scopes` (stående godkendelser m. udløb),
`budget_envelopes`, `guard_rules` (tærskler + statistik), `incidents`.

**Byggerækkefølge (revideret fra pkt. 49):**
- **Lag 1 (Vagtposten) flyttes helt frem til trin 2**, sammen med
  orchestratoren. Den er billig at bygge og er det, der gør det forsvarligt
  at lade agenter køre uden opsyn overhovedet
- **Risikoklasser og budgetkuvert (pkt. 56.1/56.3) bygges i trin 4**,
  sammen med godkendelses-gatene — ikke som en senere optimering, da
  godkendelsestræthed ellers rammer dig fra den allerførste uge
- **Lag 2 (Sporhunden) i trin 8**, når der er nok historik til at
  statistik betyder noget
- **Lag 3 (Warden) forbliver trin 9** som oprindeligt

---

## 64. Nye åbne punkter (tilføjes til spec pkt. 14)

16. Konkrete tærskelværdier for Vagtposten (antal slettede linjer, antal
    identiske tool-kald, token-loft pr. task) — skal fastsættes, før laget
    bygges
17. Skal budgetkuverten (56.3) være i kroner eller i tokens? Kroner er
    lettere at forholde sig til, men kræver løbende opdaterede
    provider-priser
18. Hvor længe skal en stående godkendelse maksimalt kunne løbe, før den
    tvinges fornyet — er 30 dage det rigtige loft?

---
*Tilføjet til projektets vidensbase som forslag. Lukker de fire huller i
pkt. 50 og de åbne punkter 10, 14 og 15. Udvider pkt. 39–51 — erstatter
intet, før hvert punkt er eksplicit godkendt af Owner.*
