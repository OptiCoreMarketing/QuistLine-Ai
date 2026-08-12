import assert from "assert";
import { getAgentConversationHistory } from "../src/agentMemory.js";
import { appendEvent } from "../src/eventLog.js";
import { pool, isDatabaseConfigured } from "../src/db.js";

console.log("Kører tests for agent-hukommelse (getAgentConversationHistory)...");

async function runIntegrationTest() {
  if (!isDatabaseConfigured()) {
    console.log("… DATABASE_URL ikke sat — springer test af agent-hukommelse over.");
    return;
  }

  const bizA = (await pool.query(
    "INSERT INTO business (name) VALUES ($1) RETURNING *",
    [`test-memory-a-${Date.now()}`]
  )).rows[0];
  const bizB = (await pool.query(
    "INSERT INTO business (name) VALUES ($1) RETURNING *",
    [`test-memory-b-${Date.now()}`]
  )).rows[0];

  try {
    await appendEvent({ businessId: bizA.id, agentId: "owner", type: "message", payload: { prompt: "Husk kodeordet ABC" } });
    await appendEvent({ businessId: bizA.id, agentId: "chief", type: "message", payload: { content: "Noteret: ABC" } });

    const historyA = await getAgentConversationHistory("chief", bizA.id);
    assert.strictEqual(historyA.length, 2, "Business A skal have præcis 2 hændelser i historikken");
    assert.deepStrictEqual(historyA[0], { role: "user", content: "Husk kodeordet ABC" }, "Første post skal være Owners besked som 'user'");
    assert.deepStrictEqual(historyA[1], { role: "assistant", content: "Noteret: ABC" }, "Anden post skal være Chiefs svar som 'assistant'");
    console.log("✓ getAgentConversationHistory returnerer korrekt formaterede roller/indhold i rækkefølge");

    const historyB = await getAgentConversationHistory("chief", bizB.id);
    assert.strictEqual(historyB.length, 0, "Et andet, tomt business skal have en tom historik — ingen lækage fra business A");
    console.log("✓ Historik er isoleret pr. business — intet lækker mellem projekter");

    // Ikke-message-typer (fx state_transition) må ikke optræde i historikken.
    await appendEvent({ businessId: bizA.id, agentId: "chief", type: "state_transition", payload: { from: "DRAFT", to: "RUNNING" } });
    const historyAfter = await getAgentConversationHistory("chief", bizA.id);
    assert.strictEqual(historyAfter.length, 2, "Ikke-message-hændelser skal ikke tælle med i samtalehukommelsen");
    console.log("✓ Kun 'message'-typen indgår i samtalehukommelsen");
  } finally {
    await pool.query("DELETE FROM event WHERE business_id = ANY($1)", [[bizA.id, bizB.id]]);
    await pool.query("DELETE FROM business WHERE id = ANY($1)", [[bizA.id, bizB.id]]);
    await pool.end();
  }
}

runIntegrationTest()
  .then(() => console.log("✓ Alle tests for agent-hukommelse bestået."))
  .catch((err) => {
    console.error("✗ Test fejlede:", err);
    process.exitCode = 1;
  });
