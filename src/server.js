import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import Groq from "groq-sdk";
import mongoose from "mongoose";

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

// Hjælpefunktion: Genbrug MongoDB-forbindelse i serverless miljø
async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) return;
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("Opkoblet til MongoDB");
    } catch (err) {
      console.error("MongoDB fejl:", err);
    }
  }
}

// Task Schema i MongoDB
const taskSchema = new mongoose.Schema({
  taskId: String,
  title: String,
  assignedTo: String,
  status: String,
  createdAt: { type: Date, default: Date.now },
  reportContent: String
});

const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);

const CHIEF_PROMPT = `Du er CHIEF, Lead Agent på QuistLine.ai. Du koordinerer direkte med Owner. Spørg ALTID om lov før du hyrer en Engineer til at bygge. Tving mappestruktur: /branding, /memory, /docs, /reports, /src, /tests.`;
const ENGINEER_PROMPT = `Du er ENGINEER, en Worker Agent. Når du bygger, skal du oprette en struktureret rapport med sektionerne: # Task Rapport, ## Status, ## Ændringer, ## Tests og ## Anbefalinger.`;

// GET /api/tasks - Hent opgaver fra MongoDB
app.get("/api/tasks", requireOwnerKey, async (req, res) => {
  try {
    await connectToDatabase();
    if (mongoose.connection.readyState === 1) {
      const tasks = await Task.find().sort({ createdAt: -1 });
      return res.json(tasks);
    }
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: "Kunne ikke hente tasks" });
  }
});

// POST /api/agent - Orkestrering af Chief & Engineer
app.post("/api/agent", requireOwnerKey, rateLimit, async (req, res) => {
  const { prompt, model, hireWorker, projectName } = req.body;
  const selectedModel = resolveModel(model);

  try {
    await connectToDatabase();

    if (hireWorker) {
      const taskId = "TASK-" + Math.floor(1000 + Math.random() * 9000);

      // 1. Worker genererer rapporten
      const workerCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: ENGINEER_PROMPT },
          { role: "user", content: `Opgave ID: ${taskId}. Byg for projekt '${projectName || "LeadAgent"}': ${prompt}.` }
        ],
        model: selectedModel,
        temperature: 0.2
      });

      const workerOutput = workerCompletion.choices[0]?.message?.content || "Ingen output.";

      // 2. Gem direkte i MongoDB hvis opkoblet
      if (mongoose.connection.readyState === 1) {
        await Task.create({
          taskId: taskId,
          title: prompt.length > 50 ? prompt.substring(0, 47) + "..." : prompt,
          assignedTo: "Engineer",
          status: "DONE",
          reportContent: workerOutput
        });
      }

      // 3. Chief svarer Owner
      const chiefCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: CHIEF_PROMPT },
          { role: "user", content: `Engineer har udført ${taskId}. Resultat:\n${workerOutput}` }
        ],
        model: selectedModel,
        temperature: 0.5
      });

      return res.json({
        reply: chiefCompletion.choices[0]?.message?.content,
        rawWorkerOutput: workerOutput,
        taskId: taskId
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

    res.json({ reply: completion.choices[0]?.message?.content });

  } catch (error) {
    console.error("Groq/MongoDB Error:", error);
    res.status(500).json({ error: "Serverfejl under afvikling." });
  }
});

// Kør kun app.listen lokalt (Vercel håndterer det automatisk i produktion)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server kører på port ${PORT}`));
}

export default app;
