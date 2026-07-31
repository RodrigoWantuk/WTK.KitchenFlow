using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace KitchenFlow.Api.Profiles;

/// <summary>Adds profile operations and schemas to the KitchenFlow OpenAPI document.</summary>
internal static class ProfileOpenApiTransformer
{
    /// <summary>Applies profile-specific OpenAPI metadata.</summary>
    internal static Task ApplyAsync(OpenApiDocument document, OpenApiDocumentTransformerContext _, CancellationToken __)
    {
        foreach (var path in new[] { "/api/v1/profile", "/api/v1/profile/preferences", "/api/v1/profile/equipment" })
        {
            if (!document.Paths.TryGetValue(path, out var pathItem) || pathItem.Operations is null)
            {
                continue;
            }

            foreach (var (method, operation) in pathItem.Operations)
            {
                if (method == HttpMethod.Put || method == HttpMethod.Patch)
                {
                    AddIfMatchHeader(operation);
                }
            }
        }

        return Task.CompletedTask;
    }

    private static void AddIfMatchHeader(OpenApiOperation operation)
    {
        operation.Parameters ??= [];
        operation.Parameters.Add(new OpenApiParameter
        {
            Name = "If-Match",
            In = ParameterLocation.Header,
            Required = false,
            Description = "Required for updates after the first create. Use the ETag returned by GET /api/v1/profile.",
            Schema = new OpenApiSchema { Type = JsonSchemaType.String }
        });
        operation.Responses ??= new OpenApiResponses();
        operation.Responses.TryAdd("412", new OpenApiResponse { Description = "The profile version is out of date." });
        operation.Responses.TryAdd("428", new OpenApiResponse { Description = "An If-Match header is required for this update." });
    }
}
