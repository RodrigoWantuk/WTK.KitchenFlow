using System.Collections.Concurrent;
using System.Text.Json;
using KitchenFlow.Modules.Ai.Abstractions;
using KitchenFlow.Modules.Ai.Providers;
using KitchenFlow.Modules.Ai.Usage;
using KitchenFlow.Modules.Identity;
using KitchenFlow.Modules.Recipes.Ai;
using KitchenFlow.Modules.Recipes.Application;
using KitchenFlow.Modules.Recipes.Domain;

namespace KitchenFlow.UnitTests;

/// <summary>Focused cook-now / AI Gateway unit tests using only the Fake provider.</summary>
public sealed class RecipeCookNowApplicationServiceTests
{
    [Fact]
    public async Task BudgetReserveSettleAndReleaseLifecycle()
    {
        var ledger = new InMemoryAiUsageLedgerStore();
        var governor = new AiUsageGovernor(ledger, new AiUsageOptions { UserDailyUnitCeiling = 10, GlobalDailyUnitCeiling = 100, UserConcurrencyCeiling = 2 }, TimeProvider.System);
        var owner = Guid.NewGuid();

        var reserved = await governor.ReserveAsync(owner, AiOperationRegistry.SuggestCandidates, 3, "corr-1", CancellationToken.None);
        Assert.Equal(AiUsageReservationOutcome.Reserved, reserved.Outcome);
        Assert.Equal(1, await ledger.CountOpenReservationsAsync(owner, CancellationToken.None));

        await governor.SettleAsync(reserved.ReservationId!.Value, 3, "fake", "fake-model", CancellationToken.None);
        Assert.Equal(0, await ledger.CountOpenReservationsAsync(owner, CancellationToken.None));
        Assert.Equal(3, await ledger.SumOwnerUnitsForDayAsync(owner, DateTimeOffset.UtcNow, CancellationToken.None));

        var second = await governor.ReserveAsync(owner, AiOperationRegistry.ExpandSelected, 5, "corr-2", CancellationToken.None);
        await governor.ReleaseAsync(second.ReservationId!.Value, CancellationToken.None);
        Assert.Equal(3, await ledger.SumOwnerUnitsForDayAsync(owner, DateTimeOffset.UtcNow, CancellationToken.None));
        Assert.Equal(0, await ledger.CountOpenReservationsAsync(owner, CancellationToken.None));
    }

    [Fact]
    public async Task RequestCandidatesSameKeyReplaysWithoutSecondProviderCall()
    {
        var harness = CreateHarness();
        var key = Guid.NewGuid();
        var first = await harness.Service.RequestCandidatesAsync(new RequestCandidatesCommand(key, "corr"), CancellationToken.None);
        var second = await harness.Service.RequestCandidatesAsync(new RequestCandidatesCommand(key, "corr"), CancellationToken.None);

        Assert.Null(first.Problem);
        Assert.Null(second.Problem);
        Assert.Equal(first.Value!.SessionId, second.Value!.SessionId);
        Assert.Equal(3, first.Value.Candidates!.Count);
        Assert.Equal(1, harness.Provider.InvocationCount(AiOperationRegistry.SuggestCandidates));
    }

    [Fact]
    public async Task OwnerIsolationPreventsCrossUserSessionAndRecipeAccess()
    {
        var sharedGeneration = new InMemoryRecipeGenerationStore();
        var sharedRecipes = new InMemoryRecipeStore();
        var ownerA = Guid.NewGuid();
        var ownerB = Guid.NewGuid();
        var serviceA = CreateHarness(ownerA, sharedGeneration, sharedRecipes).Service;
        var serviceB = CreateHarness(ownerB, sharedGeneration, sharedRecipes).Service;

        var created = await serviceA.RequestCandidatesAsync(new RequestCandidatesCommand(Guid.NewGuid(), "corr"), CancellationToken.None);
        var foreignSession = await serviceB.GetSessionAsync(created.Value!.SessionId, CancellationToken.None);
        Assert.Equal("resource_not_found", foreignSession.Problem!.ErrorCode);

        var select = await serviceA.SelectCandidateAsync(new SelectCandidateCommand(created.Value.SessionId, created.Value.Candidates![0].CandidateId, Guid.NewGuid(), "corr"), CancellationToken.None);
        Assert.Null(select.Problem);
        var foreignRecipe = await serviceB.GetRecipeAsync(select.Value!.RecipeId, CancellationToken.None);
        Assert.Equal("resource_not_found", foreignRecipe.Problem!.ErrorCode);
    }

    [Fact]
    public async Task SelectedCandidateSavedOnceAndSelectIdempotencyReplays()
    {
        var harness = CreateHarness();
        var session = await harness.Service.RequestCandidatesAsync(new RequestCandidatesCommand(Guid.NewGuid(), "corr"), CancellationToken.None);
        var selectKey = Guid.NewGuid();
        var candidateId = session.Value!.Candidates![0].CandidateId;

        var first = await harness.Service.SelectCandidateAsync(new SelectCandidateCommand(session.Value.SessionId, candidateId, selectKey, "corr"), CancellationToken.None);
        var second = await harness.Service.SelectCandidateAsync(new SelectCandidateCommand(session.Value.SessionId, candidateId, selectKey, "corr"), CancellationToken.None);

        Assert.Null(first.Problem);
        Assert.Null(second.Problem);
        Assert.Equal(first.Value!.RecipeId, second.Value!.RecipeId);
        Assert.Equal(1, harness.Provider.InvocationCount(AiOperationRegistry.ExpandSelected));
        Assert.Equal(1, harness.Recipes.SavedCount);
    }

    [Fact]
    public async Task ProviderFailureCreatesNoRecipeAndReleasesBudget()
    {
        var harness = CreateHarness(useProtocolDefaults: false);
        harness.Provider.Enqueue(AiOperationRegistry.SuggestCandidates, AiProviderInvocationResult.Failure(AiProviderFailureKind.Unavailable));
        harness.Provider.Enqueue(AiOperationRegistry.SuggestCandidates, AiProviderInvocationResult.Failure(AiProviderFailureKind.Unavailable));

        var result = await harness.Service.RequestCandidatesAsync(new RequestCandidatesCommand(Guid.NewGuid(), "corr"), CancellationToken.None);
        Assert.Equal("ai_provider_unavailable", result.Problem!.ErrorCode);
        Assert.Equal(0, harness.Recipes.SavedCount);
        Assert.Equal(0, await harness.Ledger.CountOpenReservationsAsync(harness.OwnerId, CancellationToken.None));
        Assert.Equal(0, await harness.Ledger.SumOwnerUnitsForDayAsync(harness.OwnerId, DateTimeOffset.UtcNow, CancellationToken.None));
    }

    [Fact]
    public async Task InvalidOutputAfterOneRepairFailsWithoutPersistingRecipe()
    {
        var harness = CreateHarness(useProtocolDefaults: false);
        harness.Provider.Enqueue(AiOperationRegistry.SuggestCandidates, AiProviderInvocationResult.Success("""{"operation":"recipe.suggest_candidates.v1","schemaVersion":"0.3","candidates":[],"clarifications":[]}""", "fake-model"));
        harness.Provider.Enqueue(AiOperationRegistry.SuggestCandidates, AiProviderInvocationResult.Success("""{"operation":"recipe.suggest_candidates.v1","schemaVersion":"0.3","candidates":[],"clarifications":[]}""", "fake-model"));

        var result = await harness.Service.RequestCandidatesAsync(new RequestCandidatesCommand(Guid.NewGuid(), "corr"), CancellationToken.None);
        Assert.Equal("ai_output_invalid", result.Problem!.ErrorCode);
        Assert.Equal(2, harness.Provider.InvocationCount(AiOperationRegistry.SuggestCandidates));
        Assert.Equal(0, harness.Recipes.SavedCount);
    }

    [Fact]
    public async Task ValidThreeCandidateSuggestPassesProtocolValidation()
    {
        var harness = CreateHarness();
        var result = await harness.Service.RequestCandidatesAsync(new RequestCandidatesCommand(Guid.NewGuid(), "corr"), CancellationToken.None);
        Assert.Null(result.Problem);
        Assert.Equal(3, result.Value!.Candidates!.Count);
        Assert.Equal(nameof(RecipeGenerationSessionStatus.CandidatesReady), result.Value.Status);
    }

    [Fact]
    public void RecipeRevisionContentIsImmutableAfterCreate()
    {
        var now = DateTimeOffset.UtcNow;
        var revision = RecipeRevision.CreateFirst(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Test recipe",
            ["dinner"],
            2,
            """{"name":"Test recipe"}""",
            """{"schemaVersion":"1"}""",
            "c1",
            Guid.NewGuid(),
            now);

        Assert.Equal("Test recipe", revision.Name);
        Assert.Equal(1, revision.RevisionNumber);
        var nameSetter = typeof(RecipeRevision).GetProperty(nameof(RecipeRevision.Name))!.SetMethod;
        Assert.NotNull(nameSetter);
        Assert.True(nameSetter.ReturnParameter.GetRequiredCustomModifiers().Any(type => type.FullName == "System.Runtime.CompilerServices.IsExternalInit")
            || nameSetter.IsPrivate);
    }

    private static Harness CreateHarness(Guid? ownerId = null, InMemoryRecipeGenerationStore? generation = null, InMemoryRecipeStore? recipes = null, bool useProtocolDefaults = true)
    {
        var owner = ownerId ?? Guid.NewGuid();
        var ledger = new InMemoryAiUsageLedgerStore();
        var provider = new FakeAiProvider(useProtocolDefaults);
        var generationStore = generation ?? new InMemoryRecipeGenerationStore();
        var recipeStore = recipes ?? new InMemoryRecipeStore();
        var service = new RecipeCookNowApplicationService(
            new FixedCurrentUserAccessor(owner),
            generationStore,
            recipeStore,
            new EmptyRecipeContextAssembler(),
            provider,
            AiOperationRegistry.CreateDefault(),
            new AiUsageGovernor(ledger, new AiUsageOptions(), TimeProvider.System),
            TimeProvider.System);
        return new Harness(service, provider, ledger, recipeStore, owner);
    }

    private sealed record Harness(RecipeCookNowApplicationService Service, FakeAiProvider Provider, InMemoryAiUsageLedgerStore Ledger, InMemoryRecipeStore Recipes, Guid OwnerId);

    private sealed class FixedCurrentUserAccessor(Guid userId) : ICurrentUserAccessor
    {
        public Task<InternalUser> GetCurrentAsync(CancellationToken cancellationToken) =>
            Task.FromResult(new InternalUser(userId, "https://issuer.test", "subject", DateTimeOffset.UtcNow));
    }

    private sealed class EmptyRecipeContextAssembler : IRecipeContextAssembler
    {
        public Task<RecipeSuggestRequestContext> AssembleSuggestContextAsync(Guid ownerUserId, string requestId, int contextBudgetCharacters, CancellationToken cancellationToken) =>
            Task.FromResult(new RecipeSuggestRequestContext(requestId, [], [], new RecipeUserPresets(2, [], [], []), new RecipeExecutionContext("cook_now", null)));

        public Task<RecipeExpandRequestContext> AssembleExpandContextAsync(Guid ownerUserId, string requestId, SuggestCandidate selectedCandidate, int contextBudgetCharacters, CancellationToken cancellationToken) =>
            Task.FromResult(new RecipeExpandRequestContext(
                requestId,
                selectedCandidate.InventoryUses.Select(use => new RecipeInventoryContextItem(use.InventoryItemId, use.UserName, use.RequiredQuantity, use.Unit, use.AvailabilitySource, use.IngredientRef)).ToList(),
                [],
                new RecipeUserPresets(2, [], [], []),
                new RecipeSelectedCandidateContext(
                    selectedCandidate.CandidateId,
                    selectedCandidate.Name,
                    [selectedCandidate.TargetMealType],
                    selectedCandidate.Servings,
                    selectedCandidate.RequiredEquipmentIds,
                    selectedCandidate.InventoryUses.Select(use => new RecipeInventoryContextItem(use.InventoryItemId, use.UserName, use.RequiredQuantity, use.Unit, use.AvailabilitySource, use.IngredientRef)).ToList(),
                    selectedCandidate.AdditionalIngredients.Select(item => (item.Name, item.RequiredQuantity, item.Unit, item.Optional)).ToList())));
    }

    private sealed class InMemoryAiUsageLedgerStore : IAiUsageLedgerStore
    {
        private readonly ConcurrentDictionary<Guid, AiUsageEntry> _entries = new();

        public Task<int> SumGlobalUnitsForDayAsync(DateTimeOffset asOf, CancellationToken cancellationToken) =>
            Task.FromResult(Sum(null, asOf));

        public Task<int> SumOwnerUnitsForDayAsync(Guid ownerUserId, DateTimeOffset asOf, CancellationToken cancellationToken) =>
            Task.FromResult(Sum(ownerUserId, asOf));

        public Task<int> CountOpenReservationsAsync(Guid ownerUserId, CancellationToken cancellationToken) =>
            Task.FromResult(_entries.Values.Count(item => item.OwnerUserId == ownerUserId && item.Status == AiUsageEntryStatus.Reserved));

        public Task<Guid> InsertReservationAsync(Guid ownerUserId, string operation, int reservedUnits, string correlationId, DateTimeOffset now, CancellationToken cancellationToken)
        {
            var id = Guid.NewGuid();
            _entries[id] = new AiUsageEntry(id, ownerUserId, operation, AiUsageEntryStatus.Reserved, reservedUnits, null, null, null, correlationId, now, null);
            return Task.FromResult(id);
        }

        public Task SettleAsync(Guid reservationId, int settledUnits, string provider, string model, DateTimeOffset now, CancellationToken cancellationToken)
        {
            var current = _entries[reservationId];
            _entries[reservationId] = current with { Status = AiUsageEntryStatus.Settled, SettledUnits = settledUnits, Provider = provider, Model = model, ClosedAt = now };
            return Task.CompletedTask;
        }

        public Task ReleaseAsync(Guid reservationId, DateTimeOffset now, CancellationToken cancellationToken)
        {
            var current = _entries[reservationId];
            _entries[reservationId] = current with { Status = AiUsageEntryStatus.Released, ClosedAt = now };
            return Task.CompletedTask;
        }

        private int Sum(Guid? ownerUserId, DateTimeOffset asOf)
        {
            var dayStart = new DateTimeOffset(asOf.UtcDateTime.Date, TimeSpan.Zero);
            var dayEnd = dayStart.AddDays(1);
            return _entries.Values
                .Where(item => item.CreatedAt >= dayStart && item.CreatedAt < dayEnd && item.Status != AiUsageEntryStatus.Released)
                .Where(item => ownerUserId is null || item.OwnerUserId == ownerUserId)
                .Sum(item => item.Status == AiUsageEntryStatus.Settled ? item.SettledUnits ?? item.ReservedUnits : item.ReservedUnits);
        }
    }

    private sealed class InMemoryRecipeGenerationStore : IRecipeGenerationStore
    {
        private readonly ConcurrentDictionary<Guid, RecipeGenerationSession> _sessions = new();

        public Task<RecipeGenerationSession?> FindByIdempotencyKeyAsync(Guid ownerUserId, Guid idempotencyKey, CancellationToken cancellationToken) =>
            Task.FromResult(_sessions.Values.SingleOrDefault(item => item.OwnerUserId == ownerUserId && item.IdempotencyKey == idempotencyKey));

        public Task<RecipeGenerationSession?> FindBySelectIdempotencyKeyAsync(Guid ownerUserId, Guid selectIdempotencyKey, CancellationToken cancellationToken) =>
            Task.FromResult(_sessions.Values.SingleOrDefault(item => item.OwnerUserId == ownerUserId && item.SelectIdempotencyKey == selectIdempotencyKey));

        public Task SaveNewAsync(RecipeGenerationSession session, CancellationToken cancellationToken)
        {
            _sessions[session.Id] = session;
            return Task.CompletedTask;
        }

        public Task<RecipeGenerationSession?> FindByIdAsync(Guid ownerUserId, Guid sessionId, CancellationToken cancellationToken) =>
            Task.FromResult(_sessions.TryGetValue(sessionId, out var session) && session.OwnerUserId == ownerUserId ? session : null);

        public Task<RecipeGenerationSession?> FindActiveAsync(Guid ownerUserId, Guid sessionId, CancellationToken cancellationToken) =>
            FindByIdAsync(ownerUserId, sessionId, cancellationToken);

        public Task SaveAsync(RecipeGenerationSession session, CancellationToken cancellationToken)
        {
            _sessions[session.Id] = session;
            return Task.CompletedTask;
        }
    }

    private sealed class InMemoryRecipeStore : IRecipeStore
    {
        private readonly ConcurrentDictionary<Guid, (Recipe Recipe, RecipeRevision Revision)> _items = new();

        public int SavedCount => _items.Count;

        public Task SaveNewAsync(Recipe recipe, RecipeRevision revision, CancellationToken cancellationToken)
        {
            _items[recipe.Id] = (recipe, revision);
            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<RecipeSummary>> ListAsync(Guid ownerUserId, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<RecipeSummary>>(_items.Values
                .Where(item => item.Recipe.OwnerUserId == ownerUserId)
                .Select(item => new RecipeSummary(item.Recipe.Id, item.Revision.Name, item.Revision.MealTypes, item.Revision.Servings, item.Revision.RevisionNumber, item.Recipe.CreatedAt, item.Recipe.UpdatedAt))
                .ToList());

        public Task<RecipeDetail?> FindDetailAsync(Guid ownerUserId, Guid recipeId, CancellationToken cancellationToken)
        {
            if (!_items.TryGetValue(recipeId, out var item) || item.Recipe.OwnerUserId != ownerUserId)
            {
                return Task.FromResult<RecipeDetail?>(null);
            }

            return Task.FromResult<RecipeDetail?>(new RecipeDetail(item.Recipe.Id, item.Revision.RevisionNumber, item.Revision.Name, item.Revision.MealTypes, item.Revision.Servings, item.Revision.NormalizedRecipeJson, item.Revision.ThumbnailVisualJson, item.Revision.CreatedAt));
        }
    }
}
