using System.Net;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace KitchenFlow.Api.Inventory;

internal static class InventoryOpenApiTransformer
{
    internal static Task ApplyAsync(OpenApiDocument document, OpenApiDocumentTransformerContext _, CancellationToken __)
    {
        // The emitted contract must not drift merely because CI uses an HTTP loopback listener
        // while local cookie development uses HTTPS. Consumers configure their actual base URL.
        document.Servers = [new OpenApiServer { Url = "https://localhost:7443", Description = "KitchenFlow local HTTPS development endpoint." }];
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
                AdditionalProperties = new OpenApiSchema { Type = JsonSchemaType.Array, Items = new OpenApiSchema { Type = JsonSchemaType.String } }
            };
            problemDetails.Required ??= new HashSet<string>(StringComparer.Ordinal);
            problemDetails.Required.Add("errorCode");
            problemDetails.Required.Add("traceId");
        }

        ConfigureDecimal(components, "QuantityRequest", "measuredValue");
        ConfigureDecimal(components, "QuantityResponse", "measuredValue");
        ConfigureDecimal(components, "AdjustmentRequest", "value");
        ConfigureStringEnum(components, "QuantityRequest", "unit", true, "Gram", "Milliliter", "Unit");
        ConfigureStringEnum(components, "QuantityResponse", "unit", true, "Gram", "Milliliter", "Unit");
        ConfigureStringEnum(components, "QuantityRequest", "availabilityState", true, "Available", "Low", "Unavailable");
        ConfigureStringEnum(components, "QuantityResponse", "availabilityState", true, "Available", "Low", "Unavailable");
        ConfigureStringEnum(components, "CreateLotRequest", "storageLocation", false, "Pantry", "Refrigerator", "Freezer", "Other");
        ConfigureStringEnum(components, "UpdateLotRequest", "storageLocation", false, "Pantry", "Refrigerator", "Freezer", "Other");
        ConfigureStringEnum(components, "CreateLotRequest", "packageState", true, "Sealed", "Opened", "Unknown");
        ConfigureStringEnum(components, "UpdateLotRequest", "packageState", true, "Sealed", "Opened", "Unknown");
        ConfigureStringEnum(components, "AdjustmentRequest", "type", false, "Consume", "Discard", "Correct", "AvailabilityChanged");
        ConfigureQuantityModeSchema(components, "QuantityRequest");
        ConfigureQuantityModeSchema(components, "QuantityResponse");

        foreach (var (path, pathItem) in document.Paths)
        {
            if (!path.StartsWith("/api/v1/", StringComparison.Ordinal))
            {
                foreach (var operation in pathItem.Operations is { } anonymousOperations ? anonymousOperations.Values.AsEnumerable() : Enumerable.Empty<OpenApiOperation>())
                {
                    operation.Security = [];
                    operation.Summary ??= $"{operation.Description ?? "KitchenFlow health operation"}.";
                    operation.OperationId ??= $"health{path.Replace("/", string.Empty, StringComparison.Ordinal)}";
                }
                continue;
            }

            foreach (var (method, operation) in pathItem.Operations ?? [])
            {
                operation.Summary ??= $"{method.Method} {path}";
                operation.OperationId ??= CreateOperationId(method, path);
                if (path.StartsWith("/api/v1/auth/login", StringComparison.Ordinal))
                {
                    operation.Security = [];
                }
                else
                {
                    operation.Security = [new OpenApiSecurityRequirement { [new OpenApiSecuritySchemeReference("kitchenflowSession", document)] = [] }];
                }

                var isLoginChallenge = path.Equals("/api/v1/auth/login", StringComparison.Ordinal) && method == HttpMethod.Post;
                var stateChanging = !isLoginChallenge && (method == HttpMethod.Post || method == HttpMethod.Patch || method == HttpMethod.Delete);
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

                var emitsLotEtag = path.EndsWith("/lots", StringComparison.Ordinal) && method == HttpMethod.Post ||
                    path.EndsWith("/lots/{lotId}", StringComparison.Ordinal) && (method == HttpMethod.Get || method == HttpMethod.Patch) ||
                    path.EndsWith("/adjustments", StringComparison.Ordinal) && method == HttpMethod.Post;
                foreach (var response in emitsLotEtag ? (operation.Responses ?? []).Where(response => response.Key is "200" or "201") : [])
                {
                    if (response.Value is OpenApiResponse typedResponse)
                    {
                        (typedResponse.Headers ??= new Dictionary<string, IOpenApiHeader>())["ETag"] = new OpenApiHeader { Description = "Opaque current version required by If-Match on subsequent mutations.", Schema = new OpenApiSchema { Type = JsonSchemaType.String } };
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
        Description = description,
        Schema = new OpenApiSchema { Type = JsonSchemaType.String, Format = name == "Idempotency-Key" ? "uuid" : null }
    };

    private static void ConfigureDecimal(OpenApiComponents components, string schemaName, string propertyName)
    {
        if (TryGetProperty(components, schemaName, propertyName, out var property))
        {
            property.Type = JsonSchemaType.Number;
            property.Format = "decimal";
        }
    }

    private static void ConfigureStringEnum(OpenApiComponents components, string schemaName, string propertyName, bool nullable, params string[] values)
    {
        if (TryGetProperty(components, schemaName, propertyName, out var property))
        {
            property.Type = nullable ? JsonSchemaType.String | JsonSchemaType.Null : JsonSchemaType.String;
            property.Enum = values.Select(value => (JsonNode)JsonValue.Create(value)!).Append(nullable ? JsonNode.Parse("null") : null).Where(value => value is not null).Cast<JsonNode>().ToList();
        }
    }

    private static bool TryGetProperty(OpenApiComponents components, string schemaName, string propertyName, out OpenApiSchema property)
    {
        property = null!;
        return components.Schemas is { } schemas && schemas.TryGetValue(schemaName, out var schema) && schema is OpenApiSchema typedSchema && typedSchema.Properties is { } properties && properties.TryGetValue(propertyName, out var candidate) && candidate is OpenApiSchema typedProperty && (property = typedProperty) is not null;
    }

    private static void ConfigureQuantityModeSchema(OpenApiComponents components, string schemaName)
    {
        if (components.Schemas is not { } schemas || !schemas.TryGetValue(schemaName, out var schema) || schema is not OpenApiSchema quantitySchema)
        {
            return;
        }

        quantitySchema.Required = new HashSet<string>(StringComparer.Ordinal);
        quantitySchema.OneOf =
        [
            new OpenApiSchema { Required = new HashSet<string>(StringComparer.Ordinal) { "measuredValue", "unit" } },
            new OpenApiSchema { Required = new HashSet<string>(StringComparer.Ordinal) { "availabilityState" } }
        ];
    }

    private static void AddExamples(string path, HttpMethod method, OpenApiOperation operation)
    {
        if (path.EndsWith("/lots", StringComparison.Ordinal) && method == HttpMethod.Post)
        {
            AddRequestExample(operation, "measuredLot", "A manually entered measured pantry lot.", """{"productName":"Red lentils","quantity":{"measuredValue":500,"unit":"Gram"},"storageLocation":"Pantry","customLocation":null,"packageState":"Sealed","printedExpirationDate":"2026-12-31","notes":null}""");
            AddRequestExample(operation, "availabilityLot", "A manually entered qualitative availability lot.", """{"productName":"Fresh herbs","quantity":{"availabilityState":"Low"},"storageLocation":"Refrigerator"}""");
            AddProblemExample(operation, "422", "invalidQuantity", "A measured and availability quantity cannot be supplied together.", """{"status":422,"errorCode":"domain_rule_violated","traceId":"00-00000000000000000000000000000000-0000000000000000-00"}""");
        }

        if (path.EndsWith("/adjustments", StringComparison.Ordinal) && method == HttpMethod.Post)
        {
            AddRequestExample(operation, "consume", "Consumes a measured quantity from the current lot version.", """{"type":"Consume","value":125,"availabilityState":null,"reasonCode":"meal","note":null}""");
            AddProblemExample(operation, "412", "staleEtag", "The supplied opaque ETag is no longer current.", """{"status":412,"errorCode":"precondition_failed","traceId":"00-00000000000000000000000000000000-0000000000000000-00"}""");
            AddProblemExample(operation, "409", "reusedIdempotencyKey", "The key was used for a different semantic command.", """{"status":409,"errorCode":"idempotency_key_reused","traceId":"00-00000000000000000000000000000000-0000000000000000-00"}""");
        }
    }

    private static string CreateOperationId(HttpMethod method, string path) => method.Method.ToLowerInvariant() + string.Concat(path.Split('/', StringSplitOptions.RemoveEmptyEntries).Select(segment => ToPascalCaseSegment(segment)));

    private static string ToPascalCaseSegment(string segment)
    {
        var normalized = segment.Trim('{', '}');
        return char.ToUpperInvariant(normalized[0]) + normalized[1..];
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
