import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import Groq from "groq-sdk";
import { pool, isDatabaseConfigured } from "./db.js";
import { appendEvent, getEventsForBusiness, verifyChain } from "./eventLog.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- Stopgap-auth (IKKE login-systemet fra spec åbent punkt #5, som stadig
// er ubesluttet). Formål: forhindre at en tilfældig tredjepart, der finder
// URL'en, kan trigge betalte Groq-kald på din nøgle. Erstattes af en rigtig
// godkendelses-model, når trin 4 (godkendelses-gates) bygges. ---
function requireOwnerKey(req, res, next) {
  const configuredKey = process.env.OWNER_API_KEY;
  if (!configuredKey) {
    console.warn("ADVARSEL: OWNER_API_KEY er ikke sat i miljøvariabler — dette endpoint er UBESKYTTET.");
    return next();
  }
  const providedKey = req.header("x-owner-key");
  if (providedKey !== configuredKey) {
    return res.status(401).json({ error: "Ugyldig eller manglende x-owner-key header." });
  }
  next();
}

// --- Simpel rate limiting (stopgap). In-memory pr. IP, nulstilles hvert
// minut. NB: i et serverless-miljø med flere samtidige instanser er dette
// IKKE en garanteret korrekt grænse (hukommelsen deles ikke nødvendigvis
// mellem invocations) — det er et lag, ikke løsningen. Den rigtige løsning
// er budgetkuverten (spec pkt. 56.3), der lever i databasen, bygges trin 4. ---
const RATE_LIMIT_PER_MINUTE = Number(process.env.RATE_LIMIT_PER_MINUTE) || 20;
const requestLog = new Map();

function rateLimit(req, res, next) {
  const ip = req.ip || "unknown";
  const now = Date.now();
  const windowMs = 60_000;
  const entry = requestLog.get(ip);

  if (!entry || now - entry.windowStart > windowMs) {
    requestLog.set(ip, { windowStart: now, count: 1 });
    return next();
  }
  if (entry.count >= RATE_LIMIT_PER_MINUTE) {
    return res.status(429).json({ error: `For mange forespørgsler. Maks ${RATE_LIMIT_PER_MINUTE} pr. minut pr. IP.` });
  }
  entry.count += 1;
  next();
}

// --- Model allow-list (jf. spec addendum "model-provider-claude", pkt. 18.3).
// Ingen model-streng fra klienten bruges ukontrolleret. Udvid listen, når
// ANTHROPIC_API_KEY tilføjes og Claude-routing bygges (samme addendum). ---
const ALLOWED_MODELS = [
  "llama-3.3-70b-versatile" // Groq — nuværende fallback/eneste model
];

function resolveModel(requestedModel) {
  if (requestedModel && ALLOWED_MODELS.includes(requestedModel)) {
    return requestedModel;
  }
  return ALLOWED_MODELS[0];
}

// --- Postgres er system of record fra trin 1 (spec/83). Uden DATABASE_URL
// kan platformen ikke skrive til event-loggen, og der er derfor ingen
// meningsfuld degraderet tilstand at falde tilbage på (i modsætning til
// den tidligere Mongoose-kode, som stiltiende returnerede tomme lister). ---
function requireDatabase(req, res, next) {
  if (!isDatabaseConfigured()) {
    return res.status(500).json({ error: "DATABASE_URL er ikke sat. Se .env.example." });
  }
  next();
}

async function findOrCreateBusiness(name) {
  const businessName = name || "LeadAgent";
  const existing = await pool.query("SELECT * FROM business WHERE name = $1", [businessName]);
  if (existing.rows[0]) return existing.rows[0];

  const created = await pool.query(
    "INSERT INTO business (name) VALUES ($1) RETURNING *",
    [businessName]
  );
  return created.rows[0];
}

const CHIEF_PROMPT = `Du er CHIEF, Lead Agent på QuistLine.ai. Du koordinerer direkte med Owner. Spørg ALTID om lov før du hyrer en Engineer til at bygge. Tving mappestruktur: /branding, /memory, /docs, /reports, /src, /tests.`;
const ENGINEER_PROMPT = `Du er ENGINEER, en Worker Agent. Når du bygger, skal du oprette en struktureret rapport med sektionerne: # Task Rapport, ## Status, ## Ændringer, ## Tests og ## Anbefalinger.`;

// GET /api/tasks - Hent opgaver fra Postgres, nyeste først
app.get("/api/tasks", requireOwnerKey, requireDatabase, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT task.*, business.name AS business_name
       FROM task JOIN business ON business.id = task.business_id
       ORDER BY task.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Postgres-fejl (GET /api/tasks):", err);
    res.status(500).json({ error: "Kunne ikke hente tasks" });
  }
});

// GET /api/events?businessId=... - Læs event-loggen (kæden) for en business
app.get("/api/events", requireOwnerKey, requireDatabase, async (req, res) => {
  const { businessId } = req.query;
  if (!businessId) {
    return res.status(400).json({ error: "businessId er påkrævet" });
  }
  try {
    const events = await getEventsForBusiness(businessId);
    res.json(events);
  } catch (err) {
    console.error("Postgres-fejl (GET /api/events):", err);
    res.status(500).json({ error: "Kunne ikke hente events" });
  }
});

// GET /api/events/verify?businessId=... - Genberegn hash-kæden (pkt. 66.1)
app.get("/api/events/verify", requireOwnerKey, requireDatabase, async (req, res) => {
  const { businessId } = req.query;
  if (!businessId) {
    return res.status(400).json({ error: "businessId er påkrævet" });
  }
  try {
    const result = await verifyChain(businessId);
    res.json(result);
  } catch (err) {
    console.error("Postgres-fejl (GET /api/events/verify):", err);
    res.status(500).json({ error: "Kunne ikke verificere kæden" });
  }
});

// POST /api/agent - Orkestrering af Chief & Engineer
app.post("/api/agent", requireOwnerKey, rateLimit, requireDatabase, async (req, res) => {
  const { prompt, model, hireWorker, projectName } = req.body;
  const selectedModel = resolveModel(model);

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "prompt er påkrævet og skal være tekst." });
  }

  try {
    const business = await findOrCreateBusiness(projectName);

    const ownerEvent = await appendEvent({
      businessId: business.id,
      agentId: "owner",
      type: "message",
      payload: { prompt, hireWorker: Boolean(hireWorker) }
    });

    if (hireWorker) {
      const taskTitle = prompt.length > 50 ? prompt.substring(0, 47) + "..." : prompt;
      const taskResult = await pool.query(
        `INSERT INTO task (business_id, title, assigned_to, status)
         VALUES ($1, $2, 'Engineer', 'RUNNING') RETURNING *`,
        [business.id, taskTitle]
      );
      const task = taskResult.rows[0];

      // 1. Worker genererer rapporten
      const workerCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: ENGINEER_PROMPT },
          { role: "user", content: `Opgave ID: ${task.id}. Byg for projekt '${business.name}': ${prompt}.` }
        ],
        model: selectedModel,
        temperature: 0.2
      });

      const workerOutput = workerCompletion.choices[0]?.message?.content || "Ingen output.";

      const workerEvent = await appendEvent({
        businessId: business.id,
        taskId: task.id,
        parentEventId: ownerEvent.id,
        agentId: "engineer",
        type: "report",
        payload: { content: workerOutput },
        model: selectedModel,
        provider: "groq",
        tokensIn: workerCompletion.usage?.prompt_tokens ?? null,
        tokensOut: workerCompletion.usage?.completion_tokens ?? null
      });

      await pool.query("UPDATE task SET status = 'DONE' WHERE id = $1", [task.id]);

      // 2. Chief svarer Owner
      const chiefCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: CHIEF_PROMPT },
          { role: "user", content: `Engineer har udført opgave ${task.id}. Resultat:\n${workerOutput}` }
        ],
        model: selectedModel,
        temperature: 0.5
      });
      const chiefReply = chiefCompletion.choices[0]?.message?.content;

      await appendEvent({
        businessId: business.id,
        taskId: task.id,
        parentEventId: workerEvent.id,
        agentId: "chief",
        type: "message",
        payload: { content: chiefReply },
        model: selectedModel,
        provider: "groq",
        tokensIn: chiefCompletion.usage?.prompt_tokens ?? null,
        tokensOut: chiefCompletion.usage?.completion_tokens ?? null
      });

      return res.json({
        reply: chiefReply,
        rawWorkerOutput: workerOutput,
        taskId: task.id,
        businessId: business.id
      });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: CHIEF_PROMPT },
        { role: "user", content: prompt }
      ],
      model: selectedModel,
      temperature: 0.5
    });
    const reply = completion.choices[0]?.message?.content;

    await appendEvent({
      businessId: business.id,
      parentEventId: ownerEvent.id,
      agentId: "chief",
      type: "message",
      payload: { content: reply },
      model: selectedModel,
      provider: "groq",
      tokensIn: completion.usage?.prompt_tokens ?? null,
      tokensOut: completion.usage?.completion_tokens ?? null
    });

    res.json({ reply, businessId: business.id });

  } catch (error) {
    console.error("Groq/Postgres-fejl (POST /api/agent):", error);
    res.status(500).json({ error: "Serverfejl under afvikling." });
  }
});

// Kør kun app.listen lokalt (Vercel håndterer det automatisk i produktion)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server kører på port ${PORT}`));
}

export default app;
