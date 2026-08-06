using KitchenFlow.Modules.Recipes.Domain;

namespace KitchenFlow.Modules.Recipes.Application;

/// <summary>
/// Owner-scoped persistence port for <see cref="RecipeGenerationSession"/> aggregates. The store owns
/// idempotency-key lookup so that a repeated <c>request candidates</c> or <c>select candidate</c>
/// command safely replays the already-produced result instead of re-invoking the AI Gateway or
/// re-reserving usage.
/// </summary>
public interface IRecipeGenerationStore
{
    /// <summary>Finds a previously created session for this owner and client request-candidates idempotency key, if any.</summary>
    Task<RecipeGenerationSession?> FindByIdempotencyKeyAsync(Guid ownerUserId, Guid idempotencyKey, CancellationToken cancellationToken);

    /// <summary>Finds a previously completed selection for this owner and select-and-expand idempotency key, if any.</summary>
    Task<RecipeGenerationSession?> FindBySelectIdempotencyKeyAsync(Guid ownerUserId, Guid selectIdempotencyKey, CancellationToken cancellationToken);

    /// <summary>Persists a newly created session keyed by its client idempotency key.</summary>
    Task SaveNewAsync(RecipeGenerationSession session, CancellationToken cancellationToken);

    /// <summary>Finds one owner-scoped session by identifier without cross-user disclosure.</summary>
    Task<RecipeGenerationSession?> FindByIdAsync(Guid ownerUserId, Guid sessionId, CancellationToken cancellationToken);

    /// <summary>Finds one non-expired, owner-scoped session by identifier without cross-user disclosure.</summary>
    Task<RecipeGenerationSession?> FindActiveAsync(Guid ownerUserId, Guid sessionId, CancellationToken cancellationToken);

    /// <summary>Persists a state transition on an already-created session.</summary>
    Task SaveAsync(RecipeGenerationSession session, CancellationToken cancellationToken);
}
