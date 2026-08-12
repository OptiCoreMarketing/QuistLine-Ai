# QuistLine.ai — Fri brainstorm: idéer, billeder og vilde skud

*Tilføjet: 12. august 2026*
*Status: **IDÉER — intet besluttet, intet foreslået til godkendelse.***
*Tags: `#brainstorm #identitet #ui #produkt #fremtid`*

*Dette dokument hører hjemme i `ideas.md`-kategorien (jf. pkt. 30.1), ikke
i beslutningssporet. Formålet er at have tænkt stort én gang, så de gode
idéer findes skrevet ned, når der senere er plads til dem. Meget af dette
skal aldrig bygges. Nogle få stykker kan ændre hele produktet.*

---

## A. Det store greb: QuistLine er et **rederi**, ikke et dashboard

Læg mærke til, hvad sproget allerede gør af sig selv. Chief. Warden.
Foundry. Launch a business. Fleet. Det peger et sted hen, uden at nogen
har besluttet det.

**Idé:** tag metaforen helt seriøst. QuistLine er en *linje* — et rederi.
Hver business er et **fartøj**, der bygges på værftet, søsættes, sejler,
tjener penge, og en dag sælges eller hugges op.

| Platform-begreb | Maritimt navn | Hvorfor det er bedre end det generiske |
|---|---|---|
| Opret business | **Søsætning** | "Launch" er allerede ordet — men her betyder det noget |
| Headquarters | **Flåden** | Du ser skibe, ikke rækker i en tabel |
| Foundry | **Tørdokken** | Der hvor noget tages ud af drift og repareres |
| Warden | **Fyrmesteren** | Holder øje med hele kysten, ikke ét skib |
| Event-log | **Skibsjournalen** | En logbog er allerede juridisk og historisk hellig |
| Marketplace | **Skibshandlen** | Man sælger et fartøj med papirer, ikke en "app" |
| Nedlagt projekt | **Ophugget** | Ærligt. Døde projekter skal have et ord |

Hvorfor det ikke kun er pynt: et sammenhængende sprog gør, at du kan gætte,
hvad noget hedder, uden at slå op. cto.new hedder alt det, alle andre
SaaS-produkter hedder. Det her ville hedde noget, der er dit.

Og der er en dybere rim: QuistLine Trust skal holde i 1000 år. Rederier og
værfter er nogle af de eneste virksomhedsformer, mennesker faktisk har
drevet i den tidshorisont.

---

## B. Visuel identitet — væk fra "endnu et mørkt AI-dashboard"

### B1. Signalflag som tilstandssprog
Søfarten løste for 200 år siden præcis det problem, pkt. 57.2 handler om:
hvordan viser man en tilstand entydigt på afstand. Svaret var
**signalflag** — hver har én betydning, ingen betyder to ting.

Brug flagsystemet som visuelt grundlag for tilstandsfarverne. Ikke som
bogstavelige flag-ikoner (det ville blive kitsch), men som palette og
form-logik: skarpe, opdelte felter frem for gradienter, høj mætning kun
hvor der er signal. Rav = "jeg har brug for dig" bliver til ét flag, du
lærer at genkende på et halvt sekund.

### B2. Søkort frem for terminal
Standard-AI-æstetikken lige nu er sort baggrund + neongrøn. Alternativet,
der er både smukkere og mere læsbart i to dage i træk: **søkortets
palette** — dyb blækblå, kridtet papirfarve, oxideret messing som accent,
tynde hårlinjer som dybdekurver.

Søkort er i øvrigt verdens bedste eksempel på ekstrem informationstæthed,
der stadig kan læses roligt. Det er præcis det problem, aktivitets-streamen
har.

### B3. To læsemiljøer, ikke ét tema med en switch
- **Dæk** (dag): papirfarvet baggrund, serif brødtekst — til at *læse*
  agenternes prosa i timevis
- **Nat** (aften): dæmpet blåsort, lavere kontrast — til at *overvåge*

Det er ikke light/dark mode. Det er to forskellige aktiviteter, der
fortjener hver sin typografi. Hvis du sidder to dage i træk, sidder du
ikke med samme opgave hele tiden.

### B4. Behandl agent-tekst som litteratur, inte som logs
Det kunstneriske greb, jeg selv ville turde: sæt agenternes prosa som en
**velsat bog** — serif, ordentlig linjelængde, marginnoter til metadata,
kolumnetitler. Maskinoutput (tool-kald, diffs, fejl) forbliver monospace
og teknisk.

Kontrasten mellem de to gør det øjeblikkeligt tydeligt, hvad der er
*tænkt* og hvad der er *sket* — og det gør de lange arbejdsdage
behagelige på en måde, ingen konkurrent har prøvet, fordi de alle sammen
antager, at AI-output er logs.

### B5. Flåden som et faktisk billede
Headquarters vist ikke som kort i et grid, men som en **red**: skibe på et
ankerplads, størrelse = omsætning, position = fase, dem der brænder penge
uden at tjene ligger tydeligt for sig selv. Ét blik, hele forretningen.

Risikoen er, at det bliver legetøj. Modgiften: det skal kunne slås om til
en almindelig tabel med ét tastetryk, og tabellen er den, der er sand.

---

## C. Idéer der ændrer, hvad produktet **er**

### C1. Sælg proveniensen, ikke kun produktet ⭐
Det her er efter min mening den bedste kommercielle idé i hele dokumentet.

Når du sælger et projekt på Marketplace, sælger alle andre en zip-fil.
Du kan sælge noget, ingen andre kan: **hele bygge-historikken**.
Researchens kilder. Beslutningerne og hvorfor. Hver test der blev kørt.
Hver rettelse. Acceptkriterierne og beviset for, at de blev opfyldt.

Køberen får ikke bare et produkt — de får *belæg*. Det er forskellen på
at købe en brugt båd og at købe en brugt båd med fuld servicebog.

Og det følger gratis af event-loggen (pkt. 40). Du har allerede bygget
maskinen, der producerer det; du har bare ikke opdaget, at det er varen.

### C2. Flåden nedarver — projekter får en stamtavle
Projekt nr. 7 starter ikke på bar bund. Det arver de komponenter,
mønstre og tekststrukturer, der beviseligt virkede i projekt 1–6.
Chief foreslår: *"Bookingflowet fra Projekt 3 konverterede 4 % bedre end
det fra Projekt 5 — jeg foreslår vi genbruger 3'erens."*

Det betyder, at platformen bliver **bedre af at blive brugt**. cto.new kan
per definition ikke tilbyde dig det, for de ejer ikke din historik på
tværs af dine projekter — og hvis de gjorde, ville de dele den med deres
andre kunder.

### C3. Kirkegården
Døde og fejlslagne projekter slettes ikke. De arkiveres med **dødsårsag**.
Ingen andre platforme viser dig dine fiaskoer — de gemmer dem, fordi de
sælger optimisme.

Men din kirkegård er dit mest værdifulde læringsmateriale, og Chief bør
være forpligtet til at kigge i den, før den foreslår noget, der ligner et
projekt, som allerede er dødt én gang.

### C4. Lærlinge-modellen — tillid der optjenes
I stedet for faste permissions: en worker-rolle starter **under opsyn**
(alt kræver godkendelse), og optjener autonomi ved dokumenteret
track record. Efter 20 opgaver uden guard-overtrædelser flytter Engineer
fra "spørg altid" til "spørg kun ved gul/rød".

Det løser godkendelsestræthed (pkt. 56) over tid i stedet for at afveje
den én gang. Og det er en smuk idé i sig selv: agenterne *ansættes* rigtigt
— med prøvetid.

### C5. Solnedgangs-review
Hvert produkt får automatisk et gensyn efter 30 / 90 / 365 dage: tjener
det stadig? Finans-agenten fremlægger tallene og stiller ét spørgsmål:
**behold, sælg eller hug op?**

Uden dette får du zombie-projekter, der koster hosting og opmærksomhed i
årevis, fordi ingen nogensinde besluttede at stoppe dem.

### C6. Skrogene — beviste skeletter
Efter et par projekter kender du dine egne arketyper (lead magnet,
værktøjs-side, mikro-SaaS). Gør dem til navngivne **skrog**, der kan
søsættes på minutter i stedet for at researche forfra. Ikke templates i
generisk forstand — dine egne, målt på hvad de har tjent.

---

## D. Hvordan det er at *leve* med platformen

### D1. To-minutters-morgenen
Én skærm, én gang om dagen, der er hele grænsefladen på en normal dag:
hvad afventer dig, hvad brændte i går, hvad blev færdigt, hvad koster
det. Alt andet i platformen er til undtagelser.

Målet er, at en almindelig dag *ikke* kræver, at du åbner noget andet.

### D2. Stilhed som funktion
En tilstand, hvor platformen **ikke** taler til dig i N dage, medmindre
noget er rødt. Agenterne arbejder videre inden for budgetkuverten.
Du kommer tilbage til en digest, ikke 400 notifikationer.

De fleste produkter kappes om din opmærksomhed. Dette ville kappes om at
bruge mindst muligt af den — og det er faktisk salgsargumentet mod
cto.new, hvis platformen en dag skal sælges.

### D3. Hviledagen
Én dag om ugen, hvor ingen agent bruger penge. Ikke af religiøse grunde,
men fordi: det giver en naturlig cadence til at læse, beslutte og rydde
op, det skærer forbruget med ~14 %, og det tvinger en ugentlig rytme ind i
noget, der ellers kører i én uendelig strøm.

### D4. Lufthavns-tilstanden
Du rejser permanent. Der findes en reduceret mobil-visning, hvor kun
**røde gates** og deres kontekst kan besvares — stort, roligt, få ord,
virker på dårligt wifi. Alt andet er skjult, fordi du alligevel ikke
gennemgår en aktivitets-stream på en telefon i en transitgate.

### D5. Dagens oplæsning
En kort talt opsummering (genereret tekst → tale), du kan høre, mens du
går et sted hen. Ikke et gimmick: det er den eneste måde at holde sig
opdateret på en dag, hvor du ikke sidder ved en skærm.

---

## E. Agenterne som **karakterer**, ikke funktioner

### E1. Hver rolle har en stemme, ikke bare et badge
Researcheren skriver tæt, med kilder. Engineer skriver kort og teknisk.
Copywriter skriver rytmisk. Warden skriver knapt og køligt.

Ikke som personlighedsleg — som **læsbarhed**: du kan se, hvem der taler,
før du læser navnet, ligesom du kan høre forskel på to kolleger i et
åbent kontor.

### E2. Den tomme stol
Vis også de roller, Chief **fravalgte**, og hvorfor. En grå, tom node i
canvaset: *"Ingen Researcher — projektet scorede 2 på ukendthed."*

Beslutninger om, hvad man ikke gør, er lige så vigtige som resten, og de
er normalt fuldstændig usynlige.

### E3. Djævelens advokat som fast plads
En agent, hvis eneste opgave er at være uenig. Ikke en QA-rolle
(fravalgt i pkt. 34.2) — en **modstander**, der argumenterer imod hver
plan, før du godkender den. Kører på en billig model, koster nærmest
ingenting, og fanger den klasse af fejl, hvor alle agenter er enige, fordi
de deler antagelser.

### E4. Pre-mortem i stedet for kun post-mortem
Før et projekt starter, skriver en agent: *"Det er tre måneder senere.
Projektet floppede. Skriv hvorfor."* Det tager to minutter og afslører
antagelser, som ingen risikoanalyse fanger, fordi den er formuleret
positivt.

### E5. Agenternes karakterbog
Hver kombination af rolle + model + prompt får en track record: hvor tit
blev arbejdet underkendt, hvad kostede det, hvor lang tid tog det.
Modelvalg (pkt. 3.6) holder op med at være mavefornemmelse og bliver til
data. *"Copywriter kører bedst på Claude; SEO er lige så god på Groq til
en tiendedel."*

### E6. Konfidens som visuel vægt
En agent, der er usikker, skal *se* usikker ud — lettere tekst, tydeligt
markeret som foreløbig. Ikke et procenttal ingen tror på, men en visuel
forskel, du kan skimme. Sikkert arbejde ser fast ud; gætværk ser
provisorisk ud.

---

## F. Tid, hukommelse og eftermæle

### F1. Skrubberen — spol projektet tilbage
Træk i en tidslinje og se hele arbejdsrummet, som det så ud kl. 14.20 i
tirsdags: hvilke noder arbejdede, hvad stod i filerne, hvad havde Chief
lige besluttet. Event-loggen gør det teknisk trivielt. Ingen anden
platform kan afspille sin egen fortid.

### F2. Spøgelset i koden
Hold musen over en hvilken som helst linje kode → se den beslutning, der
skabte den, og samtalen omkring den. Traceability (pkt. 30.4) gjort
sanselig i stedet for som en kommentar, ingen læser.

### F3. Årbogen
Én gang om året skriver platformen sin egen beretning: hvad blev søsat,
hvad blev solgt, hvad døde og hvorfor, hvad blev tjent, hvad blev lært.
**Trykt.** Ét fysisk bind om året.

Det lyder som en spøg for en digital nomade uden fast adresse. Men du
bygger en trust, der skal holde i 1000 år, og digitale formater dør
hurtigere end papir. Der findes ikke ét cloud-format fra 1995, du kan
åbne i dag. Der findes bøger fra 1495, du kan læse.

### F4. Efterfølger-tilstanden
Et dokument, platformen selv vedligeholder: *"Hvis du overtager dette og
ikke ved noget — læs dette først."* Rettet til Kenneth, en fremtidig
medstifter, eller en arving om fyrre år. Opdateres automatisk, når
arkitekturen ændrer sig.

Det er den eneste del af dokumentationen, der er skrevet til nogen, der
*ikke* var med.

---

## G. Vilde skud (sandsynligvis dårlige, men værd at have tænkt)

- **Flådens rådsmøde**: en gang om måneden "mødes" alle platform-agenter i
  én genereret rapport, hvor de er uenige med hinanden foran dig. Finans
  vil skære, Strateg vil investere. Du dømmer.
- **Ét skib, én farve**: hvert projekt får ved søsætning en fast farve og
  et sigil, som følger det overalt — også ud i det færdige produkts badge.
  Efter tyve projekter kan du genkende dem uden at læse navne.
- **Auktionen**: når to projekter kæmper om det samme budget, skal Chief
  for hvert af dem argumentere for pengene. Du vælger. Kapitalallokering
  som en faktisk beslutning frem for først-til-mølle.
- **Sælg et brøkstykke**: i stedet for at sælge et helt projekt, sælg 20 %
  af dets indtjening. Kræver Stripe og en juridisk struktur du allerede er
  ved at bygge (LLC → holding → trust).
- **Værftet som produkt**: den dag et andet menneske vil betale for at få
  bygget noget af din flåde — sælg ikke platformen, sælg *pladsen i køen*.
- **Modstandsdygtighed mod dig selv**: en tilstand, hvor platformen nægter
  at starte nye projekter, indtil de eksisterende er over break-even.
  Beskytter mod den mest sandsynlige fejl, en person med for mange gode
  idéer begår.

---

## H. Hvis jeg kun måtte vælge fem

Efter alt det ovenstående, dette er dem jeg selv ville bygge:

1. **Proveniens som vare (C1)** — den eneste idé her, der kan blive en
   forretningsmodel i sig selv, og den følger gratis af arkitekturen
2. **Flåden nedarver (C2)** — gør platformen bedre af at blive brugt;
   uopnåeligt for enhver konkurrent
3. **Litterær typografi til agent-prosa (B4)** — løser
   to-dages-problemet på en måde, ingen andre har prøvet
4. **Lærlinge-modellen (C4)** — den eneste løsning på
   godkendelsestræthed, der bliver *bedre* med tiden i stedet for bare at
   afveje friktion én gang
5. **Kirkegården + solnedgangs-review (C3 + C5)** — tvinger ærlighed ind
   i et system, der ellers kun måler fremdrift

Og hvis jeg måtte vælge én ting at kaste væk: flåden-som-billede (B5).
Smukt, men det er legetøj, indtil du har mindst ti projekter.

---
*Dette er en idébank, ikke et forslag. Intet heri må bygges eller
besluttes uden at flytte til et rigtigt addendum først, jf. pkt. 24 og
30.1.*
