import type {
  HomeQuickChooserDefinition,
  HomeQuickChooserOption,
  HomeQuickChooserQuestion,
  HomeQuickChooserQuestions,
} from "@/contracts/contextualHome";

/** Result of validating an untrusted chooser definition payload. */
export type HomeQuickChooserDefinitionValidationResult =
  | { ok: true; definition: HomeQuickChooserDefinition }
  | { ok: false; reason: string };

const INVALID_DEFINITION: HomeQuickChooserDefinition = {
  capabilityStatus: "temporarily_unavailable",
  retryable: true,
  statusReasonKey: "home.chooser.invalidDefinition",
  questions: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonemptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateOptions(
  options: unknown,
  questionId: string,
): HomeQuickChooserOption[] | null {
  if (!Array.isArray(options) || options.length < 2) {
    return null;
  }
  const seen = new Set<string>();
  const parsed: HomeQuickChooserOption[] = [];
  for (const option of options) {
    if (!isRecord(option)) return null;
    if (!nonemptyString(option.id) || !nonemptyString(option.labelKey)) {
      return null;
    }
    if (seen.has(option.id)) return null;
    seen.add(option.id);
    parsed.push({ id: option.id, labelKey: option.labelKey });
  }
  void questionId;
  return parsed;
}

function validateQuestions(
  questions: unknown,
): HomeQuickChooserQuestions | null {
  if (!Array.isArray(questions)) return null;
  if (questions.length !== 1 && questions.length !== 2) return null;

  const seenQuestionIds = new Set<string>();
  const parsed: HomeQuickChooserQuestion[] = [];

  for (const question of questions) {
    if (!isRecord(question)) return null;
    if (!nonemptyString(question.id) || !nonemptyString(question.promptKey)) {
      return null;
    }
    if (seenQuestionIds.has(question.id)) return null;
    seenQuestionIds.add(question.id);
    const options = validateOptions(question.options, question.id);
    if (!options) return null;
    parsed.push({
      id: question.id,
      promptKey: question.promptKey,
      options: options as unknown as HomeQuickChooserQuestion["options"],
    });
  }

  if (parsed.length === 1) {
    return [parsed[0]] as const;
  }
  return [parsed[0], parsed[1]] as const;
}

/**
 * Validates an untrusted chooser definition (e.g. future PLAN-0021 mapping).
 *
 * Invalid shapes are rejected without silent truncation or deduplication.
 */
export function validateHomeQuickChooserDefinition(
  value: unknown,
): HomeQuickChooserDefinitionValidationResult {
  if (!isRecord(value)) {
    return { ok: false, reason: "not_object" };
  }

  const status = value.capabilityStatus;
  if (status === "available") {
    // Redundant retryable:true may appear in transport payloads; reject only a
    // contradictory retryable:false on an available definition.
    if (value.retryable === false) {
      return { ok: false, reason: "available_with_false_retryable" };
    }
    const questions = validateQuestions(value.questions);
    if (!questions) {
      return { ok: false, reason: "available_invalid_questions" };
    }
    return {
      ok: true,
      definition: { capabilityStatus: "available", questions },
    };
  }

  if (status === "temporarily_unavailable") {
    if (value.retryable !== true) {
      return { ok: false, reason: "temporary_not_retryable" };
    }
    if (!nonemptyString(value.statusReasonKey)) {
      return { ok: false, reason: "temporary_missing_reason" };
    }
    if (!Array.isArray(value.questions) || value.questions.length !== 0) {
      return { ok: false, reason: "temporary_with_questions" };
    }
    return {
      ok: true,
      definition: {
        capabilityStatus: "temporarily_unavailable",
        retryable: true,
        statusReasonKey: value.statusReasonKey,
        questions: [],
      },
    };
  }

  if (status === "not_implemented") {
    if (value.retryable !== false) {
      return { ok: false, reason: "not_implemented_retryable" };
    }
    if (!Array.isArray(value.questions) || value.questions.length !== 0) {
      return { ok: false, reason: "not_implemented_with_questions" };
    }
    const statusReasonKey = nonemptyString(value.statusReasonKey)
      ? value.statusReasonKey
      : undefined;
    return {
      ok: true,
      definition: {
        capabilityStatus: "not_implemented",
        retryable: false,
        statusReasonKey,
        questions: [],
      },
    };
  }

  return { ok: false, reason: "unknown_status" };
}

/**
 * Normalizes an untrusted definition into a presentation-safe value.
 * Invalid input fails closed to a temporary-unavailable + Retry state —
 * never silently truncates or strips questions.
 */
export function normalizeHomeQuickChooserDefinition(
  value: unknown,
): HomeQuickChooserDefinition {
  const result = validateHomeQuickChooserDefinition(value);
  if (result.ok) {
    return result.definition;
  }
  return INVALID_DEFINITION;
}

/** Exhaustiveness helper for discriminated chooser definitions. */
export function assertNeverChooserDefinition(value: never): never {
  throw new Error(`Unhandled quick-chooser definition: ${String(value)}`);
}
