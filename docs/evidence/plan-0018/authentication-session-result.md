# TEST-0018-003 — Authentication / session

Harness: `scripts/plan-0005/keycloak-p0-auth.mjs` with `PLAN0005_EVIDENCE_DIR=docs/evidence/plan-0018`.

- **Exact SHA:** `814af253814d0ec7f8b0adbbca9c50040b5bab07`
- **API:** `https://localhost:7443` (Release)
- **Result:** **Passed** — 12/12 checks
- **JSON:** `authentication-session-result.json` (copy of reports/keycloak-p0-auth.json)

Covered: Authorization Code login, safe return URL, distinct internal user IDs, HttpOnly/Secure session cookies, no OIDC tokens in storage/HTML/JS-visible cookies, CSRF missing/invalid/foreign rejected, create with valid CSRF, owner/other detail isolation, logout invalidation, post-logout mutation 401.

Limitation: `KITCHENFLOW_SMOKE_ALLOW_UNTRUSTED_LOCAL_CERTIFICATE=1` used because the ASP.NET development certificate is not in the system trust store on this host.
