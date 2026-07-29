using KitchenFlow.Modules.Identity;
using Microsoft.EntityFrameworkCore;

namespace KitchenFlow.Infrastructure.Persistence;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<InternalUser> Users => Set<InternalUser>();

    public DbSet<ProductRecord> Products => Set<ProductRecord>();

    public DbSet<LotRecord> Lots => Set<LotRecord>();

    public DbSet<TransactionRecord> Transactions => Set<TransactionRecord>();

    public DbSet<AuditEventRecord> AuditEvents => Set<AuditEventRecord>();

    public DbSet<IdempotencyRecord> IdempotencyRecords => Set<IdempotencyRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<InternalUser>(entity =>
        {
            entity.ToTable("users", "identity");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Issuer).HasMaxLength(500).IsRequired();
            entity.Property(x => x.Subject).HasMaxLength(500).IsRequired();
            entity.HasIndex(x => new { x.Issuer, x.Subject }).IsUnique();
        });

        modelBuilder.Entity<ProductRecord>(entity =>
        {
            entity.ToTable("products", "inventory");
            entity.HasKey(x => x.Id);
            entity.HasAlternateKey(x => new { x.Id, x.OwnerUserId });
            entity.Property(x => x.DisplayName).HasMaxLength(160).IsRequired();
            entity.Property(x => x.NormalizedSearchName).HasMaxLength(160).IsRequired();
            entity.HasOne<InternalUser>().WithMany().HasForeignKey(x => x.OwnerUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(x => x.OwnerUserId);
        });

        modelBuilder.Entity<LotRecord>(entity =>
        {
            entity.ToTable("lots", "inventory", table =>
            {
                table.HasCheckConstraint("ck_lots_quantity_mode", "(\"MeasuredValue\" IS NOT NULL AND \"MeasuredUnit\" IS NOT NULL AND \"AvailabilityState\" IS NULL) OR (\"MeasuredValue\" IS NULL AND \"MeasuredUnit\" IS NULL AND \"AvailabilityState\" IS NOT NULL)");
                table.HasCheckConstraint("ck_lots_measured_value", "\"MeasuredValue\" IS NULL OR \"MeasuredValue\" >= 0");
                table.HasCheckConstraint("ck_lots_measured_unit", "\"MeasuredUnit\" IS NULL OR \"MeasuredUnit\" IN ('Gram', 'Milliliter', 'Unit')");
                table.HasCheckConstraint("ck_lots_availability_state", "\"AvailabilityState\" IS NULL OR \"AvailabilityState\" IN ('Available', 'Low', 'Unavailable')");
                table.HasCheckConstraint("ck_lots_storage", "(\"StorageLocation\" IN ('Pantry', 'Refrigerator', 'Freezer') AND \"CustomLocation\" IS NULL) OR (\"StorageLocation\" = 'Other' AND \"CustomLocation\" IS NOT NULL AND length(btrim(\"CustomLocation\")) > 0)");
                table.HasCheckConstraint("ck_lots_package_state", "\"PackageState\" IS NULL OR \"PackageState\" IN ('Sealed', 'Opened', 'Unknown')");
                table.HasCheckConstraint("ck_lots_expiration_provenance", "(\"PrintedExpirationDate\" IS NULL AND \"ExpirationProvenance\" IS NULL) OR (\"PrintedExpirationDate\" IS NOT NULL AND \"ExpirationProvenance\" = 'UserEntered')");
            });
            entity.HasKey(x => x.Id);
            entity.HasAlternateKey(x => new { x.Id, x.OwnerUserId });
            entity.Property(x => x.MeasuredValue).HasColumnType("numeric(18,3)");
            entity.Property(x => x.MeasuredUnit).HasMaxLength(20);
            entity.Property(x => x.AvailabilityState).HasMaxLength(20);
            entity.Property(x => x.StorageLocation).HasMaxLength(30).IsRequired();
            entity.Property(x => x.CustomLocation).HasMaxLength(80);
            entity.Property(x => x.PackageState).HasMaxLength(20);
            entity.Property(x => x.ExpirationProvenance).HasMaxLength(30);
            entity.Property(x => x.Notes).HasMaxLength(1000);
            entity.Property(x => x.Version).IsConcurrencyToken();
            entity.HasOne<InternalUser>().WithMany().HasForeignKey(x => x.OwnerUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<ProductRecord>().WithMany().HasForeignKey(x => new { x.ProductId, x.OwnerUserId }).HasPrincipalKey(x => new { x.Id, x.OwnerUserId }).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(x => new { x.OwnerUserId, x.UpdatedAt, x.Id });
        });

        modelBuilder.Entity<TransactionRecord>(entity =>
        {
            entity.ToTable("transactions", "inventory");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Type).HasMaxLength(30).IsRequired();
            entity.Property(x => x.PreviousMeasuredValue).HasColumnType("numeric(18,3)");
            entity.Property(x => x.ResultingMeasuredValue).HasColumnType("numeric(18,3)");
            entity.Property(x => x.ReasonCode).HasMaxLength(100);
            entity.Property(x => x.Note).HasMaxLength(1000);
            entity.HasOne<InternalUser>().WithMany().HasForeignKey(x => x.OwnerUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<LotRecord>().WithMany().HasForeignKey(x => new { x.LotId, x.OwnerUserId }).HasPrincipalKey(x => new { x.Id, x.OwnerUserId }).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(x => new { x.OwnerUserId, x.LotId, x.OccurredAt });
        });

        modelBuilder.Entity<AuditEventRecord>(entity =>
        {
            entity.ToTable("audit_events", "platform");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.EventName).HasMaxLength(100).IsRequired();
            entity.Property(x => x.TargetType).HasMaxLength(100).IsRequired();
            entity.Property(x => x.CorrelationId).HasMaxLength(100).IsRequired();
            entity.Property(x => x.MetadataJson).HasColumnType("jsonb").IsRequired();
            entity.HasOne<InternalUser>().WithMany().HasForeignKey(x => x.ActorUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<IdempotencyRecord>(entity =>
        {
            entity.ToTable("idempotency_records", "platform");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Scope).HasMaxLength(100).IsRequired();
            entity.Property(x => x.RequestHash).HasMaxLength(128).IsRequired();
            entity.Property(x => x.ResponseBody).HasColumnType("jsonb");
            entity.HasOne<InternalUser>().WithMany().HasForeignKey(x => x.OwnerUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(x => new { x.OwnerUserId, x.Scope, x.Key }).IsUnique();
        });
    }
}

public sealed class ProductRecord
{
    public Guid Id { get; set; }
    public Guid OwnerUserId { get; set; }
    public required string DisplayName { get; set; }
    public required string NormalizedSearchName { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
}

public sealed class LotRecord
{
    public Guid Id { get; set; }
    public Guid OwnerUserId { get; set; }
    public Guid ProductId { get; set; }
    public decimal? MeasuredValue { get; set; }
    public string? MeasuredUnit { get; set; }
    public string? AvailabilityState { get; set; }
    public required string StorageLocation { get; set; }
    public string? CustomLocation { get; set; }
    public string? PackageState { get; set; }
    public DateOnly? PrintedExpirationDate { get; set; }
    public string? ExpirationProvenance { get; set; }
    public string? Notes { get; set; }
    public long Version { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
}

public sealed class TransactionRecord
{
    public Guid Id { get; set; }
    public Guid OwnerUserId { get; set; }
    public Guid LotId { get; set; }
    public required string Type { get; set; }
    public decimal? PreviousMeasuredValue { get; set; }
    public string? PreviousMeasuredUnit { get; set; }
    public string? PreviousAvailabilityState { get; set; }
    public decimal? ResultingMeasuredValue { get; set; }
    public string? ResultingMeasuredUnit { get; set; }
    public string? ResultingAvailabilityState { get; set; }
    public string? ReasonCode { get; set; }
    public string? Note { get; set; }
    public Guid? IdempotencyKey { get; set; }
    public DateTimeOffset OccurredAt { get; set; }
}

public sealed class AuditEventRecord
{
    public Guid Id { get; set; }
    public Guid ActorUserId { get; set; }
    public required string EventName { get; set; }
    public required string TargetType { get; set; }
    public Guid TargetId { get; set; }
    public required string CorrelationId { get; set; }
    public required string MetadataJson { get; set; }
    public DateTimeOffset OccurredAt { get; set; }
}

public sealed class IdempotencyRecord
{
    public Guid Id { get; set; }
    public Guid OwnerUserId { get; set; }
    public required string Scope { get; set; }
    public Guid Key { get; set; }
    public required string RequestHash { get; set; }
    public int StatusCode { get; set; }
    public string? ResponseBody { get; set; }
    public string? ETag { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
}
