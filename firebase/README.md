# Firebase security rollout

The application currently uses three Firebase projects. The `nabdapp` rules can be deployed after
the email-based patient login ships. The hospitals project is treated as a public read-only catalog.

Do not deploy restrictive rules to `dataofdoctor` until patient and doctor identities are consolidated
or booking writes are moved behind a trusted API. The current browser clients authenticate against
different Firebase projects, so their tokens are not accepted by `dataofdoctor`.

Protected data must never be made readable merely to make a cross-project client request work.
