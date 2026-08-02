# GitHub Actions — PLAN-0016 remediation after PLAN-0018

## Validating PR tip `2f0d24a` (current Draft PR #25 head)

Exact head: `2f0d24adc44bf5f1ba61f8e43402d38aa39e201f`

| Workflow | Run ID | Result |
| --- | --- | --- |
| Backend | [30731251404](https://github.com/RodrigoWantuk/WTK.Cocinaris/actions/runs/30731251404) | success |
| PLAN-0005 validation | [30731251471](https://github.com/RodrigoWantuk/WTK.Cocinaris/actions/runs/30731251471) | success |
| Frontend | [30731251438](https://github.com/RodrigoWantuk/WTK.Cocinaris/actions/runs/30731251438) | success |
| Frontend | [30731249962](https://github.com/RodrigoWantuk/WTK.Cocinaris/actions/runs/30731249962) | success |

## Prior remediation code tip `68c04fc` (product changes + CI proof)

Exact head: `68c04fc236f30d3cab0fdd444242cc5fdeecb251`

| Workflow | Run ID | Result |
| --- | --- | --- |
| Backend | [30730920972](https://github.com/RodrigoWantuk/WTK.Cocinaris/actions/runs/30730920972) | success |
| PLAN-0005 validation | [30730920959](https://github.com/RodrigoWantuk/WTK.Cocinaris/actions/runs/30730920959) | success |
| Frontend | [30730919691](https://github.com/RodrigoWantuk/WTK.Cocinaris/actions/runs/30730919691) | success |
| Frontend (audit flake re-run) | [30730920952](https://github.com/RodrigoWantuk/WTK.Cocinaris/actions/runs/30730920952) | success after `gh run rerun --failed` |

PLAN-0018 Fail tip `814af25` remains historical. These tables are implementation-agent CI proof only.
