using System.Text.Json;
using KitchenFlow.Modules.Recipes.Application;
using KitchenFlow.Modules.Recipes.Domain;
using Microsoft.EntityFrameworkCore;

namespace KitchenFlow.Infrastructure.Persistence;

/// <summary>PostgreSQL-backed owner-scoped recipe generation session store.</summary>
public sealed class PostgreSqlRecipeGenerationStore(ApplicationDbContext database) : IRecipeGenerationStore
{

    /// <inheritdoc />
    public async Task<RecipeGenerationSession?> FindByIdempotencyKeyAsync(Guid ownerUserId, Guid idempotencyKey, CancellationToken cancellationToken)
    {
        var record = await database.RecipeGenerationSessions.AsNoTracking()
            .SingleOrDefaultAsync(item => item.OwnerUserId == ownerUserId && item.IdempotencyKey == idempotencyKey, cancellationToken);
        return record is null ? null : ToDomain(record);
    }

    /// <inheritdoc />
    public async Task<RecipeGenerationSession?> FindBySelectIdempotencyKeyAsync(Guid ownerUserId, Guid selectIdempotencyKey, CancellationToken cancellationToken)
    {
        var record = await database.RecipeGenerationSessions.AsNoTracking()
            .SingleOrDefaultAsync(item => item.OwnerUserId == ownerUserId && item.SelectIdempotencyKey == selectIdempotencyKey, cancellationToken);
        return record is null ? null : ToDomain(record);
    }

    /// <inheritdoc />
    public async Task SaveNewAsync(RecipeGenerationSession session, CancellationToken cancellationToken)
    {
        database.RecipeGenerationSessions.Add(ToRecord(session));
        await database.SaveChangesAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task<RecipeGenerationSession?> FindByIdAsync(Guid ownerUserId, Guid sessionId, CancellationToken cancellationToken)
    {
        var record = await database.RecipeGenerationSessions.AsNoTracking()
            .SingleOrDefaultAsync(item => item.OwnerUserId == ownerUserId && item.Id == sessionId, cancellationToken);
        return record is null ? null : ToDomain(record);
    }

    /// <inheritdoc />
    public async Task<RecipeGenerationSession?> FindActiveAsync(Guid ownerUserId, Guid sessionId, CancellationToken cancellationToken)
    {
        var session = await FindByIdAsync(ownerUserId, sessionId, cancellationToken);
        return session;
    }

    /// <inheritdoc />
    public async Task SaveAsync(RecipeGenerationSession session, CancellationToken cancellationToken)
    {
        var record = await database.RecipeGenerationSessions
            .SingleAsync(item => item.OwnerUserId == session.OwnerUserId && item.Id == session.Id, cancellationToken);
        record.Status = session.Status.ToString();
        record.CandidatesSnapshotJson = session.CandidatesSnapshotJson;
        record.SelectedCandidateId = session.SelectedCandidateId;
        record.SelectedRecipeId = session.SelectedRecipeId;
        record.SelectIdempotencyKey = session.SelectIdempotencyKey;
        record.FailureReason = session.FailureReason;
        record.UpdatedAt = session.UpdatedAt;
        await database.SaveChangesAsync(cancellationToken);
    }

    private static RecipeGenerationSession ToDomain(RecipeGenerationSessionRecord record) =>
        RecipeGenerationSession.Rehydrate(
            record.Id,
            record.OwnerUserId,
            record.IdempotencyKey,
            record.ExecutionMode,
            Enum.Parse<RecipeGenerationSessionStatus>(record.Status),
            record.CandidatesSnapshotJson,
            record.SelectedCandidateId,
            record.SelectedRecipeId,
            record.SelectIdempotencyKey,
            record.FailureReason,
            record.CreatedAt,
            record.UpdatedAt,
            record.ExpiresAt);

    private static RecipeGenerationSessionRecord ToRecord(RecipeGenerationSession session) => new()
    {
        Id = session.Id,
        OwnerUserId = session.OwnerUserId,
        IdempotencyKey = session.IdempotencyKey,
        ExecutionMode = session.ExecutionMode,
        Status = session.Status.ToString(),
        CandidatesSnapshotJson = session.CandidatesSnapshotJson,
        SelectedCandidateId = session.SelectedCandidateId,
        SelectedRecipeId = session.SelectedRecipeId,
        SelectIdempotencyKey = session.SelectIdempotencyKey,
        FailureReason = session.FailureReason,
        CreatedAt = session.CreatedAt,
        UpdatedAt = session.UpdatedAt,
        ExpiresAt = session.ExpiresAt
    };
}

/// <summary>PostgreSQL-backed owner-scoped recipe identity and immutable revision store.</summary>
public sealed class PostgreSqlRecipeStore(ApplicationDbContext database) : IRecipeStore
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    /// <inheritdoc />
    public async Task SaveNewAsync(Recipe recipe, RecipeRevision revision, CancellationToken cancellationToken)
    {
        database.Recipes.Add(new RecipeRecord
        {
            Id = recipe.Id,
            OwnerUserId = recipe.OwnerUserId,
            CurrentRevisionNumber = recipe.CurrentRevisionNumber,
            CreatedAt = recipe.CreatedAt,
            UpdatedAt = recipe.UpdatedAt
        });
        database.RecipeRevisions.Add(new RecipeRevisionRecord
        {
            Id = revision.Id,
            RecipeId = revision.RecipeId,
            OwnerUserId = revision.OwnerUserId,
            RevisionNumber = revision.RevisionNumber,
            Name = revision.Name,
            MealTypesJson = JsonSerializer.Serialize(revision.MealTypes, SerializerOptions),
            Servings = revision.Servings,
            NormalizedRecipeJson = revision.NormalizedRecipeJson,
            ThumbnailVisualJson = revision.ThumbnailVisualJson,
            SourceCandidateId = revision.SourceCandidateId,
            SourceGenerationSessionId = revision.SourceGenerationSessionId,
            CreatedAt = revision.CreatedAt
        });
        await database.SaveChangesAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<RecipeSummary>> ListAsync(Guid ownerUserId, CancellationToken cancellationToken)
    {
        var recipes = await database.Recipes.AsNoTracking()
            .Where(item => item.OwnerUserId == ownerUserId)
            .OrderByDescending(item => item.CreatedAt)
            .ThenByDescending(item => item.Id)
            .ToListAsync(cancellationToken);
        if (recipes.Count == 0)
        {
            return [];
        }

        var recipeIds = recipes.Select(item => item.Id).ToList();
        var revisions = await database.RecipeRevisions.AsNoTracking()
            .Where(item => item.OwnerUserId == ownerUserId && recipeIds.Contains(item.RecipeId))
            .ToListAsync(cancellationToken);
        var currentByRecipe = revisions
            .GroupBy(item => item.RecipeId)
            .ToDictionary(group => group.Key, group => group.OrderByDescending(item => item.RevisionNumber).First());

        return recipes
            .Where(recipe => currentByRecipe.ContainsKey(recipe.Id))
            .Select(recipe =>
            {
                var revision = currentByRecipe[recipe.Id];
                var mealTypes = JsonSerializer.Deserialize<string[]>(revision.MealTypesJson, SerializerOptions) ?? [];
                return new RecipeSummary(recipe.Id, revision.Name, mealTypes, revision.Servings, revision.RevisionNumber, recipe.CreatedAt, recipe.UpdatedAt);
            })
            .ToList();
    }

    /// <inheritdoc />
    public async Task<RecipeDetail?> FindDetailAsync(Guid ownerUserId, Guid recipeId, CancellationToken cancellationToken)
    {
        var recipe = await database.Recipes.AsNoTracking()
            .SingleOrDefaultAsync(item => item.OwnerUserId == ownerUserId && item.Id == recipeId, cancellationToken);
        if (recipe is null)
        {
            return null;
        }

        var revision = await database.RecipeRevisions.AsNoTracking()
            .SingleOrDefaultAsync(item => item.OwnerUserId == ownerUserId && item.RecipeId == recipeId && item.RevisionNumber == recipe.CurrentRevisionNumber, cancellationToken);
        if (revision is null)
        {
            return null;
        }

        var mealTypes = JsonSerializer.Deserialize<string[]>(revision.MealTypesJson, SerializerOptions) ?? [];
        return new RecipeDetail(recipe.Id, revision.RevisionNumber, revision.Name, mealTypes, revision.Servings, revision.NormalizedRecipeJson, revision.ThumbnailVisualJson, revision.CreatedAt);
    }
}
