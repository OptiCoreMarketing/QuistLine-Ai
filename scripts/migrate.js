import { readdirSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool, isDatabaseConfigured } from "../src/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, "..", "migrations");

async function migrate() {
  if (!isDatabaseConfigured()) {
    console.error("DATABASE_URL er ikke sat. Se .env.example.");
    process.exitCode = 1;
    return;
  }

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const appliedRows = await client.query("SELECT version FROM schema_migrations");
    const applied = new Set(appliedRows.rows.map((r) => r.version));

    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`Springer over (allerede kørt): ${file}`);
        continue;
      }

      const sql = readFileSync(path.join(migrationsDir, file), "utf8");
      console.log(`Kører migration: ${file}`);

      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`OK: ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }

    console.log("Alle migrationer kørt.");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("Migration fejlede:", err);
  process.exitCode = 1;
});
