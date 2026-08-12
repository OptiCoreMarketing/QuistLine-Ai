import { pool } from "./db.js";

// Samtalehukommelse for platform-agenter, der er scoped PR. BUSINESS
// (spec pkt. 54.1 — i dag kun Chief, men mekanismen er generel: enhver
// fremtidig pr.-business-agent kan genbruge den med sit eget agentId).
// Kontekstvinduet holdes bevidst lille (pkt. 54.1's begrundelse: "Chief
// for projekt A skal ikke bære projekt B's historik rundt") ved kun at
// hente de seneste AGENT_HISTORY_LIMIT beskeder, ikke hele loggen.
//
// GLOBALT scopede agenter (Warden, pkt. 54.4 — "Warden forbliver
// global", overvåger på tværs af alle businesses) kan IKKE bruge denne
// funktion som den er: `event.business_id` er NOT NULL
// (migrations/001_init.sql), så der findes intet naturligt sted at gemme
// "Wardens egen samtale med Owner" uden en business at hænge den på.
// Det kræver enten en dedikeret tabel eller en anden løsning, når Warden
// rent faktisk bygges (trin 9) — bevidst ikke gættet på her, jf. pkt. 39's
// advarsel mod at bygge infrastruktur for en funktion, der endnu ikke
// findes.
const AGENT_HISTORY_LIMIT = 20;

export async function getAgentConversationHistory(agentId, businessId) {
  const { rows } = await pool.query(
    `SELECT agent_id, payload FROM event
     WHERE business_id = $1 AND type = 'message' AND agent_id IN ($2, 'owner')
     ORDER BY created_at DESC LIMIT $3`,
    [businessId, agentId, AGENT_HISTORY_LIMIT]
  );
  return rows.reverse().map((row) => ({
    role: row.agent_id === "owner" ? "user" : "assistant",
    content: row.agent_id === "owner" ? (row.payload.prompt || "") : (row.payload.content || "")
  }));
}
