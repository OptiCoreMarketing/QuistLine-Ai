# QuistLine.ai — Addendum: Agent-arkitektur uddybet (Chief, platform-agenter, projekt-workers)

*Tilføjet: 12. august 2026*
*Kontekst: Udvider spec pkt. 3 (agent-arkitektur). Formålet er at gøre
hver agents ansvar, triggere og grænser konkrete nok til at kunne bygges
efter — ikke kun navngivet. Forslag markeret som sådan kræver
Owner-godkendelse, jf. addendum pkt. 24–25.*

---

## 32. Chief — uddybet rolle

### 32.1 Kerneansvar (udvidet fra pkt. 3.1/3.3)
Chief er **ikke** en generel assistent — Chief er et koordinationslag.
Konkret betyder det:
- Tager Owners forespørgsel og oversætter den til én eller flere tasks
- Vurderer om en eksisterende platform-agent kan løse opgaven, eller om
  der skal hyres en projekt-worker (jf. pkt. 34)
- Håndhæver "læs før du bygger"-reglen (pkt. 4) — ikke selv, men som
  gatekeeper der bekræfter Bibliotekarens godkendelse før en worker sættes
  i gang
- Håndhæver tool-godkendelses-gaten (addendum pkt. 26) før en task
  igangsættes
- Samler workers/agenters rapporter til én forståelig status til Owner —
  Owner skal aldrig selv skulle stykke flere rå rapporter sammen
- Eneste indgang (sammen med Warden) for øvrige agenter — ingen anden
  agent taler direkte til Owner

### 32.2 Fast flow ved en ny opgave
1. Owner beder Chief om noget (frit sprog, ikke struktureret formular)
2. Chief stiller evt. opklarende spørgsmål, angiver derefter (jf. pkt. 25):
   antagelser, alternativer overvejet, risici
3. Chief identificerer tool-behov (pkt. 26) — godkendes separat hvis nyt
4. Chief spørger Owner om lov til at hyre/uddelegere (pkt. 3.3)
5. Ved godkendelse: worker/agent arbejder i sandkassen, Chief overvåger
6. Worker rapporterer til Chief (aldrig til Owner)
7. Chief vurderer reel færdiggørelse, spørger Owner: "Færdig — godkender
   du?" og separat "Deploye?" (pkt. 7)

### 32.3 Grænser — hvad Chief ikke gør
- Bygger ikke selv kode — det er altid en workers opgave
- Handler ikke ved nødstop uden Warden (pkt. 3.4) — Chief er ligestillet
  med Warden, ikke overordnet
- Deployer aldrig uden et separat, eksplicit "ja" (pkt. 7)

### 32.4 Forhold til Warden
Ligestillet, ikke hierarkisk. Ved kill-switch: sagen ruter til
Foundry/Warden, Chief og Warden samarbejder om løsningsforslag, men
reparation kræver stadig Owners godkendelse (pkt. 3.4, uændret).

---

## 33. De faste platform-agenter — uddybet modul for modul

| Agent | Trigger | Typisk input | Typisk output | Autonominiveau | Rapporterer til |
|---|---|---|---|---|---|
| **Strateg** (Plan) | Ny business oprettet, eller Owner ber om plan-opdatering | Owners fritekst-idé, eksisterende plan-historik | Versioneret forretningsplan | Forslår, bygger ikke selv | Chief |
| **Bibliotekar** (Files) | Enhver worker-handling der læser/skriver filer | Projektets mappestruktur, rapport-skabelon | Godkendt/afvist adgang, struktur-status | Håndhæver, blokerer ved brud — høj autonomi inden for egen snævre opgave | Chief |
| **Finans** (Finance) | Task markeret DONE, eller periodisk | Cost pr. API-kald, salgspris | Aggregeret P&L, rentabilitetsflag | Observerende/rådgivende, ingen handling uden Owner | Chief |
| **Sælger** (Marketplace) | Owner beslutter at sælge et projekt | Projektstatus, Finans-data | Marketplace-listing, Stripe Connect-flow | Forbereder, sælger ikke uden Owners endelige "ja" | Chief |
| **Sandkasse** (Sandbox) | Business oprettet / projekt nedlagt | Projekt-ID | Provisioneret/nedlagt isoleret miljø | Fuld autonomi inden for teknisk provisionering | Chief |
| **Efficiency** (Usage/Budget) | Periodisk, eller ved høj forbrugsrate | Usage-log pr. agent/provider/model | Besparelsesforslag | Rådgivende kun | Chief |
| **Warden** (Foundry) | Always-on | Rapport-strøm (pkt. 9), fejl-signaler | Kill-switch, fejlrapport | Eneste agent med selvstændig nødstop-ret (pkt. 3.4) | Owner + Chief i fællesskab |

**Vigtig pointe:** Ingen af disse agenter bygger kildekode. De styrer,
overvåger, rådgiver eller håndhæver regler omkring det, projekt-workers
bygger (pkt. 34). Det er en bevidst adskillelse — platform-agenterne er
*platformens* infrastruktur, ikke *projektets* arbejdskraft.

---

## 34. Projekt-workers — agenterne Chief hyrer til at bygge dine businesses

### 34.1 Forskel fra platform-agenterne
- **Platform-agenter**: permanente, én instans pr. platform, findes uanset
  hvor mange businesses du har
- **Projekt-workers**: ephemere, oprettes pr. business/task, findes kun så
  længe der er arbejde at gøre på det specifikke projekt

### 34.2 Foreslået rolle-katalog (kræver Owner-godkendelse)
Spec'en nævner i dag kun **Engineer** eksplicit (jf. glossary). Forslag
til et lille, styret katalog i stedet for at Chief frit opfinder roller:
- **Engineer** — koden selv, kører de 3 test-niveauer (pkt. 7)
- **Designer** — visuelt layout inden for branding-kravene (pkt. 5) —
  *overvejet alternativ:* lade Engineer selv stå for dette uden egen rolle;
  fravalgt fordi visuel kvalitet (jf. chat-læsbarhedsaddendum) fortjener
  dedikeret fokus, ikke en bibeskæftigelse for Engineer
- **Copywriter** — marketing-/salgstekst til det færdige produkt
- **Researcher** — markedsdata/konkurrentanalyse, oplagt Gemini-brug
  (store kontekst-opgaver, jf. pkt. 3.6)
- *Fravalgt som egen rolle:* separat QA/Tester — Engineers eget
  test-niveau 2 (funktionel test + regression, pkt. 7) dækker dette;
  en ekstra rolle vurderes at tilføje hiring-overhead uden reel gevinst

### 34.3 Livscyklus
1. Chief identificerer behov for en rolle fra kataloget (34.2)
2. Chief spørger Owner om lov (pkt. 3.3) — navngiver rolle + formål
3. Worker arbejder **kun** i projektets sandkasse (pkt. 6), aldrig direkte
   på Files
4. Worker rapporterer **kun** til Chief (pkt. 3.3)
5. Worker "fyres"/frigives når: task er DONE, projektet pauses, eller
   projektet sælges/nedlægges (Sandkasse-agent rydder op, pkt. 6)

### 34.4 Permissions — forslag til svar på åbent spørgsmål 14.6
- **Platform-agenter**: brede, stående tilladelser matchet til deres faste
  modul-ansvar (fx Finans har stående læseadgang til cost-data)
- **Projekt-workers**: narrow, opgave-specifikke tilladelser, gen-evalueret
  ved *hver* hiring — en Engineer hyret til opgave A får ikke automatisk
  samme tilladelser til opgave B, selv i samme projekt

### 34.5 Tool-adgang for projekt-workers
Kobler direkte til tool-godkendelses-gaten (addendum pkt. 26): en workers
tool-adgang er **aldrig** underforstået af, at platformen globalt har
forbindelsen (fx GitHub) — Chief skal stadig eksplicit bekræfte pr. hiring
hvilke tools denne specifikke worker får adgang til.

---

## 35. Forslag til at lukke to åbne spørgsmål (kræver Owner-bekræftelse)

**Pkt. 14.2** ("Hyrer Chief også de faste platform-agenter?"): Forslås
lukket med **nej** — platform-agenterne er født permanent (heraf navnet
"faste"), kun projekt-workers (pkt. 34) kræver hiring-godkendelse fra
Owner via Chief.

**Pkt. 14.6** (permissions-listens omfang): Forslås lukket med modellen i
pkt. 34.4 — differentieret efter agent-type, ikke én fælles liste.

Begge forslag er markeret *forslag*, ikke besluttet — kræver dit
eksplicitte "ja" for at flytte fra åbent spørgsmål til besluttet, jf.
addendum pkt. 24's tjekliste.

## 36. Nyt åbent punkt (tilføjes til spec pkt. 14)

11. Skal projekt-worker-rollerne (pkt. 34.2) være en **lukket liste** Chief
    vælger fra, eller kan Chief **frit definere nye rolletyper** efter
    behov (fx en "SEO-agent" til ét specifikt projekt)? Fri definition
    giver flexibilitet, men gør permissions-modellen (34.4) sværere at
    holde konsistent og sværere at dokumentere pr. rolle.

---
*Tilføjet til projektets vidensbase. Udvider spec pkt. 3 (agent-
arkitektur) — erstatter ikke denne, men konkretiserer roller, triggere og
grænser pr. agent.*
