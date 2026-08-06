using System.Text.Json;
using KitchenFlow.Modules.Ai.Abstractions;
using KitchenFlow.Modules.Ai.Usage;
using KitchenFlow.Modules.Identity;
using KitchenFlow.Modules.Recipes.Ai;
using KitchenFlow.Modules.Recipes.Domain;

namespace KitchenFlow.Modules.Recipes.Application;

/// <summary>
/// Module-owned application service for the complete authenticated cook-now recipe generation
/// vertical slice: create a generation session, request three validated candidates through the AI
/// Gateway (reserve usage, invoke the provider, validate the response, allow at most one repair,
/// then settle or release the reservation), select and expand one candidate into an immutable
/// recipe revision, and list or read previously generated recipes. AI output is never trusted or
/// persisted until it passes <see cref="RecipeProtocolValidator"/> schema and semantic validation.
/// </summary>
public sealed class RecipeCookNowApplicationService(
    ICurrentUserAccessor currentUser,
    IRecipeGenerationStore generationStore,
    IRecipeStore recipeStore,
    IRecipeContextAssembler contextAssembler,
    IAiProvider aiProvider,
    AiOperationRegistry operationRegistry,
    AiUsageGovernor usageGovernor,
    TimeProvider timeProvider)
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    /// <summary>
    /// Creates a cook-now generation session and requests exactly three validated candidates.
    /// Replays the prior result when <see cref="RequestCandidatesCommand.IdempotencyKey"/> was
    /// already used by this owner, without re-invoking the AI Gateway or re-reserving usage.
    /// </summary>
    public async Task<RecipeApplicationResult<RecipeGenerationSessionView>> RequestCandidatesAsync(RequestCandidatesCommand command, CancellationToken cancellationToken)
    {
        if (command.IdempotencyKey is null)
        {
            return Failure<RecipeGenerationSessionView>("validation_failed", "A UUID Idempotency-Key header is required.");
        }

        var user = await currentUser.GetCurrentAsync(cancellationToken);
        var existing = await generationStore.FindByIdempotencyKeyAsync(user.Id, command.IdempotencyKey.Value, cancellationToken);
        if (existing is not null)
        {
            return RecipeApplicationResult<RecipeGenerationSessionView>.Succeeded(ToSessionView(existing));
        }

        if (!operationRegistry.TryGet(AiOperationRegistry.SuggestCandidates, out var definition))
        {
            return Failure<RecipeGenerationSessionView>("ai_capability_unavailable", "The recipe suggestion capability is not registered.");
        }

        var now = timeProvider.GetUtcNow();
        var session = RecipeGenerationSession.Create(user.Id, command.IdempotencyKey.Value, now);

        var reservation = await usageGovernor.ReserveAsync(user.Id, definition.Operation, definition.EstimatedUsageUnits, command.CorrelationId, cancellationToken);
        if (reservation.Outcome != AiUsageReservationOutcome.Reserved)
        {
            session.MarkFailed($"usage_{reservation.Outcome}", now);
            await generationStore.SaveNewAsync(session, cancellationToken);
            return Failure<RecipeGenerationSessionView>(MapReservationFailure(reservation.Outcome), ReservationDetail(reservation.Outcome));
        }

        var context = await contextAssembler.AssembleSuggestContextAsync(user.Id, Guid.NewGuid().ToString("n"), definition.ContextBudgetCharacters, cancellationToken);
        var invocation = await InvokeSuggestWithRepairAsync(definition, context, command.CorrelationId, cancellationToken);
        if (invocation.Response is null)
        {
            await usageGovernor.ReleaseAsync(reservation.ReservationId!.Value, cancellationToken);
            session.MarkFailed(invocation.FailureCode ?? "ai_output_invalid", timeProvider.GetUtcNow());
            await generationStore.SaveNewAsync(session, cancellationToken);
            return Failure<RecipeGenerationSessionView>(invocation.FailureCode ?? "ai_output_invalid", invocation.FailureDetail ?? "The AI provider did not return three validated candidates.");
        }

        await usageGovernor.SettleAsync(reservation.ReservationId!.Value, definition.EstimatedUsageUnits, aiProvider.Name, invocation.ModelUsed ?? "unknown", cancellationToken);
        session.AttachValidatedCandidates(JsonSerializer.Serialize(invocation.Response, SerializerOptions), timeProvider.GetUtcNow());
        await generationStore.SaveNewAsync(session, cancellationToken);
        return RecipeApplicationResult<RecipeGenerationSessionView>.Succeeded(ToSessionView(session, invocation.Response.Candidates));
    }

    /// <summary>Gets one owner-scoped generation session and its validated candidates, when present.</summary>
    public async Task<RecipeApplicationResult<RecipeGenerationSessionView>> GetSessionAsync(Guid sessionId, CancellationToken cancellationToken)
    {
        var user = await currentUser.GetCurrentAsync(cancellationToken);
        var session = await generationStore.FindByIdAsync(user.Id, sessionId, cancellationToken);
        return session is null
            ? Failure<RecipeGenerationSessionView>("resource_not_found", "The generation session was not found.")
            : RecipeApplicationResult<RecipeGenerationSessionView>.Succeeded(ToSessionView(session));
    }

    /// <summary>
    /// Selects one previously suggested candidate, expands it through the AI Gateway, and persists
    /// exactly one new owner-isolated immutable recipe and its first revision on success. Replays the
    /// prior recipe when <see cref="SelectCandidateCommand.IdempotencyKey"/> was already used.
    /// </summary>
    public async Task<RecipeApplicationResult<RecipeDetailView>> SelectCandidateAsync(SelectCandidateCommand command, CancellationToken cancellationToken)
    {
        if (command.IdempotencyKey is null)
        {
            return Failure<RecipeDetailView>("validation_failed", "A UUID Idempotency-Key header is required.");
        }

        if (string.IsNullOrWhiteSpace(command.CandidateId))
        {
            return Failure<RecipeDetailView>("validation_failed", "A candidate identifier is required.");
        }

        var user = await currentUser.GetCurrentAsync(cancellationToken);
        var priorSelection = await generationStore.FindBySelectIdempotencyKeyAsync(user.Id, command.IdempotencyKey.Value, cancellationToken);
        if (priorSelection?.SelectedRecipeId is Guid priorRecipeId)
        {
            var priorDetail = await recipeStore.FindDetailAsync(user.Id, priorRecipeId, cancellationToken);
            return priorDetail is null
                ? Failure<RecipeDetailView>("resource_not_found", "The previously selected recipe was not found.")
                : RecipeApplicationResult<RecipeDetailView>.Succeeded(ToDetailView(priorDetail));
        }

        var session = await generationStore.FindActiveAsync(user.Id, command.SessionId, cancellationToken);
        if (session is null)
        {
            return Failure<RecipeDetailView>("resource_not_found", "The generation session was not found.");
        }

        var now = timeProvider.GetUtcNow();
        if (session.IsExpired(now))
        {
            return Failure<RecipeDetailView>("precondition_failed", "The generation session has expired.");
        }

        if (session.Status == RecipeGenerationSessionStatus.Selected && session.SelectedRecipeId is Guid existingRecipeId)
        {
            if (!string.Equals(session.SelectedCandidateId, command.CandidateId, StringComparison.Ordinal))
            {
                return Failure<RecipeDetailView>("ai_operation_conflict", "A different candidate was already selected for this generation session.");
            }

            var existingDetail = await recipeStore.FindDetailAsync(user.Id, existingRecipeId, cancellationToken);
            return existingDetail is null
                ? Failure<RecipeDetailView>("resource_not_found", "The previously selected recipe was not found.")
                : RecipeApplicationResult<RecipeDetailView>.Succeeded(ToDetailView(existingDetail));
        }

        if (session.Status != RecipeGenerationSessionStatus.CandidatesReady)
        {
            return Failure<RecipeDetailView>("precondition_failed", "Candidates are not ready for selection on this session.");
        }

        var candidates = JsonSerializer.Deserialize<SuggestCandidatesResponse>(session.CandidatesSnapshotJson!, SerializerOptions)!;
        var selected = candidates.Candidates.FirstOrDefault(item => string.Equals(item.CandidateId, command.CandidateId, StringComparison.Ordinal));
        if (selected is null)
        {
            return Failure<RecipeDetailView>("resource_not_found", "The candidate was not found in this generation session.");
        }

        if (!operationRegistry.TryGet(AiOperationRegistry.ExpandSelected, out var definition))
        {
            return Failure<RecipeDetailView>("ai_capability_unavailable", "The recipe expansion capability is not registered.");
        }

        var reservation = await usageGovernor.ReserveAsync(user.Id, definition.Operation, definition.EstimatedUsageUnits, command.CorrelationId, cancellationToken);
        if (reservation.Outcome != AiUsageReservationOutcome.Reserved)
        {
            return Failure<RecipeDetailView>(MapReservationFailure(reservation.Outcome), ReservationDetail(reservation.Outcome));
        }

        var context = await contextAssembler.AssembleExpandContextAsync(user.Id, Guid.NewGuid().ToString("n"), selected, definition.ContextBudgetCharacters, cancellationToken);
        var invocation = await InvokeExpandWithRepairAsync(definition, context, command.CorrelationId, cancellationToken);
        if (invocation.Response is null)
        {
            await usageGovernor.ReleaseAsync(reservation.ReservationId!.Value, cancellationToken);
            session.MarkFailed(invocation.FailureCode ?? "ai_output_invalid", timeProvider.GetUtcNow());
            await generationStore.SaveAsync(session, cancellationToken);
            return Failure<RecipeDetailView>(invocation.FailureCode ?? "ai_output_invalid", invocation.FailureDetail ?? "The AI provider did not return a valid expanded recipe.");
        }

        await usageGovernor.SettleAsync(reservation.ReservationId!.Value, definition.EstimatedUsageUnits, aiProvider.Name, invocation.ModelUsed ?? "unknown", cancellationToken);

        var completedAt = timeProvider.GetUtcNow();
        var expandedRecipe = invocation.Response.Recipe;
        var recipe = Recipe.Create(user.Id, completedAt);
        var revision = RecipeRevision.CreateFirst(
            recipe.Id,
            user.Id,
            expandedRecipe.Name,
            expandedRecipe.MealTypes,
            expandedRecipe.Servings,
            RecipeRevisionMapper.NormalizeRecipe(expandedRecipe),
            RecipeRevisionMapper.NormalizeThumbnailVisual(expandedRecipe.ThumbnailVisual),
            selected.CandidateId,
            session.Id,
            completedAt);

        await recipeStore.SaveNewAsync(recipe, revision, cancellationToken);
        session.CompleteSelection(selected.CandidateId, recipe.Id, command.IdempotencyKey.Value, completedAt);
        await generationStore.SaveAsync(session, cancellationToken);
        return RecipeApplicationResult<RecipeDetailView>.Succeeded(ToDetailView(revision), RecipeApplicationSuccess.Created);
    }

    /// <summary>Lists all recipes owned by the current internal user, most recently created first.</summary>
    public async Task<RecipeApplicationResult<IReadOnlyList<RecipeSummaryView>>> ListRecipesAsync(CancellationToken cancellationToken)
    {
        var user = await currentUser.GetCurrentAsync(cancellationToken);
        var items = await recipeStore.ListAsync(user.Id, cancellationToken);
        return RecipeApplicationResult<IReadOnlyList<RecipeSummaryView>>.Succeeded(items.Select(ToSummaryView).ToList());
    }

    /// <summary>Gets one owned recipe's current revision without cross-user disclosure.</summary>
    public async Task<RecipeApplicationResult<RecipeDetailView>> GetRecipeAsync(Guid recipeId, CancellationToken cancellationToken)
    {
        var user = await currentUser.GetCurrentAsync(cancellationToken);
        var detail = await recipeStore.FindDetailAsync(user.Id, recipeId, cancellationToken);
        return detail is null
            ? Failure<RecipeDetailView>("resource_not_found", "The recipe was not found.")
            : RecipeApplicationResult<RecipeDetailView>.Succeeded(ToDetailView(detail));
    }

    private async Task<(SuggestCandidatesResponse? Response, string? ModelUsed, string? FailureCode, string? FailureDetail)> InvokeSuggestWithRepairAsync(
        AiOperationDefinition definition, RecipeSuggestRequestContext context, string correlationId, CancellationToken cancellationToken)
    {
        var payload = RecipeAiRequestEnvelopes.BuildSuggestRequest(context);
        using var requestDocument = JsonDocument.Parse(payload);
        var requestElement = requestDocument.RootElement;
        string? modelUsed = null;
        AiProviderFailureKind? lastTransportFailure = null;
        var sawInvalidOutput = false;
        for (var attempt = 0; attempt <= definition.MaxRepairAttempts; attempt++)
        {
            var invocation = await aiProvider.InvokeAsync(new AiProviderInvocationRequest(definition.Operation, payload, definition.PreferNonThinking, definition.TimeoutSeconds, correlationId), cancellationToken);
            if (!invocation.IsSuccess)
            {
                lastTransportFailure = invocation.FailureKind;
                continue;
            }

            modelUsed = invocation.ModelUsed;
            var validation = RecipeProtocolValidator.ValidateSuggest(invocation.RawContent!, requestElement);
            if (validation.IsValid)
            {
                return (validation.Response, modelUsed, null, null);
            }

            sawInvalidOutput = true;
        }

        return (null, modelUsed, MapProviderFailure(lastTransportFailure, sawInvalidOutput), DescribeProviderFailure(lastTransportFailure, sawInvalidOutput));
    }

    private async Task<(ExpandSelectedResponse? Response, string? ModelUsed, string? FailureCode, string? FailureDetail)> InvokeExpandWithRepairAsync(
        AiOperationDefinition definition, RecipeExpandRequestContext context, string correlationId, CancellationToken cancellationToken)
    {
        var payload = RecipeAiRequestEnvelopes.BuildExpandRequest(context);
        using var requestDocument = JsonDocument.Parse(payload);
        var requestElement = requestDocument.RootElement;
        string? modelUsed = null;
        AiProviderFailureKind? lastTransportFailure = null;
        var sawInvalidOutput = false;
        for (var attempt = 0; attempt <= definition.MaxRepairAttempts; attempt++)
        {
            var invocation = await aiProvider.InvokeAsync(new AiProviderInvocationRequest(definition.Operation, payload, definition.PreferNonThinking, definition.TimeoutSeconds, correlationId), cancellationToken);
            if (!invocation.IsSuccess)
            {
                lastTransportFailure = invocation.FailureKind;
                continue;
            }

            modelUsed = invocation.ModelUsed;
            var validation = RecipeProtocolValidator.ValidateExpand(invocation.RawContent!, requestElement);
            if (validation.IsValid)
            {
                return (validation.Response, modelUsed, null, null);
            }

            sawInvalidOutput = true;
        }

        return (null, modelUsed, MapProviderFailure(lastTransportFailure, sawInvalidOutput), DescribeProviderFailure(lastTransportFailure, sawInvalidOutput));
    }

    private static RecipeGenerationSessionView ToSessionView(RecipeGenerationSession session, IReadOnlyList<SuggestCandidate>? candidates = null)
    {
        var resolved = candidates ?? (session.CandidatesSnapshotJson is null ? null : JsonSerializer.Deserialize<SuggestCandidatesResponse>(session.CandidatesSnapshotJson, SerializerOptions)!.Candidates);
        return new RecipeGenerationSessionView(session.Id, session.Status.ToString(), resolved?.Select(ToCandidateView).ToList(), session.FailureReason);
    }

    private static RecipeCandidateView ToCandidateView(SuggestCandidate candidate) => new(
        candidate.CandidateId,
        candidate.CandidateStrategy,
        candidate.Name,
        candidate.TargetMealType,
        candidate.DishFormat,
        candidate.PrimaryTechnique,
        candidate.PrimaryIngredientRefs,
        candidate.Summary,
        candidate.Servings,
        candidate.Time.ActiveMinutes,
        candidate.Time.PassiveMinutes,
        candidate.Time.TotalMinutes,
        candidate.Difficulty,
        candidate.RequiredEquipmentIds,
        candidate.RequiredCapabilities);

    private static RecipeDetailView ToDetailView(RecipeRevision revision) => new(revision.RecipeId, revision.RevisionNumber, revision.Name, revision.MealTypes, revision.Servings, revision.NormalizedRecipeJson, revision.ThumbnailVisualJson, revision.CreatedAt);
    private static RecipeDetailView ToDetailView(RecipeDetail detail) => new(detail.RecipeId, detail.RevisionNumber, detail.Name, detail.MealTypes, detail.Servings, detail.NormalizedRecipeJson, detail.ThumbnailVisualJson, detail.CreatedAt);
    private static RecipeSummaryView ToSummaryView(RecipeSummary summary) => new(summary.RecipeId, summary.Name, summary.MealTypes, summary.Servings, summary.CreatedAt);

    private static RecipeApplicationResult<T> Failure<T>(string code, string detail, IReadOnlyDictionary<string, string[]>? errors = null) => RecipeApplicationResult<T>.Failure(code, detail, errors);

    private static string MapReservationFailure(AiUsageReservationOutcome outcome) => outcome switch
    {
        AiUsageReservationOutcome.Disabled => "ai_capability_unavailable",
        AiUsageReservationOutcome.GlobalBudgetExhausted or AiUsageReservationOutcome.UserBudgetExhausted => "ai_budget_exhausted",
        AiUsageReservationOutcome.ConcurrencyExhausted => "ai_operation_conflict",
        _ => "ai_budget_unavailable"
    };

    private static string ReservationDetail(AiUsageReservationOutcome outcome) => outcome switch
    {
        AiUsageReservationOutcome.Disabled => "The AI Gateway is currently disabled.",
        AiUsageReservationOutcome.GlobalBudgetExhausted => "The global AI usage budget for today is exhausted.",
        AiUsageReservationOutcome.UserBudgetExhausted => "Your daily AI usage budget is exhausted.",
        AiUsageReservationOutcome.ConcurrencyExhausted => "You already have the maximum number of AI requests in progress.",
        _ => "The AI Gateway is currently unavailable."
    };

    private static string MapProviderFailure(AiProviderFailureKind? failureKind, bool sawInvalidOutput)
    {
        if (sawInvalidOutput)
        {
            return "ai_output_invalid";
        }

        return failureKind switch
        {
            AiProviderFailureKind.Timeout => "ai_provider_timeout",
            AiProviderFailureKind.Unavailable => "ai_provider_unavailable",
            _ => "ai_provider_unavailable"
        };
    }

    private static string DescribeProviderFailure(AiProviderFailureKind? failureKind, bool sawInvalidOutput)
    {
        if (sawInvalidOutput)
        {
            return "The AI provider returned output that failed protocol validation after the allowed repair attempt.";
        }

        return failureKind switch
        {
            AiProviderFailureKind.Timeout => "The AI provider timed out before returning a usable response.",
            AiProviderFailureKind.Unavailable => "The AI provider is currently unavailable.",
            _ => "The AI provider did not return a usable response."
        };
    }
}
