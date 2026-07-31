import type {
  PreparationRouteRepository,
  PreparationRouteTask,
  PreparationTaskState,
} from "../../contracts/preparation";

const DEFAULT_ROUTE_ID = "prep-route-bean-soup";

/**
 * Fixture tasks aligned with the Emergent route-with-deps snapshot.
 * Tasks without targetRecipeId (or requiredForTarget=false) do not block cook readiness.
 */
export const MOCK_PREPARATION_ROUTE_TASKS: PreparationRouteTask[] = [
  {
    id: "n1",
    groupKey: "monday",
    time: "20:00",
    task: "Deixar feijão de molho",
    forTitle: "Sopa de feijão",
    targetRecipeId: "r3",
    relatedPlanEntryId: "pl-route-r3",
    produces: null,
    activeMin: 5,
    passiveMin: 480,
    dependsOn: null,
    baselineState: "done",
    requiredForTarget: true,
  },
  {
    id: "n2",
    groupKey: "tuesdayAM",
    time: "08:00",
    task: "Cozinhar o feijão",
    forTitle: "Sopa de feijão",
    targetRecipeId: "r3",
    relatedPlanEntryId: "pl-route-r3",
    produces: "Feijão cozido · 800 g",
    activeMin: 20,
    passiveMin: 90,
    dependsOn: "n1",
    baselineState: "canStart",
    requiredForTarget: true,
  },
  {
    id: "n3",
    groupKey: "tuesdayAM",
    time: "10:30",
    task: "Separar 500 g para a sopa",
    forTitle: "Sopa de feijão",
    targetRecipeId: "r3",
    relatedPlanEntryId: "pl-route-r3",
    produces: null,
    activeMin: 3,
    passiveMin: 0,
    dependsOn: "n2",
    baselineState: "blocked",
    requiredForTarget: true,
  },
  {
    id: "n4",
    groupKey: "tuesdayAM",
    time: "10:35",
    task: "Congelar 300 g",
    forTitle: "Uso futuro",
    targetRecipeId: null,
    produces: "Feijão porcionado · 300 g",
    activeMin: 2,
    passiveMin: 0,
    dependsOn: "n2",
    baselineState: "blocked",
    requiredForTarget: false,
  },
  {
    id: "n5",
    groupKey: "thursday",
    time: "19:30",
    task: "Usar a porção reservada",
    forTitle: "Salada de feijão",
    targetRecipeId: null,
    produces: null,
    activeMin: 15,
    passiveMin: 0,
    dependsOn: "n4",
    baselineState: "next",
    requiredForTarget: false,
  },
];

/**
 * In-memory mock repository providing a single source of preparation progress
 * for Home, Plan, full route, and cook handoff.
 */
export class MockPreparationRouteRepository implements PreparationRouteRepository {
  private readonly routeId: string;
  private readonly tasks: PreparationRouteTask[];
  private completed: Set<string>;
  private inProgress: Set<string> = new Set();
  private dismissedTargets: Set<string> = new Set();
  private readonly listeners = new Set<() => void>();

  constructor(
    tasks: PreparationRouteTask[] = MOCK_PREPARATION_ROUTE_TASKS,
    routeId: string = DEFAULT_ROUTE_ID,
  ) {
    this.tasks = tasks.map((t) => ({ ...t }));
    this.routeId = routeId;
    this.completed = new Set(
      this.tasks.filter((t) => t.baselineState === "done").map((t) => t.id),
    );
  }

  getRouteId(): string {
    return this.routeId;
  }

  getTasks(): PreparationRouteTask[] {
    return this.tasks.map((t) => ({ ...t }));
  }

  getCompletedIds(): ReadonlySet<string> {
    return this.completed;
  }

  getInProgressIds(): ReadonlySet<string> {
    return this.inProgress;
  }

  getDismissedTargetIds(): ReadonlySet<string> {
    return this.dismissedTargets;
  }

  markDone(taskId: string): void {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (task.dependsOn && !this.completed.has(task.dependsOn)) return;
    this.completed = new Set(this.completed).add(taskId);
    this.inProgress = new Set([...this.inProgress].filter((id) => id !== taskId));
    this.emit();
  }

  markInProgress(taskId: string): void {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (this.completed.has(taskId)) return;
    if (task.dependsOn && !this.completed.has(task.dependsOn)) return;
    this.inProgress = new Set(this.inProgress).add(taskId);
    this.emit();
  }

  dismissCookCta(targetRecipeId: string): void {
    this.dismissedTargets = new Set(this.dismissedTargets).add(targetRecipeId);
    this.emit();
  }

  /** Test helper: replace completion set without going through unlock rules. */
  replaceCompletedForTests(ids: Iterable<string>): void {
    this.completed = new Set(ids);
    this.emit();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }
}

/** Shared singleton used by the React provider during the mock phase. */
export const sharedMockPreparationRouteRepository = new MockPreparationRouteRepository();

export function mapLegacyChainState(state: string): PreparationTaskState {
  if (
    state === "next" ||
    state === "canStart" ||
    state === "inProgress" ||
    state === "overdue" ||
    state === "done" ||
    state === "blocked"
  ) {
    return state;
  }
  return "next";
}
