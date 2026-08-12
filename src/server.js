import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import Groq from "groq-sdk";
import { pool, isDatabaseConfigured } from "./db.js";
import { appendEvent, getEventsForBusiness, verifyChain } from "./eventLog.js";
import { transitionTask } from "./taskStateMachine.js";
import { checkEngineerReportContract, checkSecretScanner, recordGuardViolation } from "./guards.js";

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

// Chief er pr. business, ikke global (spec pkt. 54.1): hvert projekt har
// sin egen, individuelle samtale — en ny business starter med tom
// historik, og et eksisterende projekts historik bæres aldrig over i et
// andet. Kontekstvinduet holdes bevidst lille (pkt. 54.1's begrundelse:
// "Chief for projekt A skal ikke bære projekt B's historik rundt") ved
// kun at hente de seneste CHIEF_HISTORY_LIMIT beskeder, ikke hele loggen.
// Kun `message`-typen (Owner↔Chief) — rapporter/godkendelser/tilstands-
// skift hører til observationskanalen, ikke selve samtalen, Chief skal
// huske ordret.
const CHIEF_HISTORY_LIMIT = 20;

async function getChiefConversationHistory(businessId) {
  const { rows } = await pool.query(
    `SELECT agent_id, payload FROM event
     WHERE business_id = $1 AND type = 'message'
     ORDER BY created_at DESC LIMIT $2`,
    [businessId, CHIEF_HISTORY_LIMIT]
  );
  return rows.reverse().map((row) => ({
    role: row.agent_id === "owner" ? "user" : "assistant",
    content: row.agent_id === "owner" ? (row.payload.prompt || "") : (row.payload.content || "")
  }));
}

// GET /api/businesses - Hent Flåden (alle businesses), nyeste først
app.get("/api/businesses", requireOwnerKey, requireDatabase, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM business ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error("Postgres-fejl (GET /api/businesses):", err);
    res.status(500).json({ error: "Kunne ikke hente Flåden" });
  }
});

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

// POST /api/tasks/:taskId/transition - Blotlægger tilstandsmaskinen (pkt.41.3)
// direkte for Owner. Ingen ny risikoklasse-/budget-logik her (det er trin 4) —
// dette er kun det, der kræves for at komme videre fra en Vagtpost-stop, jf.
// side 3.2-rapporten.
app.post("/api/tasks/:taskId/transition", requireOwnerKey, requireDatabase, async (req, res) => {
  const { taskId } = req.params;
  const { toStatus, reason } = req.body;
  if (!toStatus) {
    return res.status(400).json({ error: "toStatus er påkrævet." });
  }
  try {
    const event = await transitionTask({ taskId, toStatus, agentId: "owner", reason: reason || null });
    res.json({ event });
  } catch (err) {
    console.error("Tilstandsovergang fejlede (POST /api/tasks/:taskId/transition):", err);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/tasks/:taskId/approve-hire - Owner svarer på en hyrings-
// anmodning (approval_request). Godkendt: udfører selve Engineer-kaldet +
// Vagtpost-check + Chief-svar, som tidligere skete øjeblikkeligt i
// /api/agent. Afvist: KILLED, intet Groq-kald sker nogensinde.
app.post("/api/tasks/:taskId/approve-hire", requireOwnerKey, rateLimit, requireDatabase, async (req, res) => {
  const { taskId } = req.params;
  const { approved } = req.body;

  try {
    const taskRow = await pool.query("SELECT * FROM task WHERE id = $1", [taskId]);
    const task = taskRow.rows[0];
    if (!task) {
      return res.status(404).json({ error: "Task findes ikke." });
    }
    // Tjekket her, ikke kun overladt til tilstandsmaskinens fejl, så et
    // dobbelt klik (fx på et forældet, allerede afgjort kort) giver en
    // forklarende 409 i stedet for et uklart 500 "Serverfejl under afvikling".
    if (task.status !== "AWAITING_HIRE_APPROVAL") {
      return res.status(409).json({ error: `Denne anmodning er allerede afgjort (status: ${task.status}).` });
    }

    if (!approved) {
      await transitionTask({ taskId, toStatus: "KILLED", agentId: "owner", reason: "owner_denied_hire" });
      return res.json({ status: "denied" });
    }

    const requestEventRow = await pool.query(
      `SELECT * FROM event WHERE task_id = $1 AND type = 'approval_request' ORDER BY created_at DESC LIMIT 1`,
      [taskId]
    );
    const requestEvent = requestEventRow.rows[0];
    if (!requestEvent) {
      return res.status(400).json({ error: "Ingen godkendelsesanmodning fundet for denne task." });
    }

    const { prompt, model } = requestEvent.payload;
    const selectedModel = resolveModel(model);

    const businessRow = await pool.query("SELECT * FROM business WHERE id = $1", [task.business_id]);
    const business = businessRow.rows[0];

    await transitionTask({ taskId, toStatus: "RUNNING", agentId: "owner", reason: "owner_approved_hire" });
    await appendEvent({
      businessId: business.id,
      taskId,
      parentEventId: requestEvent.id,
      agentId: "owner",
      type: "approval_granted",
      payload: { action: "hire_engineer" }
    });

    // Fra her og ned: task er RUNNING. Hvis noget fejler (fx Groq nede),
    // skal task IKKE stå fanget i RUNNING for evigt uden forklaring —
    // derfor egen catch, der sætter KILLED med en sporbar årsag, i stedet
    // for at lade den ydre catch kun svare 500 uden at røre tilstanden.
    try {
      // 1. Worker genererer rapporten
      const workerCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: ENGINEER_PROMPT },
          { role: "user", content: `Opgave ID: ${taskId}. Byg for projekt '${business.name}': ${prompt}.` }
        ],
        model: selectedModel,
        temperature: 0.2
      });
      const workerOutput = workerCompletion.choices[0]?.message?.content || "Ingen output.";

      const workerEvent = await appendEvent({
        businessId: business.id,
        taskId,
        parentEventId: requestEvent.id,
        agentId: "engineer",
        type: "report",
        payload: { content: workerOutput },
        model: selectedModel,
        provider: "groq",
        tokensIn: workerCompletion.usage?.prompt_tokens ?? null,
        tokensOut: workerCompletion.usage?.completion_tokens ?? null
      });

      // Vagtpost lag 1 (pkt. 60.1): kontraktvalidering + hemmeligheds-scanner.
      const contractCheck = checkEngineerReportContract(workerOutput);
      const secretCheck = checkSecretScanner(workerOutput);
      const failedGuard = contractCheck.violated ? contractCheck : (secretCheck.violated ? secretCheck : null);

      if (failedGuard) {
        await recordGuardViolation({
          businessId: business.id,
          taskId,
          agentId: "vagtpost",
          violation: failedGuard,
          context: { stage: "engineer_report" }
        });
        return res.json({
          status: "approved",
          rawWorkerOutput: workerOutput,
          guardViolation: { rule: failedGuard.rule, detail: failedGuard.detail }
        });
      }

      await transitionTask({ taskId, toStatus: "DONE", agentId: "engineer" });

      // 2. Chief svarer Owner — med sin egen samtalehistorik for netop
      // denne business, ikke et koldt, isoleret kald.
      const chiefHistory = await getChiefConversationHistory(business.id);
      const chiefCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: CHIEF_PROMPT },
          ...chiefHistory,
          { role: "user", content: `Engineer har udført opgave ${taskId}. Resultat:\n${workerOutput}` }
        ],
        model: selectedModel,
        temperature: 0.5
      });
      const chiefReply = chiefCompletion.choices[0]?.message?.content;

      await appendEvent({
        businessId: business.id,
        taskId,
        parentEventId: workerEvent.id,
        agentId: "chief",
        type: "message",
        payload: { content: chiefReply },
        model: selectedModel,
        provider: "groq",
        tokensIn: chiefCompletion.usage?.prompt_tokens ?? null,
        tokensOut: chiefCompletion.usage?.completion_tokens ?? null
      });

      res.json({ status: "approved", reply: chiefReply, rawWorkerOutput: workerOutput });
    } catch (executionError) {
      console.error("Groq-fejl efter godkendt hyring:", executionError);
      await transitionTask({
        taskId,
        toStatus: "KILLED",
        agentId: "system",
        reason: `execution_failed: ${executionError.message}`
      }).catch((transitionErr) => console.error("Kunne heller ikke sætte KILLED:", transitionErr));
      res.status(500).json({ error: "Serverfejl under afvikling af den godkendte opgave." });
    }
  } catch (error) {
    console.error("Groq/Postgres-fejl (POST /api/tasks/:taskId/approve-hire):", error);
    res.status(500).json({ error: "Serverfejl under afvikling." });
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
    // Hentet FØR den nuværende besked skrives til loggen, så den ikke
    // optræder dobbelt (én gang fra historikken, én gang som selve kaldet).
    const chiefHistory = await getChiefConversationHistory(business.id);

    const ownerEvent = await appendEvent({
      businessId: business.id,
      agentId: "owner",
      type: "message",
      payload: { prompt, hireWorker: Boolean(hireWorker) }
    });

    if (hireWorker) {
      // Hyring er gul klasse (pkt.56.1) — CHIEF_PROMPT siger "spørg ALTID
      // om lov", men det var indtil nu kun en instruktion i en prompt, ikke
      // en teknisk umulighed at omgå (pkt.41.3's kernekrav). Her stopper
      // flowet reelt: task går i AWAITING_HIRE_APPROVAL, intet Groq-kald
      // sker, ingen tokens brænder, før Owner svarer via /approve-hire.
      const taskTitle = prompt.length > 50 ? prompt.substring(0, 47) + "..." : prompt;
      const taskResult = await pool.query(
        `INSERT INTO task (business_id, title, assigned_to) VALUES ($1, $2, 'Engineer') RETURNING *`,
        [business.id, taskTitle]
      );
      const task = taskResult.rows[0];

      await transitionTask({
        taskId: task.id,
        toStatus: "AWAITING_HIRE_APPROVAL",
        agentId: "chief",
        reason: "hireWorker anmodet af Owner"
      });

      await appendEvent({
        businessId: business.id,
        taskId: task.id,
        parentEventId: ownerEvent.id,
        agentId: "chief",
        type: "approval_request",
        payload: { action: "hire_engineer", prompt, model: selectedModel }
      });

      return res.json({ taskId: task.id, businessId: business.id, awaitingApproval: true });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: CHIEF_PROMPT },
        ...chiefHistory,
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
