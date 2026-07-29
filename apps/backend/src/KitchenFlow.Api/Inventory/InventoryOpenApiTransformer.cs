using System.Net;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace KitchenFlow.Api.Inventory;

internal static class InventoryOpenApiTransformer
{
    internal static Task ApplyAsync(OpenApiDocument document, OpenApiDocumentTransformerContext _, CancellationToken __)
    {
        var components = document.Components ??= new OpenApiComponents();
        (components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>())["kitchenflowSession"] = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.ApiKey,
            In = ParameterLocation.Cookie,
            Name = "__Host-kitchenflow-session",
            Description = "Backend-managed, secure HttpOnly session cookie. Browser code must not read or store OIDC tokens."
        };

        if (components.Schemas is { } schemas && schemas.TryGetValue("ProblemDetails", out var problemSchema) && problemSchema is OpenApiSchema problemDetails)
        {
            (problemDetails.Properties ??= new Dictionary<string, IOpenApiSchema>())["errorCode"] = new OpenApiSchema
            {
                Description = "Stable machine-readable KitchenFlow error code.",
                Type = JsonSchemaType.String
            };
            problemDetails.Properties["traceId"] = new OpenApiSchema
            {
                Description = "Correlation identifier suitable for support without exposing private request data.",
                Type = JsonSchemaType.String
            };
            problemDetails.Properties["errors"] = new OpenApiSchema
            {
                Description = "Field-level validation messages keyed by request field name.",
                Type = JsonSchemaType.Object,
                AdditionalProperties = new OpenApiSchema { Type = JsonSchemaType.Array }
            };
        }

        foreach (var (path, pathItem) in document.Paths)
        {
            if (!path.StartsWith("/api/v1/", StringComparison.Ordinal))
            {
                continue;
            }

            foreach (var (method, operation) in pathItem.Operations ?? [])
            {
                if (!path.StartsWith("/api/v1/auth/login", StringComparison.Ordinal))
                {
                    operation.Security = [new OpenApiSecurityRequirement { [new OpenApiSecuritySchemeReference("kitchenflowSession", document)] = [] }];
                }

                var stateChanging = method == HttpMethod.Post || method == HttpMethod.Patch || method == HttpMethod.Delete;
                if (stateChanging)
                {
                    operation.Parameters ??= [];
                    operation.Parameters.Add(Header("X-CSRF-TOKEN", "Required CSRF token issued by GET /api/v1/session."));
                }

                if ((path.Contains("/lots", StringComparison.Ordinal) && (method == HttpMethod.Patch || method == HttpMethod.Delete)) || path.EndsWith("/adjustments", StringComparison.Ordinal))
                {
                    operation.Parameters ??= [];
                    operation.Parameters.Add(Header("If-Match", "Required opaque concurrency ETag from the current lot representation."));
                }

                if ((path.EndsWith("/lots", StringComparison.Ordinal) && method == HttpMethod.Post) || path.EndsWith("/adjustments", StringComparison.Ordinal))
                {
                    operation.Parameters ??= [];
                    operation.Parameters.Add(Header("Idempotency-Key", "Required UUID key for semantic create or adjustment replay."));
                }

                foreach (var response in (operation.Responses ?? []).Where(response => response.Key is "200" or "201"))
                {
                    if (response.Value is OpenApiResponse typedResponse)
                    {
                        (typedResponse.Headers ??= new Dictionary<string, IOpenApiHeader>())["ETag"] = new OpenApiHeader { Description = "Opaque current version required by If-Match on subsequent mutations." };
                    }
                }
            }
        }

        return Task.CompletedTask;
    }

    private static OpenApiParameter Header(string name, string description) => new()
    {
        Name = name,
        In = ParameterLocation.Header,
        Required = true,
        Description = description
    };
}
