# Patient login by national ID

The login page no longer queries private `users` documents before authentication.
The `patientLogin` callable in **nabdapp-3a077** resolves the national ID server-side,
checks the password with Firebase Authentication, and returns the email only after
the authenticated UID matches the profile document ID. The browser then signs in
using Firebase's normal email/password SDK. Patients enter only national ID and
password. Existing accounts, UIDs, password reset, and profile documents are retained.
Registration still collects a recovery email; no email removal or data migration is required.

## Deployment order (required before merging the page)

1. Use Node.js 22 and the official Firebase CLI. Authenticate with the Google account
   that owns `nabdapp-3a077`. Functions deployment requires the project's Blaze billing
   plan; do not enable billing without the owner's approval.
2. From the repository root:
   ```sh
   npm --prefix firebase/functions ci
   npm --prefix firebase/functions test
   firebase deploy --project nabdapp-3a077 --only functions:patient-auth
   ```
   `PATIENT_AUTH_WEB_API_KEY` defaults to the existing public web key. If a different
   key is selected, it must belong to this same project and permit the Identity
   Toolkit API from the function. Browser-only referrer restrictions cannot authorize
   a server call. Configure a separate server-compatible key if necessary; retain
   restrictions on the browser key.
3. Keep the current `nabdapp.firestore.rules` unchanged. In particular, keep
   `allow list: if false`. No public national-ID-to-email collection is needed.
4. Set a Firestore TTL policy on `_patientLoginAttempts.expiresAt` to remove expired
   throttle entries. Limit evaluation uses fixed 15-minute windows and does not
   depend on TTL deletion timing. Entries store hashes and counts, never raw IDs,
   IP addresses, passwords, or patient profiles.
5. Merge/deploy `login_Patient.html` only after the callable deploy succeeds. The
   page and callable both use `us-central1`.
6. With an existing disposable patient account, sign out, open a private browser,
   and verify correct national ID/password reaches the booking page. Verify wrong
   password and unknown national ID both show the same credential error; verify
   direct unauthenticated `users` reads remain denied. Arabic digits should work.
   Verify registration and email password reset still work. If the function is
   unavailable, the page should report a service issue rather than wrong credentials.

## Limits

- No live deployment or real-patient password test is performed by the unit tests.
- Duplicate national IDs fail closed and require an administrator to resolve the
  duplicate profiles. Registration currently does not reserve unique national IDs.
- MFA-enabled accounts are explicitly rejected pending a dedicated second-factor UI.
- The callable uses same-origin CORS for the existing GitHub Pages host. CORS is not
  authentication; transactions additionally limit attempts to 10 per national ID and
  40 per client IP per fixed 15-minute window. A distributed attack can still exhaust
  those windows; monitor usage and configure App Check before a broader production rollout.
- Passwords travel over TLS to this project's callable and to Firebase Auth for
  verification; they are never stored or logged by this implementation.
- Roll back only the page if needed; do not loosen Firestore rules to recover login.

References: [callables](https://firebase.google.com/docs/functions/callable),
[Auth password verification](https://firebase.google.com/docs/reference/rest/auth#section-sign-in-email-password).
