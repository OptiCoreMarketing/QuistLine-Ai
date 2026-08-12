# QuistLine.ai — Addendum: Tre beslutninger (database, vagtpost-tærskler, tillidstærskler)

*Tilføjet: 12. august 2026*
*Status: **BESLUTTET** af Owner 12. august 2026.*
*Tags: `#beslutning #datamodel #foundry #trust #vagtpost`*

*Lukker åbent spørgsmål 13, 16 og 20. Alle tre var blokerende for
byggerækkefølgens trin 1, 2 og 4 (pkt. 70).*

---

## 83. Beslutning: Postgres bliver system of record (lukker åbent punkt 13)

**Besluttet:** Postgres er platformens primære database. MongoDB udfases
som system of record.

### 83.1 Hvad forskellen er, i klar tale
- **MongoDB** gemmer hver post som et selvstændigt dokument, nærmest en
  JSON-fil pr. record. Stærk når poster står alene og må have forskellig
  struktur.
- **Postgres** gemmer i tabeller med faste kolonner og forstår
  *sammenhængen* mellem dem. Stærk når alt hænger sammen.

De to er begge fuldt brugbare databaser. Valget her handler om, hvilken
type der passer til netop denne platform.

### 83.2 Begrundelse
1. **Alt i platformen er relationelt.** task hører til business, event
   hører til task, cost hører til event, godkendelse blokerer task. Det er
   præcis det, en relationel database er bygget til
2. **Finance (pkt. 10) er ren talaggregering.** "Hvad kostede projekt 3,
   fordelt på agent og model?" er ét SQL-kald. I MongoDB bliver det en
   aggregeringspipeline, der bliver tungere, efterhånden som event-loggen
   vokser
3. **Regler kan håndhæves i databasen, ikke kun i koden.** Fx: en task kan
   ikke sættes til DONE uden tilknyttet rapport. Det matcher hele
   gate-filosofien i pkt. 41.3 — reglen er en tilstand, ikke en
   instruktion nogen skal huske
4. **Hash-kæden (pkt. 66.1) kræver streng rækkefølge og transaktioner.**
   Postgres garanterer begge dele indbygget. Uden det kan kæden få huller,
   og så mister den sin beviskraft
5. **Den kører allerede** på Railway. Ingen ny leverandør, ingen ny udgift

### 83.3 Ærligt modargument (jf. pkt. 25)
MongoDB ville også kunne bære platformen. Det er ikke et spørgsmål om,
at Mongo er dårlig — det er, at denne app er usædvanligt relationel.
Prisen ved Postgres er, at skemaændringer kræver migrationer, hvilket er
mere disciplin end Mongo kræver. Det vurderes acceptabelt, fordi
migrationer samtidig giver den versionsstyring af datamodellen, som gate B
(pkt. 75) allerede kræver.

### 83.4 Hvorfor det skal besluttes nu
Der findes endnu ingen rigtige data. Skiftet koster i dag stort set
ingenting. Om et år, med hundredvis af tasks og en etableret hash-kæde,
er det en stor og risikabel operation. Dette er selve definitionen af en
beslutning mærket *strukturel/dyr at ændre* (pkt. 30.9).

### 83.5 Konsekvenser
- Repoets nuværende Mongoose-opsætning i `src/server.js` udgår ved trin 1
- MongoDB kan beholdes til ustrukturerede artefakter, eller udfases helt.
  **Anbefaling:** udfas helt — to databaser er to ting at holde ved lige
- `vercel.json`s routing af alt til `src/server.js` udgår ved trin 2
  sammen med serverless-modellen (pkt. 41.1)
- **Ændrer intet ved hosting.** Vercel = frontend, Railway = database +
  orchestrator

---

## 84. Beslutning: Vagtpostens tærskelværdier (lukker åbent punkt 16)

**Besluttet:** følgende startværdier for lag 1 (pkt. 60.1). De er
*startværdier*, ikke endelige — de justeres efter falsk-alarm-statistikken
(pkt. 62) og kun af Owner (pkt. 59.6).

| Værn | Tærskel | Handling | Begrundelse |
|---|---|---|---|
| **Masse-sletning** | >50 fjernede linjer i én fil, eller >150 i én task | Stop, kræv menneskeligt blik | Målrettede ændringer (pkt. 8) rammer sjældent over 50 linjer |
| **Filsletning** | Enhver sletning af en hel fil | Stop — rød klasse (pkt. 56.1) | Sletning er irreversibel, uanset omfang |
| **Løkke-værn** | 3 identiske tool-kald i træk (samme tool, samme argumenter) | Stop, markér som løkke | Retry-loftet er allerede 3 (pkt. 7); det tredje identiske kald er mistænkeligt |
| **Budget-værn** | 2× tørkørslens estimat (pkt. 58.3). Uden estimat: 25 kr pr. task | Stop, bed om nyt loft | Relativt loft er bedre end absolut — en stor opgave må koste mere, bare ikke det dobbelte af det lovede |
| **Timeout-værn** | 2× estimeret varighed. Absolut loft: 45 min uden tilstandsskift | Stop, markér som hængende | Fanger agenter der står stille uden at fejle |
| **Sti-værn** | Skrivning uden for projektets tilladte mapper | Blokér altid | Ingen acceptabel mængde |
| **Hemmeligheds-scanner** | Ethvert match på nøglemønster på vej i fil/commit | Blokér altid | Ingen acceptabel mængde |
| **Kontraktvalidering** | Output matcher ikke påkrævet skema | Afvis altid | Ingen acceptabel mængde |

De tre nederste har bevidst **ingen tærskel** — der findes ikke en
acceptabel mængde lækkede API-nøgler eller skrivninger uden for
projektmappen.

**Revision:** tærsklerne gennemgås ved hvert spec-sundhedstjek (pkt. 30.5)
mod deres udløsningsstatistik. En regel med høj falsk-alarm-rate er ikke
et bevis på, at reglen er unødvendig — det er lige så ofte et bevis på, at
tærsklen er sat forkert.

---

## 85. Beslutning: Tillidstærskler i lærlinge-modellen (lukker åbent punkt 20)

**Besluttet:** følgende tærskler for `agent_trust`-niveauer (pkt. 66.3).

### 85.1 Forfremmelse
| Skift | Krav |
|---|---|
| `under opsyn` → `betroet` | **10 rene opgaver i træk** *og* mindst **3 forskellige opgavetyper** |
| `betroet` → `selvkørende` | Yderligere **25 rene opgaver** *og* mindst **90 % beståelse i modstander-review** (testniveau 4, pkt. 76) |

**"Ren opgave" defineres som:** nul guard-overtrædelser, nul underkendte
rapporter, ingen budgetoverskridelse, ingen falsk færdigmelding.

**Kravet om 3 forskellige opgavetyper er bevidst.** Uden det kunne ti
identiske trivielle opgaver give autonomi, som først bruges på noget helt
andet og sværere.

### 85.2 Degradering
- **Enhver Foundry-sag** hvor rollen er årsag: ét niveau ned, øjeblikkeligt
- **To guard-overtrædelser inden for 10 opgaver:** ét niveau ned
- **Gen-forfremmelse koster dobbelt:** 20 rene opgaver i stedet for 10.
  Ellers kan en agent svinge frem og tilbage over samme grænse uden reelt
  at være blevet mere pålidelig

### 85.3 Nulstilling ved ændringer
Tillid er knyttet til kombinationen **rolle + model + charter-version**
(pkt. 66.3):
- **Modelskift:** tillid nulstilles til `under opsyn`. En ny model er en
  ny medarbejder
- **Charter-ændring:** ét niveau ned, ikke nulstilling. Ellers tør ingen
  nogensinde rette en prompt

### 85.4 Det ufravigelige loft (gentaget, fordi det er vigtigst)
Tillidsniveau kan **kun** flytte handlinger mellem **grøn** og **gul**
klasse (pkt. 56.1).

**Rød klasse auto-godkendes aldrig — uanset niveau, uanset track record,
uanset hvor længe noget har virket.** Deploy, betaling, salg og sletning
kræver Owner, hver gang, for evigt.

---

## 86. Status efter disse beslutninger

**Blokeringer fjernet:**
- Trin 1 (datamodel) kan påbegyndes — databasevalget er truffet
- Trin 2 (Vagtposten) kan påbegyndes — tærskler findes
- Trin 4 (godkendelses-gates + trust) kan påbegyndes — tærskler findes

**Stadig åbne, men ikke blokerende for trin 0–5:** #2, #3, #4, #5, #9,
#11, #12, #17, #18, #19, #21 (se `INDEX.md`).

**Næste handling:** trin 0 — rens repoet for cto.new-branding
(acceptkriterier i pkt. 82).

---
*Vedtaget af Owner. Lukker åbne punkter 13, 16 og 20. Udvider pkt. 41.2
(database), 60.1 (vagtpost) og 66.3 (trust) — erstatter ikke disse, men
fastsætter de konkrete værdier, de manglede.*
