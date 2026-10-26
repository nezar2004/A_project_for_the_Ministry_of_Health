# Reliability update: rollout checklist

These changes are prepared on a separate branch. Do not mark the Firebase migration complete merely because the browser tests pass.

## Included

- Email-based patient sign-in with the existing Firebase accounts.
- Atomic booking creation, status changes, and rescheduling. Both booking views commit together.
- Per-doctor, per-day reservations in `appointmentSlots`, including interval overlap checks.
- Existing bookings are checked before reserving; new concurrent clients also contend on the reservation document.
- Account-scoped local reminders, real daily/weekly recurrence while the page is open, and escaped reminder names.
- Server-confirmed booking history without locally invented bookings.
- Doctor catalog verification and saved availability; past appointments cannot be selected for rescheduling.
- Explicit Asia/Amman appointment times, JOD estimates, local/international phone input.
- Separate page scripts, accessible selection controls and dialogs, reduced-motion support, updated shell cache.
- Arabic/English chatbot requests and safe API error handling.

## Required before publishing the frontend

1. Connect Firebase and inspect the *deployed* rules of `nabdapp-3a077`, `dataofhosp`, and `dataofdoctor`.
2. Confirm `appointmentSlots` transactions and existing booking collections work with the intended identities. Do not open patient records to make cross-project requests work.
3. Consolidate authentication into the bookings project, or route booking operations through a trusted server that verifies both existing identity providers. Migrating account data or changing Firebase rules is not automated by this branch.
4. Deploy restrictive rules *after* the matching authenticated booking path is tested. The proposed patient-profile rules already require email-based sign-in.
5. Test with an approved patient test account and doctor test account in a staging Firebase environment: book, concurrent booking conflict, approve, reject, reschedule, notes, and cancel.
6. Backfill reservations for active legacy bookings before allowing mixed old and new clients. During cutover, pause legacy booking writes or enforce the new reservation invariant in the trusted server. A query before a transaction alone cannot lock old clients.
7. Apply real clinic schedules. Optional doctor catalog fields: `workingDays` (0=Sunday through 6=Saturday), `workStart`, `workEnd`, `slotDuration`, or `schedule[weekday] = {start, end, closed}`. Existing records keep the former 09:00–17:00 default until configured.
8. Confirm the stored catalog currency before publishing JOD estimates. Insurance uses `insuranceCopayRate` only when the department explicitly defines it; otherwise the full catalog cost is shown as an estimate.
9. Merge/deploy, verify patient and doctor workflows, then retire the old frontend. Retain the previous commit for code rollback.

## Current limits

- Local reminders require this device and an open page; they are not background push delivery.
- The browser does not enforce authorization by itself. Firebase rules or a trusted API must do so.
- A health check verifies HTTP availability, not Gemini credentials or booking permissions.
- Current country data and registration ID validation still target Jordan. International phone formatting does not imply worldwide clinic support.
- Dependency audits, accessibility certification, and legal compliance are not asserted by the regression suite.

## Validation

Run `npm ci && npm test` in each repository. Web tests use synthetic in-memory data and JSDOM; API tests mock Gemini and never use real API keys. No production patient records are used or modified.
