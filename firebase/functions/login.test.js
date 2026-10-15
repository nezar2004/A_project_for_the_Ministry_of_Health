"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { normalizeNationalID, resolvePatientLogin } = require("./login");

function setup(overrides = {}) {
  const calls = [];
  return { calls, deps: {
    error: code => Object.assign(new Error(code), { code }),
    consumeAttempt: async () => calls.push("rate"),
    findPatients: async () => { calls.push("lookup"); return [{ uid: "existing-uid", email: "patient@example.test" }]; },
    verifyPassword: async (email, password) => {
      calls.push("verify");
      assert.equal(email, "patient@example.test");
      assert.equal(password, " password stays exact ");
      return { uid: "existing-uid" };
    }, ...overrides
  } };
}
const input = { nationalID: "1234567890", password: " password stays exact " };

test("existing profile logs in without a public Firestore query or account migration", async () => {
  const { deps, calls } = setup();
  assert.deepEqual(await resolvePatientLogin(input, deps), { email: "patient@example.test" });
  assert.deepEqual(calls, ["rate", "lookup", "verify"]);
});
test("Arabic and Persian digits normalize without losing leading zeroes", () => {
  assert.equal(normalizeNationalID(" ٠١٢٣٤٥٦٧٨٩ "), "0123456789");
  assert.equal(normalizeNationalID("۰۱۲۳۴۵۶۷۸۹"), "0123456789");
});
test("malformed inputs never reach database or Auth", async () => {
  for (const data of [null, {}, { ...input, nationalID: 1234567890 }, { ...input, nationalID: "123" }, { ...input, password: "" }, { ...input, password: "x".repeat(4097) }]) {
    const { deps, calls } = setup();
    await assert.rejects(resolvePatientLogin(data, deps), { code: "invalid-argument" });
    assert.deepEqual(calls, []);
  }
});
test("missing and duplicate national IDs disclose no profile", async () => {
  for (const patients of [[], [{ uid: "a", email: "a@test.invalid" }, { uid: "b", email: "b@test.invalid" }], [{ uid: "a" }]]) {
    const { deps, calls } = setup({ findPatients: async () => patients });
    await assert.rejects(resolvePatientLogin(input, deps), { code: "unauthenticated" });
    assert.deepEqual(calls, ["rate"]);
  }
});
test("incorrect password or mismatched Auth UID never returns email", async () => {
  for (const verified of [null, { uid: "another-patient" }]) {
    const { deps } = setup({ verifyPassword: async () => verified });
    await assert.rejects(resolvePatientLogin(input, deps), { code: "unauthenticated" });
  }
});
test("throttled requests cannot look up accounts or verify passwords", async () => {
  const { deps, calls } = setup({ consumeAttempt: async () => { throw Object.assign(new Error(), { code: "resource-exhausted" }); } });
  await assert.rejects(resolvePatientLogin(input, deps), { code: "resource-exhausted" });
  assert.deepEqual(calls, []);
});
