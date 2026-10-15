"use strict";

const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineString } = require("firebase-functions/params");
const { createHash } = require("node:crypto");
const { resolvePatientLogin } = require("./login");

initializeApp();
const db = getFirestore();
// This is the same public Firebase Web API key used by the patient page.
const apiKey = defineString("PATIENT_AUTH_WEB_API_KEY", {
  default: "AIzaSyC4l0BaiwsxguCFPWBEF_5xoUv45PWjHqk"
});
const failure = code => new HttpsError(code, "Unable to sign in.");

// Fixed windows are updated transactionally across all function instances.
// IDs contain hashes, never raw national IDs/IPs. Existing deny-all rules protect them.
async function consumeAttempt(nationalID, ip) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const entries = [["national", nationalID, 10], ["ip", ip || "unknown", 40]];
  const refs = entries.map(([kind, value]) => db.collection("_patientLoginAttempts")
    .doc(createHash("sha256").update(`${kind}:${windowStart}:${value}`).digest("hex")));
  await db.runTransaction(async tx => {
    const snapshots = await tx.getAll(...refs);
    if (snapshots.some((s, i) => (s.data()?.count || 0) >= entries[i][2])) {
      throw failure("resource-exhausted");
    }
    snapshots.forEach((s, i) => tx.set(refs[i], {
      count: (s.data()?.count || 0) + 1,
      expiresAt: Timestamp.fromMillis(windowStart + 2 * windowMs)
    }));
  });
}

exports.patientLogin = onCall({
  region: "us-central1", maxInstances: 3, concurrency: 20, timeoutSeconds: 30,
  invoker: "public",
  cors: ["https://nezar2004.github.io"]
}, async request => {
  try {
    return await resolvePatientLogin(request.data, {
      error: failure,
      consumeAttempt: nationalID => consumeAttempt(nationalID, request.rawRequest.ip),
      findPatients: async nationalID => {
        const snapshot = await db.collection("users").where("nationalID", "==", nationalID)
          .limit(2).get();
        return snapshot.docs.map(doc => ({ uid: doc.id, email: doc.data().email }));
      },
      verifyPassword: async (email, password) => {
        const response = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey.value())}`,
          { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, returnSecureToken: true }),
            signal: AbortSignal.timeout(10000) }
        );
        const result = await response.json();
        const code = result.error?.message;
        if (code === "TOO_MANY_ATTEMPTS_TRY_LATER") throw failure("resource-exhausted");
        if (!response.ok) {
          if (["INVALID_LOGIN_CREDENTIALS", "INVALID_PASSWORD", "EMAIL_NOT_FOUND", "USER_DISABLED"].includes(code)) return null;
          throw failure("unavailable");
        }
        // No bypass for accounts requiring a second factor.
        if (result.mfaPendingCredential) throw failure("failed-precondition");
        if (!result.localId) throw failure("unavailable");
        return { uid: result.localId };
      }
    });
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    // Do not log requests, passwords, profiles, Auth responses or raw exception data.
    throw failure("unavailable");
  }
});
