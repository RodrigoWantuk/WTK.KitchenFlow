import type {
  CookReadyTarget,
  PreparationRouteProjection,
  PreparationRouteRepository,
  PreparationRouteTask,
  PreparationRouteTaskView,
  PreparationTaskState,
} from "../../contracts/preparation";

/**
 * Derives presentation state for each task from shared completion/progress sets.
 * Unlocking follows dependsOn; blocked tasks are never highlighted.
 */
export function projectPreparationRoute(
  repository: PreparationRouteRepository,
): PreparationRouteProjection {
  const tasks = repository.getTasks();
  const completed = repository.getCompletedIds();
  const inProgress = repository.getInProgressIds();
  const dismissed = repository.getDismissedTargetIds();
  const routeId = repository.getRouteId();

  const views: PreparationRouteTaskView[] = tasks.map((task) => {
    const state = resolveTaskState(task, completed, inProgress);
    return { ...task, state, isHighlighted: false };
  });

  const highlightedTaskId = pickHighlightedTaskId(views);
  const withHighlight = views.map((task) => ({
    ...task,
    isHighlighted: task.id === highlightedTaskId,
  }));

  return {
    routeId,
    tasks: withHighlight,
    highlightedTaskId,
    readyTargets: collectReadyTargets(tasks, completed, dismissed, routeId),
  };
}

function resolveTaskState(
  task: PreparationRouteTask,
  completed: ReadonlySet<string>,
  inProgress: ReadonlySet<string>,
): PreparationTaskState {
  if (completed.has(task.id)) return "done";
  if (task.dependsOn && !completed.has(task.dependsOn)) return "blocked";
  if (inProgress.has(task.id)) return "inProgress";
  if (task.baselineState === "overdue") return "overdue";
  if (!task.dependsOn || completed.has(task.dependsOn)) return "canStart";
  return task.baselineState === "next" ? "next" : "canStart";
}

function pickHighlightedTaskId(tasks: PreparationRouteTaskView[]): string | null {
  const overdue = tasks.find((t) => t.state === "overdue");
  if (overdue) return overdue.id;
  const actionable = tasks.find(
    (t) => t.state === "canStart" || t.state === "inProgress",
  );
  if (actionable) return actionable.id;
  return null;
}

/**
 * A target is cook-ready when every requiredForTarget task for that recipe is complete.
 * Optional tasks (requiredForTarget=false or null target) never block readiness.
 */
export function collectReadyTargets(
  tasks: PreparationRouteTask[],
  completed: ReadonlySet<string>,
  dismissed: ReadonlySet<string>,
  routeId: string,
): CookReadyTarget[] {
  const byTarget = new Map<string, PreparationRouteTask[]>();
  for (const task of tasks) {
    if (!task.targetRecipeId || !task.requiredForTarget) continue;
    const list = byTarget.get(task.targetRecipeId) ?? [];
    list.push(task);
    byTarget.set(task.targetRecipeId, list);
  }

  const ready: CookReadyTarget[] = [];
  byTarget.forEach((list, targetRecipeId) => {
    const allDone = list.every((t) => completed.has(t.id));
    if (!allDone) return;
    ready.push({
      targetRecipeId,
      forTitle: list[0]?.forTitle ?? targetRecipeId,
      sourcePreparationRouteId: routeId,
      relatedPlanEntryId:
        list.find((t) => t.relatedPlanEntryId)?.relatedPlanEntryId ?? null,
      dismissed: dismissed.has(targetRecipeId),
    });
  });
  return ready;
}
