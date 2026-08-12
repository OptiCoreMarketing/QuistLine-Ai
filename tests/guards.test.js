import assert from "assert";
import {
  checkMassDeletion,
  checkFileDeletion,
  checkLoopGuard,
  checkBudgetGuard,
  checkTimeoutGuard,
  checkPathGuard,
  checkSecretScanner,
  checkContractValidation,
  checkEngineerReportContract
} from "../src/guards.js";

console.log("Kører tests for Vagtposten lag 1 (trin 2, side 2.1, spec pkt. 60.1/84)...");

// --- Masse-sletning: >50 linjer i én fil, eller >150 i én task ---
assert.strictEqual(checkMassDeletion({ linesRemovedInFile: 50, linesRemovedInTask: 50 }).violated, false, "50 linjer i én fil er grænsen, ikke over den");
assert.strictEqual(checkMassDeletion({ linesRemovedInFile: 51, linesRemovedInTask: 0 }).violated, true, "51 linjer i én fil skal blokeres");
assert.strictEqual(checkMassDeletion({ linesRemovedInFile: 10, linesRemovedInTask: 151 }).violated, true, "151 linjer samlet i en task skal blokeres, selv fordelt på flere filer");
console.log("✓ checkMassDeletion respekterer pkt. 84's tærskler (50/fil, 150/task)");

// --- Filsletning: enhver, ingen tærskel ---
assert.strictEqual(checkFileDeletion({ isFileDeletion: false }).violated, false, "Almindelig redigering er ikke filsletning");
assert.strictEqual(checkFileDeletion({ isFileDeletion: true }).violated, true, "Enhver filsletning skal blokeres, uanset omfang");
console.log("✓ checkFileDeletion blokerer altid, uden tærskel");

// --- Løkke-værn: 3 identiske tool-kald i træk ---
const call = { tool: "write_file", args: { path: "a.txt" } };
assert.strictEqual(checkLoopGuard([call, call]).violated, false, "To identiske kald er endnu ikke en løkke");
assert.strictEqual(checkLoopGuard([call, call, call]).violated, true, "Tre identiske kald i træk skal opdages som en løkke");
assert.strictEqual(
  checkLoopGuard([call, { tool: "write_file", args: { path: "b.txt" } }, call]).violated,
  false,
  "Tre kald der IKKE er identiske (forskellige args) skal ikke opdages som en løkke"
);
console.log("✓ checkLoopGuard opdager præcis 3 identiske kald i træk, ikke færre eller forskellige");

// --- Budget-værn: 2x estimat (i tokens), ellers 20.000 tokens fallback (pkt.95) ---
assert.strictEqual(checkBudgetGuard({ spentTokens: 1000, estimateTokens: 1000 }).violated, false, "2x estimatet er grænsen, ikke over den");
assert.strictEqual(checkBudgetGuard({ spentTokens: 2001, estimateTokens: 1000 }).violated, true, "Over 2x estimatet skal blokeres");
assert.strictEqual(checkBudgetGuard({ spentTokens: 20_000 }).violated, false, "20.000 tokens uden estimat er fallback-grænsen, ikke over den");
assert.strictEqual(checkBudgetGuard({ spentTokens: 20_001 }).violated, true, "Over 20.000 tokens uden estimat skal blokeres");
console.log("✓ checkBudgetGuard bruger 2x-multiplikator med estimat og 20.000 tokens-fallback uden (pkt.95)");

// --- Timeout-værn: 2x estimeret varighed, absolut loft 45 min ---
assert.strictEqual(checkTimeoutGuard({ elapsedMs: 20_000, estimatedMs: 10_000 }).violated, false, "2x estimeret varighed er grænsen, ikke over den");
assert.strictEqual(checkTimeoutGuard({ elapsedMs: 20_001, estimatedMs: 10_000 }).violated, true, "Over 2x estimeret varighed skal blokeres");
assert.strictEqual(checkTimeoutGuard({ elapsedMs: 45 * 60 * 1000 + 1 }).violated, true, "Over 45 min absolut, selv uden estimat, skal blokeres");
assert.strictEqual(checkTimeoutGuard({ elapsedMs: 5000 }).violated, false, "Kort varighed uden estimat er ikke en overtrædelse");
console.log("✓ checkTimeoutGuard håndhæver både den relative og den absolutte grænse");

// --- Sti-værn: skrivning uden for tilladte mapper ---
assert.strictEqual(checkPathGuard({ writePath: "src/server.js", allowedRoots: ["src", "tests"] }).violated, false, "Skrivning inden for en tilladt rod er OK");
assert.strictEqual(checkPathGuard({ writePath: "../etc/passwd", allowedRoots: ["src"] }).violated, true, "Skrivning uden for projektet skal blokeres");
assert.strictEqual(checkPathGuard({ writePath: "secrets/keys.env", allowedRoots: ["src", "tests"] }).violated, true, "Skrivning til en mappe, der ikke står på listen, skal blokeres");
console.log("✓ checkPathGuard blokerer skrivning uden for de tilladte rødder");

// --- Hemmeligheds-scanner ---
assert.strictEqual(checkSecretScanner("Dette er en almindelig rapport uden hemmeligheder.").violated, false, "Almindelig tekst skal ikke give falsk alarm");
assert.strictEqual(checkSecretScanner("Her er nøglen: gsk_abcdefghijklmnopqrstuvwxyz123456").violated, true, "En Groq-nøgle i teksten skal opdages");
assert.strictEqual(checkSecretScanner("API_KEY=supersecretvalue1234567890").violated, true, "Et generisk nøgle-tildeling-mønster skal opdages");
console.log("✓ checkSecretScanner opdager kendte nøgle-mønstre uden at fejlalarmere på almindelig tekst");

// --- Kontraktvalidering (generisk) ---
assert.strictEqual(checkContractValidation({ toolsRequired: [] }, ["toolsRequired"]).violated, false, "Til stede felt (selv tomt array) opfylder kontrakten");
assert.strictEqual(checkContractValidation({}, ["toolsRequired"]).violated, true, "Manglende påkrævet felt skal afvises");
console.log("✓ checkContractValidation afviser payloads, der mangler påkrævede felter");

// --- Kontraktvalidering: Engineer-rapportens 5 sektioner ---
const validReport = "# Task Rapport\n## Status\nFærdig\n## Ændringer\n...\n## Tests\n...\n## Anbefalinger\n...";
assert.strictEqual(checkEngineerReportContract(validReport).violated, false, "En rapport med alle 5 sektioner skal bestå");
assert.strictEqual(checkEngineerReportContract("Bare noget tekst uden struktur.").violated, true, "En rapport uden de påkrævede sektioner skal afvises");
assert.strictEqual(checkEngineerReportContract("# Task Rapport\n## Status\nOK").violated, true, "En delvis rapport (mangler Ændringer/Tests/Anbefalinger) skal afvises");
console.log("✓ checkEngineerReportContract håndhæver ENGINEER_PROMPT's 5 påkrævede sektioner");

console.log("✓ Alle guard-tests bestået.");
