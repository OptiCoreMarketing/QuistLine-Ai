import { pool } from "./db.js";
import { appendEvent } from "./eventLog.js";

// Tilstandsmaskine for task, jf. spec/39-teknisk-arkitektur.md pkt. 41.3.
// Nøglerne i ALLOWED_TRANSITIONS er den ene kilde til sandhed om, hvilke
// tilstande der findes. KILLED kan nås fra enhver ikke-terminal tilstand
// ("når som helst") — modelleret som en eksplicit kant pr. tilstand.
export const ALLOWED_TRANSITIONS = {
  DRAFT: ["AWAITING_TOOL_APPROVAL", "AWAITING_HIRE_APPROVAL", "RUNNING", "KILLED"],
  AWAITING_TOOL_APPROVAL: ["RUNNING", "KILLED"],
  AWAITING_HIRE_APPROVAL: ["RUNNING", "KILLED"],
  RUNNING: [
    "BLOCKED_ON_DEPENDENCY",
    "AWAITING_OWNER_REVIEW",
    "AWAITING_TOOL_APPROVAL",
    "AWAITING_HIRE_APPROVAL",
    "DONE",
    "KILLED"
  ],
  BLOCKED_ON_DEPENDENCY: ["RUNNING", "KILLED"],
  AWAITING_OWNER_REVIEW: ["RUNNING", "APPROVED", "KILLED"],
  APPROVED: ["AWAITING_DEPLOY_APPROVAL", "DONE", "KILLED"],
  AWAITING_DEPLOY_APPROVAL: ["DONE", "KILLED"],
  DONE: [],
  KILLED: []
};

export function isValidTransition(from, to) {
  if (!Object.prototype.hasOwnProperty.call(ALLOWED_TRANSITIONS, from)) {
    throw new Error(`Ukendt fra-tilstand: ${from}`);
  }
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertValidTransition(from, to) {
  if (!isValidTransition(from, to)) {
    throw new Error(`Ulovlig tilstandsovergang: ${from} -> ${to}`);
  }
}

// Skifter en tasks tilstand og skriver en `state_transition`-event, jf.
// pkt. 40's princip om at intet sker uden om event-loggen. Låser rækken
// (SELECT ... FOR UPDATE) inde i transaktionen, så to samtidige forsøg på
// at skifte samme task ikke begge kan læse den samme udgangstilstand.
export async function transitionTask({ taskId, toStatus, agentId, reason }) {
  let fromStatus;
  let businessId;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const current = await client.query(
      "SELECT * FROM task WHERE id = $1 FOR UPDATE",
      [taskId]
    );
    if (!current.rows[0]) {
      throw new Error(`Task ${taskId} findes ikke`);
    }
    const task = current.rows[0];
    fromStatus = task.status;
    businessId = task.business_id;

    assertValidTransition(fromStatus, toStatus);

    await client.query("UPDATE task SET status = $1 WHERE id = $2", [toStatus, taskId]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  // Hændelsen skrives efter commit — appendEvent tager sin egen advisory
  // lock pr. business og skal ikke dele transaktion med tabel-låsen ovenfor.
  return appendEvent({
    businessId,
    taskId,
    agentId: agentId || "system",
    type: "state_transition",
    payload: { from: fromStatus, to: toStatus, reason: reason || null }
  });
}
