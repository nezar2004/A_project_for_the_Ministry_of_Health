# Firebase security rollout

See ../ROLLOUT.md for the coordinated API, frontend and rules deployment order.

Patient and doctor Auth projects remain unchanged. The Node API verifies both identities and uses server credentials for dataofdoctor. Direct booking collection access is denied after the API and matching frontend are live. Public read-only catalog rules in dataofhosp remain unchanged.

The patient-profile rules are a tested prototype with owner-only reads, no enumeration, bounded fields and immutable national ID/creation time. Review before broad rollout.
