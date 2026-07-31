using KitchenFlow.Modules.Profiles.Application;
using KitchenFlow.Modules.Profiles.Domain;

namespace KitchenFlow.ArchitectureTests;

public sealed class ProfileBoundaryTests
{
    [Fact]
    public void ProfilesDomainDoesNotReferenceApiOrEntityFramework()
    {
        var references = typeof(UserProfile).Assembly.GetReferencedAssemblies().Select(reference => reference.Name).ToHashSet(StringComparer.Ordinal);
        Assert.DoesNotContain("KitchenFlow.Api", references);
        Assert.DoesNotContain("Microsoft.EntityFrameworkCore", references);
        Assert.DoesNotContain("Microsoft.AspNetCore.Http", references);
        Assert.DoesNotContain("KitchenFlow.Infrastructure", references);
    }

    [Fact]
    public void ProfilesApplicationResultsDoNotExposeHttpStatusOrEtagTokens()
    {
        var properties = typeof(ProfileApplicationWorkflow).Assembly.GetTypes()
            .Where(type => type.Namespace == "KitchenFlow.Modules.Profiles.Application")
            .SelectMany(type => type.GetProperties())
            .ToList();
        Assert.DoesNotContain(properties, property => property.Name.Contains("StatusCode", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(properties, property => property.Name.Contains("Etag", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void ProfilesApplicationCommandsUseDecodedConcurrencyValues()
    {
        var precondition = typeof(PutProfileCommand).GetProperty(nameof(PutProfileCommand.Precondition));
        Assert.Equal(typeof(ProfileVersionPrecondition), precondition!.PropertyType);
    }
}
