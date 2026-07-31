import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  createElement,
  type ReactNode,
} from "react";
import {
  SEED_PANTRY,
  SEED_PLAN,
  SEED_SHOPPING,
  RECIPES,
  generateFullWeekPlan,
  type PantryItem,
  type PlanEntry,
  type ShoppingItem,
  type Recipe,
  type RecipeIngredient,
} from "./mockData";
import { t } from "./i18n";

export interface Profile {
  name: string;
  household: { adults: number; children: number };
  preferences: string[];
  restrictions: string[];
  allergies: string[];
  goals: string[];
  skill: number;
  time: number;
  effort: number;
  cleanup: number;
  equipment: string[];
  units: string;
  region: string;
  onboardingDone: boolean;
}

export interface CookingState {
  recipeId: string;
  step: number;
  paused: boolean;
  startedAt: number;
}

export interface Activity {
  type: string;
  recipeId: string;
  step?: number;
  paused?: boolean;
  startedAt: number;
}

export interface HistoryEntry {
  at: number;
  type: string;
  recipeId?: string;
  reconciliation?: unknown;
}

export interface RecipeWithMatch extends Recipe {
  have: number;
  total: number;
  missing: RecipeIngredient[];
}

export interface StoreState {
  lang: string;
  theme: string;
  scenario: string;
  authed: boolean;
  profile: Profile;
  pantry: PantryItem[];
  plan: PlanEntry[];
  shopping: ShoppingItem[];
  favorites: string[];
  history: HistoryEntry[];
  cooking: CookingState | null;
  activity: Activity | null;
  _lastReconciled?: { moved: number; at: number };
}

type StatePatch = Partial<StoreState> | ((state: StoreState) => Partial<StoreState>);

export interface StoreActions {
  setLang: (lang: string) => void;
  setTheme: (theme: string) => void;
  setScenario: (scenario: string) => void;
  setAuthed: (v: boolean) => void;
  setProfile: (patch: Partial<Profile>) => void;
  addPantry: (item: Omit<PantryItem, "id"> & { id?: string }) => void;
  updatePantry: (id: string, patch: Partial<PantryItem>) => void;
  removePantry: (id: string) => void;
  addShopping: (item: Omit<ShoppingItem, "id" | "checked"> & { id?: string; checked?: boolean }) => void;
  toggleShopping: (id: string) => void;
  removeShopping: (id: string) => void;
  addMissingToShopping: (recipeId: string) => void;
  startCooking: (recipeId: string) => void;
  updateCookStep: (step: number) => void;
  pauseCooking: () => void;
  resumeCooking: () => void;
  finishCooking: (reconciliation?: unknown) => void;
  toggleFavorite: (recipeId: string) => void;
  updatePlan: (id: string, patch: Partial<PlanEntry>) => void;
  addPlan: (entry: Omit<PlanEntry, "id"> & { id?: string }) => void;
  removePlan: (id: string) => void;
  acceptSuggestion: (id: string) => void;
  setMealState: (id: string, state: string) => void;
  replaceMeal: (id: string, newRecipeId: string, opts?: { removePrevShopping?: boolean }) => void;
  moveMeal: (
    id: string,
    target: { day: number; meal: string },
    resolution?: string
  ) => void;
  changeMealSlot: (id: string, meal: string) => void;
  markMealDone: (id: string, mode: string) => void;
  clearReconcilePending: (id: string) => void;
  finishShopping: () => void;
  sendItemsToShopping: (items: Array<Partial<ShoppingItem> & Pick<ShoppingItem, "name" | "qty" | "unit">>) => void;
  resetAll: () => void;
}

/** React context value exposed by useStore. */
export interface StoreContextValue extends StoreState, StoreActions {
  pantry: PantryItem[];
  plan: PlanEntry[];
  shopping: ShoppingItem[];
  activity: Activity | null;
  smartAvailable: boolean;
  scenarioError: string | null;
  recipes: RecipeWithMatch[];
  tr: (key: string) => string;
}

const StoreCtx = createContext<StoreContextValue | null>(null);

const LS_KEY = "cocinaris_state_v1";

function loadState(): Partial<StoreState> | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<StoreState>;
  } catch { return null; }
}

function persist(state: StoreState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota / private-mode persistence failures in the mock client.
  }
}

const defaultProfile: Profile = {
  name: "Marina",
  household: { adults: 2, children: 1 },
  preferences: ["Onívora"],
  restrictions: [],
  allergies: [],
  goals: ["Reduzir desperdício"],
  skill: 2, // 1-3
  time: 2, // 1-3
  effort: 2,
  cleanup: 2,
  equipment: ["forno","fogão","microondas","air fryer","liquidificador"],
  units: "metric",
  region: "BR",
  onboardingDone: true,
};

const initialState: StoreState = {
  lang: "pt-BR",
  theme: "light",
  scenario: "filledPantry",
  authed: false,
  profile: defaultProfile,
  pantry: SEED_PANTRY,
  plan: SEED_PLAN,
  shopping: SEED_SHOPPING,
  favorites: ["r2"],
  history: [
    { at: Date.now() - 86400000, type: "cooked", recipeId: "r2" },
    { at: Date.now() - 86400000 * 3, type: "cooked", recipeId: "r3" },
  ],
  cooking: null, // { recipeId, step, paused }
  activity: null, // continuity ("preparo interrompido")
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(() => {
    const persisted = loadState();
    return persisted ? { ...initialState, ...persisted } : initialState;
  });

  useEffect(() => { persist(state); }, [state]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", state.theme === "dark");
  }, [state.theme]);

  const set = useCallback((patch: StatePatch) => setState((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) })), []);

  // Scenario transformations produce derived views without destroying real data.
  const scenarioView = useMemo(() => {
    const s = state.scenario;
    let pantry = state.pantry;
    let plan = state.plan;
    let shopping = state.shopping;
    let activity = state.activity;
    let smartAvailable = true;
    let error: string | null = null;

    if (s === "emptyPantry" || s === "newUser") pantry = [];
    if (s === "attention") pantry = pantry.map(i => ["p5","p6","p8","p12","p16"].includes(i.id) ? i : i);
    if (s === "missing") pantry = pantry.filter(i => !["p10","p11"].includes(i.id));
    if (s === "planned") plan = state.plan;
    if (s === "thaw") pantry = pantry.map(i => i.id === "p10" ? { ...i, notes: "Descongelando desde manhã" } : i);
    if (s === "shoppingOngoing") shopping = shopping.map((it, idx) => idx < 2 ? { ...it, checked: true } : it);
    if (s === "cooking" || s === "cookingPaused") activity = { type: "cook", recipeId: "r1", step: 3, paused: s === "cookingPaused", startedAt: Date.now() - 900000 };
    if (s === "withLeftovers") activity = { type: "finish", recipeId: "r3", startedAt: Date.now() - 3600000 };
    if (s === "frozenPortions") pantry = [...pantry, { id: "pF", name: "Sopa de feijão (porção)", category: "leftover", mode: "measured", qty: 2, unit: "porções", location: "freezer", notes: "Congelado após preparo" }];
    if (s === "smartOffline") smartAvailable = false;
    if (s === "serviceError") { smartAvailable = false; error = t(state.lang, "states.error"); }
    if (s === "insufficient") { /* keep pantry small */ pantry = pantry.slice(0, 3); }
    if (s === "onboardingIncomplete") { /* handled via profile flag override */ }
    if (s === "newUser") plan = [];

    // --- Plan-focused scenarios ---
    const allRecipeIds = RECIPES.map(r => r.id);
    // Runtime "today" index so plan-focused scenarios always surface on /app/hoje.
    const _dow = new Date().getDay();
    const _todayIdx = _dow === 0 ? 6 : _dow - 1;
    const _tomorrowIdx = (_todayIdx + 1) % 7;
    if (s === "weekEmpty") plan = [];
    if (s === "weekPartial") {
      plan = [
        { id: "wp1", day: _todayIdx, meal: "lunch", recipeId: "r1", state: "accepted" },
        { id: "wp2", day: _todayIdx, meal: "dinner", recipeId: "r2", state: "suggested" },
        { id: "wp3", day: _tomorrowIdx, meal: "lunch", recipeId: "r3", state: "draft" },
      ];
    }
    if (s === "weekComplete") plan = generateFullWeekPlan(allRecipeIds);
    if (s === "awaitingAcceptance") {
      plan = generateFullWeekPlan(allRecipeIds).map(p => ({ ...p, state: "suggested" }));
    }
    if (s === "manyDrafts") {
      plan = generateFullWeekPlan(allRecipeIds).slice(0, 8).map(p => ({ ...p, state: "draft" }));
    }
    if (s === "listReady") {
      plan = [
        { id: "lr1", day: _todayIdx, meal: "lunch", recipeId: "r1", state: "needsShopping" },
        { id: "lr2", day: _todayIdx, meal: "dinner", recipeId: "r3", state: "needsShopping" },
        { id: "lr3", day: _tomorrowIdx, meal: "lunch", recipeId: "r4", state: "needsShopping" },
        { id: "lr4", day: (_tomorrowIdx + 1) % 7, meal: "dinner", recipeId: "r5", state: "accepted" },
        { id: "lr5", day: (_tomorrowIdx + 2) % 7, meal: "lunch", recipeId: "r2", state: "accepted" },
      ];
      pantry = pantry.filter(i => !["p10","p11","p12","p15"].includes(i.id));
    }
    if (s === "prepAheadPending") {
      plan = [
        { id: "pp1", day: _todayIdx, meal: "dinner", recipeId: "r1", state: "needsPrep" },
        { id: "pp2", day: _todayIdx, meal: "lunch", recipeId: "r4", state: "needsPrep" },
        { id: "pp3", day: _tomorrowIdx, meal: "dinner", recipeId: "r3", state: "needsPrep" },
      ];
    }
    if (s === "moveConflict") {
      plan = [
        { id: "mc1", day: _todayIdx, meal: "lunch", recipeId: "r1", state: "accepted" },
        { id: "mc2", day: _todayIdx, meal: "dinner", recipeId: "r4", state: "needsPrep" },
        { id: "mc3", day: _tomorrowIdx, meal: "dinner", recipeId: "r2", state: "accepted", _conflictHint: true },
      ];
    }
    if (s === "sameDayEdit") {
      plan = [
        { id: "sd1", day: _todayIdx, meal: "lunch", recipeId: "r2", state: "accepted" },
        { id: "sd2", day: _todayIdx, meal: "dinner", recipeId: "r1", state: "suggested" },
        { id: "sd3", day: _todayIdx, meal: "snack", recipeId: "r5", state: "draft" },
      ];
    }
    if (s === "replacementDone") {
      plan = [
        { id: "rd1", day: _todayIdx, meal: "lunch", recipeId: "r2", state: "accepted", _replacedFrom: "r1" },
        { id: "rd2", day: _tomorrowIdx, meal: "dinner", recipeId: "r3", state: "accepted" },
      ];
    }
    if (s === "doneReconcilePending") {
      plan = [
        { id: "dp1", day: _todayIdx, meal: "lunch", recipeId: "r1", state: "done", _reconciliationPending: true },
        { id: "dp2", day: _todayIdx, meal: "dinner", recipeId: "r2", state: "done", _reconciliationPending: true },
      ];
    }
    if (s === "mealSkipped") {
      plan = [
        { id: "sk1", day: _todayIdx, meal: "lunch", recipeId: "r3", state: "skipped" },
        { id: "sk2", day: _todayIdx, meal: "dinner", recipeId: "r1", state: "skipped" },
      ];
    }
    if (s === "routeToday" || s === "routeOverdue" || s === "routePartial") {
      plan = [
        { id: "rt1", day: _todayIdx, meal: "lunch", recipeId: "r1", state: "needsPrep" },
        { id: "rt2", day: _todayIdx, meal: "dinner", recipeId: "r4", state: "needsPrep" },
        { id: "rt3", day: _tomorrowIdx, meal: "dinner", recipeId: "r3", state: "needsPrep" },
      ];
    }
    if (s === "twoInSlot") {
      plan = [
        { id: "ts1", day: _todayIdx, meal: "lunch", recipeId: "r2", state: "accepted" },
        { id: "ts2", day: _todayIdx, meal: "lunch", recipeId: "r5", state: "suggested" },
        { id: "ts3", day: _todayIdx, meal: "dinner", recipeId: "r1", state: "accepted" },
      ];
    }
    // === Iter 5: reality/components/simulation/route-with-deps scenarios ===
    if (s === "realityChanged" || s === "deliveryReplaces" || s === "ingredientOut" || s === "extraLeftover") {
      plan = [
        { id: "rl1", day: _todayIdx, meal: "lunch",  recipeId: "r1", state: "accepted" },
        { id: "rl2", day: _todayIdx, meal: "dinner", recipeId: "r4", state: s === "realityChanged" ? "skipped" : (s === "deliveryReplaces" ? "skipped" : "needsShopping"), _realityHint: s },
        { id: "rl3", day: _tomorrowIdx, meal: "lunch", recipeId: "r2", state: "accepted" },
        { id: "rl4", day: _tomorrowIdx, meal: "dinner", recipeId: "r3", state: "accepted" },
      ];
    }
    if (s === "componentScheduled" || s === "componentInPantry" || s === "componentShared") {
      plan = [
        { id: "cs1", day: _todayIdx, meal: "dinner", recipeId: "r3", state: "needsPrep" },
        { id: "cs2", day: (_todayIdx + 3) % 7, meal: "dinner", recipeId: "r4", state: "accepted" },
      ];
      if (s === "componentInPantry" || s === "componentShared") {
        // Attach a preparado component to pantry, with structured reservations so the UI can
        // render a reserved/free bar. `componentShared` overbooks it (reserved > qty).
        const reservedFor = s === "componentShared"
          ? [
              { title: "Escondidinho rápido", qtyNum: 1200, unit: "ml", when: "Terça" },
              { title: "Sopa de feijão",      qtyNum: 1000, unit: "ml", when: "Sexta" },
            ]
          : [
              { title: "Escondidinho rápido", qtyNum: 600, unit: "ml", when: "Terça" },
              { title: "Sopa de feijão",      qtyNum: 400, unit: "ml", when: "Sexta" },
            ];
        pantry = [
          { id: "cp_broth", name: "Caldo de carne caseiro (preparado)", category: "component", mode: "measured", qty: 2000, unit: "ml", location: "freezer", notes: "Preparado no domingo.", _isComponent: true, _uncertainty: "confirmed", reservedFor },
          ...pantry,
        ];
      }
    }
    if (s === "uncertainQty") {
      pantry = pantry.map(i => i.id === "p7" ? { ...i, mode: "approx", availability: "unknown", _uncertainty: "unknown" } : i);
    }
    if (s === "prepDelayed") {
      plan = [
        { id: "pd1", day: _todayIdx, meal: "dinner", recipeId: "r1", state: "needsPrep", _prepDelayed: true },
        { id: "pd2", day: _tomorrowIdx, meal: "dinner", recipeId: "r3", state: "accepted" },
      ];
    }
    if (s === "routeWithDeps") {
      plan = [
        { id: "rw1", day: _todayIdx, meal: "dinner", recipeId: "r3", state: "needsPrep" },
        { id: "rw2", day: (_todayIdx + 2) % 7, meal: "dinner", recipeId: "r3", state: "needsPrep" },
      ];
    }
    if (s === "fullReconcile") {
      plan = [
        { id: "fr1", day: _todayIdx, meal: "dinner", recipeId: "r4", state: "done", _reconciliationPending: true, _hasFullReconcile: true },
        { id: "fr2", day: _tomorrowIdx, meal: "lunch", recipeId: "r2", state: "accepted" },
      ];
    }
    if (s === "chickenTimeline" || s === "weekSimulation") {
      plan = [
        { id: "wk1", day: 0, meal: "lunch",  recipeId: "r1", state: "suggested" },
        { id: "wk2", day: 2, meal: "dinner", recipeId: "r4", state: "suggested" },
      ];
    }
    if (s === "troubleSuccess" || s === "derivedRecipe") {
      plan = [
        { id: "tr1", day: _todayIdx, meal: "dinner", recipeId: "r2", state: "accepted" },
      ];
    }

    return { pantry, plan, shopping, activity, smartAvailable, error };
  }, [state]);

  // Compute pantry attention flags
  const pantryWithAttention = useMemo(() => {
    const today = new Date();
    return scenarioView.pantry.map(item => {
      let attention = item.attention || null;
      if (!attention && item.expiry) {
        const days = (new Date(item.expiry).getTime() - today.getTime()) / 86400000;
        if (days <= 5 && days >= 0) attention = "nearExpiry";
        if (days < 0) attention = "nearExpiry";
      }
      if (!attention && item.packaging === "opened") attention = "opened";
      if (!attention && item.mode === "approx" && item.availability === "low") attention = "lowStock";
      return { ...item, attention };
    });
  }, [scenarioView.pantry]);

  // Compute recipe compatibility with pantry
  const recipesWithMatch = useMemo(() => {
    const pantryIds = new Set(pantryWithAttention.map(i => i.id));
    return RECIPES.map(r => {
      const have = r.ingredients.filter(i => i.match && pantryIds.has(i.match)).length;
      const total = r.ingredients.length;
      const missing = r.ingredients.filter(i => !i.match || !pantryIds.has(i.match));
      return { ...r, have, total, missing };
    });
  }, [pantryWithAttention]);

  // Actions
  const actions = useMemo<StoreActions>(() => ({
    setLang: (lang) => set({ lang }),
    setTheme: (theme) => set({ theme }),
    setScenario: (scenario) => set({ scenario }),
    setAuthed: (v) => set({ authed: v }),
    setProfile: (patch) => set(s => ({ profile: { ...s.profile, ...patch } })),
    addPantry: (item) => set(s => ({ pantry: [{ ...item, id: `p_${Date.now()}` }, ...s.pantry] })),
    updatePantry: (id, patch) => set(s => ({ pantry: s.pantry.map(i => i.id === id ? { ...i, ...patch } : i) })),
    removePantry: (id) => set(s => ({ pantry: s.pantry.filter(i => i.id !== id) })),
    addShopping: (item) => set(s => ({ shopping: [{ ...item, id: `s_${Date.now()}`, checked: false }, ...s.shopping] })),
    toggleShopping: (id) => set(s => ({ shopping: s.shopping.map(i => i.id === id ? { ...i, checked: !i.checked } : i) })),
    removeShopping: (id) => set(s => ({ shopping: s.shopping.filter(i => i.id !== id) })),
    addMissingToShopping: (recipeId) => set(s => {
      const r = RECIPES.find(x => x.id === recipeId);
      if (!r) return {};
      const pantryIds = new Set(s.pantry.map(i => i.id));
      const missing = r.ingredients.filter(i => !i.match || !pantryIds.has(i.match));
      const additions: ShoppingItem[] = missing.map((m, idx) => ({ id: `s_${Date.now()}_${idx}`, name: m.name, qty: m.qty, unit: m.unit, aisle: "grocery", origin: "recipe", recipeId, checked: false }));
      return { shopping: [...additions, ...s.shopping] };
    }),
    startCooking: (recipeId) => set({ cooking: { recipeId, step: 0, paused: false, startedAt: Date.now() }, activity: { type: "cook", recipeId, step: 0, paused: false, startedAt: Date.now() } }),
    updateCookStep: (step) => set(s => ({ cooking: s.cooking ? { ...s.cooking, step } : null, activity: s.activity ? { ...s.activity, step } : null })),
    pauseCooking: () => set(s => ({ cooking: s.cooking ? { ...s.cooking, paused: true } : null, activity: s.activity ? { ...s.activity, paused: true } : null })),
    resumeCooking: () => set(s => ({ cooking: s.cooking ? { ...s.cooking, paused: false } : null, activity: s.activity ? { ...s.activity, paused: false } : null })),
    finishCooking: (reconciliation) => set(s => ({
      cooking: null,
      activity: null,
      history: [{ at: Date.now(), type: "cooked", recipeId: s.cooking?.recipeId, reconciliation }, ...s.history],
    })),
    toggleFavorite: (recipeId) => set(s => ({ favorites: s.favorites.includes(recipeId) ? s.favorites.filter(i => i !== recipeId) : [...s.favorites, recipeId] })),
    updatePlan: (id, patch) => set(s => ({ plan: s.plan.map(p => p.id === id ? { ...p, ...patch } : p) })),
    addPlan: (entry) => set(s => ({ plan: [{ ...entry, id: `pl_${Date.now()}` }, ...s.plan] })),
    removePlan: (id) => set(s => ({ plan: s.plan.filter(p => p.id !== id) })),
    acceptSuggestion: (id) => set(s => ({ plan: s.plan.map(p => p.id === id ? { ...p, state: "accepted" } : p) })),
    setMealState: (id, mealState) => set(s => ({ plan: s.plan.map(p => p.id === id ? { ...p, state: mealState } : p) })),
    replaceMeal: (id, newRecipeId, opts = {}) => set(s => {
      const entry = s.plan.find(p => p.id === id);
      if (!entry) return {};
      const prevRecipeId = entry.recipeId;
      const nextPlan = s.plan.map(p => p.id === id ? { ...p, recipeId: newRecipeId, state: "accepted", _replacedFrom: prevRecipeId } : p);
      let nextShopping = s.shopping;
      if (opts.removePrevShopping && prevRecipeId) {
        nextShopping = s.shopping.filter(it => !(it.origin === "recipe" && it.recipeId === prevRecipeId));
      }
      return { plan: nextPlan, shopping: nextShopping };
    }),
    moveMeal: (id, target, resolution = "swap") => set(s => {
      const entry = s.plan.find(p => p.id === id);
      if (!entry) return {};
      const occupying = s.plan.find(p => p.id !== id && p.day === target.day && p.meal === target.meal);
      let next = s.plan;
      if (!occupying || resolution === "keepBoth" || resolution === "ignore") {
        next = s.plan.map(p => p.id === id ? { ...p, day: target.day, meal: target.meal } : p);
      } else if (resolution === "swap") {
        next = s.plan.map(p => {
          if (p.id === id) return { ...p, day: target.day, meal: target.meal };
          if (p.id === occupying.id) return { ...p, day: entry.day, meal: entry.meal };
          return p;
        });
      } else if (resolution === "replace") {
        next = s.plan.filter(p => p.id !== occupying.id).map(p => p.id === id ? { ...p, day: target.day, meal: target.meal } : p);
      }
      return { plan: next };
    }),
    changeMealSlot: (id, meal) => set(s => ({ plan: s.plan.map(p => p.id === id ? { ...p, meal } : p) })),
    markMealDone: (id, mode) => set(s => ({
      plan: s.plan.map(p => p.id === id
        ? (mode === "skipped"
            ? { ...p, state: "skipped", _reconciliationPending: false }
            : { ...p, state: "done", _reconciliationPending: mode === "onlyDone" })
        : p),
    })),
    clearReconcilePending: (id) => set(s => ({ plan: s.plan.map(p => p.id === id ? { ...p, _reconciliationPending: false } : p) })),
    finishShopping: () => set(s => {
      const bought = s.shopping.filter(i => i.checked);
      const remaining = s.shopping.filter(i => !i.checked);
      const additions: PantryItem[] = bought.map(it => {
        const qtyNum = Number(it.qty);
        const isMeasured = !Number.isNaN(qtyNum) && qtyNum > 0 && !!it.unit;
        const base = {
          id: `p_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
          name: it.name,
          category: it.aisle || "grocery",
          location: it.aisle === "fridge" ? "fridge" : it.aisle === "meat" ? "fridge" : "pantry",
          packaging: "sealed",
          notes: `Adicionado ao terminar compras`,
        };
        return isMeasured
          ? { ...base, mode: "measured", qty: qtyNum, unit: it.unit }
          : { ...base, mode: "approx", availability: "some" };
      });
      return { shopping: remaining, pantry: [...additions, ...s.pantry], _lastReconciled: { moved: additions.length, at: Date.now() } };
    }),
    sendItemsToShopping: (items) => set(s => {
      const existingKey = (n: string | undefined, u: string | undefined) => `${(n||"").toLowerCase()}|${(u||"").toLowerCase()}`;
      const existing = new Map(s.shopping.map(it => [existingKey(it.name, it.unit), it]));
      const additions: ShoppingItem[] = [];
      items.forEach(it => {
        const k = existingKey(it.name, it.unit);
        if (existing.has(k)) {
          const cur = existing.get(k)!;
          const merged = { ...cur, qty: (Number(cur.qty) || 0) + (Number(it.qty) || 0) };
          existing.set(k, merged);
        } else {
          const created: ShoppingItem = { id: `s_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, checked: false, aisle: it.aisle || "grocery", origin: it.origin || "plan", recipeId: it.recipeId, name: it.name, qty: it.qty, unit: it.unit };
          existing.set(k, created);
          additions.push(created);
        }
      });
      const merged = Array.from(existing.values());
      // preserve original ordering roughly: put additions first
      return { shopping: [...additions, ...merged.filter(it => !additions.find(a => a.id === it.id))] };
    }),
    resetAll: () => setState(initialState),
  }), [set]);

  const value: StoreContextValue = {
    ...state,
    pantry: pantryWithAttention,
    plan: scenarioView.plan,
    shopping: scenarioView.shopping,
    activity: scenarioView.activity || state.activity,
    smartAvailable: scenarioView.smartAvailable,
    scenarioError: scenarioView.error,
    recipes: recipesWithMatch,
    tr: (k) => t(state.lang, k),
    ...actions,
  };

  return createElement(StoreCtx.Provider, { value }, children);
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
