# Browser smoke evidence

Automated Playwright smoke (`yarn smoke:browser` / CI `yarn smoke:browser:ci`) writes reports under this directory at **runtime**.

## Canonical evidence

- **Source of truth for a given CI run:** the `browser-smoke-report` GitHub Actions artifact attached to that workflow run.
- Generated files (`browser-smoke-report.json`, `.html`, `failures/`, `traces/`, `videos/`) are **not** durable product documentation and must not be committed as “current” evidence.
- Do not treat a JSON file checked into git as proof for the current branch tip.

## Local / CI output

| File | Purpose |
|---|---|
| `browser-smoke-report.json` | Machine-readable results for the run that generated it |
| `browser-smoke-report.html` | Human-readable dump of the same report |
| `failures/`, `traces/`, `videos/` | Optional debug artifacts |

Report fields include `testedCodeSha`, `githubRunId`, `githubRunAttempt`, `githubEventName`, workflow name, prototype/production base URLs, `testedModes`, toolchain versions, and per-check results.

On `pull_request` events, `testedCodeSha` / `prHeadSha` refer to the PR head; `syntheticMergeSha` (when set) is the Actions merge commit and must not be cited as Implementation SHA.

See `browser-smoke-report.schema.example.json` for the expected shape.
