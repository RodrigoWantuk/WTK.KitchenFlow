/**
 * Stable, non-localized catalog codes offered as curated suggestions for equipment,
 * techniques, goals, abandonment reasons, and preference/restriction entries.
 *
 * These codes are a frontend-owned convenience catalog, not a backend-enforced
 * enumeration: the backend accepts any bounded, whitespace-free `stableCode` (see
 * `StableCode` in the profile domain) and does not validate it against a fixed list.
 * Users may always add a custom entry via `createCustomStableCode` when nothing here
 * fits; see `../customCodes`.
 *
 * This is an initial, intentionally non-exhaustive seed list. Extending it is a
 * catalog/localization change, not a contract change, and does not require backend
 * coordination.
 */
import type { PreferenceCategory } from "@/contracts/profile";

/** Curated equipment stable codes. */
export const EQUIPMENT_CODES = [
  "oven",
  "stovetop",
  "microwave",
  "refrigerator",
  "freezer",
  "slow_cooker",
  "pressure_cooker",
  "air_fryer",
  "blender",
  "food_processor",
  "stand_mixer",
  "toaster_oven",
  "outdoor_grill",
  "rice_cooker",
  "sous_vide_immersion_circulator",
] as const;
export type EquipmentCode = (typeof EQUIPMENT_CODES)[number];

/** Curated cooking technique stable codes, shared by known/to-learn technique lists. */
export const TECHNIQUE_CODES = [
  "knife_skills",
  "sauteing",
  "roasting",
  "baking",
  "grilling",
  "braising",
  "steaming",
  "deep_frying",
  "poaching",
  "fermenting",
  "sous_vide_cooking",
  "pressure_cooking",
  "stir_frying",
  "blanching",
] as const;
export type TechniqueCode = (typeof TECHNIQUE_CODES)[number];

/** Curated cooking-goal stable codes. */
export const GOAL_CODES = [
  "eat_healthier",
  "save_money",
  "reduce_food_waste",
  "save_time",
  "learn_new_skills",
  "meal_prep_ahead",
  "cook_more_at_home",
  "eat_more_variety",
  "reduce_takeout",
  "feed_family_easier",
  "build_confidence",
] as const;
export type GoalCode = (typeof GOAL_CODES)[number];

/** Curated stable codes for why a user previously abandoned cooking-at-home routines. */
export const ABANDONMENT_REASON_CODES = [
  "too_time_consuming",
  "too_expensive",
  "lack_of_ingredients",
  "lost_interest",
  "life_change",
  "meal_plan_did_not_fit",
  "recipes_too_complex",
  "not_enough_variety",
  "technical_issues",
  "preferred_takeout",
] as const;
export type AbandonmentReasonCode = (typeof ABANDONMENT_REASON_CODES)[number];

/**
 * Curated preference/restriction stable codes, keyed by category. Allergy and
 * MedicalRestriction codes are presented with heightened UX communication and are
 * never inferred; see `docs/product/audience-and-profile.md`.
 */
export const PREFERENCE_ENTRY_CODES: Record<
  PreferenceCategory,
  readonly string[]
> = {
  Preference: [
    "spicy_food",
    "comfort_food",
    "fresh_vegetables",
    "grilled_flavors",
    "one_pot_meals",
    "baked_goods",
    "street_food_style",
    "slow_cooked_meals",
  ],
  Dislike: [
    "cilantro",
    "mushrooms",
    "olives",
    "blue_cheese",
    "liver",
    "raw_onion",
    "licorice",
    "anchovies",
  ],
  DietaryPattern: [
    "vegetarian",
    "vegan",
    "pescatarian",
    "keto",
    "paleo",
    "gluten_free_diet",
    "dairy_free_diet",
    "low_carb",
    "mediterranean_diet",
  ],
  Intolerance: [
    "lactose_intolerance",
    "gluten_intolerance",
    "fructose_intolerance",
    "histamine_intolerance",
    "caffeine_sensitivity",
    "sulfite_sensitivity",
  ],
  Allergy: [
    "peanut_allergy",
    "tree_nut_allergy",
    "shellfish_allergy",
    "fish_allergy",
    "egg_allergy",
    "milk_allergy",
    "soy_allergy",
    "wheat_allergy",
    "sesame_allergy",
  ],
  ReligiousRestriction: [
    "halal",
    "kosher",
    "hindu_vegetarian",
    "jain_diet",
    "lent_fasting",
    "buddhist_vegetarian",
  ],
  EthicalRestriction: [
    "vegan_ethical",
    "cruelty_free_only",
    "sustainable_seafood_only",
    "fair_trade_only",
    "local_sourcing_preferred",
    "no_palm_oil",
  ],
  MedicalRestriction: [
    "low_sodium_diet",
    "low_sugar_diet",
    "renal_diet",
    "low_fodmap_diet",
    "celiac_safe_diet",
    "heart_healthy_diet",
    "diabetic_friendly_diet",
  ],
};
