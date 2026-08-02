import type {
  ContextualHomeAdapter,
  ContextualHomeQuery,
  HomeQuickChooserDefinition,
  HomeSourceResult,
} from "@/contracts/contextualHome";

const unavailable = (tier: HomeSourceResult["tier"]): HomeSourceResult => ({
  tier,
  status: "unavailable",
  statusReasonKey: "home.source.unavailable",
  items: [],
});

const UNAVAILABLE_CHOOSER: HomeQuickChooserDefinition = {
  recommendationCapability: "unavailable",
  questions: [],
};

/**
 * Production stand-in until PLAN-0021 wires live home sources.
 * Never falls back to mock fixtures.
 */
export function createUnavailableContextualHomeAdapter(): ContextualHomeAdapter {
  return {
    async loadMenuSource(): Promise<HomeSourceResult> {
      return unavailable("menu");
    },
    async loadInventorySource(): Promise<HomeSourceResult> {
      return unavailable("inventory");
    },
    async loadProfileSource(): Promise<HomeSourceResult> {
      return unavailable("profile");
    },
    async getQuickChooserDefinition(): Promise<HomeQuickChooserDefinition> {
      return UNAVAILABLE_CHOOSER;
    },
    async loadQuickChooserSuggestions(
      _query: ContextualHomeQuery,
    ): Promise<HomeSourceResult> {
      return unavailable("quickChooser");
    },
  };
}
