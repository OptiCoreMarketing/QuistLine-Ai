# QuistLine.ai — Master Spec & Handoff
*Status: PLANLÆGNING — ingen kode bygget endnu. Alt herunder er besluttet,
intet er implementeret.*
*Overført til nyt Claude Team-projekt: 11. august 2026*

---

## 0. Kontekst om ejeren (til ny Claude-instans)
- Stifter/ejer af OptiCore Marketing LLC (New Mexico, disregarded entity) og
  CoreHost. Arbejder med Google Ads, SEO, hjemmesider, hosting, IT-værktøjer
- Har allerede bygget sit eget CRM. Én ansat (Kenneth, telefonisk booking/salg)
- Stack i forvejen: Emergent.sh, GitHub, Vercel, Railway, MongoDB
- Dansk, rejser permanent siden 10. marts 2025, udmeldt af dansk skat/velfærd
- Selskabsstruktur under opbygning: LLC (nu) → Holdingselskab (næste) →
  QuistLine Trust (1000-årig, slutmål). QuistLine.ai er første forretningsben
  under dette navn
- Foretrækker: dokumentation/planlægning FØR kode. Ingen kode må skrives før
  spec er godkendt

## 1. Hvad er QuistLine.ai
En platform der lader ejeren hyre og styre et team af AI-agenter, som bygger
digitale produkter (websites, værktøjer, apps) selvstændigt — og sælger de
færdige produkter videre via en markedsplads.

Struktureret efter forbillede cto.new (Headquarters / Plan / Tasks / Files /
Sell), men under eget navn/branding, med egen kommandostruktur (Chief/Warden
i stedet for direkte kontakt til alle agenter) og egen salgs-infrastruktur.

## 2. De 8 hovedmoduler
1. **Login** — kun Owner, ingen multi-user endnu
2. **Headquarters** (globalt) — opret businesses, overblik på tværs
3. **Business-side** (isoleret pr. projekt) — Plan, Tasks, Files, Live
   preview, GitHub-status
4. **Finance** (globalt, summerer pr. business) — cost/salgspris/fortjeneste
5. **Marketplace** (globalt) — intern først, ekstern bro senere
6. **Foundry** (globalt) — hvor Warden bor, tværgående fejlovervågning
7. **Usage/Budget** (globalt) — forbrug pr. agent/provider
8. **Settings** (globalt) — API-nøgler, branding-standarder, GitHub

**Global vs. isoleret:** Kun Headquarters, Foundry, Finance, Usage,
Marketplace, Settings er fælles på tværs af businesses. Plan/Tasks/Files/
Live preview/GitHub er 100% isolerede pr. business.

## 3. Agent-arkitektur
### 3.1 Faste platform-agenter
| Modul | Agent | Ansvar |
|---|---|---|
| Business/Plan | Strateg-agent | Laver og opdaterer forretningsplaner |
| Tasks/Delegation | **Chief** (lead) | Uddelegerer, godkender, koordinerer |
| Files/mappestruktur | Bibliotekar-agent | Håndhæver struktur, branding, README |
| Finance | Finans-agent | Cost/fortjeneste, flagger urentable projekter |
| Marketplace | Sælger-agent | Klargør/lister projekter til salg |
| Sandkasse | Sandkasse-agent | Provisionerer/rydder op i miljøer |
| Usage/Budget | Efficiency-agent | Overvåger forbrug, spare-anbefalinger |
| Foundry | **Warden** | Tværgående fejl/health-overvågning, always-on |

Projekt-specifikke workers (fx "engineer") oprettes pr. projekt af Chief,
adskilt fra de faste platform-agenter ovenfor.

### 3.2 Drifts-model (forslag, ikke endeligt bekræftet)
- **Always-on**: Warden (skal fange fejl i realtid)
- **On-demand**: Strateg, Finans, Sælger, Sandkasse, Efficiency
- **Event-drevet**: Chief (aktiveres ved task-statusskift)

### 3.3 Kommandostruktur — Chief og Warden som eneste kontaktpunkter
- Owner har **kun** direkte kontakt med Chief og Warden — aldrig med workers
  eller andre platform-agenter direkte
- Chief og Warden er **ligestillede**
- Alle andre agenter henvender sig til Chief, ikke til Owner
- Chief skal spørge om lov før den hyrer en worker eller igangsætter en task
- Anderledes end tidligere JARVIS-arkitektur (hvor Owner talte direkte med
  hver sub-agent) — bevidst strammere model her

### 3.4 Nødstop-beføjelse (kill-switch) — eneste undtagelse til Chief-reglen
Enhver platform-agent kan stoppe et projekt øjeblikkeligt uden godkendelse
ved reelt problematiske forhold (løbsk forbrug, kritiske fejl, sikkerhed).

**Fuldt flow:**
1. Nødstop sker øjeblikkeligt — ingen godkendelse krævet
2. Sagen ruter til Foundry/Warden — ikke direkte til Owner
3. Warden og Chief samarbejder om løsning. Warden har kun adgang til
   agenterne i fællesskab med Chief, aldrig alene
4. Chief formulerer en rette-opgave
5. **Opgaven må IKKE starte før Owner er spurgt og har godkendt** — selv
   akutte reparationer kræver eksplicit godkendelse. Kun selve stoppet er
   øjeblikkeligt; reparationen er det aldrig
6. Fuld rapport og log er obligatorisk hver gang — ingen stiltiende handlinger

### 3.5 Permissions-model pr. agent
Granulær tilladelsesliste pr. agent (inspireret af cto.new): Check team
status / Read task reports / Update business plan / Hire employees / Fire
employees / Delegate work / Issue invoices / Create payment links / Create
products. Styres gennem Chief, ikke direkte af Owner pr. agent.
*(Åbent: gælder listen kun for Chief selv, eller også for agenter Chief hyrer?)*

### 3.6 Model-valg pr. agent
Model-markedsplads-koncept fra cto.new (dropdown, sorteret smartest/
billigst, skift med kontekst-opsummering) — men uden tier-lås, da det er
Owners egen API-nøgle. Frit valg mellem Claude/Groq/Gemini m.fl.

**Model-strategi:**
- Claude API: tunge/kritiske opgaver (kode, strategi, kundetekst)
- Groq (gratis tier): hurtige rutineopgaver, klassificering
- Gemini (gratis tier): store kontekst-opgaver, research
- Router-lag normaliserer tool-use på tværs af providers

## 4. Mappestruktur — hård regel for alle agent-byggerier
```
/{projekt-navn}
  /branding          ← ALTID til stede (se punkt 5)
  /memory            ← context.md, decisions.md, glossary.md
  /docs              ← README.md, ARCHITECTURE.md, CHANGELOG.md
  /reports           ← én fil pr. afsluttet task, tidsstemplet
  /src               ← selve koden
  /tests             ← testsuite
```
Ingen filer løst i projektroden ud over det der reelt hører hjemme der.

**"Læs før du bygger"-regel:** Før en agent starter på et eksisterende
projekt, skal den obligatorisk læse (i rækkefølge): README → memory/context
+ decisions → seneste CHANGELOG-indgange → seneste relevante rapport(er).
Kun ved helt nyt/tomt projekt springes dette over.

**Håndhævelse:** Ikke kun i systemprompt — task-loopet tvinger disse
læsninger som de allerførste tool-kald, før write/run-tools låses op.
Bibliotekar-agenten er vogter af reglen.

## 5. Branding-krav
- `/branding`-mappe obligatorisk i ethvert bygget projekt
- Lille visuel badge nederst i venstre hjørne af frontend, viser **kun**
  "QuistLine.ai" — projektet designes IKKE efter QuistLine.ai's eget
  designsprog i øvrigt
- Navngivningskonvention: **{Projektnavn} · QuistLine.ai**

## 6. Sandbox ↔ Files-arkitektur
- Sandbox er ikke en selvstændig side — arbejdslag bag Files-siden
- Business oprettes → sandkasse starter automatisk, én isoleret sandkasse
  pr. projekt (ikke delt pulje)
- Live preview: offentligt subdomain (fx projektnavn.quistline.app, HTTPS)
  — virker fra enhver enhed uden lokal opsætning, modsat localhost/git bash
- Files-siden viser KUN den godkendte/officielle version (kanonisk sandhed)
- Godkendt opgave → ændringer flyttes sandkasse → Files, erstatter gamle filer
- Nedlæggelse: Owner → Chief → Sandkasse-agent, når projekt solgt/dødt

**Files-side, optimeret struktur:**
1. Struktur-status øverst (✓/✗ pr. påkrævet mappe), håndhævet af Bibliotekar
2. Genveje: README, seneste CHANGELOG, seneste rapport
3. Fil-browser (src/tests foldet sammen, reports/docs/memory foldet ud)
4. GitHub-sync-status-badge pr. fil
5. Read-only for Owner — redigering kun gennem agenter

## 7. Deploy-pipeline (CI/CD med Chief som mellemled)
1. Owner beder Chief om opdatering
2. Chief uddelegerer til projektets engineer i sandkassen
3. Engineer bygger + kører 3 test-niveauer, retry-loft 3 pr. niveau:
   - Build-test (compilerer uden fejl)
   - Funktionel test (virker det den skal, inkl. regression af eksisterende)
   - Selv-review (agent scanner egen diff for uforklarlige fjernelser)
4. Bestået → struktureret rapport til Chief
5. Chief vurderer reel færdiggørelse
6. Chief spørger Owner: "Færdig — godkender du?"
7. Ved godkendelse — SEPARAT spørgsmål: "Deploye til GitHub?"
8. Ja → push. Nej → bliver i sandkassen til justering
*(Færdig ≠ deploy er bevidst adskilt)*

## 8. Beskyttelse mod utilsigtet kodetab
Fire lag:
1. Git som ubrydeligt sikkerhedsnet — hver promovering er et commit,
   version-historik pr. fil i Files-siden
2. Målrettede søg-og-erstat-ændringer, ikke fuld fil-omskrivning
3. Diff-scanning i selv-review (test-niveau 3) — flager unormale fjernelser
4. Regression-test som fast del af test-niveau 2

## 9. Rapportering & dokumentation
- Hver task afsluttes med struktureret rapport: status (fuldt færdig/
  delvist/blokeret), metode, resultat, anbefaling
- Alle rapporter samlet læsbare i én global log/backlog-visning
- Warden bruger denne rapport-strøm som primær datakilde

## 10. Finance-modul
- Omkostningssporing pr. API-kald (provider/model/tokens/kr), aggregeret
  pr. agent og pr. projekt, plus infrastruktur-estimat
- Tredjeparts-gebyrer (Stripe m.fl.) trukket automatisk fra salgspris
- Fortjeneste = Salgspris − AI-cost − Infra-cost − Gebyrer
- Visninger: projekt-oversigt, agent-rentabilitet, global P&L,
  break-even-indikator pr. projekt

## 11. Usage/Budget-modul
- Forbrug logges pr. agent, pr. provider, pr. model
- Gratis-tier vs. betalt vist separat
- Efficiency-agent (fremtidig) foreslår besparelser uden kvalitetstab
- Deler datastruktur med Finance (agent_id, provider, model, tokens,
  gratis/betalt-flag, tidsstempel)

## 12. Marketplace
- Ingen oplagt ekstern markedsplads for "færdigbyggede AI-produkter" fundet
  endnu — cto.news "Sell this business" er nærmeste forbillede
- Fase 1: intern markedsplads, Stripe Connect, prismodel pr. projekt
- Fase 2 (senere): ekstern distribution / evt. egen sælger-agent til
  eksterne platforme

## 13. Reference — fuldt katalog fra cto.new (inspirationskilde, ikke facit)
**Navigation:** Headquarters/Plan/Tasks/Files/Finance/Inbox, Team-dropdown
(Team/Tasks/Site m. live-indikator)

**Agent-styring:** Team-liste (navn/rolle/model/status), Pause/Resume,
Fire-knap, permissions-checkliste, model-picker (Smartest/Cheapest-sortering)

**Plan:** Latest plan + "I've read this plan"-godkendelse, versioneret historik

**Tasks:** Backlog(DRAFT)/Working/Done, varighed vist, "Read report"-link,
Delegate-popup med Reject/Approve

**Files:** Simpel mappe/fil-browser med størrelse/tidsstempel

**Finance/Usage:** Daily/Weekly usage-bar med farveskift, "hit your daily
limit"-banner, Upgrade-modal med tier/model-sammenligning

**Marketplace:** "Sell this business" — Stripe Connect + landevalg

## 14. Åbne, uafklarede beslutninger
1. Foundry: skal den vise historik af tidligere nødstop, eller kun aktive sager?
2. Hyrer Chief også de faste platform-agenter, eller er de født ind
   permanent — kun projekt-workers kræver godkendelse?
3. Always-on vs. on-demand (3.2) — forslag afventer bekræftelse
4. Marketplace-detaljer — prismodel, kvalitetskontrol, hvem må købe
5. Login — metode (email/OAuth), session-varighed, 2FA
6. Permissions-checklisten (3.5) — gælder kun Chief selv, eller nedad til
   agenter Chief hyrer?
7. Data-arkitektur — hvordan mappekrav mappes til eksisterende Postgres/
   MongoDB/Railway-stack (teknisk, udskudt til efter spec er færdigt)

---
*Intet er bygget. Dette dokument er den fulde overførsel af beslutninger
truffet før skift til nyt Claude Team-projekt. Fortsæt planlægningen fra
punkt 14.*
