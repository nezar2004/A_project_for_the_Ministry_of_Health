"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const vm = require("node:vm");

function page(error) {
  const html = readFileSync(join(__dirname, "../../login_Patient.html"), "utf8");
  const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1]
    .replace(/import\s+[\s\S]*?\s+from\s+"[^"]+";/g, "");
  const elements = new Map();
  const calls = [], alerts = [];
  const get = id => {
    if (!elements.has(id)) elements.set(id, { value: "", disabled: false });
    return elements.get(id);
  };
  const window = { location: { href: "" } };
  const context = {
    document: { getElementById: get }, window,
    alert: message => alerts.push(message),
    initializeApp: () => ({}), getAuth: () => ({}), getFirestore: () => ({}),
    getFunctions: () => ({}),
    httpsCallable: () => async data => {
      calls.push({ type: "callable", nationalID: data.nationalID });
      if (error) throw { code: error };
      assert.equal(data.password, " exact password ");
      return { data: { email: "patient@example.test" } };
    },
    signInWithEmailAndPassword: async (auth, email, password) => {
      calls.push({ type: "signin", email });
      assert.equal(password, " exact password ");
    }
  };
  vm.runInNewContext(script, context);
  get("loginNationalID").value = "٠١٢٣٤٥٦٧٨٩";
  get("loginPassword").value = " exact password ";
  return { get, calls, alerts, window };
}

test("page normalizes national ID, verifies via callable, then signs in and redirects", async () => {
  const p = page();
  await p.get("loginBtn").onclick();
  assert.deepEqual(p.calls, [
    { type: "callable", nationalID: "0123456789" },
    { type: "signin", email: "patient@example.test" }
  ]);
  assert.equal(p.window.location.href, "Patient_booking_page.html");
  assert.equal(p.get("loginBtn").disabled, false);
});
test("page distinguishes bad credentials from service and throttle failures", async () => {
  for (const [error, pattern] of [
    ["functions/unauthenticated", /غير صحيحة/],
    ["functions/unavailable", /تعذر الاتصال بخدمة/],
    ["functions/resource-exhausted", /15 دقيقة/]
  ]) {
    const p = page(error);
    await p.get("loginBtn").onclick();
    assert.match(p.alerts[0], pattern);
    assert.equal(p.calls.length, 1);
    assert.equal(p.window.location.href, "");
    assert.equal(p.get("loginBtn").disabled, false);
  }
});
