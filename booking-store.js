import { collection, doc, getDoc, getDocs, query, where, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

let db, auth;
function init(database, authentication) { db = database; auth = authentication; }
const busyMessage = () => Amal.text("هذا الموعد حُجز للتو. اختر وقتًا آخر.", "This appointment was just reserved. Choose another time.");
async function forDoctor(email) {
  const snap = await getDocs(query(collection(db, "allBookings"), where("doctor_email", "==", String(email).trim().toLowerCase())));
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}
function lockRef(doctorId, date) { return doc(db, "appointmentSlots", Amal.lockId(doctorId, date)); }
function checkEntries(entries, booking, ignoreId) {
  return Object.entries(entries).some(([id, value]) => id !== ignoreId && Amal.occupied({ ...value, doctor_id: booking.doctor_id }, booking.doctor_id, booking.date, booking.time, booking.slot_duration));
}
async function create(payload) {
  const user = auth.currentUser;
  if (!user) throw new Error(Amal.text("سجل الدخول أولًا.", "Sign in first."));
  const booking = { ...payload, slot_duration: Number(payload.slot_duration) || 30, user_uid: user.uid, user_email: String(user.email || "").toLowerCase(), doctor_email: String(payload.doctor_email || "").trim().toLowerCase() };
  if (!booking.doctor_id || !booking.doctor_email || !booking.date || !booking.time) throw new Error(Amal.text("بيانات الموعد غير مكتملة.", "Appointment details are incomplete."));
  const existing = await forDoctor(booking.doctor_email);
  if (existing.some(b => Amal.occupied({ ...b, doctor_id: booking.doctor_id }, booking.doctor_id, booking.date, booking.time, booking.slot_duration))) throw new Error(busyMessage());
  const main = doc(collection(db, "allBookings"));
  const mirror = doc(db, "users", user.uid, "bookings", main.id);
  const day = lockRef(booking.doctor_email, booking.date);
  const saved = { ...booking, booking_id: booking.booking_id || main.id, source_booking_doc_id: mirror.id };
  await runTransaction(db, async tx => {
    const daySnap = await tx.get(day);
    const entries = daySnap.exists() ? daySnap.data().entries || {} : {};
    if (checkEntries(entries, saved, main.id)) throw new Error(busyMessage());
    const entry = { doctor_id: saved.doctor_id, date: saved.date, time: saved.time, slot_duration: saved.slot_duration, status: saved.status };
    tx.set(day, { entries: { ...entries, [main.id]: entry }, updatedAt: serverTimestamp() });
    tx.set(main, saved);
    tx.set(mirror, saved);
  });
  return main.id;
}
async function update(booking, patch) {
  if (!auth.currentUser) throw new Error(Amal.text("سجل الدخول أولًا.", "Sign in first."));
  const main = doc(db, "allBookings", booking.id);
  const intended = { ...booking, ...patch };
  if (Amal.occupies(intended)) {
    const existing = await forDoctor(booking.doctor_email);
    if (existing.some(b => b.id !== booking.id && Amal.occupied({ ...b, doctor_id: intended.doctor_id }, intended.doctor_id, intended.date, intended.time, intended.slot_duration))) throw new Error(busyMessage());
  }
  await runTransaction(db, async tx => {
    const currentSnap = await tx.get(main);
    if (!currentSnap.exists()) throw new Error(Amal.text("الحجز غير موجود.", "Booking no longer exists."));
    const current = currentSnap.data();
    if (current.date !== booking.date || current.time !== booking.time || current.status !== booking.status) throw new Error(Amal.text("تغيّر الحجز، حدّث القائمة وحاول مجددًا.", "Booking changed. Refresh and try again."));
    const next = { ...current, ...patch, updatedAt: serverTimestamp() };
    const oldRef = lockRef(current.doctor_email || current.doctor_id, current.date);
    const newRef = lockRef(next.doctor_email || next.doctor_id, next.date);
    const oldSnap = await tx.get(oldRef);
    const newSnap = newRef.path === oldRef.path ? oldSnap : await tx.get(newRef);
    const oldEntries = { ...(oldSnap.exists() ? oldSnap.data().entries || {} : {}) };
    const newEntries = newRef.path === oldRef.path ? oldEntries : { ...(newSnap.exists() ? newSnap.data().entries || {} : {}) };
    delete oldEntries[booking.id];
    if (Amal.occupies(next)) {
      if (checkEntries(newEntries, next, booking.id)) throw new Error(busyMessage());
      newEntries[booking.id] = { doctor_id: next.doctor_id, date: next.date, time: next.time, slot_duration: Number(next.slot_duration) || 30, status: next.status };
    } else delete newEntries[booking.id];
    tx.set(oldRef, { entries: oldEntries, updatedAt: serverTimestamp() });
    if (newRef.path !== oldRef.path) tx.set(newRef, { entries: newEntries, updatedAt: serverTimestamp() });
    tx.update(main, { ...patch, updatedAt: serverTimestamp() });
    if (current.user_uid && current.source_booking_doc_id) tx.set(doc(db, "users", current.user_uid, "bookings", current.source_booking_doc_id), { ...patch, updatedAt: serverTimestamp() }, { merge: true });
  });
}
window.AmalBooking = { init, create, update, forDoctor };
