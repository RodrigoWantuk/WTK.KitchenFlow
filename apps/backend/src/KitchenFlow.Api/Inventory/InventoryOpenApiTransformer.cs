using System.Net;
using System.Text.Json.Nodes;
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

                AddExamples(path, method, operation);

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

    private static void AddExamples(string path, HttpMethod method, OpenApiOperation operation)
    {
        if (path.EndsWith("/lots", StringComparison.Ordinal) && method == HttpMethod.Post)
        {
            AddRequestExample(operation, "measuredLot", "A manually entered measured pantry lot.", """{"productName":"Red lentils","quantity":{"measuredValue":500,"unit":"Gram","availabilityState":null},"storageLocation":"Pantry","customLocation":null,"packageState":"Sealed","printedExpirationDate":"2026-12-31","notes":null}""");
            AddProblemExample(operation, "422", "invalidQuantity", "A measured and availability quantity cannot be supplied together.", """{"status":422,"errorCode":"domain_rule_violated"}""");
        }

        if (path.EndsWith("/adjustments", StringComparison.Ordinal) && method == HttpMethod.Post)
        {
            AddRequestExample(operation, "consume", "Consumes a measured quantity from the current lot version.", """{"type":"Consume","value":125,"availabilityState":null,"reasonCode":"meal","note":null}""");
            AddProblemExample(operation, "412", "staleEtag", "The supplied opaque ETag is no longer current.", """{"status":412,"errorCode":"precondition_failed"}""");
            AddProblemExample(operation, "409", "reusedIdempotencyKey", "The key was used for a different semantic command.", """{"status":409,"errorCode":"idempotency_key_reused"}""");
        }
    }

    private static void AddRequestExample(OpenApiOperation operation, string name, string summary, string value)
    {
        if (operation.RequestBody?.Content is { } content && content.TryGetValue("application/json", out var requestMediaType) && requestMediaType is OpenApiMediaType mediaType)
        {
            (mediaType.Examples ??= new Dictionary<string, IOpenApiExample>())[name] = new OpenApiExample { Summary = summary, Value = JsonNode.Parse(value) };
        }
    }

    private static void AddProblemExample(OpenApiOperation operation, string statusCode, string name, string summary, string value)
    {
        if (operation.Responses is { } responses && responses.TryGetValue(statusCode, out var response) && response.Content is { } content && content.TryGetValue("application/problem+json", out var responseMediaType) && responseMediaType is OpenApiMediaType mediaType)
        {
            (mediaType.Examples ??= new Dictionary<string, IOpenApiExample>())[name] = new OpenApiExample { Summary = summary, Value = JsonNode.Parse(value) };
        }
    }
}
