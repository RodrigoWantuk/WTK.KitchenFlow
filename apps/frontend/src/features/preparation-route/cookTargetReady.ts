/**
 * True when every requiredForTarget task for the given recipe is done.
 * Optional / other-target tasks must not block readiness for this recipe.
 */
export function isCookTargetReady(
  tasks: Array<{
    requiredForTarget: boolean;
    targetRecipeId: string | null;
    state: string;
  }>,
  targetRecipeId: string,
): boolean {
  const required = tasks.filter(
    (t) => t.requiredForTarget && t.targetRecipeId === targetRecipeId,
  );
  if (required.length === 0) return false;
  return required.every((t) => t.state === "done");
}
