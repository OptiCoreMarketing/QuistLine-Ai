# QuistLine.ai — Logbog: Gemini SPA-skitse (cto.new-klon)
*Tilføjet: 12. august 2026 — original logbog fra Gemini-sessionen, bevaret
som reference. Se addendum pkt. 15–16 for vurdering af, hvad heraf skal
bruges/fjernes.*

---

## 1. Projektets formål (ifølge Gemini)
At genskabe og strukturere brugergrænsefladen (UI) for cto.new / OTO AI
Business-platformen i én samlet, interaktiv Single Page Application
(`index.html`) ved hjælp af HTML, Tailwind CSS og JavaScript.

**Note:** Dette var bevidst en 1:1 visuel klon af cto.new's UI til
skitsebrug — ikke QuistLine.ai's endelige design. Se addendum pkt. 15 for
hvad der skal renses ud, før dette kan bruges videre.

## 2. Arkitektur & navigation (tre-lags hierarki)
Applikationen skifter layout afhængigt af, om brugeren er på **globalt
niveau** eller inde i et **Business Workspace**.

### A. Hovedside / Global Level (`global-app-layout`)
- **Venstre global sidebar**: navigation mellem platformens overordnede
  sektioner samt opgraderingsmodul og brugerprofil
- **Hovedvisninger:**
  - `#view-launch` — Launch new business: prompt-input til at starte nye
    AI-virksomheder + hurtig adgang til eksisterende
  - `#view-businesses` — Businesses: overblik over alle virksomheder (fx
    GoogleSyn) med status (Paused), seneste aktivitet, knapper til at åbne
    eller sælge
  - `#view-integrations` — Integrations: kobling af eksterne værktøjer
    (GitHub) og MCPs/databaser (Kaspr)

### B. Virksomheds-niveau / Business Workspace (`workspace-app-layout`)
- **Top header & sub-navigation**: viser aktiv virksomhed (GoogleSyn),
  genvej til Home, faner for selve forretningen
- **Faner i workspace:**
  - `#subtab-hq` — Headquarters: kontrolcenter med TODO-liste, seneste
    opgaver, økonomi og annoncer (venstre), Team Canvas/Live Site Preview
    (midten), Chief Lead Chat (højre)
  - `#subtab-tasks` — Tasks: Kanban-board (Backlog, Working, Done)
  - `#subtab-files` — Files: fildirektorie over genererede kildefiler
  - Inbox, Ads, Finance & Settings — reserverede områder, ikke bygget ud

## 3. Implementerede interaktionsfunktioner (JavaScript)
| Funktion | Formål |
|---|---|
| `navigateGlobal(viewName)` | Skifter mellem Launch, Businesses og Integrations uden reload |
| `openBusiness(businessName)` | Skifter fra globalt niveau ind i specifikt Business Headquarters |
| `switchTab(tabId)` | Skifter visning inde i Business Workspace (HQ, Tasks, Files osv.) |
| `toggleMainView(view)` | Skifter HQ-centrum mellem TEAM (org-diagram/live terminal) og SITE (preview af landingsside) |

**Teknisk status:** Al navigation er ren client-side visning/skjul af
divs — ingen af funktionerne kalder backend'en (`src/server.js`). Se
addendum pkt. 15 for det fulde billede af, hvad der reelt virker.

---
*Bevaret ordret som udviklingsreference. Vurdering af hvad der skal
genbruges/fjernes findes i addendum til master spec, ikke i dette
dokument.*
