import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Groq from "groq-sdk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const TASKS_FILE = path.join(__dirname, "tasks.json");

const CHIEF_PROMPT = `Du er CHIEF, Lead Agent på QuistLine.ai. Du koordinerer direkte med Owner. Spørg ALTID om lov før du hyrer en Engineer til at bygge. Tving mappestruktur: /branding, /memory, /docs, /reports, /src, /tests.`;

const ENGINEER_PROMPT = `Du er ENGINEER, en Worker Agent. Når du bygger, skal du oprette en struktureret rapport med sektionerne: # Task Rapport, ## Status, ## Ændringer, ## Tests og ## Anbefalinger. Overhold alle mappenormer.`;

function readTasks() {
  if (!fs.existsSync(TASKS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(TASKS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

app.get("/api/tasks", (req, res) => {
  res.json(readTasks());
});

app.post("/api/agent", async (req, res) => {
  const { prompt, model, hireWorker, projectName } = req.body;
  const selectedModel = model || "llama-3.3-70b-versatile";

  try {
    if (hireWorker) {
      const taskId = "TASK-" + Math.floor(1000 + Math.random() * 9000);
      const dateStr = new Date().toISOString().split("T")[0];
      const reportFileName = `${dateStr}_${taskId.toLowerCase()}.md`;

      const workerCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: ENGINEER_PROMPT },
          { 
            role: "user", 
            content: `Opgave ID: ${taskId}. Byg for projekt '${projectName || "LeadAgent"}': ${prompt}. Skriv en komplet rapport i Markdown.` 
          }
        ],
        model: selectedModel,
        temperature: 0.2
      });

      const workerOutput = workerCompletion.choices[0]?.message?.content || "Ingen output fra Engineer.";

      const reportsDir = path.join(__dirname, "../reports");
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      fs.writeFileSync(path.join(reportsDir, reportFileName), workerOutput);

      const tasks = readTasks();
      tasks.push({
        id: taskId,
        title: prompt.length > 50 ? prompt.substring(0, 47) + "..." : prompt,
        assignedTo: "Engineer",
        status: "DONE",
        createdAt: new Date().toISOString(),
        reportFile: reportFileName
      });
      writeTasks(tasks);

      const chiefCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: CHIEF_PROMPT },
          { 
            role: "user", 
            content: `Engineer har udført ${taskId} og gemt rapporten i '/reports/${reportFileName}'. Resultat:\n${workerOutput}\n\nOpdater Owner om at opgaven er udført og klar til godkendelse.` 
          }
        ],
        model: selectedModel,
        temperature: 0.5
      });

      return res.json({
        reply: chiefCompletion.choices[0]?.message?.content,
        rawWorkerOutput: workerOutput,
        taskId: taskId,
        reportFile: reportFileName
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
    console.error("Groq API Error:", error);
    res.status(500).json({ error: "Fejl under kommunikation med Groq API." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server kører på port ${PORT}`));
