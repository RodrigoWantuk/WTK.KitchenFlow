# PLAN-0008 Owner Amendment: AI-Generated Recipe Thumbnails

- **Status:** Completed documentation amendment
- **Parent plan:** [PLAN-0008](PLAN-0008-define-lean-launch-ai-economics.md)
- **Type:** Operations / AI economics amendment
- **Priority:** High
- **Owner:** Repository owner decision; documented by OpenAI planning agent
- **Created:** 2026-08-02
- **Last updated:** 2026-08-02T03:10:00Z
- **Branch:** `docs/plan-0008-recipe-thumbnail-ai`
- **Pull request:** Not opened
- **Related ADRs:** ADR-0005, ADR-0006
- **Related active work:** PLAN-0016 / draft PR #23 owns the recipe-artifact protocol and is not modified by this amendment
- **Source:** Repository-owner notebook/configuration example and preferred thumbnail prompt supplied on 2026-08-02

## Purpose

Extend PLAN-0008's AI operation inventory, routing, cost, cache, privacy, and degradation policy with a dedicated operation for generating reusable recipe thumbnails.

This amendment preserves PLAN-0008's completed planning history. It does not reopen the original acquisition plan, authorize direct production provider calls, or silently modify the active PLAN-0016 recipe-artifact protocol.

## Owner decision

Cocinaris intends to use **Gemini 3.1 Flash-Lite Image**, also presented by Google as **Nano Banana 2 Lite**, as the initial evaluated provider/model for recipe thumbnail generation.

The normalized provider model identifier is:

```text
gemini-3.1-flash-lite-image
```

Provider adapters may accept an SDK-specific `models/` prefix when required, but application policy, telemetry, cache metadata, and evaluation records use the normalized identifier above.

The initial evaluated output profile is:

```yaml
operation: recipe.thumbnail.generate.v1
provider: google
model: gemini-3.1-flash-lite-image
temperature: 1.0
topP: 0.95
thinkingLevel: minimal
maximumTextOutputTokens: 1000
responseModalities:
  - image
image:
  aspectRatio: 16:9
  size: 1K
```

These values are a versioned evaluation baseline, not permanent hard-coded domain behavior. The provider adapter must validate the exact current SDK or REST request shape before implementation. Notebook syntax is reference evidence, not the application contract.

Official model documentation currently states that the Flash-Lite image variant supports 1K image output. A later model/version change requires a new evaluated policy version rather than silently changing output size, cost, or quality.

## AI operation classification

Add the following operation to PLAN-0008's AI operation taxonomy:

### `recipe.thumbnail.generate.v1`

- **Tier:** specialized image-generation operation, governed separately from text Tier 1–3 routing;
- **Execution:** durable asynchronous job;
- **Authority:** illustrative media only;
- **Input:** accepted structured visual description of a recipe result;
- **Output:** one generated recipe-thumbnail asset plus provenance metadata;
- **Default format:** 16:9, 1K;
- **Provider baseline:** Google Gemini 3.1 Flash-Lite Image;
- **Fallback:** cached image or deterministic placeholder; recipe creation and cooking remain usable without an image;
- **Mutation boundary:** image output never changes recipe ingredients, instructions, inventory, planning, shopping, safety, or user profile state.

Thumbnail generation must pass through the backend-owned AI Gateway or an application-owned media-generation adapter governed by the same operation registry, secrets, budgets, telemetry, provider policy, and kill switches. The browser never receives provider credentials and never calls the image model directly.

## Recipe visual-description requirement

The ordinary recipe `summary` is user-facing prose and is not a stable image-generation or cache contract. Recipe generation or a deterministic post-acceptance projection must provide a separate, bounded, indexable visual description of the plated result.

The intended contract is conceptually:

```json
{
  "thumbnailVisual": {
    "schemaVersion": "1.0",
    "description": "Cooked chicken breast in tomato sauce, served with white rice and sauteed carrot slices.",
    "visibleComponents": [
      "chicken breast in tomato sauce",
      "white rice",
      "sauteed carrot slices"
    ],
    "plating": "single plated meal",
    "dominantColors": ["red", "white", "orange"],
    "garnish": [],
    "excludedVisuals": ["cutlery", "napkin", "text", "people"]
  }
}
```

The exact schema belongs to the applicable recipe-contract plan. Before implementation, PLAN-0016 or a successor must reconcile the field into the accepted recipe-artifact protocol without losing its current ownership, versioning, and validation rules.

Requirements:

- describe only what should be visibly present in the finished plated dish;
- use accepted recipe components and preparation state;
- do not invent garnish, side dishes, tableware, ingredients, brands, text, people, or serving context;
- distinguish visual description from recipe title, marketing copy, summary, instructions, and food-safety guidance;
- keep the description bounded and suitable for deterministic normalization;
- avoid user identity, pantry contents unrelated to the recipe, allergies, private notes, or household history;
- expose uncertainty when the accepted recipe does not determine appearance sufficiently;
- allow deterministic application validation against the accepted recipe before image generation.

The model may propose the visual descriptor, but backend code owns normalization, validation, fingerprinting, authorization, persistence, and cache lookup.

## Prompt baseline

The repository owner reported strong results with the following prompt pattern, using the recipe summary as the inserted dish description:

```text
Gere uma imagem realista para thumbnail com fundo branco de um prato servido com a receita "{dishDescription}", apenas o prato sobre uma mesa de madeira moderna e fundo desfocado. Sem talheres nem guardanapo, e pouca borda na lateral da imagem fora da região do prato.
```

Preserve this text verbatim as the first benchmark fixture. The apparent combination of a white background and a modern wooden table must be evaluated rather than silently rewritten.

The production prompt must be a versioned template. It may be refined only after controlled evaluation demonstrates better visual fidelity, prompt adherence, cache reuse, latency, or cost. Prompt changes invalidate the corresponding cache namespace.

The generated image must not intentionally include:

- text, labels, recipe names, logos, brand marks, watermarks added by Cocinaris, prices, or nutritional claims;
- cutlery or napkins under the baseline style;
- people, hands, faces, kitchens, or unrelated decorative objects;
- ingredients, garnishes, portions, or side dishes absent from the accepted visual descriptor;
- unsafe preparation claims or visual proof that food is safe to consume.

Provider-applied provenance mechanisms such as SynthID are not removed or bypassed.

## Generation timing and product behavior

The initial cost-safe policy is:

1. do not block recipe suggestion, selection, saving, planning, or cooking on image generation;
2. query the visual cache before reserving provider budget;
3. generate asynchronously only when no acceptable cached asset exists;
4. prefer generating for an accepted, persisted, or explicitly previewed recipe rather than automatically generating every transient candidate;
5. show a deterministic localized placeholder while the job is pending, unavailable, rejected, or failed;
6. never retry continuously on page view or navigation;
7. permit a bounded explicit regeneration path only when authorized and budgeted;
8. retain a previously valid cached image when a provider outage affects optional regeneration.

Whether candidate-selection cards justify generating images for all transient candidates remains an experiment. The decision must compare conversion or selection benefit against latency, image cost, cache-hit rate, and discarded-candidate waste.

## Cache and reuse policy

Image caching is mandatory for economic and latency control.

### Cache key

The backend computes a stable content fingerprint. The model must not supply the authoritative cache key.

The cache namespace includes at least:

```text
thumbnail visual schema version
+ normalized visual descriptor fingerprint
+ prompt-template version
+ provider/model policy version
+ aspect ratio
+ output size
+ style policy version
```

Do not use only the recipe title or raw `summary` as the cache key. Wording changes, translations, recipe revisions, and visually material substitutions would otherwise create false hits or unnecessary misses.

Locale is excluded from the key when all user-visible text is absent and the normalized descriptor is locale-neutral. If prompt language changes output materially, prompt-language policy becomes part of the cache namespace.

### Reuse boundary

A generated asset may be reused across private recipes only when the complete normalized visual fingerprint matches. Reuse does not expose recipe ownership, private recipe text, pantry data, or user identity.

Cache lookup returns only the shared generated asset and safe generation provenance. It never returns another user's private recipe metadata.

### Invalidation

Generate or select a new asset when any visually material input changes, including:

- visible component or preparation-state change;
- plating or side-dish change;
- accepted recipe revision with a different visual fingerprint;
- prompt-template or style-policy version change;
- model-policy change declared visually incompatible;
- aspect-ratio or resolution change;
- moderation, corruption, or asset-quality failure.

A nonvisual wording correction does not invalidate the image when the normalized visual fingerprint remains identical.

### Storage metadata

Persist at least:

- asset ID and content hash;
- cache fingerprint;
- operation and schema version;
- prompt-template version;
- provider and normalized model ID;
- generation policy version;
- aspect ratio, size, MIME type, byte size, and dimensions;
- created timestamp;
- moderation and validation result;
- provider request/job correlation identifier where policy permits;
- measured usage and settled cost;
- reuse count and last-used timestamp;
- lifecycle status and deletion reason.

Do not persist provider credentials, raw private context, or unnecessary full prompts in ordinary operational records.

## Validation and quality gates

The initial evaluation set must contain diverse plated recipes across Portuguese (Brazil), English, and Spanish contexts while keeping the visual descriptor canonical and bounded.

Measure at least:

- correct visible ingredients and preparation states;
- absence of invented side dishes, garnish, utensils, napkins, text, people, and brands;
- recognizable correspondence with the accepted recipe;
- framing, plate occupancy, edge margin, table/background adherence, and 16:9 composition;
- photorealism without deceptive claims that the image is a photograph of the user's result;
- consistency across repeated generations;
- image moderation pass rate;
- empty, malformed, unsupported, or truncated provider responses;
- p50 and p95 latency;
- provider usage and settled cost per successful unique image;
- automatic retry and repair count;
- cache-hit rate;
- duplicate-image reuse rate;
- regeneration rate and reason;
- user acceptance, replacement, and report rate;
- visual-fingerprint false-hit and false-miss rate.

Run at least three repetitions for each benchmark visual descriptor before approving a prompt/model policy version.

The initial provider/model is accepted for production only when operation-specific thresholds for fidelity, policy adherence, latency, failure rate, moderation, and cost are documented and pass. Low price or attractive isolated examples are insufficient.

## Cost and quota controls

The image operation receives dedicated limits separate from text tokens:

- global daily and monthly image-generation spend;
- per-user and per-plan-period image count;
- per-recipe revision generation count;
- concurrent image jobs;
- one automatic retry maximum unless a later policy proves another bound;
- provider/model daily ceiling;
- maximum generated byte size and dimensions;
- cache lookup before allowance reservation;
- no charge to the user for a pure cache hit unless commercial policy explicitly defines value-based credits;
- refund or release of reserved allowance when no usable image is produced;
- separate measurement of generated, cached, rejected, failed, moderated, and regenerated outcomes.

Cost reporting distinguishes:

- unique generated asset cost;
- cached delivery cost;
- failed-attempt cost;
- retry cost;
- storage and delivery cost;
- amortized cost per recipe view, saved recipe, cooking start, and retained user.

## Security, privacy, rights, and safety

- Send only the bounded visual descriptor and style template required for the image.
- Do not send user name, email, internal user ID, household composition, pantry list, allergies, restrictions, private notes, history, or provider credentials.
- Treat the visual description as untrusted model-produced input and validate length, structure, content, and recipe consistency.
- Prevent prompt fragments inside recipe content from overriding the system-owned thumbnail template.
- Do not use uploaded recipe-book images, user photos, copyrighted source photography, logos, or third-party assets as references without a separately approved rights and privacy workflow.
- Generated thumbnails remain illustrative. The UI must not imply that they are photographs of the exact user outcome.
- The thumbnail cannot establish doneness, freshness, storage safety, allergen absence, nutrition, authenticity, or food-safety compliance.
- Support asset reporting and removal for inappropriate, misleading, infringing, or low-quality output.
- Apply retention and deletion policy to generated assets and generation metadata.
- Keep provider keys and billing configuration in backend secret management.

## Failure and degraded behavior

- A provider outage, quota rejection, moderation rejection, timeout, or invalid image never blocks access to the recipe.
- Return a stable job state and safe failure category.
- Use a deterministic placeholder or valid cached image.
- Do not display broken-image controls or repeatedly resubmit on render.
- Do not silently switch to a more expensive image model without an accepted routing policy and reserved budget.
- Kill switches may disable all image generation, one model/provider, free-user generation, regeneration, or new jobs while preserving cached delivery.

## Observability

Record privacy-safe operation metadata:

- operation/schema/prompt/model policy versions;
- provider and actual model;
- cache hit, miss, stale, invalidated, and reused outcome;
- job status, latency, retry, moderation, validation, and failure category;
- input/output usage reported by the provider;
- estimated and settled cost;
- image dimensions, MIME type, and byte size;
- correlation and trace identifiers;
- regeneration and report reason codes.

Do not put the raw visual description, recipe title, private recipe text, prompt, response bytes, user identity, or pantry data in default logs, metrics, or traces.

## Implementation boundaries

This amendment does not implement provider calls. Future implementation requires a separate approved plan covering:

- AI Gateway/media-generation operation registry;
- Google provider adapter and secret configuration;
- durable image-generation jobs;
- object-storage lifecycle and CDN delivery;
- visual-description contract reconciliation;
- deterministic fingerprinting and cache store;
- quota reservation, settlement, refunds, and abuse controls;
- moderation and asset-report workflow;
- OpenAPI/events and generated frontend contracts;
- privacy/export/deletion behavior;
- observability and operational runbook;
- automated evaluations, contract tests, integration tests, and end-to-end degraded behavior.

No frontend code may call Google directly. No model-specific DTO may leak into recipe, inventory, planning, or frontend domain contracts.

## Acceptance criteria

- [x] PLAN-0008 explicitly includes recipe-thumbnail generation as a governed AI operation.
- [x] Nano Banana 2 Lite / Gemini 3.1 Flash-Lite Image is recorded as the initial evaluated model, not an unconditional permanent provider lock-in.
- [x] The owner-provided configuration is preserved as a versioned baseline.
- [x] The owner-provided prompt is preserved verbatim as the first benchmark fixture.
- [x] A separate indexable visual description is required instead of using raw recipe summary as the durable contract.
- [x] The application owns normalization, validation, cache fingerprinting, storage, authorization, budgets, and state.
- [x] Cache-key inputs, reuse boundary, invalidation, and provenance metadata are explicit.
- [x] Generation is optional, asynchronous, fail-soft, and nonauthoritative.
- [x] Privacy, rights, security, safety, cost, observability, and degradation requirements are explicit.
- [x] PLAN-0016 ownership is preserved and future contract reconciliation is identified without modifying its draft PR.
- [x] Implementation requires a separate approved plan.

## Execution state

- **Current run delivery target:** Add a complete owner-approved recipe-thumbnail AI operation amendment to PLAN-0008 without modifying PLAN-0016 or implementing provider calls.
- **Current checkpoint:** Documentation amendment complete on `docs/plan-0008-recipe-thumbnail-ai`.
- **Last completed step:** Defined provider/model baseline, prompt fixture, visual descriptor, deterministic cache, generation timing, budget, privacy, safety, validation, observability, degradation, and implementation boundaries.
- **Exact next action:** Update `docs/plan-status.md`, open a draft documentation PR, and obtain owner review. A later implementation plan may then reconcile the recipe visual-description contract and build the governed provider/cache pipeline.
- **Blockers:** None for documentation. Production implementation requires accepted recipe-contract reconciliation, AI Gateway/media adapter work, object storage, provider privacy review, and measured quality/cost approval.
- **Partially modified areas:** PLAN-0008 amendment and central registry only.
- **Documentation delivered:** This amendment.
- **Validation performed:** Cross-checked PLAN-0008, ADR-0005, AI architecture, cost governance, privacy/security requirements, active PLAN-0016 ownership, the owner-provided notebook/prompt, and current official Google model documentation.
- **Known failures or limitations:** No live generation, pricing benchmark, visual evaluation run, cache implementation, moderation test, or production provider call was performed. Exact SDK syntax and current pricing must be revalidated during implementation.
- **Working tree state:** Connector-managed branch; no local working tree.

## Progress log

### 2026-08-02T03:10:00Z — OpenAI planning agent

- **Run delivery target:** Produce a complete PLAN-0008 amendment for reusable AI-generated recipe thumbnails.
- **Checkpoint:** Amendment authored and committed before central-registry reconciliation.
- **Changes included in the commit:** Added this document with the owner decision, reference configuration and prompt, operation contract, visual description, cache, budgets, privacy, safety, validation, observability, degradation, and handoff.
- **Documentation and code-documentation delivered:** Durable documentation amendment; code-level documentation is not applicable because no executable code changed.
- **Validation performed:** Reviewed repository AI governance and official Google documentation for model identity and 1K image support.
- **Result:** PLAN-0008 now has a bounded thumbnail-generation amendment ready to be registered.
- **Next action:** Reconcile `docs/plan-status.md` and open a draft PR.
- **Blockers or handoff notes:** GitHub connector contents writes are sequential; the registry reconciliation follows immediately in the next commit and is recorded openly.
