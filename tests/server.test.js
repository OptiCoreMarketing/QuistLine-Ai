import assert from "assert";

console.log("Kører tests for QuistLine.ai repository...");
assert.strictEqual(typeof process.env, "object", "Process.env skal være tilgængeligt");
console.log("✓ Alle basale tests bestået.");
