import type {
  ContextualHomeAdapter,
  ContextualHomeQuery,
  HomeQuickChooserDefinition,
  HomeSourceResult,
  HomeSuggestionCandidate,
  HomeSourceTier,
} from "@/contracts/contextualHome";
import {
  homeCatalogText,
  homeSourceLabelKey,
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
  | "menuMissingRequired"
  | "menuNeedsThaw"
  | "emptyInventory"
  | "inventoryAttention"
  | "incompleteProfile"
  | "confirmedProfile"
  | "profileEffortCleanup"
  | "shoppingOptional"
  | "shoppingRequired"
  | "withUncertainty"
  | "aiUnavailable"
  | "menuFailed"
  | "inventoryFailed"
  | "profileFailed"
  | "menuStale"
  | "noCandidates"
  | "oneQuestion"
  | "twoQuestions"
  | "allSourcesReady"
  | "transientMenuFailThenRecover";

export const MOCK_HOME_SCENARIO_IDS: readonly MockHomeScenarioId[] = [
  "default",
  "newUser",
  "noMenu",
  "menuAvailable",
  "menuMissingRequired",
  "menuNeedsThaw",
  "emptyInventory",
  "inventoryAttention",
  "incompleteProfile",
  "confirmedProfile",
  "profileEffortCleanup",
  "shoppingOptional",
  "shoppingRequired",
  "withUncertainty",
  "aiUnavailable",
  "menuFailed",
  "inventoryFailed",
  "profileFailed",
  "menuStale",
  "noCandidates",
  "oneQuestion",
  "twoQuestions",
  "allSourcesReady",
  "transientMenuFailThenRecover",
] as const;

interface MockHomeScenario {
  menu: HomeSourceResult;
  inventory: HomeSourceResult;
  profile: HomeSourceResult;
  chooser: HomeQuickChooserDefinition;
  chooserSuggestions: HomeSourceResult;
}

function candidate(
  partial: Omit<HomeSuggestionCandidate, "sourceLabelKey" | "reasonCodes"> & {
    sourceLabelKey?: string;
    reasonCodes?: readonly string[];
    reasonCode?: string;
  },
): HomeSuggestionCandidate {
  const reasonCodes =
    partial.reasonCodes ??
    (partial.reasonCode
      ? [partial.reasonCode]
      : (["planned_for_daypart"] as const));
  const { reasonCode: _ignored, ...rest } = partial;
  return {
    freshness: "current",
    shoppingState: "not_required",
    sourceLabelKey:
      partial.sourceLabelKey ?? homeSourceLabelKey(partial.sourceTier),
    reasonCodes,
    ...rest,
  };
}

const MENU_READY = candidate({
  id: "mock-menu-lentil-stew",
  title: homeCatalogText("home.fixture.menu.lentilStew"),
  sourceTier: "menu",
  reasonCodes: ["planned_for_daypart"],
  timing: { activeMinutes: 20, totalMinutes: 35 },
  effortCode: "medium",
  cleanupCode: "medium",
  readinessCode: "ready_now",
  availableRequirements: [
    {
      code: "lentils",
      kind: "required",
      label: homeCatalogText("home.requirement.lentils"),
    },
  ],
});

const MENU_MISSING = candidate({
  id: "mock-menu-missing-garlic",
  title: homeCatalogText("home.fixture.menu.missingGarlic"),
  sourceTier: "menu",
  reasonCodes: ["planned_for_daypart"],
  timing: { activeMinutes: 25, totalMinutes: 40 },
  effortCode: "medium",
  cleanupCode: "low",
  readinessCode: "blocked",
  availableRequirements: [
    {
      code: "pasta",
      kind: "required",
      label: homeCatalogText("home.requirement.pasta"),
    },
  ],
  missingRequirements: [
    {
      code: "garlic",
      kind: "required",
      label: homeCatalogText("home.requirement.garlic"),
    },
  ],
  shoppingState: "required",
});

const MENU_THAW = candidate({
  id: "mock-menu-needs-thaw",
  title: homeCatalogText("home.fixture.menu.needsThaw"),
  sourceTier: "menu",
  reasonCodes: ["planned_for_daypart"],
  timing: { activeMinutes: 15, totalMinutes: 30 },
  effortCode: "low",
  cleanupCode: "low",
  readinessCode: "needs_thaw",
  preparationRequirements: [
    {
      code: "thaw_chicken",
      kind: "thaw",
      label: homeCatalogText("home.prep.thawChicken"),
      leadTimeHours: 12,
    },
  ],
});

const INVENTORY_ATTENTION = candidate({
  id: "mock-inv-spinach-omelette",
  title: homeCatalogText("home.fixture.inventory.spinachOmelette"),
  sourceTier: "inventory",
  reasonCodes: ["uses_attention_product"],
  timing: { activeMinutes: 10, totalMinutes: 15 },
  effortCode: "low",
  cleanupCode: "low",
  readinessCode: "ready_now",
  attentionInfluenced: true,
});

const PROFILE_FIT = candidate({
  id: "mock-profile-grain-bowl",
  title: homeCatalogText("home.fixture.profile.grainBowl"),
  sourceTier: "profile",
  reasonCodes: ["matches_confirmed_preferences"],
  timing: { activeMinutes: 15, totalMinutes: 25 },
  effortCode: "low",
  cleanupCode: "low",
  readinessCode: "ready_now",
});

const PROFILE_EFFORT = candidate({
  id: "mock-profile-roast-tray",
  title: homeCatalogText("home.fixture.profile.roastTray"),
  sourceTier: "profile",
  reasonCodes: ["matches_confirmed_preferences"],
  timing: { activeMinutes: 20, totalMinutes: 55 },
  effortCode: "medium",
  cleanupCode: "high",
  readinessCode: "ready_now",
});

const SHOPPING_OPTIONAL = candidate({
  id: "mock-menu-optional-herb",
  title: homeCatalogText("home.fixture.menu.optionalHerb"),
  sourceTier: "menu",
  reasonCodes: ["planned_for_daypart"],
  timing: { activeMinutes: 18, totalMinutes: 30 },
  effortCode: "low",
  cleanupCode: "low",
  readinessCode: "ready_now",
  missingRequirements: [
    {
      code: "fresh_parsley",
      kind: "optional",
      label: homeCatalogText("home.requirement.parsley"),
    },
  ],
  shoppingState: "optional",
});

const SHOPPING_REQUIRED = candidate({
  ...MENU_MISSING,
  id: "mock-menu-shopping-required",
});

const UNCERTAIN = candidate({
  id: "mock-inv-uncertain-stew",
  title: homeCatalogText("home.fixture.inventory.uncertainStew"),
  sourceTier: "inventory",
  reasonCodes: ["uses_attention_product"],
  timing: { activeMinutes: 25, totalMinutes: 45 },
  effortCode: "medium",
  cleanupCode: "medium",
  readinessCode: "needs_prep",
  uncertaintyCodes: ["quantity_uncertain"],
  attentionInfluenced: true,
});

const CHOOSER_ITEM = candidate({
  id: "mock-chooser-simple-soup",
  title: homeCatalogText("home.fixture.chooser.simpleSoup"),
  sourceTier: "quickChooser",
  reasonCodes: ["matches_request_answers"],
  timing: { activeMinutes: 12, totalMinutes: 20 },
  effortCode: "low",
  cleanupCode: "low",
  readinessCode: "ready_now",
});

const ONE_QUESTION: HomeQuickChooserDefinition = {
  capabilityStatus: "available",
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
  ],
};

const DEFAULT_QUESTIONS: HomeQuickChooserDefinition = {
  capabilityStatus: "available",
  questions: [
    ONE_QUESTION.questions[0],
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
  tier: HomeSourceTier,
  statusReasonKey: string,
): HomeSourceResult {
  return {
    tier,
    status: "empty",
    retryable: false,
    statusReasonKey,
    items: [],
  };
}

function failed(
  tier: HomeSourceTier,
  statusReasonKey: string,
  retryable = true,
): HomeSourceResult {
  return { tier, status: "failed", retryable, statusReasonKey, items: [] };
}

function ready(
  tier: HomeSourceTier,
  items: HomeSuggestionCandidate[],
): HomeSourceResult {
  return { tier, status: "ready", retryable: false, items };
}

/** Mock adapter with prototype scenario switching. */
export interface MockContextualHomeAdapter extends ContextualHomeAdapter {
  setScenario(next: MockHomeScenarioId): void;
  getScenario(): MockHomeScenarioId;
}

export function isMockContextualHomeAdapter(
  adapter: ContextualHomeAdapter,
): adapter is MockContextualHomeAdapter {
  const candidateAdapter = adapter as Partial<MockContextualHomeAdapter>;
  return (
    typeof candidateAdapter.setScenario === "function" &&
    typeof candidateAdapter.getScenario === "function"
  );
}

export function buildScenario(id: MockHomeScenarioId): MockHomeScenario {
  const base: MockHomeScenario = {
    menu: ready("menu", [MENU_READY]),
    inventory: ready("inventory", [INVENTORY_ATTENTION]),
    profile: ready("profile", [PROFILE_FIT]),
    chooser: DEFAULT_QUESTIONS,
    chooserSuggestions: ready("quickChooser", [CHOOSER_ITEM]),
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
          retryable: false,
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
      return { ...base, menu: empty("menu", "home.source.empty.menu") };
    case "menuMissingRequired":
    case "shoppingRequired":
      return { ...base, menu: ready("menu", [SHOPPING_REQUIRED]) };
    case "menuNeedsThaw":
      return { ...base, menu: ready("menu", [MENU_THAW]) };
    case "shoppingOptional":
      return { ...base, menu: ready("menu", [SHOPPING_OPTIONAL]) };
    case "withUncertainty":
      return { ...base, inventory: ready("inventory", [UNCERTAIN]) };
    case "profileEffortCleanup":
      return { ...base, profile: ready("profile", [PROFILE_EFFORT]) };
    case "oneQuestion":
      return { ...base, chooser: ONE_QUESTION };
    case "twoQuestions":
    case "menuAvailable":
    case "allSourcesReady":
    case "default":
    case "confirmedProfile":
    case "inventoryAttention":
      return base;
    case "emptyInventory":
      return {
        ...base,
        inventory: empty("inventory", "home.source.empty.inventory"),
      };
    case "incompleteProfile":
      return {
        ...base,
        profile: {
          tier: "profile",
          status: "incomplete",
          retryable: false,
          statusReasonKey: "home.source.incomplete.profile",
          items: [],
        },
      };
    case "aiUnavailable":
      return {
        ...base,
        chooser: {
          capabilityStatus: "not_implemented",
          retryable: false,
          statusReasonKey: "home.chooser.unavailable",
          questions: [],
        },
        chooserSuggestions: {
          tier: "quickChooser",
          status: "unavailable",
          retryable: false,
          statusReasonKey: "home.source.unavailable.ai",
          items: [],
        },
      };
    case "menuFailed":
      return {
        ...base,
        menu: failed("menu", "home.source.failed.menu", true),
      };
    case "inventoryFailed":
      return {
        ...base,
        inventory: failed("inventory", "home.source.failed.inventory", true),
      };
    case "profileFailed":
      return {
        ...base,
        profile: failed("profile", "home.source.failed.profile", true),
      };
    case "menuStale":
      return {
        ...base,
        menu: {
          tier: "menu",
          status: "stale",
          retryable: true,
          statusReasonKey: "home.source.stale.menu",
          items: [{ ...MENU_READY, freshness: "stale" }],
        },
      };
    case "transientMenuFailThenRecover":
      // Handled by stateful factory; static snapshot is failed.
      return {
        ...base,
        menu: failed("menu", "home.source.failed.menu", true),
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
 *
 * Prefer creating a new adapter per scenario (immutable) for deterministic
 * switching — see `createMockContextualHomeAdapter({ scenario })`.
 */
export function createMockContextualHomeAdapter(options?: {
  scenario?: MockHomeScenarioId;
  /** When set, menu fails on the first N calls then recovers (retry tests). */
  menuFailTimes?: number;
}): MockContextualHomeAdapter {
  let scenarioId: MockHomeScenarioId = options?.scenario ?? "default";
  let menuFailuresRemaining = options?.menuFailTimes ?? 0;

  const adapter: MockContextualHomeAdapter = {
    setScenario(next: MockHomeScenarioId): void {
      scenarioId = next;
    },
    getScenario(): MockHomeScenarioId {
      return scenarioId;
    },
    async loadMenuSource(
      query: ContextualHomeQuery,
    ): Promise<HomeSourceResult> {
      if (query.signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      if (
        scenarioId === "transientMenuFailThenRecover" ||
        menuFailuresRemaining > 0
      ) {
        if (menuFailuresRemaining > 0) {
          menuFailuresRemaining -= 1;
          return failed("menu", "home.source.failed.menu", true);
        }
        if (scenarioId === "transientMenuFailThenRecover") {
          return ready("menu", [MENU_READY]);
        }
      }
      return buildScenario(scenarioId).menu;
    },
    async loadInventorySource(
      query: ContextualHomeQuery,
    ): Promise<HomeSourceResult> {
      if (query.signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      return buildScenario(scenarioId).inventory;
    },
    async loadProfileSource(
      query: ContextualHomeQuery,
    ): Promise<HomeSourceResult> {
      if (query.signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      return buildScenario(scenarioId).profile;
    },
    async getQuickChooserDefinition(
      query: ContextualHomeQuery,
    ): Promise<HomeQuickChooserDefinition> {
      if (query.signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      return buildScenario(scenarioId).chooser;
    },
    async loadQuickChooserSuggestions(
      query: ContextualHomeQuery,
    ): Promise<HomeSourceResult> {
      if (query.signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      const scenario = buildScenario(scenarioId);
      if (scenario.chooser.capabilityStatus !== "available") {
        return scenario.chooserSuggestions;
      }
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
