import {
  normalizeHomeQuickChooserDefinition,
  validateHomeQuickChooserDefinition,
} from "./validateHomeQuickChooserDefinition";

const validOneQuestion = {
  capabilityStatus: "available",
  questions: [
    {
      id: "time",
      promptKey: "home.chooser.q.time",
      options: [
        { id: "under_20", labelKey: "home.chooser.a.under20" },
        { id: "about_40", labelKey: "home.chooser.a.about40" },
      ],
    },
  ],
};

const validTwoQuestions = {
  capabilityStatus: "available",
  questions: [
    validOneQuestion.questions[0],
    {
      id: "shopping",
      promptKey: "home.chooser.q.shopping",
      options: [
        { id: "use_what_i_have", labelKey: "home.chooser.a.useWhatIHave" },
        { id: "ok_to_buy", labelKey: "home.chooser.a.okToBuy" },
      ],
    },
  ],
};

describe("validateHomeQuickChooserDefinition", () => {
  it("accepts available one- and two-question definitions", () => {
    expect(validateHomeQuickChooserDefinition(validOneQuestion).ok).toBe(true);
    expect(validateHomeQuickChooserDefinition(validTwoQuestions).ok).toBe(true);
  });

  it("accepts temporary unavailable and not implemented variants", () => {
    expect(
      validateHomeQuickChooserDefinition({
        capabilityStatus: "temporarily_unavailable",
        retryable: true,
        statusReasonKey: "home.chooser.definitionFailed",
        questions: [],
      }).ok,
    ).toBe(true);
    expect(
      validateHomeQuickChooserDefinition({
        capabilityStatus: "not_implemented",
        retryable: false,
        questions: [],
      }).ok,
    ).toBe(true);
  });

  it.each([
    [
      "available zero questions",
      { capabilityStatus: "available", questions: [] },
    ],
    [
      "available three questions",
      {
        capabilityStatus: "available",
        questions: [
          validOneQuestion.questions[0],
          validTwoQuestions.questions[1],
          {
            id: "third",
            promptKey: "home.chooser.q.time",
            options: [
              { id: "a", labelKey: "home.chooser.a.under20" },
              { id: "b", labelKey: "home.chooser.a.about40" },
            ],
          },
        ],
      },
    ],
    [
      "duplicate question ids",
      {
        capabilityStatus: "available",
        questions: [
          validOneQuestion.questions[0],
          { ...validTwoQuestions.questions[1], id: "time" },
        ],
      },
    ],
    [
      "empty question id",
      {
        capabilityStatus: "available",
        questions: [{ ...validOneQuestion.questions[0], id: "  " }],
      },
    ],
    [
      "empty prompt",
      {
        capabilityStatus: "available",
        questions: [{ ...validOneQuestion.questions[0], promptKey: "" }],
      },
    ],
    [
      "zero options",
      {
        capabilityStatus: "available",
        questions: [{ ...validOneQuestion.questions[0], options: [] }],
      },
    ],
    [
      "one option",
      {
        capabilityStatus: "available",
        questions: [
          {
            ...validOneQuestion.questions[0],
            options: [{ id: "only", labelKey: "home.chooser.a.under20" }],
          },
        ],
      },
    ],
    [
      "duplicate option ids",
      {
        capabilityStatus: "available",
        questions: [
          {
            ...validOneQuestion.questions[0],
            options: [
              { id: "dup", labelKey: "home.chooser.a.under20" },
              { id: "dup", labelKey: "home.chooser.a.about40" },
            ],
          },
        ],
      },
    ],
    [
      "empty option id",
      {
        capabilityStatus: "available",
        questions: [
          {
            ...validOneQuestion.questions[0],
            options: [
              { id: "", labelKey: "home.chooser.a.under20" },
              { id: "b", labelKey: "home.chooser.a.about40" },
            ],
          },
        ],
      },
    ],
    [
      "empty option label",
      {
        capabilityStatus: "available",
        questions: [
          {
            ...validOneQuestion.questions[0],
            options: [
              { id: "a", labelKey: "" },
              { id: "b", labelKey: "home.chooser.a.about40" },
            ],
          },
        ],
      },
    ],
    [
      "temporary with questions",
      {
        capabilityStatus: "temporarily_unavailable",
        retryable: true,
        statusReasonKey: "home.chooser.definitionFailed",
        questions: [validOneQuestion.questions[0]],
      },
    ],
    [
      "not implemented with questions",
      {
        capabilityStatus: "not_implemented",
        retryable: false,
        questions: [validOneQuestion.questions[0]],
      },
    ],
    [
      "temporary not retryable",
      {
        capabilityStatus: "temporarily_unavailable",
        retryable: false,
        statusReasonKey: "home.chooser.definitionFailed",
        questions: [],
      },
    ],
    [
      "not implemented retryable",
      {
        capabilityStatus: "not_implemented",
        retryable: true,
        questions: [],
      },
    ],
  ])("rejects %s without truncation", (_label, fixture) => {
    const result = validateHomeQuickChooserDefinition(fixture);
    expect(result.ok).toBe(false);
    const normalized = normalizeHomeQuickChooserDefinition(fixture);
    expect(normalized).toEqual({
      capabilityStatus: "temporarily_unavailable",
      retryable: true,
      statusReasonKey: "home.chooser.invalidDefinition",
      questions: [],
    });
  });
});
