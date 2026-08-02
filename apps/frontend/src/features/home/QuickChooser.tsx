import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useProductionI18n } from "@/app/i18n/ProductionI18nProvider";
import type {
  HomeQuickChooserDefinition,
  HomeSourceResult,
  HomeTelemetry,
} from "@/contracts/contextualHome";

/**
 * Request-scoped quick chooser. Answers are not written to profile/menu/inventory.
 */
export function QuickChooser({
  definition,
  onCancel,
  onComplete,
  onLoadSuggestions,
  telemetry,
}: {
  definition: HomeQuickChooserDefinition;
  onCancel: () => void;
  onComplete: (result: HomeSourceResult) => void;
  onLoadSuggestions: (
    answers: Record<string, string>,
  ) => Promise<HomeSourceResult>;
  telemetry: HomeTelemetry;
}) {
  const { t } = useProductionI18n();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions = definition.questions;
  const question = questions[step];
  const isLast = step >= questions.length - 1;

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, []);

  if (definition.recommendationCapability === "unavailable") {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="quick-chooser"
        className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-4 sm:items-center"
      >
        <div
          ref={dialogRef}
          tabIndex={-1}
          className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg outline-none"
        >
          <h2 id={titleId} className="font-display text-2xl">
            {t("home.chooser.title")}
          </h2>
          <p role="status" className="mt-3 text-sm text-muted-foreground">
            {t("home.chooser.unavailable")}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              type="button"
              data-testid="chooser-cancel"
              onClick={onCancel}
            >
              {t("home.chooser.cancel")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              data-testid="chooser-retry"
              onClick={onCancel}
            >
              {t("home.chooser.retry")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return null;
  }

  async function submit(finalAnswers: Record<string, string>) {
    setBusy(true);
    setError(null);
    try {
      const result = await onLoadSuggestions(finalAnswers);
      telemetry.track({
        name: "quick_chooser_completed",
        codes: { questionCount: String(Object.keys(finalAnswers).length) },
      });
      onComplete(result);
    } catch {
      setError(t("home.chooser.empty"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-testid="quick-chooser"
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-4 sm:items-center"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg outline-none"
      >
        <h2 id={titleId} className="font-display text-2xl">
          {t("home.chooser.title")}
        </h2>
        <p className="mt-4 text-base" data-testid="chooser-prompt">
          {t(question.promptKey)}
        </p>
        <div
          role="group"
          aria-label={t(question.promptKey)}
          className="mt-4 flex flex-col gap-2"
        >
          {question.options.map((option) => {
            const selected = answers[question.id] === option.id;
            return (
              <button
                key={option.id}
                type="button"
                data-testid={`chooser-option-${option.id}`}
                aria-pressed={selected}
                className={`min-h-11 rounded-xl border px-4 py-3 text-left text-sm ${
                  selected
                    ? "border-primary bg-secondary"
                    : "border-border hover:bg-secondary/50"
                }`}
                onClick={() =>
                  setAnswers((prev) => ({ ...prev, [question.id]: option.id }))
                }
              >
                {t(option.labelKey)}
              </button>
            );
          })}
        </div>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            data-testid="chooser-cancel"
            onClick={() => {
              telemetry.track({ name: "quick_chooser_cancelled" });
              onCancel();
            }}
          >
            {t("home.chooser.cancel")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            data-testid="chooser-skip"
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
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              {t("home.chooser.back")}
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
      </div>
    </div>
  );
}
