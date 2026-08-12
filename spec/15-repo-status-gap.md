# QuistLine.ai — Addendum til Master Spec
*Tilføjet: 12. august 2026 — efter gennemgang af repo OptiCoreMarketing/QuistLine-Ai*

---

## 15. Rettelse af repo-status (erstatter "ingen kode bygget endnu")

Repoet indeholder allerede filer fra en Gemini-session (11. august 2026).
**Vigtigt at forstå formålet:** det var en ren visuel skitse for at se
layoutet — en direkte klon af cto.new's faktiske UI, ikke et forsøg på at
bygge QuistLine.ai's rigtige produkt. Meget lidt af det er reelt
funktionelt.

### Hvad er der, konkret
- **Mappestruktur**: følger allerede spec'ens hårde regel (branding/memory/
  docs/reports/src/tests) — denne del kan bevares
- **Backend** (`src/server.js`): Express + Groq SDK + Mongoose.
  `GET /api/tasks` og `POST /api/agent` (Chief-prompt, evt. Engineer-prompt
  hvis `hireWorker: true`). Fungerer isoleret, men er **ikke forbundet til
  frontend'en** — ingen af knapperne i UI'en kalder faktisk disse endpoints
- **Frontend** (`src/public/index.html`): statisk HTML/Tailwind-klon af
  cto.new. Ingen reel interaktivitet udover faneskift (JS toggler kun
  hidden/visible på divs)

### Skal fjernes/rettes før noget bygges videre på dette
1. **cto.new-branding** — logo/tekst "cto", "AI BUSINESS", domænetekst
   `ctonew.app`, "Discord"-knap — alt sammen cto.new's eget brand, intet af
   det hører til QuistLine.ai
2. **Tier-lock-mønster** — 🔒 på Inbox/Ads/Finance + "FREE"-badge +
   "Upgrade"-boks er cto.new's forretningsmodel. QuistLine.ai har ingen
   besluttet tier-model (jf. spec pkt. 14, åbent punkt) — skal ikke
   overtages ukritisk
3. **Sponsoreret indhold** — "SPONSORED Similarweb", "SPONSORED Kaspr" —
   hører til cto.new's indtægtsmodel, irrelevant for QuistLine.ai
4. **Model-dropdown** viser cto.new's eget modelkatalog ("DeepSeek V4 Flash
   0731") — skal være Claude/Groq/Gemini jf. punkt 3.6
5. **Badge-krav fra punkt 5** (badge nederst venstre med kun "QuistLine.ai")
   er ikke implementeret endnu — nuværende badge-fil (`branding/badge.json`)
   er sat op korrekt i data, men aldrig renderet i UI'en

### Hvad kan genbruges
- Split-screen-idéen (Chief-chat i højre panel, canvas i midten) er et
  brugbart udgangspunkt til layout — bare uden cto.new's konkrete brand og
  lock-ikoner
- Mappestruktur, `.env.example`, `package.json`-setup

**Konklusion:** Ingen reel funktionalitet bygget endnu i praksis — kun et
visuelt referencelag der skal renses og re-brandes, ikke udbygges direkte.
Spec-status forbliver **PLANLÆGNING**.

---

## 16. Gap-analyse: cto.new's faktiske UI-mønstre vs. QuistLine.ai's 8 moduler

| cto.new-mønster (set i klonen) | QuistLine.ai spec-status | Gap |
|---|---|---|
| Launch-side m. fritekst-prompt → auto-opretter business | Headquarters (modul 2) beskriver "opret businesses" men ikke UX-flow | Skal besluttes: fritekst-prompt eller struktureret formular? |
| Team-canvas: lead+worker som noder, model-dropdown pr. node | Matcher 3.6 (model-valg pr. agent), men UI-form ikke besluttet | Kan genbruges konceptuelt, uden cto.new's modelliste |
| Freemium-lock (Inbox/Ads/Finance bag 🔒) | Ingen tier-model besluttet (pkt. 14.4 delvist) | Åbent — skal du overhovedet have gratis/betalt-lag, eller er det kun dig som bruger? |
| "Sell this business"-knap | Marketplace (modul 5), Sælger-agent | Findes i spec, men UI-flow (Stripe Connect) ikke detaljeret |
| Pause/Resume af hele business ved usage-limit | Usage/Budget (modul 7), Efficiency-agent | Spec nævner ikke automatisk pause ved overforbrug — værd at overveje som hård grænse |
| Live terminal-log i canvas | Rapportering (punkt 9) | Din spec har rapporter pr. task, ikke løbende terminal-feed — bevidst valg eller mangler? |
| SITE-toggle (live preview i samme vindue) | Punkt 6 (Sandbox↔Files, offentligt subdomain) | Matcher godt — men cto.new viser preview inline, ikke som separat side |
| GitHub-connect under Integrations (globalt) | Settings (modul 8) nævner GitHub, men ikke som separat "Integrations"-fane | Overvej om Integrations skal være sit eget modul frem for en undersektion af Settings |

**Vigtigste konklusion:** cto.new's struktur bekræfter grundformen i din
spec relativt godt (Team/Tasks/Files/Finance-opdelingen holder), men deres
UI er bygget til at drive *dem selv* som forretning (upsell, sponsorater,
tier-lock). Intet af det skal med over i QuistLine.ai uden en selvstændig
beslutning om, at du faktisk vil have det (fx hvis QuistLine.ai en dag skal
sælges som SaaS til andre end dig selv — men det er ikke nuværende plan).

---
*Tilføjet til projektets vidensbase. Oprindeligt handoff-dokument
(punkt 0–14) forbliver gældende, bortset fra statuslinjen om "ingen kode
bygget endnu", som denne addendum korrigerer.*
