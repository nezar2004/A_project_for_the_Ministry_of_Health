# Security notes

- Patient sign-in and password reset use email directly; the national ID is no longer queried before authentication.
- Patient profile documents are intended to be readable only by their owner.
- The doctor dashboard queries bookings by the authenticated doctor's email instead of downloading the full collection.
- The hospitals database is a public, read-only catalog in the proposed rules.
- The bookings project still requires an identity consolidation or trusted API migration before restrictive production rules can be deployed safely.
- Never commit service-account credentials, Firebase CLI credentials, or AI provider keys.
