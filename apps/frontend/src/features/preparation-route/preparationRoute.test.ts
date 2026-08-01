import {
  MockPreparationRouteRepository,
  MOCK_PREPARATION_ROUTE_TASKS,
} from "../../adapters/mock/preparationRouteRepository";
import {
  collectReadyTargets,
  projectPreparationRoute,
} from "./projectPreparationRoute";
import { selectShoppingShortfalls } from "../../adapters/mock/shoppingRequirementFixtures";
import { MOCK_SHOPPING_REQUIREMENTS } from "../../adapters/mock/shoppingRequirementFixtures";
import {
  MOCK_PREPARED_COMPONENT_SHORTFALL,
  projectPreparedComponentFromPantryItem,
} from "../../adapters/mock/preparedComponentFixtures";
import {
  cookHandoffSearchParams,
  toCookHandoff,
} from "../../features/preparation-route/derivePreparationRoute";

describe("projectPreparationRoute", () => {
  it("shares unlock state from a single completion set", () => {
    const repo = new MockPreparationRouteRepository(
      MOCK_PREPARATION_ROUTE_TASKS,
    );
    let projection = projectPreparationRoute(repo);
    expect(projection.highlightedTaskId).toBe("n2");
    expect(projection.tasks.find((t) => t.id === "n3")?.state).toBe("blocked");

    repo.markDone("n2");
    projection = projectPreparationRoute(repo);
    expect(projection.tasks.find((t) => t.id === "n3")?.state).toBe("canStart");
    expect(projection.tasks.find((t) => t.id === "n4")?.state).toBe("canStart");
    expect(projection.highlightedTaskId).toBe("n3");
  });

  it("does not highlight blocked tasks", () => {
    const repo = new MockPreparationRouteRepository(
      MOCK_PREPARATION_ROUTE_TASKS,
    );
    const projection = projectPreparationRoute(repo);
    const blocked = projection.tasks.filter((t) => t.state === "blocked");
    expect(blocked.every((t) => !t.isHighlighted)).toBe(true);
  });

  it("marks cook ready when required tasks complete; optional tasks do not block", () => {
    const repo = new MockPreparationRouteRepository(
      MOCK_PREPARATION_ROUTE_TASKS,
    );
    repo.markDone("n2");
    repo.markDone("n3");
    // n4/n5 are optional (requiredForTarget=false)
    const projection = projectPreparationRoute(repo);
    expect(projection.readyTargets).toHaveLength(1);
    expect(projection.readyTargets[0].targetRecipeId).toBe("r3");
    expect(projection.readyTargets[0].dismissed).toBe(false);
  });

  it("preserves completion when cook CTA is dismissed (Later)", () => {
    const repo = new MockPreparationRouteRepository(
      MOCK_PREPARATION_ROUTE_TASKS,
    );
    repo.markDone("n2");
    repo.markDone("n3");
    repo.dismissCookCta("r3");
    const projection = projectPreparationRoute(repo);
    expect(projection.readyTargets[0].dismissed).toBe(true);
    expect(repo.getCompletedIds().has("n3")).toBe(true);
  });
});

describe("collectReadyTargets", () => {
  it("ignores tasks without targetRecipeId", () => {
    const ready = collectReadyTargets(
      MOCK_PREPARATION_ROUTE_TASKS,
      new Set(["n1", "n2", "n3", "n4", "n5"]),
      new Set(),
      "route-1",
    );
    expect(ready.map((r) => r.targetRecipeId)).toEqual(["r3"]);
  });
});

describe("cook handoff", () => {
  it("builds payload and search params with recipe and route ids", () => {
    const payload = toCookHandoff({
      targetRecipeId: "r3",
      forTitle: "Sopa de feijão",
      sourcePreparationRouteId: "prep-route-bean-soup",
      relatedPlanEntryId: "pl-route-r3",
      dismissed: false,
    });
    expect(payload).toEqual({
      targetRecipeId: "r3",
      sourcePreparationRouteId: "prep-route-bean-soup",
      relatedPlanEntryId: "pl-route-r3",
    });
    const qs = cookHandoffSearchParams(payload);
    expect(qs).toContain("sourcePreparationRouteId=prep-route-bean-soup");
    expect(qs).toContain("relatedPlanEntryId=pl-route-r3");
  });
});

describe("PreparedComponentAvailability fixtures", () => {
  it("exposes shortfall without requiring UI arithmetic", () => {
    expect(MOCK_PREPARED_COMPONENT_SHORTFALL.status).toBe("shortfall");
    expect(MOCK_PREPARED_COMPONENT_SHORTFALL.shortfallQuantity?.value).toBe(
      200,
    );
  });

  it("projects pantry mock items into presentation model", () => {
    const availability = projectPreparedComponentFromPantryItem({
      id: "cp_broth",
      qty: 2000,
      unit: "ml",
      reservedFor: [
        { title: "A", qtyNum: 1200, unit: "ml" },
        { title: "B", qtyNum: 1000, unit: "ml" },
      ],
    });
    expect(availability?.status).toBe("shortfall");
    expect(availability?.shortfallQuantity?.value).toBe(200);
    expect(availability?.freeQuantity.value).toBe(0);
  });
});

describe("selectShoppingShortfalls", () => {
  it("sends only shortfall rows to shopping", () => {
    const shortfalls = selectShoppingShortfalls(MOCK_SHOPPING_REQUIREMENTS);
    expect(shortfalls.every((s) => s.shortfallQuantity.value > 0)).toBe(true);
    expect(shortfalls.map((s) => s.requirementId)).toEqual([
      "req-broth-shortfall",
      "req-onion-missing",
    ]);
    expect(
      shortfalls.find((s) => s.requirementId === "req-beans-covered"),
    ).toBeUndefined();
  });
});
