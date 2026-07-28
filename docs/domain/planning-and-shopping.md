# Planning and Shopping

- **Status:** Accepted
- **Last updated:** 2026-07-28

## Optional module rule

Menu planning is optional. A user can start recipe selection and cooking at any time without an active menu plan.

A menu entry is an intention, shortcut, and source of preparation or purchase actions. It is not an obligation.

## Planning states

- **Simulation:** calculates possibilities and shopping impact without persistent reservations, tasks, or active-plan mutation.
- **Draft:** stores an editable candidate plan but does not become the operating plan.
- **Accepted:** may create flexible reservations, preparation actions, reminders, and shopping requirements.

## Planning input

The user chooses any relevant subset of:

- planning period;
- meal count and optional dates or times;
- number of people and portions;
- maximum cooking sessions;
- inventory inclusion;
- products or quantities to lock;
- products that should be prioritized;
- additional purchase permission or limits;
- equipment or technique;
- time, effort, cleanup, skill, variety, nutrition, and cost priorities;
- preference for leftovers, batch preparation, component preparation, or freezing.

The system may use profile defaults but must display or allow overrides when they materially affect the result.

## Suggestion and selection

The AI may generate many normalized recipe possibilities. The user can:

- accept all or individual recipes;
- reject and replace one recipe;
- lock accepted recipes;
- change portions;
- request an ingredient or technique adaptation;
- regenerate only the remaining candidates;
- prepare immediately;
- schedule;
- save;
- favorite;
- discard.

A localized change must not silently regenerate the entire accepted plan.

## Menu entry

A planned entry can contain:

- recipe UUID;
- current or pinned revision;
- date and time, when fixed;
- flexible period, when unscheduled;
- portions;
- expected product requirements;
- inventory reservations;
- preparation, thawing, or preservation actions;
- required and optional missing products;
- readiness state;
- reminder policy.

Before the intended time, the system checks current inventory and may propose a purchase, substitution, recipe adaptation, localized replacement, reschedule, or preparation action.

## Shopping requirements

Shopping is derived from actual requirements rather than a concatenated ingredient list.

The calculation considers:

- selected recipe portions;
- available and reserved lots;
- products that must be preserved for another use;
- package sizes and units;
- expected product remainder;
- future uses for the remainder;
- time until the next intended purchase;
- perishability and storage capability;
- required versus optional products;
- substitutions and user constraints.

## Shopping item categories

- required;
- recommended;
- optional;
- already available;
- expected to run out;
- preservation or operational item.

Operational items may include storage materials required by an accepted freezing or portioning strategy.

## Package remainder example

```text
Planned recipe need: 600 g chicken
Current usable lot: 200 g
Net purchase need: 400 g
Available package: 1,000 g
Expected remainder: 600 g
Suggested handling:
- reserve 200 g for another selected meal
- freeze 400 g in two portions
```

The system must not assume a package size without a source or user confirmation.

## Planned versus actual purchase

When a purchase differs from the plan, KitchenFlow records the real product and quantity, then proposes impact:

- keep the recipe and adapt the product;
- change portions;
- add the original product to a later purchase;
- replace only affected recipes;
- preserve accepted meals and repurpose the extra product;
- make no plan change.

The actual purchase becomes inventory only after confirmation. The accepted plan is not silently rewritten.

## Cancellation and change

When a planned meal is not prepared, the system may:

- mark it skipped or cancelled;
- ask whether to reschedule;
- release or retain reservations;
- recalculate shelf-life attention;
- propose preservation;
- update future shopping requirements.

Automation follows explicit user policy and remains reversible.
