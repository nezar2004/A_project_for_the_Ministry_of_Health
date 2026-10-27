# Booking reliability and authorization rollout

Patient Auth stays in nabdapp-3a077, doctor Auth in dataofhosp, and booking data in dataofdoctor. No account, password, or booking migration is required.

## Prepared changes
- Email patient login using existing accounts; owner-only patient profile rules.
- Render verifies Firebase identity tokens from both existing Auth projects.
- Doctor actions also require an administrator-managed doctorAccess document matching the verified UID and email. Browser session fields confer no permissions.
- Booking creation, status changes, notes and rescheduling update both booking copies atomically. Reservations and legacy appointment queries prevent overlap.
- Prices and doctor identities come from the public catalog. Availability responses exclude patient details.
- Account-scoped reminders, accessible dialogs and controls, improved phone/date validation, separated scripts and updated service worker cache.

## Required cutover order
1. Review backend changes and frontend PR together. Keep current deployed commits and rules for rollback.
2. Create a dedicated service account in dataofdoctor with roles/datastore.user only; put its JSON credential directly in Render FIREBASE_SERVICE_ACCOUNT_JSON. Never store a personal OAuth token or commit a credential.
3. Seed doctorAccess only for exact existing catalog email/UID matches. 77 accounts matched; doctor055@dataofhosp.com has no matching account and requires administrator review. No passwords are changed.
4. Deploy backend and composite index, check /api/booking-health, then validate synthetic booking workflows.
5. Publish frontend and verify its patient and doctor flows, then immediately close direct booking database access with firebase.bookings.json. Mixed legacy writers must not remain enabled. Old open tabs will need a reload.
6. Deploy firebase.nabdapp.json once email login is live; keep dataofhosp public catalog rules unchanged.
7. Verify booking, conflict, approval/rejection, reschedule, notes, cancellation and account isolation after cutover.

## Validation
25 browser and HTTP facade tests; 26 backend/chat/security tests; 10 real Firestore emulator rule tests. All use synthetic data. No production patient records were read or changed during these tests.

Run npm ci and npm test in both repositories. Run the rules test via Firebase CLI with Java 21, demo-amal-rules and firebase.test.json. CI includes these checks.

## Limits and operations
- Jordan catalog, registration ID validation, Asia/Amman and JOD estimates remain the supported scope. No catalog currency fields exist; confirm JOD amounts with the operator before international use.
- Existing clinic schedules default to 09:00–17:00 until actual working hours are configured. Slot duration is retained from catalog.
- Local reminders require an open page on the same device. Doctor dashboard refreshes every 20 seconds while visible.
- Free Render instances may take time to wake. Gemini can return temporary upstream errors.
- The Firestore rules are a tested prototype; review them before broadly sharing the app. They deny patient enumeration and direct booking access, but do not replace an organizational security review.
- The dedicated service account can access the bookings database through IAM. Protect and rotate its key in Render; audit administrator-managed doctorAccess changes.
