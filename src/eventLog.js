import crypto from "crypto";
import { pool } from "./db.js";

// Fast mærke for den første hændelse i en business' kæde, så en tom
// forrige-hash ikke kan forveksles med en fejlagtigt udeladt værdi —
// begge ville ellers blive `null`/`undefined` i hashen.
const GENESIS_MARKER = "GENESIS";

// Stabil, nøgle-sorteret JSON-serialisering. Almindelig JSON.stringify
// afhænger af objekters egenskabsrækkefølge — Postgres' jsonb-lagring
// garanterer IKKE at bevare den rækkefølge, en klient indsatte i. Uden
// dette ville en hændelse, der læses tilbage fra databasen, kunne få en
// anden hash end den, der blev skrevet, selvom indholdet er uændret,
// hvilket ville gøre kæde-verifikation ubrugelig (falske positiver).
function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function computeEventHash({
  prevEventHash,
  businessId,
  taskId,
  agentId,
  parentEventId,
  type,
  payload,
  model,
  provider,
  tokensIn,
  tokensOut,
  costUsd,
  createdAt
}) {
  const canonical = stableStringify({
    prev: prevEventHash || GENESIS_MARKER,
    businessId,
    taskId: taskId || null,
    agentId,
    parentEventId: parentEventId || null,
    type,
    payload: payload || {},
    model: model || null,
    provider: provider || null,
    tokensIn: tokensIn ?? null,
    tokensOut: tokensOut ?? null,
    costUsd: costUsd ?? null,
    createdAt
  });
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

// Skriver én hændelse ind i kæden for en business. Låser pr. business
// (advisory lock, ikke tabellåsning) inde i transaktionen, så to
// samtidige append-kald for samme business ikke kan læse samme
// "forrige hash" og dermed forgrene kæden i stedet for at forlænge den.
export async function appendEvent({
  businessId,
  taskId,
  agentId,
  parentEventId,
  type,
  payload,
  model,
  provider,
  tokensIn,
  tokensOut,
  costUsd
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [businessId]);

    const lastEvent = await client.query(
      `SELECT event_hash FROM event WHERE business_id = $1
       ORDER BY created_at DESC, id DESC LIMIT 1`,
      [businessId]
    );
    const prevEventHash = lastEvent.rows[0]?.event_hash || null;
    const createdAt = new Date().toISOString();

    const eventHash = computeEventHash({
      prevEventHash,
      businessId,
      taskId,
      agentId,
      parentEventId,
      type,
      payload,
      model,
      provider,
      tokensIn,
      tokensOut,
      costUsd,
      createdAt
    });

    const inserted = await client.query(
      `INSERT INTO event (
        business_id, task_id, agent_id, parent_event_id, type, payload,
        model, provider, tokens_in, tokens_out, cost_usd,
        prev_event_hash, event_hash, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *`,
      [
        businessId,
        taskId || null,
        agentId,
        parentEventId || null,
        type,
        payload || {},
        model || null,
        provider || null,
        tokensIn ?? null,
        tokensOut ?? null,
        costUsd ?? null,
        prevEventHash,
        eventHash,
        createdAt
      ]
    );

    await client.query("COMMIT");
    return inserted.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getEventsForBusiness(businessId) {
  const { rows } = await pool.query(
    `SELECT * FROM event WHERE business_id = $1 ORDER BY created_at ASC, id ASC`,
    [businessId]
  );
  return rows;
}

function rowToHashInput(row) {
  return {
    prevEventHash: row.prev_event_hash,
    businessId: row.business_id,
    taskId: row.task_id,
    agentId: row.agent_id,
    parentEventId: row.parent_event_id,
    type: row.type,
    payload: row.payload,
    model: row.model,
    provider: row.provider,
    tokensIn: row.tokens_in,
    tokensOut: row.tokens_out,
    costUsd: row.cost_usd !== null ? Number(row.cost_usd) : null,
    createdAt: row.created_at.toISOString()
  };
}

// Genberegner hele kæden for en business og sammenligner med de gemte
// hashes. Dette er den reelle test af pkt. 66.1's løfte: at enhver
// ændring af historikken (også en enkelt payload-værdi) bliver synlig.
export async function verifyChain(businessId) {
  const rows = await getEventsForBusiness(businessId);

  let expectedPrev = null;
  for (const row of rows) {
    if (row.prev_event_hash !== expectedPrev) {
      return {
        valid: false,
        brokenAtEventId: row.id,
        reason: "prev_event_hash matcher ikke forrige hændelses event_hash"
      };
    }

    const recomputed = computeEventHash(rowToHashInput(row));
    if (recomputed !== row.event_hash) {
      return {
        valid: false,
        brokenAtEventId: row.id,
        reason: "event_hash matcher ikke en genberegning af hændelsens data — historikken kan være ændret"
      };
    }

    expectedPrev = row.event_hash;
  }

  return { valid: true, eventCount: rows.length };
}

export const __testables = { stableStringify, GENESIS_MARKER };
