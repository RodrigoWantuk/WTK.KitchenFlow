namespace KitchenFlow.Modules.Profiles.Application;

/// <summary>Redacts sensitive preference and restriction codes from privacy-minimizing history.</summary>
public static class ProfileHistoryRedaction
{
    private static readonly HashSet<string> SensitiveCategories = new(StringComparer.Ordinal) { "Allergy", "MedicalRestriction" };

    /// <summary>Redacts preference mutation codes before they are persisted to change history.</summary>
    /// <param name="commands">The explicit preference commands applied in the mutation.</param>
    /// <returns>Privacy-safe history field codes.</returns>
    public static IReadOnlyList<string> RedactPreferenceFieldCodes(IReadOnlyList<PreferenceMutationInput> commands) =>
        commands.Select(RedactPreferenceCommand).Distinct(StringComparer.Ordinal).ToList();

    private static string RedactPreferenceCommand(PreferenceMutationInput command)
    {
        if (!SensitiveCategories.Contains(command.Category))
        {
            return $"{command.Category}:{command.StableCode}";
        }

        var isAllergy = string.Equals(command.Category, "Allergy", StringComparison.Ordinal);
        return command.Action switch
        {
            "add" => isAllergy ? "allergy_entry_added" : "medical_restriction_added",
            "remove" => isAllergy ? "allergy_entry_removed" : "medical_restriction_removed",
            "update" => isAllergy ? "allergy_entry_changed" : "medical_restriction_changed",
            _ => isAllergy ? "allergy_entry_changed" : "medical_restriction_changed"
        };
    }
}
