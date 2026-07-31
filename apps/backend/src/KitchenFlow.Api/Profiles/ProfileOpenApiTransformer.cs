using System.Text.Json.Nodes;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace KitchenFlow.Api.Profiles;

/// <summary>Adds profile operations and schemas to the KitchenFlow OpenAPI document.</summary>
internal static class ProfileOpenApiTransformer
{
    private static readonly string[] FieldActions = ["confirm", "remove", "absent"];
    private static readonly string[] FieldDurabilities = ["durable"];

    /// <summary>Applies profile-specific OpenAPI metadata.</summary>
    internal static Task ApplyAsync(OpenApiDocument document, OpenApiDocumentTransformerContext _, CancellationToken __)
    {
        AddFieldMutationSchemas(document);
        AddCollectionResponseSchemas(document);

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

                if (method == HttpMethod.Get && path != "/api/v1/profile")
                {
                    AddEtagResponse(operation);
                }
            }
        }

        return Task.CompletedTask;
    }

    private static void AddFieldMutationSchemas(OpenApiDocument document)
    {
        document.Components ??= new OpenApiComponents();
        document.Components.Schemas ??= new Dictionary<string, IOpenApiSchema>();

        document.Components.Schemas["ProfileFieldAction"] = new OpenApiSchema
        {
            Type = JsonSchemaType.String,
            Enum = FieldActions.Select(value => (JsonNode)JsonValue.Create(value)!).ToList(),
            Description = "Progressive field action. absent is only valid for PUT replace semantics."
        };

        document.Components.Schemas["ProfileFieldDurability"] = new OpenApiSchema
        {
            Type = JsonSchemaType.String,
            Enum = FieldDurabilities.Select(value => (JsonNode)JsonValue.Create(value)!).ToList(),
            Description = "Only durable mutations are accepted on profile endpoints."
        };
    }

    private static void AddCollectionResponseSchemas(OpenApiDocument document)
    {
        document.Components ??= new OpenApiComponents();
        document.Components.Schemas ??= new Dictionary<string, IOpenApiSchema>();

        document.Components.Schemas["PreferencesCollectionResponse"] = new OpenApiSchema
        {
            Type = JsonSchemaType.Object,
            Required = new HashSet<string> { "version", "entries" },
            Properties = new Dictionary<string, IOpenApiSchema>
            {
                ["version"] = new OpenApiSchema { Type = JsonSchemaType.String, Description = "Opaque profile version token matching the ETag header." },
                ["entries"] = new OpenApiSchema { Type = JsonSchemaType.Array, Items = new OpenApiSchemaReference("PreferenceResponse", document) }
            }
        };

        document.Components.Schemas["EquipmentCollectionResponse"] = new OpenApiSchema
        {
            Type = JsonSchemaType.Object,
            Required = new HashSet<string> { "version", "entries" },
            Properties = new Dictionary<string, IOpenApiSchema>
            {
                ["version"] = new OpenApiSchema { Type = JsonSchemaType.String, Description = "Opaque profile version token matching the ETag header." },
                ["entries"] = new OpenApiSchema { Type = JsonSchemaType.Array, Items = new OpenApiSchemaReference("EquipmentResponse", document) }
            }
        };
    }

    private static void AddIfMatchHeader(OpenApiOperation operation)
    {
        operation.Parameters ??= [];
        operation.Parameters.Add(new OpenApiParameter
        {
            Name = "If-Match",
            In = ParameterLocation.Header,
            Required = false,
            Description = "Required for updates after the first create. Use the ETag returned by GET /api/v1/profile or the collection endpoints.",
            Schema = new OpenApiSchema { Type = JsonSchemaType.String }
        });
        operation.Responses ??= new OpenApiResponses();
        operation.Responses.TryAdd("400", new OpenApiResponse { Description = "Validation failed for action, durability, or field values." });
        operation.Responses.TryAdd("409", new OpenApiResponse { Description = "A profile already exists for this account." });
        operation.Responses.TryAdd("412", new OpenApiResponse { Description = "The profile version is out of date." });
        operation.Responses.TryAdd("428", new OpenApiResponse { Description = "An If-Match header is required for this update." });
    }

    private static void AddEtagResponse(OpenApiOperation operation)
    {
        operation.Responses ??= new OpenApiResponses();
        operation.Responses.TryAdd("200", new OpenApiResponse
        {
            Description = "Collection returned with an ETag header when a profile exists.",
            Headers = new Dictionary<string, IOpenApiHeader>
            {
                ["ETag"] = new OpenApiHeader
                {
                    Description = "Opaque profile version token required for subsequent mutations.",
                    Schema = new OpenApiSchema { Type = JsonSchemaType.String }
                }
            }
        });
    }
}
