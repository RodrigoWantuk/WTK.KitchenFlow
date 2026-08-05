# PLAN-0027 independent retest matrix

| Area | Method | Result | Evidence |
|---|---|---|---|
| Candidate identity | fetch, ancestor, name-status, workflow SHA metadata | Passed | environment.json |
| F-0026-01 same-key ×50 | independent HTTP | Passed | integration-plan0027 / sut-backend |
| F-0026-01 key reuse mismatch | independent HTTP | Passed | integration-plan0027 |
| F-0026-01 different keys | independent HTTP | Passed | integration-plan0027 |
| F-0026-02 CHECK IS TRUE + SQL matrix | independent SQL + pg_get_constraintdef | Passed | integration-plan0027; sut-idempotent-migration |
| F-0026-03 consumedBy 0/1/49/50/51/55 | independent HTTP | Passed | integration-plan0027 |
| F-0026-03 producedBy independence | independent HTTP | Passed | integration-plan0027 |
| Immutable measured yield | independent HTTP | Passed | integration-plan0027 |
| Owner nondisclosure | independent HTTP | Passed | integration-plan0027 |
| Adjustment same-key ×50 | independent HTTP | Passed | integration-plan0027 |
| Full backend suite on SUT | restore/format/build/test | Passed | sut-backend-summary |
| Migration script twice + count | compose postgres | Passed | sut-idempotent-summary |
| No pending model changes | dotnet ef | Passed | sut-migrations-vulns |
| OpenAPI export/check/lint | local API | Passed | sut-openapi |
| Frontend gates | yarn matrix | Passed | sut-frontend-summary |
| Browser smoke | yarn smoke:browser:ci | Passed | sut-browser-summary |
| Firefox native zoom | xvfb-run | Passed | sut-browser-summary |
| Handoff workflow wording | docs inspection | **P3 F-0027-01** | findings.md |
