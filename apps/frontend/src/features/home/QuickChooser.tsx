import { useEffect, useId, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProductionI18n } from "@/app/i18n/ProductionI18nProvider";
import { cn } from "@/lib/utils";
import type {
  HomeQuickChooserDefinition,
  HomeSourceResult,
  HomeTelemetry,
} from "@/contracts/contextualHome";

/**
 * Classifies a resolved suggestion result.
 *
 * Telemetry: `quick_chooser_completed` is emitted for a finished search that
 * yields `ready` or `empty` (empty = completed search with zero candidates).
 * Failures and permanent unavailable never emit completion.
 */
function classifySuggestionResult(
  result: HomeSourceResult,
):
  | { kind: "complete"; empty: boolean }
  | { kind: "recoverable"; messageKey: string }
  | { kind: "permanent"; messageKey: string }
  | { kind: "invalid"; messageKey: string } {
  if (result.tier !== "quickChooser") {
    return { kind: "invalid", messageKey: "home.chooser.invalidResult" };
  }
  if (typeof result.retryable !== "boolean") {
    return { kind: "invalid", messageKey: "home.chooser.invalidResult" };
  }
  for (const item of result.items) {
    if (item.sourceTier !== "quickChooser") {
      return { kind: "invalid", messageKey: "home.chooser.invalidResult" };
    }
  }

  if (result.status === "ready") {
    if (result.items.length === 0) {
      return { kind: "invalid", messageKey: "home.chooser.invalidResult" };
    }
    return { kind: "complete", empty: false };
  }

  if (result.status === "empty") {
    return { kind: "complete", empty: true };
  }

  if (result.status === "failed" && result.retryable) {
    return {
      kind: "recoverable",
      messageKey: result.statusReasonKey ?? "home.chooser.loadFailed",
    };
  }

  if (result.status === "unavailable" && result.retryable) {
    return {
      kind: "recoverable",
      messageKey: result.statusReasonKey ?? "home.chooser.loadFailed",
    };
  }

  if (result.status === "unavailable" && !result.retryable) {
    return {
      kind: "permanent",
      messageKey: result.statusReasonKey ?? "home.chooser.unavailable",
    };
  }

  return { kind: "invalid", messageKey: "home.chooser.invalidResult" };
}

/**
 * Request-scoped quick chooser built on Radix Dialog.
 *
 * Answers are never written to profile/menu/inventory/localStorage.
 * Escape closes (including during submit, which cancels the attempt).
 * Late results after cancel or a newer attempt are ignored.
 *
 * Resolved suggestion Promises are classified by status — a resolved
 * `failed`/`unavailable` result is not treated as successful completion.
 */
export function QuickChooser({
  definition,
  onCancel,
  onRetry,
  onComplete,
  onLoadSuggestions,
  telemetry,
}: {
  definition: HomeQuickChooserDefinition;
  onCancel: () => void;
  /** Reload chooser capability/definition after a recoverable unavailable state. */
  onRetry: () => void;
  onComplete: (result: HomeSourceResult) => void;
  onLoadSuggestions: (
    answers: Record<string, string>,
    signal: AbortSignal,
  ) => Promise<HomeSourceResult>;
  telemetry: HomeTelemetry;
}) {
  const { t } = useProductionI18n();
  const titleId = useId();
  const descriptionId = useId();
  const mountedRef = useRef(true);
  const attemptRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestionRetryable, setSuggestionRetryable] = useState(false);
  const [permanentSuggestionBlock, setPermanentSuggestionBlock] =
    useState(false);

  const questions = definition.questions;
  const question = questions[step];
  const isLast = step >= questions.length - 1;
  const definitionUnavailable = definition.capabilityStatus !== "available";
  const showDefinitionRetry =
    definition.capabilityStatus === "temporarily_unavailable" &&
    definition.retryable;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  // Reset wizard when definition identity changes while open.
  // Suggestion-level retry keeps the same definition object and preserves answers.
  useEffect(() => {
    setStep(0);
    setAnswers({});
    setError(null);
    setBusy(false);
    setSuggestionRetryable(false);
    setPermanentSuggestionBlock(false);
    abortRef.current?.abort();
    abortRef.current = null;
  }, [definition]);

  function requestClose() {
    telemetry.track({ name: "quick_chooser_cancelled" });
    abortRef.current?.abort();
    attemptRef.current += 1;
    onCancel();
  }

  async function submit(finalAnswers: Record<string, string>) {
    if (busy) return;
    const attempt = ++attemptRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError(null);
    setSuggestionRetryable(false);
    setPermanentSuggestionBlock(false);
    try {
      const result = await onLoadSuggestions(finalAnswers, controller.signal);
      if (
        !mountedRef.current ||
        attempt !== attemptRef.current ||
        controller.signal.aborted
      ) {
        return;
      }

      const classified = classifySuggestionResult(result);
      if (classified.kind === "complete") {
        telemetry.track({
          name: "quick_chooser_completed",
          codes: {
            questionCount: String(Object.keys(finalAnswers).length),
            outcome: classified.empty ? "empty" : "ready",
          },
        });
        onComplete(result);
        return;
      }

      if (classified.kind === "recoverable") {
        setError(t(classified.messageKey));
        setSuggestionRetryable(true);
        return;
      }

      if (classified.kind === "permanent") {
        setError(t(classified.messageKey));
        setPermanentSuggestionBlock(true);
        setSuggestionRetryable(false);
        return;
      }

      setError(t(classified.messageKey));
      setSuggestionRetryable(false);
    } catch (err) {
      if (
        !mountedRef.current ||
        attempt !== attemptRef.current ||
        controller.signal.aborted ||
        (err instanceof DOMException && err.name === "AbortError")
      ) {
        return;
      }
      setError(t("home.chooser.loadFailed"));
      setSuggestionRetryable(true);
    } finally {
      if (mountedRef.current && attempt === attemptRef.current) {
        setBusy(false);
      }
    }
  }

  const descriptionCopy = definitionUnavailable
    ? t(
        definition.statusReasonKey ??
          (definition.capabilityStatus === "temporarily_unavailable"
            ? "home.chooser.definitionFailed"
            : "home.chooser.unavailable"),
      )
    : t("home.chooser.description");

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) requestClose();
      }}
    >
      <DialogPortal>
        <DialogOverlay className="motion-reduce:animate-none" />
        <DialogPrimitive.Content
          data-testid="quick-chooser"
          data-capability={definition.capabilityStatus}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg",
            "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
            "motion-reduce:duration-0 motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none",
          )}
          onEscapeKeyDown={(event) => {
            void event;
          }}
          onPointerDownOutside={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle id={titleId} className="font-display text-2xl">
              {t("home.chooser.title")}
            </DialogTitle>
            <DialogDescription id={descriptionId}>
              {descriptionCopy}
            </DialogDescription>
          </DialogHeader>

          {definitionUnavailable ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                data-testid="chooser-cancel"
                onClick={requestClose}
              >
                {t("home.chooser.cancel")}
              </Button>
              {showDefinitionRetry ? (
                <Button
                  type="button"
                  variant="secondary"
                  data-testid="chooser-retry"
                  onClick={onRetry}
                >
                  {t("home.chooser.retry")}
                </Button>
              ) : null}
            </div>
          ) : permanentSuggestionBlock ? (
            <div className="space-y-3">
              {error ? (
                <p
                  role="alert"
                  data-testid="chooser-error"
                  className="text-sm text-destructive"
                >
                  {error}
                </p>
              ) : null}
              <Button
                type="button"
                data-testid="chooser-cancel"
                onClick={requestClose}
              >
                {t("home.chooser.cancel")}
              </Button>
            </div>
          ) : question ? (
            <>
              <p className="text-base" data-testid="chooser-prompt">
                {t(question.promptKey)}
              </p>
              <div
                role="group"
                aria-label={t(question.promptKey)}
                className="flex flex-col gap-2"
              >
                {question.options.map((option) => {
                  const selected = answers[question.id] === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      data-testid={`chooser-option-${option.id}`}
                      aria-pressed={selected}
                      disabled={busy}
                      className={`min-h-11 rounded-xl border px-4 py-3 text-left text-sm ${
                        selected
                          ? "border-primary bg-secondary"
                          : "border-border hover:bg-secondary/50"
                      } disabled:opacity-60`}
                      onClick={() =>
                        setAnswers((prev) => ({
                          ...prev,
                          [question.id]: option.id,
                        }))
                      }
                    >
                      {t(option.labelKey)}
                    </button>
                  );
                })}
              </div>
              {error ? (
                <p
                  role="alert"
                  data-testid="chooser-error"
                  className="text-sm text-destructive"
                >
                  {error}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  data-testid="chooser-cancel"
                  onClick={requestClose}
                >
                  {t("home.chooser.cancel")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  data-testid="chooser-skip"
                  disabled={busy}
                  onClick={() => {
                    if (isLast) {
                      void submit(answers);
                    } else {
                      setStep((s) => s + 1);
                    }
                  }}
                >
                  {t("home.chooser.skip")}
                </Button>
                {step > 0 ? (
                  <Button
                    type="button"
                    variant="secondary"
                    data-testid="chooser-back"
                    disabled={busy}
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                  >
                    {t("home.chooser.back")}
                  </Button>
                ) : null}
                {suggestionRetryable ? (
                  <Button
                    type="button"
                    variant="secondary"
                    data-testid="chooser-retry"
                    disabled={busy}
                    onClick={() => void submit(answers)}
                  >
                    {t("home.chooser.retry")}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  data-testid="chooser-next"
                  disabled={!answers[question.id] || busy}
                  onClick={() => {
                    if (isLast) {
                      void submit(answers);
                    } else {
                      setStep((s) => s + 1);
                    }
                  }}
                >
                  {isLast ? t("home.chooser.submit") : t("home.chooser.next")}
                </Button>
              </div>
            </>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
