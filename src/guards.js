import path from "path";
import { appendEvent } from "./eventLog.js";
import { transitionTask } from "./taskStateMachine.js";

// Vagtposten — lag 1, jf. spec/52-flaskehalse-foundry.md pkt. 60.1.
// Alle regler er rene, synkrone funktioner: ingen model, ingen I/O,
// ingen netværkskald. Tærskler er dem, Owner besluttede i
// spec/83-beslutninger-database-taerskler.md pkt. 84 — ændres kun der,
// aldrig ved at redigere tallene direkte i denne fil uden et addendum.
const MASS_DELETE_LINES_PER_FILE = 50;
const MASS_DELETE_LINES_PER_TASK = 150;
const LOOP_GUARD_REPEAT_COUNT = 3;
const BUDGET_GUARD_MULTIPLIER = 2;
const BUDGET_GUARD_FALLBACK_DKK = 25;
const TIMEOUT_GUARD_MULTIPLIER = 2;
const TIMEOUT_GUARD_ABSOLUTE_MS = 45 * 60 * 1000;

function violation(rule, detail) {
  return { violated: true, rule, detail };
}

function ok(rule) {
  return { violated: false, rule, detail: null };
}

export function checkMassDeletion({ linesRemovedInFile = 0, linesRemovedInTask = 0 }) {
  if (linesRemovedInFile > MASS_DELETE_LINES_PER_FILE) {
    return violation(
      "mass_deletion",
      `${linesRemovedInFile} linjer fjernet i én fil (grænse ${MASS_DELETE_LINES_PER_FILE})`
    );
  }
  if (linesRemovedInTask > MASS_DELETE_LINES_PER_TASK) {
    return violation(
      "mass_deletion",
      `${linesRemovedInTask} linjer fjernet i denne task samlet (grænse ${MASS_DELETE_LINES_PER_TASK})`
    );
  }
  return ok("mass_deletion");
}

export function checkFileDeletion({ isFileDeletion = false }) {
  if (isFileDeletion) {
    return violation("file_deletion", "Handlingen sletter en hel fil — altid rød klasse (pkt. 56.1), ingen tærskel");
  }
  return ok("file_deletion");
}

export function checkLoopGuard(recentToolCalls = []) {
  if (recentToolCalls.length < LOOP_GUARD_REPEAT_COUNT) return ok("loop_guard");

  const lastN = recentToolCalls.slice(-LOOP_GUARD_REPEAT_COUNT);
  const [first, ...rest] = lastN;
  const identical = rest.every(
    (call) => call.tool === first.tool && JSON.stringify(call.args) === JSON.stringify(first.args)
  );

  if (identical) {
    return violation(
      "loop_guard",
      `Samme tool-kald ('${first.tool}') gentaget ${LOOP_GUARD_REPEAT_COUNT} gange i træk med identiske argumenter`
    );
  }
  return ok("loop_guard");
}

// NB: tærsklen i pkt. 84 er angivet i kroner, ikke i USD (cost_usd-kolonnen
// i event-tabellen). Åbent spørgsmål #17 (kr. vs. tokens) handler om den
// generelle budgetkuverte i trin 4 — denne specifikke Vagtpost-tærskel er
// allerede besluttet i kr. uafhængigt af det. Caller er ansvarlig for at
// konvertere, indtil en rigtig prismodel findes (cost_usd er stadig `null`
// i praksis, jf. trin 1a-rapporten).
export function checkBudgetGuard({ spentDkk = 0, estimateDkk = null }) {
  if (estimateDkk !== null && estimateDkk !== undefined) {
    const limit = estimateDkk * BUDGET_GUARD_MULTIPLIER;
    if (spentDkk > limit) {
      return violation(
        "budget_guard",
        `Forbrug ${spentDkk} kr overstiger ${BUDGET_GUARD_MULTIPLIER}x tørkørslens estimat (${limit} kr)`
      );
    }
    return ok("budget_guard");
  }
  if (spentDkk > BUDGET_GUARD_FALLBACK_DKK) {
    return violation(
      "budget_guard",
      `Forbrug ${spentDkk} kr overstiger standardloftet på ${BUDGET_GUARD_FALLBACK_DKK} kr pr. task (intet estimat sat)`
    );
  }
  return ok("budget_guard");
}

export function checkTimeoutGuard({ elapsedMs, estimatedMs = null }) {
  if (elapsedMs > TIMEOUT_GUARD_ABSOLUTE_MS) {
    return violation(
      "timeout_guard",
      `${Math.round(elapsedMs / 60000)} min uden tilstandsskift overstiger det absolutte loft på 45 min`
    );
  }
  if (estimatedMs !== null && estimatedMs !== undefined) {
    const limit = estimatedMs * TIMEOUT_GUARD_MULTIPLIER;
    if (elapsedMs > limit) {
      return violation(
        "timeout_guard",
        `${elapsedMs}ms overstiger ${TIMEOUT_GUARD_MULTIPLIER}x det estimerede (${limit}ms)`
      );
    }
  }
  return ok("timeout_guard");
}

// Heuristisk: normaliserer og sammenligner mod tilladte rødder. Dette er
// IKKE en hærdet beskyttelse mod symlinks/faktisk filsystem-adgang — den
// bruges pt. ikke mod et rigtigt filsystem (ingen sandkasse findes endnu,
// jf. side 2.1's afgrænsning). Skal revurderes, når sandkassen bygges.
export function checkPathGuard({ writePath, allowedRoots }) {
  const normalized = path.normalize(writePath).replace(/\\/g, "/");
  const isAllowed = allowedRoots.some((root) => {
    const normalizedRoot = path.normalize(root).replace(/\\/g, "/");
    return normalized === normalizedRoot || normalized.startsWith(`${normalizedRoot}/`);
  });

  if (!isAllowed || normalized.startsWith("../") || normalized.includes("/../")) {
    return violation(
      "path_guard",
      `Skrivning til '${writePath}' er uden for de tilladte mapper (${allowedRoots.join(", ")})`
    );
  }
  return ok("path_guard");
}

// Kendte nøgle-mønstre. Bevidst ufuldstændig — en heuristik, ikke en
// garanti. Udvides efterhånden som nye providers/tools tilføjes.
const SECRET_PATTERNS = [
  { name: "groq_api_key", pattern: /gsk_[A-Za-z0-9]{20,}/ },
  { name: "anthropic_api_key", pattern: /sk-ant-[A-Za-z0-9\-_]{20,}/ },
  { name: "openai_api_key", pattern: /sk-[A-Za-z0-9]{20,}/ },
  { name: "github_token", pattern: /gh[pousr]_[A-Za-z0-9]{20,}/ },
  { name: "aws_access_key", pattern: /AKIA[0-9A-Z]{16}/ },
  { name: "generic_bearer_token", pattern: /Bearer\s+[A-Za-z0-9\-_.]{20,}/ },
  { name: "generic_secret_assignment", pattern: /(api[_-]?key|secret|password|token)\s*[:=]\s*['"]?[A-Za-z0-9\-_./+=]{16,}['"]?/i }
];

export function checkSecretScanner(content) {
  if (!content) return ok("secret_scanner");
  for (const { name, pattern } of SECRET_PATTERNS) {
    if (pattern.test(content)) {
      return violation("secret_scanner", `Mønster der ligner en hemmelighed fundet (${name})`);
    }
  }
  return ok("secret_scanner");
}

export function checkContractValidation(payload, requiredKeys = []) {
  const missing = requiredKeys.filter(
    (key) => payload == null || payload[key] === undefined || payload[key] === null || payload[key] === ""
  );
  if (missing.length > 0) {
    return violation("contract_validation", `Mangler påkrævede felter: ${missing.join(", ")}`);
  }
  return ok("contract_validation");
}

// Specifik kontrakt for Engineer-rapporter, jf. ENGINEER_PROMPT i
// src/server.js og spec pkt. 28.
const ENGINEER_REPORT_SECTIONS = ["# Task Rapport", "## Status", "## Ændringer", "## Tests", "## Anbefalinger"];

export function checkEngineerReportContract(reportText) {
  const text = reportText || "";
  const missing = ENGINEER_REPORT_SECTIONS.filter((section) => !text.includes(section));
  if (missing.length > 0) {
    return violation("contract_validation", `Engineer-rapport mangler påkrævede sektioner: ${missing.join(", ")}`);
  }
  return ok("contract_validation");
}

// Fælles håndtering, når en Vagtpost-regel slår ud: skriv hændelsen, og
// sæt task til at afvente Owner. Vagtposten "fortolker ikke, reparerer
// ikke" (pkt. 60.1) — den stopper bare og gør overtrædelsen synlig.
export async function recordGuardViolation({ businessId, taskId, agentId, violation: violationResult, context }) {
  await appendEvent({
    businessId,
    taskId,
    agentId: agentId || "vagtpost",
    type: "guard_violation",
    payload: { rule: violationResult.rule, detail: violationResult.detail, context: context || {} }
  });

  if (taskId) {
    await transitionTask({
      taskId,
      toStatus: "AWAITING_OWNER_REVIEW",
      agentId: "vagtpost",
      reason: `guard_violation:${violationResult.rule}`
    });
  }
}
