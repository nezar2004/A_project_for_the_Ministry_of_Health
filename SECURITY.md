# Security notes

- Patient sign-in uses national ID and password. The trusted server performs a bounded exact national ID lookup and verifies the password with Firebase before returning the account email. Client profile enumeration stays denied. Password reset uses email. The dedicated server has read-only access to patient profiles for this lookup.
- Patient profile documents are intended to be readable only by their owner.
- The doctor dashboard queries bookings by the authenticated doctor's email instead of downloading the full collection.
- The hospitals database is a public, read-only catalog in the proposed rules.
- The bookings project still requires an identity consolidation or trusted API migration before restrictive production rules can be deployed safely.
- Never commit service-account credentials, Firebase CLI credentials, or AI provider keys.
