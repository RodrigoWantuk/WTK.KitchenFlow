# PLAN-0026 independent validation matrix

| Area | Method | Result | Evidence |
|---|---|---|---|
| Candidate identity | fetch, PR view, ancestor check, name-status diff, workflow list | Passed | `environment.json`, claim command |
| Immutable measured declared yield after output mutate | HTTP independent test | Passed | integration Plan0026 |
| Qualitative yield API path | HTTP + unit | Passed | unit/integration Plan0026 |
| Declared-yield DB constraint matrix | direct SQL probe | **Failed (F-0026-02)** | `reports/declared-yield-constraint-probe.txt` |
| Preparation atomicity / rollback | existing store + integration suite | Passed | sut-dotnet-test |
| Partial remainders / multi-parent | independent HTTP | Passed | integration Plan0026 |
| Multi-parent stale middle version | independent HTTP | Passed | integration Plan0026 |
| Concurrent same-key preparation | independent HTTP (10 iters) | **Failed (F-0026-01)** | integration/sut-dotnet-test |
| Preparation key reuse mismatch | independent HTTP | Passed | integration Plan0026 |
| Adjustment same-key replay ×50 | independent HTTP | Passed | integration Plan0026 |
| Null/malformed HTTP boundaries | independent HTTP | Passed | integration Plan0026 |
| Provenance bound 50 + ordering | independent HTTP | Passed bound; **P2 F-0026-03** no truncation signal | integration Plan0026 |
| Append-only preparation history | independent HTTP/SQL | Passed | integration Plan0026 |
| Ownership nondisclosure | independent HTTP two users | Passed | integration Plan0026 |
| Shelf-life evidence domain rules | independent unit | Passed | unit Plan0026 |
| Audit privacy for preparation | independent HTTP + DB read | Passed | integration Plan0026 |
| Reservation/lock boundary | source + domain docs inspection | Passed (compatibility-only; not enforced) | inspection |
| Migrations / OpenAPI / vulns | SUT scripts + API export | Passed | sut-openapi / sut-contracts |
| Frontend generated-client + quality gates | SUT yarn matrix | Passed | sut-frontend-gates |
| Browser smoke | yarn smoke:browser:ci on SUT | Passed | sut-browser-smoke-summary.txt |
| Existing inventory regression | full backend integration (non-Plan0026) | Passed | sut-dotnet-test (161/163; 2 fails are Plan0026 findings only) |
| Firefox native zoom | xvfb-run validate:firefox-native-zoom on SUT | Passed | sut-firefox-native-zoom-summary.txt |
