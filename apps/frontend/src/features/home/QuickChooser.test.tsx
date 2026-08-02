import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductionI18nProvider } from "@/app/i18n/ProductionI18nProvider";
import type {
  HomeQuickChooserDefinition,
  HomeSourceResult,
} from "@/contracts/contextualHome";
import { QuickChooser } from "./QuickChooser";

const twoQuestionDef: HomeQuickChooserDefinition = {
  recommendationCapability: "available",
  retryable: true,
  questions: [
    {
      id: "time",
      promptKey: "home.chooser.q.time",
      options: [
        { id: "under_20", labelKey: "home.chooser.opt.under20" },
        { id: "under_45", labelKey: "home.chooser.opt.under45" },
      ],
    },
    {
      id: "priority",
      promptKey: "home.chooser.q.priority",
      options: [
        { id: "use_what_i_have", labelKey: "home.chooser.opt.useWhatIHave" },
      ],
    },
  ],
};

const oneQuestionDef: HomeQuickChooserDefinition = {
  recommendationCapability: "available",
  retryable: true,
  questions: [
    {
      id: "only",
      promptKey: "home.chooser.q.time",
      options: [{ id: "under_20", labelKey: "home.chooser.opt.under20" }],
    },
  ],
};

function renderChooser(
  definition: HomeQuickChooserDefinition,
  overrides?: Partial<{
    onCancel: () => void;
    onRetry: () => void;
    onComplete: (result: HomeSourceResult) => void;
    onLoadSuggestions: (
      answers: Record<string, string>,
      signal: AbortSignal,
    ) => Promise<HomeSourceResult>;
  }>,
) {
  const onCancel = overrides?.onCancel ?? jest.fn();
  const onRetry = overrides?.onRetry ?? jest.fn();
  const onComplete = overrides?.onComplete ?? jest.fn();
  const onLoadSuggestions =
    overrides?.onLoadSuggestions ??
    (async () =>
      ({
        tier: "quickChooser",
        status: "empty",
        retryable: false,
        items: [],
      }) satisfies HomeSourceResult);
  const telemetry = { track: jest.fn() };
  const view = render(
    <ProductionI18nProvider initialLocale="en">
      <QuickChooser
        definition={definition}
        telemetry={telemetry}
        onCancel={onCancel}
        onRetry={onRetry}
        onComplete={onComplete}
        onLoadSuggestions={onLoadSuggestions}
      />
    </ProductionI18nProvider>,
  );
  return {
    ...view,
    onCancel,
    onRetry,
    onComplete,
    onLoadSuggestions,
    telemetry,
  };
}

describe("QuickChooser", () => {
  it("resets to the first question when definition changes while open", async () => {
    const user = userEvent.setup();
    const { rerender, telemetry } = renderChooser(twoQuestionDef);
    await user.click(screen.getByTestId("chooser-option-under_20"));
    await user.click(screen.getByTestId("chooser-next"));
    expect(
      screen.getByTestId("chooser-option-use_what_i_have"),
    ).toBeInTheDocument();

    rerender(
      <ProductionI18nProvider initialLocale="en">
        <QuickChooser
          definition={oneQuestionDef}
          telemetry={telemetry}
          onCancel={jest.fn()}
          onRetry={jest.fn()}
          onComplete={jest.fn()}
          onLoadSuggestions={async () => ({
            tier: "quickChooser",
            status: "empty",
            retryable: false,
            items: [],
          })}
        />
      </ProductionI18nProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("chooser-option-under_20")).toBeInTheDocument();
    });
    expect(
      screen.queryByTestId("chooser-option-use_what_i_have"),
    ).not.toBeInTheDocument();
  });

  it("retries after a failed suggestion load", async () => {
    const user = userEvent.setup();
    let attempt = 0;
    const onComplete = jest.fn();
    renderChooser(oneQuestionDef, {
      onComplete,
      onLoadSuggestions: async () => {
        attempt += 1;
        if (attempt === 1) {
          throw new Error("transient");
        }
        return {
          tier: "quickChooser",
          status: "ready",
          retryable: false,
          items: [
            {
              id: "recovered",
              titleKey: "home.fixture.chooser.simpleSoup",
              sourceTier: "quickChooser",
              sourceLabelKey: "home.source.label.quickChooser",
              reasonCodes: ["matches_request_answers"],
            },
          ],
        };
      },
    });
    await user.click(screen.getByTestId("chooser-option-under_20"));
    await user.click(screen.getByTestId("chooser-next"));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    await user.click(screen.getByTestId("chooser-retry"));
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(onComplete.mock.calls[0][0].items[0].id).toBe("recovered");
  });
});
