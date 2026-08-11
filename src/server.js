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

// MongoDB Forbindelse
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Opkoblet til MongoDB"))
    .catch((err) => console.error("MongoDB fejl:", err));
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
app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Kunne ikke hente tasks" });
  }
});

// POST /api/agent - Orkestrering af Chief & Engineer
app.post("/api/agent", async (req, res) => {
  const { prompt, model, hireWorker, projectName } = req.body;
  const selectedModel = model || "llama-3.3-70b-versatile";

  try {
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

      // 2. Gem direkte i MongoDB
      await Task.create({
        taskId: taskId,
        title: prompt.length > 50 ? prompt.substring(0, 47) + "..." : prompt,
        assignedTo: "Engineer",
        status: "DONE",
        reportContent: workerOutput
      });

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

export default app;
