import {
  createMockContextualHomeAdapter,
  type MockHomeScenarioId,
} from "@/adapters/mock/contextual-home/mockContextualHomeAdapter";
import { createUnavailableContextualHomeAdapter } from "@/adapters/live/unavailableContextualHomeAdapter";
import { HOME_SOURCE_TIERS } from "@/contracts/contextualHome";

const query = {
  locale: "en",
  timeZone: "America/Sao_Paulo",
  now: new Date("2026-08-02T15:00:00Z"),
};

describe("contextual home adapters", () => {
  it("unavailable adapter returns capability-unavailable for every tier", async () => {
    const adapter = createUnavailableContextualHomeAdapter();
    const menu = await adapter.loadMenuSource(query);
    const inventory = await adapter.loadInventorySource(query);
    const profile = await adapter.loadProfileSource(query);
    const chooser = await adapter.getQuickChooserDefinition(query);
    const suggestions = await adapter.loadQuickChooserSuggestions(query);
    expect(menu.status).toBe("unavailable");
    expect(menu.retryable).toBe(false);
    expect(inventory.status).toBe("unavailable");
    expect(profile.status).toBe("unavailable");
    expect(suggestions.status).toBe("unavailable");
    expect(chooser.recommendationCapability).toBe("unavailable");
    expect(chooser.retryable).toBe(false);
  });

  it("retry recovers after transient menu failures", async () => {
    const adapter = createMockContextualHomeAdapter({
      scenario: "transientMenuFailThenRecover",
      menuFailTimes: 1,
    });
    expect((await adapter.loadMenuSource(query)).status).toBe("failed");
    expect((await adapter.loadMenuSource(query)).status).toBe("ready");
  });

  it("rich scenarios expose missing, thaw, shopping and uncertainty projections", async () => {
    const missing = await createMockContextualHomeAdapter({
      scenario: "menuMissingRequired",
    }).loadMenuSource(query);
    expect(missing.items[0].missingRequirements?.length).toBeGreaterThan(0);
    expect(missing.items[0].shoppingState).toBe("required");

    const thaw = await createMockContextualHomeAdapter({
      scenario: "menuNeedsThaw",
    }).loadMenuSource(query);
    expect(thaw.items[0].preparationRequirements?.[0].kind).toBe("thaw");

    const uncertain = await createMockContextualHomeAdapter({
      scenario: "withUncertainty",
    }).loadInventorySource(query);
    expect(uncertain.items[0].uncertaintyCodes).toContain("quantity_uncertain");
  });

  it("mock default scenario preserves tier order and labels", async () => {
    const adapter = createMockContextualHomeAdapter({ scenario: "default" });
    const results = [
      await adapter.loadMenuSource(query),
      await adapter.loadInventorySource(query),
      await adapter.loadProfileSource(query),
    ];
    expect(results.map((r) => r.tier)).toEqual([
      "menu",
      "inventory",
      "profile",
    ]);
    expect(HOME_SOURCE_TIERS.slice(0, 3)).toEqual([
      "menu",
      "inventory",
      "profile",
    ]);
    expect(results.every((r) => r.status === "ready")).toBe(true);
    expect(results[0].items[0].sourceLabelKey).toBe("home.source.label.menu");
    expect(results[1].items[0].attentionInfluenced).toBe(true);
  });

  it.each([
    ["noMenu", "empty"],
    ["emptyInventory", "empty"],
    ["incompleteProfile", "incomplete"],
    ["menuFailed", "failed"],
    ["inventoryFailed", "failed"],
    ["profileFailed", "failed"],
    ["menuStale", "stale"],
    ["aiUnavailable", "unavailable"],
  ] as const)(
    "scenario %s yields expected status for the targeted source",
    async (scenario, expected) => {
      const adapter = createMockContextualHomeAdapter({
        scenario: scenario as MockHomeScenarioId,
      });
      if (
        scenario === "noMenu" ||
        scenario === "menuFailed" ||
        scenario === "menuStale"
      ) {
        expect((await adapter.loadMenuSource(query)).status).toBe(expected);
        expect((await adapter.loadInventorySource(query)).status).toBe("ready");
      }
      if (scenario === "emptyInventory" || scenario === "inventoryFailed") {
        expect((await adapter.loadInventorySource(query)).status).toBe(
          expected,
        );
        expect((await adapter.loadMenuSource(query)).status).toBe("ready");
      }
      if (scenario === "incompleteProfile" || scenario === "profileFailed") {
        expect((await adapter.loadProfileSource(query)).status).toBe(expected);
        expect((await adapter.loadMenuSource(query)).status).toBe("ready");
      }
      if (scenario === "aiUnavailable") {
        const def = await adapter.getQuickChooserDefinition(query);
        expect(def.recommendationCapability).toBe("unavailable");
        expect(
          (
            await adapter.loadQuickChooserSuggestions({
              ...query,
              quickChooserAnswers: { time_available: "under_20" },
            })
          ).status,
        ).toBe("unavailable");
      }
    },
  );

  it("quick chooser suggestions stay request-scoped and empty without answers", async () => {
    const adapter = createMockContextualHomeAdapter({ scenario: "default" });
    const empty = await adapter.loadQuickChooserSuggestions(query);
    expect(empty.status).toBe("empty");
    const filled = await adapter.loadQuickChooserSuggestions({
      ...query,
      quickChooserAnswers: { time_available: "under_20" },
    });
    expect(filled.status).toBe("ready");
    expect(filled.items.length).toBeGreaterThan(0);
  });
});
