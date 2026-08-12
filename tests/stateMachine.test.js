import assert from "assert";
import { isValidTransition, assertValidTransition, transitionTask, ALLOWED_TRANSITIONS } from "../src/taskStateMachine.js";
import { pool, isDatabaseConfigured } from "../src/db.js";

console.log("Kører tests for tilstandsmaskinen (trin 2, side 2.1)...");

// --- Unit-tests (ingen database krævet) ---

assert.strictEqual(isValidTransition("DRAFT", "RUNNING"), true, "DRAFT -> RUNNING skal være lovlig");
assert.strictEqual(isValidTransition("DONE", "RUNNING"), false, "DONE er terminal — intet kan følge efter");
assert.strictEqual(isValidTransition("RUNNING", "KILLED"), true, "KILLED skal kunne nås fra enhver ikke-terminal tilstand");
assert.strictEqual(isValidTransition("AWAITING_OWNER_REVIEW", "KILLED"), true, "KILLED skal kunne nås fra AWAITING_OWNER_REVIEW");
console.log("✓ isValidTransition skelner korrekt mellem lovlige og ulovlige overgange");

assert.throws(() => assertValidTransition("DONE", "DRAFT"), /Ulovlig tilstandsovergang/, "Ulovlig overgang skal kaste en fejl");
assert.doesNotThrow(() => assertValidTransition("DRAFT", "RUNNING"), "Lovlig overgang skal ikke kaste en fejl");
console.log("✓ assertValidTransition kaster kun ved ulovlige overgange");

assert.throws(() => isValidTransition("UKENDT_TILSTAND", "RUNNING"), /Ukendt fra-tilstand/, "Ukendt tilstand skal kaste en fejl, ikke stille returnere false");
console.log("✓ isValidTransition afviser ukendte tilstande eksplicit");

// Terminal-tilstande skal have tomme overgangslister — ellers er de ikke terminale.
assert.deepStrictEqual(ALLOWED_TRANSITIONS.DONE, [], "DONE skal være terminal (ingen udgående overgange)");
assert.deepStrictEqual(ALLOWED_TRANSITIONS.KILLED, [], "KILLED skal være terminal (ingen udgående overgange)");
console.log("✓ DONE og KILLED er terminale tilstande");

// --- Integrationstest (kun hvis DATABASE_URL er sat) ---

async function runIntegrationTest() {
  if (!isDatabaseConfigured()) {
    console.log("… DATABASE_URL ikke sat — springer integrationstest af tilstandsmaskinen over.");
    return;
  }

  const businessResult = await pool.query(
    "INSERT INTO business (name) VALUES ($1) RETURNING *",
    [`test-statemachine-${Date.now()}`]
  );
  const business = businessResult.rows[0];

  const taskResult = await pool.query(
    "INSERT INTO task (business_id, title, assigned_to) VALUES ($1, $2, 'Engineer') RETURNING *",
    [business.id, "Test-task"]
  );
  const task = taskResult.rows[0];
  assert.strictEqual(task.status, "DRAFT", "Ny task skal starte i DRAFT (migration 002's nye default)");

  try {
    const event = await transitionTask({ taskId: task.id, toStatus: "RUNNING", agentId: "test" });
    assert.strictEqual(event.type, "state_transition", "transitionTask skal skrive en state_transition-event");
    assert.strictEqual(event.payload.from, "DRAFT");
    assert.strictEqual(event.payload.to, "RUNNING");

    const updated = await pool.query("SELECT status FROM task WHERE id = $1", [task.id]);
    assert.strictEqual(updated.rows[0].status, "RUNNING", "task.status skal være opdateret i databasen");

    await assert.rejects(
      () => transitionTask({ taskId: task.id, toStatus: "DRAFT", agentId: "test" }),
      /Ulovlig tilstandsovergang/,
      "En ulovlig overgang skal afvises og IKKE ændre databasen"
    );
    const unchanged = await pool.query("SELECT status FROM task WHERE id = $1", [task.id]);
    assert.strictEqual(unchanged.rows[0].status, "RUNNING", "Status skal forblive uændret efter en afvist overgang");

    console.log("✓ transitionTask skriver events og håndhæver tilstandsmaskinen mod Postgres");
  } finally {
    await pool.query("DELETE FROM event WHERE business_id = $1", [business.id]);
    await pool.query("DELETE FROM task WHERE id = $1", [task.id]);
    await pool.query("DELETE FROM business WHERE id = $1", [business.id]);
    await pool.end();
  }
}

runIntegrationTest()
  .then(() => console.log("✓ Alle tilstandsmaskine-tests bestået."))
  .catch((err) => {
    console.error("✗ Test fejlede:", err);
    process.exitCode = 1;
  });
