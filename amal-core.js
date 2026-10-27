/* Shared, dependency-free helpers. Kept global for the existing HTML pages. */
(function (root) {
  "use strict";
  const settings = { country: "JO", timeZone: "Asia/Amman", currency: "JOD" };
  function language() { return root.document?.documentElement?.lang === "en" ? "en" : "ar"; }
  function text(ar, en) { return language() === "en" ? en : ar; }
  function dateInZone(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: settings.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
    const get = (type) => parts.find(p => p.type === type).value;
    return get("year") + "-" + get("month") + "-" + get("day");
  }
  function clockInZone(date = new Date()) {
    return new Intl.DateTimeFormat("en-GB", { timeZone: settings.timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
  }
  function minutes(value) {
    if (!/^\d{2}:\d{2}$/.test(String(value))) return NaN;
    const [h, m] = value.split(":").map(Number);
    return h < 24 && m < 60 ? h * 60 + m : NaN;
  }
  function slots(doctor, date, now = new Date()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || !Number.isFinite(new Date(date + "T12:00:00Z").getTime())) return [];
    const weekday = new Date(date + "T12:00:00Z").getUTCDay();
    const schedule = doctor.schedule?.[weekday] ?? doctor.schedule?.[String(weekday)];
    if (schedule === false || schedule?.closed || (Array.isArray(doctor.workingDays) && !doctor.workingDays.map(Number).includes(weekday))) return [];
    const start = minutes(schedule?.start || doctor.workStart || "09:00");
    const end = minutes(schedule?.end || doctor.workEnd || "17:00");
    const duration = Number(doctor.slotDuration || 30);
    if (!Number.isInteger(duration) || duration < 5 || duration > 480 || !Number.isFinite(start + end) || start >= end) return [];
    const today = dateInZone(now);
    if (date < today) return [];
    const nowMinute = minutes(clockInZone(now));
    const result = [];
    for (let n = start; n + duration <= end; n += duration) {
      if (date === today && n <= nowMinute) continue;
      result.push(String(Math.floor(n / 60)).padStart(2, "0") + ":" + String(n % 60).padStart(2, "0"));
    }
    return result;
  }
  function doctorKey(doctor) { return String(doctor.doctorKey ?? doctor.id ?? doctor.docId ?? "").trim(); }
  function occupies(booking) { return !["REJECTED", "CANCELLED"].includes(String(booking.status || "PENDING").toUpperCase()); }
  function overlaps(aTime, aDuration, bTime, bDuration) {
    const a = minutes(aTime), b = minutes(bTime);
    return Number.isFinite(a + b) && a < b + Number(bDuration || 30) && b < a + Number(aDuration || 30);
  }
  function lockId(doctorId, date) { return encodeURIComponent(String(doctorId)) + "_" + date; }
  function occupied(booking, doctorId, date, time, duration = 30) {
    return occupies(booking) && String(booking.doctor_id) === String(doctorId) && booking.date === date && overlaps(booking.time, booking.slot_duration, time, duration);
  }
  function phone(value) {
    let p = String(value || "").replace(/[\s()-]/g, "");
    if (/^00\d/.test(p)) p = "+" + p.slice(2);
    if (/^0[0-9]{9}$/.test(p)) p = "+962" + p.slice(1);
    return /^\+[1-9][0-9]{6,14}$/.test(p) ? p : null;
  }
  function money(value) { return new Intl.NumberFormat(language() === "en" ? "en-JO" : "ar-JO", { style: "currency", currency: settings.currency }).format(Number(value) || 0); }
  function nextOccurrence(reminder, now = new Date()) {
    const initial = new Date(reminder.date + "T" + reminder.time);
    if (!Number.isFinite(initial.getTime())) return null;
    if (!["daily", "weekly"].includes(reminder.repeat)) return initial;
    const next = new Date(initial);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const firstDay = new Date(next.getFullYear(), next.getMonth(), next.getDate());
    const days = Math.max(0, Math.round((today - firstDay) / 86400000));
    const interval = reminder.repeat === "weekly" ? 7 : 1;
    next.setDate(next.getDate() + Math.floor(days / interval) * interval);
    if (next < now) next.setDate(next.getDate() + interval);
    return next;
  }
  function readList(storage, key) {
    try { const result = JSON.parse(storage.getItem(key) || "[]"); return Array.isArray(result) ? result : []; } catch { return []; }
  }
  function userKey(kind, uid) { return "amal:" + kind + ":" + uid; }
  function status(status) {
    const labels = {
      PENDING: ["بانتظار المراجعة", "Pending"],
      APPROVED: ["مؤكد", "Approved"],
      REJECTED: ["مرفوض", "Rejected"],
      CANCELLED: ["ملغى", "Cancelled"],
      RESCHEDULED: ["تم تغيير الموعد", "Rescheduled"]
    };
    const pair = labels[String(status || "").toUpperCase()] || labels.PENDING;
    return text(pair[0], pair[1]);
  }
  root.Amal = { settings, language, text, dateInZone, clockInZone, minutes, slots, doctorKey, occupies, overlaps, lockId, occupied, phone, money, nextOccurrence, readList, userKey, status };
})(typeof window === "undefined" ? globalThis : window);
