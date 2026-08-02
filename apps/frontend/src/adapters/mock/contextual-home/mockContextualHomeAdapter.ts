import type {
  ContextualHomeAdapter,
  ContextualHomeQuery,
  HomeQuickChooserDefinition,
  HomeSourceResult,
  HomeSuggestionCandidate,
} from "@/contracts/contextualHome";

/**
 * Synthetic scenario identifiers for prototype/test only.
 * Never import this module from production composition roots.
 */
export type MockHomeScenarioId =
  | "default"
  | "newUser"
  | "noMenu"
  | "menuAvailable"
  | "emptyInventory"
  | "inventoryAttention"
  | "incompleteProfile"
  | "confirmedProfile"
  | "aiUnavailable"
  | "menuFailed"
  | "inventoryFailed"
  | "profileFailed"
  | "menuStale"
  | "noCandidates"
  | "allSourcesReady";

export const MOCK_HOME_SCENARIO_IDS: readonly MockHomeScenarioId[] = [
  "default",
  "newUser",
  "noMenu",
  "menuAvailable",
  "emptyInventory",
  "inventoryAttention",
  "incompleteProfile",
  "confirmedProfile",
  "aiUnavailable",
  "menuFailed",
  "inventoryFailed",
  "profileFailed",
  "menuStale",
  "noCandidates",
  "allSourcesReady",
] as const;

interface MockHomeScenario {
  menu: HomeSourceResult;
  inventory: HomeSourceResult;
  profile: HomeSourceResult;
  chooser: HomeQuickChooserDefinition;
  chooserSuggestions: HomeSourceResult;
}

function candidate(
  partial: Omit<HomeSuggestionCandidate, "sourceLabelKey"> & {
    sourceLabelKey?: string;
  },
): HomeSuggestionCandidate {
  return {
    freshness: "current",
    sourceLabelKey: partial.sourceLabelKey ?? "home.source.label.menu",
    ...partial,
  };
}

const MENU_ITEM = candidate({
  id: "mock-menu-lentil-stew",
  titleKey: "home.fixture.menu.lentilStew",
  sourceLabelKey: "home.source.label.menu",
  reasonCode: "planned_for_daypart",
  estimatedTotalMinutes: 35,
  effortCode: "medium",
});

const INVENTORY_ITEM = candidate({
  id: "mock-inv-spinach-omelette",
  titleKey: "home.fixture.inventory.spinachOmelette",
  sourceLabelKey: "home.source.label.inventory",
  reasonCode: "uses_attention_product",
  estimatedTotalMinutes: 15,
  effortCode: "low",
  attentionInfluenced: true,
});

const PROFILE_ITEM = candidate({
  id: "mock-profile-grain-bowl",
  titleKey: "home.fixture.profile.grainBowl",
  sourceLabelKey: "home.source.label.profile",
  reasonCode: "matches_confirmed_preferences",
  estimatedTotalMinutes: 25,
  effortCode: "low",
});

const CHOOSER_ITEM = candidate({
  id: "mock-chooser-simple-soup",
  titleKey: "home.fixture.chooser.simpleSoup",
  sourceLabelKey: "home.source.label.quickChooser",
  reasonCode: "matches_request_answers",
  estimatedTotalMinutes: 20,
  effortCode: "low",
});

const DEFAULT_QUESTIONS: HomeQuickChooserDefinition = {
  recommendationCapability: "available",
  questions: [
    {
      id: "time_available",
      promptKey: "home.chooser.q.time",
      options: [
        { id: "under_20", labelKey: "home.chooser.a.under20" },
        { id: "about_40", labelKey: "home.chooser.a.about40" },
        { id: "flexible", labelKey: "home.chooser.a.flexible" },
      ],
    },
    {
      id: "shopping_ok",
      promptKey: "home.chooser.q.shopping",
      options: [
        { id: "use_what_i_have", labelKey: "home.chooser.a.useWhatIHave" },
        { id: "ok_to_buy", labelKey: "home.chooser.a.okToBuy" },
      ],
    },
  ],
};

function empty(
  tier: HomeSourceResult["tier"],
  statusReasonKey: string,
): HomeSourceResult {
  return { tier, status: "empty", statusReasonKey, items: [] };
}

function failed(
  tier: HomeSourceResult["tier"],
  statusReasonKey: string,
): HomeSourceResult {
  return { tier, status: "failed", statusReasonKey, items: [] };
}

/** Mock adapter with prototype scenario switching. */
export interface MockContextualHomeAdapter extends ContextualHomeAdapter {
  setScenario(next: MockHomeScenarioId): void;
  getScenario(): MockHomeScenarioId;
}

export function isMockContextualHomeAdapter(
  adapter: ContextualHomeAdapter,
): adapter is MockContextualHomeAdapter {
  const candidate = adapter as Partial<MockContextualHomeAdapter>;
  return (
    typeof candidate.setScenario === "function" &&
    typeof candidate.getScenario === "function"
  );
}

function buildScenario(id: MockHomeScenarioId): MockHomeScenario {
  const base: MockHomeScenario = {
    menu: {
      tier: "menu",
      status: "ready",
      items: [MENU_ITEM],
    },
    inventory: {
      tier: "inventory",
      status: "ready",
      items: [INVENTORY_ITEM],
    },
    profile: {
      tier: "profile",
      status: "ready",
      items: [PROFILE_ITEM],
    },
    chooser: DEFAULT_QUESTIONS,
    chooserSuggestions: {
      tier: "quickChooser",
      status: "ready",
      items: [CHOOSER_ITEM],
    },
  };

  switch (id) {
    case "newUser":
    case "noCandidates":
      return {
        menu: empty("menu", "home.source.empty.menu"),
        inventory: empty("inventory", "home.source.empty.inventory"),
        profile: {
          tier: "profile",
          status: "incomplete",
          statusReasonKey: "home.source.incomplete.profile",
          items: [],
        },
        chooser: DEFAULT_QUESTIONS,
        chooserSuggestions: empty(
          "quickChooser",
          "home.source.empty.quickChooser",
        ),
      };
    case "noMenu":
      return {
        ...base,
        menu: empty("menu", "home.source.empty.menu"),
      };
    case "menuAvailable":
    case "allSourcesReady":
    case "default":
      return base;
    case "emptyInventory":
      return {
        ...base,
        inventory: empty("inventory", "home.source.empty.inventory"),
      };
    case "inventoryAttention":
      return {
        ...base,
        inventory: {
          tier: "inventory",
          status: "ready",
          items: [INVENTORY_ITEM],
        },
      };
    case "incompleteProfile":
      return {
        ...base,
        profile: {
          tier: "profile",
          status: "incomplete",
          statusReasonKey: "home.source.incomplete.profile",
          items: [],
        },
      };
    case "confirmedProfile":
      return base;
    case "aiUnavailable":
      return {
        ...base,
        chooser: {
          ...DEFAULT_QUESTIONS,
          recommendationCapability: "unavailable",
        },
        chooserSuggestions: {
          tier: "quickChooser",
          status: "unavailable",
          statusReasonKey: "home.source.unavailable.ai",
          items: [],
        },
      };
    case "menuFailed":
      return {
        ...base,
        menu: failed("menu", "home.source.failed.menu"),
      };
    case "inventoryFailed":
      return {
        ...base,
        inventory: failed("inventory", "home.source.failed.inventory"),
      };
    case "profileFailed":
      return {
        ...base,
        profile: failed("profile", "home.source.failed.profile"),
      };
    case "menuStale":
      return {
        ...base,
        menu: {
          tier: "menu",
          status: "stale",
          statusReasonKey: "home.source.stale.menu",
          items: [
            {
              ...MENU_ITEM,
              freshness: "stale",
            },
          ],
        },
      };
    default: {
      const _exhaustive: never = id;
      void _exhaustive;
      return base;
    }
  }
}

/**
 * Prototype/test contextual-home adapter backed by synthetic fixtures.
 * Must not be imported by production composition roots.
 */
export function createMockContextualHomeAdapter(options?: {
  scenario?: MockHomeScenarioId;
}): MockContextualHomeAdapter {
  let scenarioId: MockHomeScenarioId = options?.scenario ?? "default";

  const adapter: MockContextualHomeAdapter = {
    /** Prototype scenario switch used by ScenarioBar / tests. */
    setScenario(next: MockHomeScenarioId): void {
      scenarioId = next;
    },
    getScenario(): MockHomeScenarioId {
      return scenarioId;
    },
    async loadMenuSource(): Promise<HomeSourceResult> {
      return buildScenario(scenarioId).menu;
    },
    async loadInventorySource(): Promise<HomeSourceResult> {
      return buildScenario(scenarioId).inventory;
    },
    async loadProfileSource(): Promise<HomeSourceResult> {
      return buildScenario(scenarioId).profile;
    },
    async getQuickChooserDefinition(): Promise<HomeQuickChooserDefinition> {
      return buildScenario(scenarioId).chooser;
    },
    async loadQuickChooserSuggestions(
      query: ContextualHomeQuery,
    ): Promise<HomeSourceResult> {
      const scenario = buildScenario(scenarioId);
      if (scenario.chooser.recommendationCapability === "unavailable") {
        return scenario.chooserSuggestions;
      }
      // Answers remain request-scoped; presence only gates returning fixtures.
      if (
        !query.quickChooserAnswers ||
        Object.keys(query.quickChooserAnswers).length === 0
      ) {
        return empty("quickChooser", "home.source.empty.quickChooser");
      }
      return scenario.chooserSuggestions;
    },
  };

  return adapter;
}
