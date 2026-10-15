"use strict";

function normalizeNationalID(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 1776));
}

// Resolve identity only on the server and disclose it only after password verification.
async function resolvePatientLogin(data, deps) {
  const nationalID = normalizeNationalID(data?.nationalID);
  const password = data?.password;
  if (!/^\d{10}$/.test(nationalID) || typeof password !== "string" ||
      !password.length || password.length > 4096) {
    throw deps.error("invalid-argument");
  }
  await deps.consumeAttempt(nationalID);
  const patients = await deps.findPatients(nationalID);
  // Ambiguous IDs must never select an arbitrary patient's account.
  if (patients.length !== 1 || typeof patients[0].email !== "string") {
    throw deps.error("unauthenticated");
  }
  const patient = patients[0];
  const verified = await deps.verifyPassword(patient.email, password);
  if (!verified || verified.uid !== patient.uid) {
    throw deps.error("unauthenticated");
  }
  // Do not return the profile, national ID, password, or REST-issued tokens.
  // The browser signs in normally, preserving Firebase's password/MFA checks.
  return { email: patient.email };
}

module.exports = { normalizeNationalID, resolvePatientLogin };
