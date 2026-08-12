# QuistLine.ai — Addendum: Claude API som model-provider (side om side med Groq)

*Tilføjet: 12. august 2026*
*Kontekst: Groq API-nøgle er sat op i Vercel. Ønske: samme opsætning for
Claude API, med fritvalg mellem alle Claude-modeller — ligesom Groq's
model-dropdown i den nuværende `/api/agent`-kode.*

---

## 17. Nuværende tilstand (Groq)

I `src/server.js` er der i dag **ét** hardcoded model-navn som fallback
(`llama-3.3-70b-versatile`), valgt via `req.body.model`. Der er ingen
dynamisk liste af tilgængelige Groq-modeller i UI'en — dropdownen i
frontend-skitsen viser stadig cto.new's eget modelkatalog ("DeepSeek V4
Flash"), ikke en reel Groq-modelliste (jf. addendum pkt. 15, punkt 4).

## 18. Beslutning: Claude API tilføjes som sideordnet provider

**Princip (jf. spec pkt. 3.6):** Router-lag normaliserer tool-use på tværs
af providers. Groq og Claude skal kunne vælges pr. agent, ikke være
hardcoded til én provider.

### 18.1 Vercel-opsætning
Samme mønster som Groq — tilføj som miljøvariabel i Vercel (Project
Settings → Environment Variables):
```
ANTHROPIC_API_KEY=sk-ant-...
```
Nøglen oprettes på console.anthropic.com (kræver betalingskort tilknyttet —
Claude API er ikke gratis-tier som Groq/Gemini, jf. spec pkt. 3.6's
model-strategi).

### 18.2 SDK
```bash
npm install @anthropic-ai/sdk
```
```javascript
import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
```

### 18.3 Hvordan du får "vælg mellem alle modellerne" ligesom Groq

To muligheder — anbefaler A, fordi den ikke kræver manuel opdatering hver
gang Anthropic udgiver en ny model:

**A) Dynamisk liste via API (anbefalet)**
Anthropic API har et `/v1/models`-endpoint, som lister alle modeller der
er tilgængelige for din API-nøgle, med `id` og `display_name`. Dette kan
kaldes én gang server-side (evt. cachet et par timer) og sendes til
frontend som JSON — akkurat samme princip som du skal bruge for Groq's
modelliste, hvis du vil have en reelt dynamisk dropdown i stedet for
cto.new's fake liste.
```javascript
app.get("/api/models/claude", async (req, res) => {
  try {
    const models = await anthropic.models.list();
    res.json(models.data); // [{ id, display_name, ... }, ...]
  } catch (err) {
    res.status(500).json({ error: "Kunne ikke hente Claude-modeller" });
  }
});
```
Frontend-dropdownen bygges så af det, API'et faktisk returnerer — ingen
hardcodede modelnavne i UI-koden.

**B) Statisk liste (simplere, men skal opdateres manuelt)**
Pr. 12. august 2026 er de aktuelle modelfamilier (til reference — kan være
forældet, tjek altid docs.claude.com for den nyeste liste før
implementering):
- `claude-opus-4-8` — tungeste/dyreste, til komplekse opgaver
- `claude-sonnet-5` — balanceret, sandsynligvis standardvalg til kode/tekst
- `claude-haiku-4-5-20251001` — hurtig/billig, til rutineopgaver
- `claude-fable-5` — Mythos-tier (over Opus), særskilt adgang/pris

**Vigtigt forbehold:** Modelnavne, priser og hvilke modeller der er
tilgængelige for din nøgle ændrer sig løbende. Løsning A (dynamisk liste)
undgår at spec/kode bliver forældet — anbefales stærkt over B.

### 18.4 Routing i `/api/agent`
Udvid den eksisterende endpoint til at vælge provider baseret på
model-navnets prefix eller et separat `provider`-felt fra frontend:
```javascript
const isClaudeModel = selectedModel.startsWith("claude-");

if (isClaudeModel) {
  const completion = await anthropic.messages.create({
    model: selectedModel,
    max_tokens: 1024,
    system: CHIEF_PROMPT,
    messages: [{ role: "user", content: prompt }]
  });
  reply = completion.content[0]?.text;
} else {
  // eksisterende Groq-kald
}
```
Dette er kun en skitse til senere implementering — jf. spec pkt. 0 skrives
ingen produktionskode før spec/beslutning er godkendt af Owner.

### 18.5 Model-strategi (uændret fra spec 3.6, bekræftet)
- **Claude API**: tunge/kritiske opgaver (kode, strategi, kundetekst) —
  koster penge pr. token, brug bevidst
- **Groq (gratis tier)**: hurtige rutineopgaver, klassificering
- **Gemini (gratis tier)**: store kontekst-opgaver, research

## 19. Nyt åbent punkt (tilføjes til spec pkt. 14)
9. Skal model-dropdownen bygges som dynamisk liste (18.3-A) fra start, eller
   er en simpel statisk liste nok til v1? Dynamisk kræver mere kode nu,
   men sparer fremtidig vedligeholdelse hver gang Anthropic/Groq ændrer
   modelkatalog.

---
*Tilføjet til projektets vidensbase. Kræver Owner-godkendelse før
implementering, jf. spec pkt. 0.*
