# PLAN-0006: Refine the Lovable Product Design Brief

- **Status:** Validating
- **Type:** Documentation
- **Priority:** High
- **Owner:** AI product and UX planning agent
- **Created:** 2026-07-29
- **Last updated:** 2026-07-29
- **Branch:** `agent/plan-0006-refine-lovable-design-brief`
- **Pull request:** Not opened
- **Related implementation plan:** PLAN-0004
- **Related issues:** None
- **Related ADRs:** ADR-0001, ADR-0004, ADR-0006
- **Dependencies:** PLAN-0002 merged

## Objective

Refine PLAN-0004 with an accepted general visual and experience direction for the first Lovable generations while preserving Lovable's authority to design page composition, information hierarchy, responsive layout, and interaction details.

The refinement must enable a highly navigable, heavily mocked, responsive single-page application prototype that supports early stakeholder validation without embedding rigid wireframes or pretending mocked modules are production-ready.

## Scope

### Included

- General product personality and visual direction.
- General color, typography, iconography, imagery, motion, tone, and density guidance.
- SPA-like client navigation and device-adaptive behavior.
- Two prototype fidelity layers: contract-ready inventory and broad mocked product exploration.
- Mock data, scenario switching, prototype gallery, and no-dead-action requirements.
- Clear separation between prototype-only behavior and production integration.
- Updated Lovable Project Knowledge and initial Plan-mode prompt requirements.
- Updated PLAN-0004 phases, risks, acceptance criteria, execution state, and progress log.
- Reconciliation of PLAN-0002 delivery state after PR #6 merge.

### Excluded

- Wireframes, screen sketches, pixel-level layouts, fixed navigation composition, or prescribed component placement.
- Final logo artwork or generated brand assets.
- Executable frontend code.
- Lovable project creation or account-level actions.
- Backend or OpenAPI changes.
- Starting PLAN-0004 implementation.

## Requirements and constraints

- Do not prescribe a screen-by-screen layout.
- Do not include ASCII wireframes or fixed desktop/mobile navigation diagrams.
- Lovable must be invited to propose and justify the information architecture and responsive composition.
- The experience must remain intuitive, direct, calm, accessible, and suitable for adults.
- Early generations must be extensively mocked and navigable across the broader accepted first-release product surface.
- Mock actions must navigate, mutate mock state, display a deliberate result, or explicitly identify a prototype-only limitation; inert controls are prohibited.
- Prototype-only adapters, fixtures, scenario controls, and routes must remain isolated and removable or disableable for production builds.
- Inventory remains the only module connected to PLAN-0003 during this implementation plan.
- No mock page may imply that AI, notifications, shopping, planning, recipes, or cooking execution are already implemented in the backend.
- Existing security, localization, accessibility, repository, and Lovable integration constraints remain binding.

## Execution phases

### Phase 1: Register and reconcile

- [x] Confirm PR #6 merge.
- [x] Create PLAN-0006 and register it.
- [x] Reconcile PLAN-0002 delivery to `Merged`.

**Exit criteria:** PLAN-0006 is active and the central registry reflects current delivery state.

### Phase 2: Refine PLAN-0004

- [x] Add general design direction without wireframes.
- [x] Add SPA and responsive experience principles.
- [x] Add contract-ready and broad mocked prototype layers.
- [x] Add required mocked modules, scenario fixtures, and prototype gallery.
- [x] Update Project Knowledge and Plan-mode prompt instructions.
- [x] Update phases, risks, acceptance criteria, execution state, and progress log.

**Exit criteria:** PLAN-0004 can be handed to Lovable without further basic visual-direction questions and without constraining its page-design capability.

### Phase 3: Validate and deliver

- [ ] Verify no screen sketch or fixed layout was introduced.
- [ ] Verify mock scope is separated from live integration scope.
- [ ] Verify no backend or security boundary changed.
- [ ] Compare branch with `main` and review every changed file.
- [ ] Open a pull request.
- [ ] Mark PLAN-0006 completed while keeping PLAN-0004 ready for implementation.

**Exit criteria:** A cohesive documentation-only PR is open and directly usable by the frontend agent and Lovable.

## Testing and validation plan

- Manual traceability against the stakeholder instruction in this plan.
- Review PLAN-0004 for contradictions with PLAN-0002, accepted ADRs, and product/domain documents.
- Search for prohibited wireframe or fixed-layout requirements.
- Verify prototype-only routes and data cannot be mistaken for live backend capabilities.
- Verify PLAN-0004 still gates live API integration on PLAN-0003's OpenAPI milestone.
- Verify `docs/plan-status.md` contains each plan exactly once.

## Cross-cutting impact

### Security and privacy

No executable security behavior changes. The refined plan keeps browser-token, Keycloak, API, mock-data, and production-data boundaries explicit. Prototype fixtures use synthetic data only.

### Food safety

Mocked expiration and food-state content do not make safety guarantees. Prototype scenarios may demonstrate attention states but label uncertainty appropriately.

### AI behavior and cost

No AI provider call is added. Mocked AI experiences are local prototype simulations and do not imply live model execution or consume tokens.

### Localization and accessibility

The visual direction supports English, Portuguese (Brazil), and Spanish, text expansion, keyboard operation, assistive technologies, reduced motion, and responsive widths.

### Operations and observability

No runtime or infrastructure change. Prototype mode is required to be controllable through build configuration and unavailable in production by default.

## Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Visual guidance becomes a rigid wireframe | Medium | High | State design principles and outcomes, not page composition |
| Lovable produces generic recipe-app visuals | High | Medium | Define product personality, anti-patterns, and general brand direction |
| Broad mock prototype is mistaken for implemented scope | High | High | Explicit prototype labels, isolated adapters, production-disable requirement |
| Mock controls become inert demos | High | High | Require every control to navigate, mutate state, or explain its prototype status |
| Broad mock work delays inventory integration | Medium | High | Separate fidelity layers and keep PLAN-0003 OpenAPI milestone binding |

## Acceptance criteria

- [x] PLAN-0004 contains accepted general visual and experience direction.
- [x] No wireframe, ASCII screen sketch, or fixed responsive layout is prescribed.
- [x] Lovable retains responsibility for page composition and information architecture.
- [x] SPA-like navigation and full device adaptability are explicit.
- [x] Contract-ready and broad mocked prototype layers are explicit and separated.
- [x] The broad prototype includes the accepted first-release journeys and forms needed for navigation validation.
- [x] Mock actions are functional within the prototype and no dead controls are accepted.
- [x] Prototype scenario switching and a validation gallery are required.
- [x] Mock data and controls are isolated from production behavior.
- [x] Project Knowledge and Plan-mode prompt instructions are updated.
- [x] PLAN-0002 delivery is reconciled to `Merged`.
- [x] PLAN-0004 remains `Ready`, not falsely marked as implemented.
- [ ] Full branch validation is complete and a PR is open.

## Execution state

- **Current checkpoint:** PLAN-0004 has been fully refined with design principles, Lovable design authority, SPA behavior, two fidelity layers, broad mock workflows, scenarios, prototype gallery, and production-isolation requirements.
- **Last completed step:** Phase 2 PLAN-0004 refinement.
- **Exact next action:** Compare the branch against `main`, inspect all changed files, open the pull request, then finalize PLAN-0006 delivery state.
- **Blockers:** None.
- **Partially modified areas:** Final validation and PR delivery remain.
- **Validation performed:** Reviewed the revised PLAN-0004 against stakeholder constraints, PLAN-0002, accepted architecture, security, localization, and accessibility boundaries.
- **Known failures or limitations:** Final Lovable-generated runtime, exact tokens, layout, navigation composition, and brand assets remain intentionally unresolved until execution.
- **Working tree state:** Clean after this commit.

## Progress log

### 2026-07-29 — AI product and UX planning agent

- **Checkpoint:** Registered the Lovable design-brief refinement.
- **Changes included in the commit:** Added PLAN-0006; reconciled PLAN-0002 delivery; registered the active documentation work.
- **Validation performed:** Reviewed current PLAN-0004, registry, PR #6 merge state, and stakeholder constraints.
- **Result:** Refinement work is explicitly bounded and does not start frontend implementation.
- **Next action:** Update PLAN-0004 with general design and prototype guidance.
- **Blockers or handoff notes:** Do not introduce screen sketches or fixed layout instructions.

### 2026-07-29 — AI product and UX planning agent

- **Checkpoint:** PLAN-0004 design and prototype brief refined.
- **Changes included in the commit:** Rewrote PLAN-0004 to add general product personality, color/type/icon/image/motion direction, SPA and responsive principles, two fidelity layers, broad mock workflows, synthetic scenarios, development-only gallery, no-dead-control rule, mock/live isolation, refined Project Knowledge and Plan-mode prompt, tests, phases, risks, and acceptance criteria.
- **Validation performed:** Confirmed the document contains no screen sketch, ASCII wireframe, fixed navigation structure, or pixel-level layout. Confirmed only Layer A can connect to PLAN-0003 and Layer B remains synthetic.
- **Result:** Lovable receives strong product direction while retaining page-design and information-architecture authority.
- **Next action:** Perform final branch review and open the PR.
- **Blockers or handoff notes:** None.

## Completion and handoff checklist

- [x] PLAN-0004 refinement is complete.
- [x] Validation confirms no rigid screen design was introduced.
- [ ] Documentation and registry are synchronized after final PR delivery.
- [ ] Pull request reports scope and validation.
- [x] PLAN-0004 remains ready for a future frontend agent.
- [ ] Branch cleanup responsibility is recorded.
