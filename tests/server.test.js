import assert from "assert";
import { computeEventHash, appendEvent, getEventsForBusiness, verifyChain } from "../src/eventLog.js";
import { pool, isDatabaseConfigured } from "../src/db.js";

console.log("Kører tests for QuistLine.ai repository...");

// --- Niveau 1: rene unit-tests af hash-funktionen (ingen database krævet) ---

const baseEvent = {
  prevEventHash: null,
  businessId: "biz-1",
  taskId: null,
  agentId: "owner",
  parentEventId: null,
  type: "message",
  payload: { prompt: "Byg en landingsside", nested: { b: 2, a: 1 } },
  model: null,
  provider: null,
  tokensIn: null,
  tokensOut: null,
  costUsd: null,
  createdAt: "2026-08-12T12:00:00.000Z"
};

const hashA = computeEventHash(baseEvent);
const hashB = computeEventHash(baseEvent);
assert.strictEqual(hashA, hashB, "Samme input skal altid give samme hash");
console.log("✓ computeEventHash er deterministisk");

// Nøgle-rækkefølge i payload må ikke ændre hashen (jf. jsonb-normalisering).
const reorderedPayload = { ...baseEvent, payload: { nested: { a: 1, b: 2 }, prompt: "Byg en landingsside" } };
assert.strictEqual(computeEventHash(reorderedPayload), hashA, "Ombytning af nøgle-rækkefølge i payload må ikke ændre hashen");
console.log("✓ computeEventHash er uafhængig af objekt-nøglerækkefølge");

// Enhver reel ændring af indholdet skal ændre hashen (tamper-evidence).
const tamperedPayload = { ...baseEvent, payload: { ...baseEvent.payload, prompt: "Byg en helt anden side" } };
assert.notStrictEqual(computeEventHash(tamperedPayload), hashA, "Ændret payload skal give en anden hash");
console.log("✓ computeEventHash opdager ændret payload");

const differentPrev = { ...baseEvent, prevEventHash: "en-anden-forrige-hash" };
assert.notStrictEqual(computeEventHash(differentPrev), hashA, "Ændret prevEventHash skal give en anden hash");
console.log("✓ computeEventHash indregner prevEventHash (selve kæden)");

// --- Niveau 2: integrationstest mod rigtig Postgres, kun hvis DATABASE_URL er sat ---

async function runIntegrationTest() {
  if (!isDatabaseConfigured()) {
    console.log("… DATABASE_URL ikke sat — springer integrationstest af hash-kæden over.");
    return;
  }

  const businessName = `test-business-${Date.now()}`;
  const businessResult = await pool.query(
    "INSERT INTO business (name) VALUES ($1) RETURNING *",
    [businessName]
  );
  const business = businessResult.rows[0];

  try {
    const first = await appendEvent({
      businessId: business.id,
      agentId: "owner",
      type: "message",
      payload: { prompt: "test" }
    });
    assert.strictEqual(first.prev_event_hash, null, "Første hændelse i en business skal have prev_event_hash = null");

    const second = await appendEvent({
      businessId: business.id,
      agentId: "chief",
      parentEventId: first.id,
      type: "message",
      payload: { content: "svar" }
    });
    assert.strictEqual(second.prev_event_hash, first.event_hash, "Anden hændelse skal kæde til den første");

    const events = await getEventsForBusiness(business.id);
    assert.strictEqual(events.length, 2, "Begge hændelser skal kunne læses tilbage");

    const okResult = await verifyChain(business.id);
    assert.strictEqual(okResult.valid, true, "Kæden skal være gyldig før nogen manipulation");

    await pool.query("UPDATE event SET payload = $1 WHERE id = $2", [
      { content: "manipuleret" },
      second.id
    ]);
    const brokenResult = await verifyChain(business.id);
    assert.strictEqual(brokenResult.valid, false, "Kæden skal opdages som ugyldig efter manipulation af en hændelse");

    console.log("✓ Hash-kæden skrives, læses og verificeres korrekt mod Postgres");
  } finally {
    await pool.query("DELETE FROM event WHERE business_id = $1", [business.id]);
    await pool.query("DELETE FROM business WHERE id = $1", [business.id]);
    await pool.end();
  }
}

runIntegrationTest()
  .then(() => {
    console.log("✓ Alle tests bestået.");
  })
  .catch((err) => {
    console.error("✗ Test fejlede:", err);
    process.exitCode = 1;
  });
