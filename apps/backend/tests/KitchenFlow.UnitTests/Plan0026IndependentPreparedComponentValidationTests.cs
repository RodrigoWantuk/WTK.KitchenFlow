using KitchenFlow.Modules.Identity;
using KitchenFlow.Modules.Inventory.Application;
using KitchenFlow.Modules.Inventory.Domain;

namespace KitchenFlow.UnitTests;

/// <summary>
/// PLAN-0026 independent adversarial coverage for preparation domain and workflow rules.
/// These tests do not mutate production code; they only assert candidate behavior.
/// </summary>
public sealed class Plan0026IndependentPreparedComponentValidationTests
{
    private static readonly DateTimeOffset Now = new(2026, 8, 4, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void PreparedShelfLifeEvidenceRejectsUnknownWithDateOrKnownConfidence()
    {
        Assert.Throws<ArgumentException>(() => new PreparedShelfLifeEvidence(new DateOnly(2026, 8, 10), PreparedShelfLifeEvidenceSource.Unknown, ShelfLifeEvidenceConfidence.Unknown, null));
        Assert.Throws<ArgumentException>(() => new PreparedShelfLifeEvidence(null, PreparedShelfLifeEvidenceSource.Unknown, ShelfLifeEvidenceConfidence.High, null));
    }

    [Fact]
    public void PreparedShelfLifeEvidenceRejectsKnownSourceWithoutDateOrWithUnknownConfidence()
    {
        Assert.Throws<ArgumentException>(() => new PreparedShelfLifeEvidence(null, PreparedShelfLifeEvidenceSource.UserEntered, ShelfLifeEvidenceConfidence.High, null));
        Assert.Throws<ArgumentException>(() => new PreparedShelfLifeEvidence(new DateOnly(2026, 8, 10), PreparedShelfLifeEvidenceSource.Curated, ShelfLifeEvidenceConfidence.Unknown, null));
        Assert.Throws<ArgumentException>(() => new PreparedShelfLifeEvidence(new DateOnly(2026, 8, 10), PreparedShelfLifeEvidenceSource.Regional, ShelfLifeEvidenceConfidence.Unknown, null));
    }

    [Fact]
    public void PreparedShelfLifeEvidenceTrimsConditionsAndRejectsOversizedText()
    {
        var evidence = new PreparedShelfLifeEvidence(new DateOnly(2026, 8, 10), PreparedShelfLifeEvidenceSource.UserEntered, ShelfLifeEvidenceConfidence.Medium, "  chilled promptly  ");
        Assert.Equal("chilled promptly", evidence.Conditions);

        var oversized = new string('x', 501);
        Assert.Throws<ArgumentException>(() => new PreparedShelfLifeEvidence(new DateOnly(2026, 8, 10), PreparedShelfLifeEvidenceSource.UserEntered, ShelfLifeEvidenceConfidence.Low, oversized));
    }

    [Fact]
    public async Task QualitativeDeclaredYieldPersistsAndRejectsMixedOrMultipleOutputs()
    {
        var successFixture = new Fixture(parentQuantity: new LotQuantity.Measured(5m, CanonicalUnit.Gram));
        var success = await successFixture.Workflow.PrepareAsync(successFixture.QualitativeCommand(), CancellationToken.None);
        Assert.Null(success.Problem);
        Assert.Equal("Available", success.Value!.DeclaredYield.AvailabilityState);
        Assert.Null(success.Value.DeclaredYield.MeasuredValue);

        var mixedFixture = new Fixture(parentQuantity: new LotQuantity.Measured(5m, CanonicalUnit.Gram));
        var mixed = await mixedFixture.Workflow.PrepareAsync(mixedFixture.QualitativeCommand() with
        {
            Outputs = [mixedFixture.MeasuredOutput(1m), new PreparationOutputCommand(null, null, "Available", "Refrigerator", null, "Opened", null, "Unknown", "Unknown", null)]
        }, CancellationToken.None);
        Assert.Equal("domain_rule_violated", mixed.Problem!.ErrorCode);
        Assert.Null(mixedFixture.Store.Saved);

        var multipleFixture = new Fixture(parentQuantity: new LotQuantity.Measured(5m, CanonicalUnit.Gram));
        var multipleQualitative = await multipleFixture.Workflow.PrepareAsync(multipleFixture.QualitativeCommand() with
        {
            Outputs =
            [
                new PreparationOutputCommand(null, null, "Available", "Refrigerator", null, "Opened", null, "Unknown", "Unknown", null),
                new PreparationOutputCommand(null, null, "Available", "Freezer", null, "Opened", null, "Unknown", "Unknown", null)
            ]
        }, CancellationToken.None);
        Assert.Equal("domain_rule_violated", multipleQualitative.Problem!.ErrorCode);
    }

    [Fact]
    public async Task DeclaredYieldRemainsImmutableAcrossReplayAfterOutputMutationInMemory()
    {
        var fixture = new Fixture(parentQuantity: new LotQuantity.Measured(100m, CanonicalUnit.Gram));
        var key = Guid.NewGuid();
        var command = fixture.Command(declaredYield: 60m, output: 60m, consumed: 60m, key: key);
        var created = await fixture.Workflow.PrepareAsync(command, CancellationToken.None);
        Assert.Null(created.Problem);
        Assert.Equal(60m, created.Value!.DeclaredYield.MeasuredValue);
        Assert.Equal(60m, created.Value.Outputs[0].Lot.Quantity.MeasuredValue);

        var replay = await fixture.Workflow.PrepareAsync(command, CancellationToken.None);
        Assert.Equal(InventoryIdempotencyDisposition.Replayed, replay.Idempotency);
        Assert.Equal(60m, replay.Value!.DeclaredYield.MeasuredValue);
        Assert.Equal(created.Value.DeclaredYield.MeasuredValue, replay.Value.DeclaredYield.MeasuredValue);
    }

    [Fact]
    public async Task MismatchedPartitionUnitAndPrecisionAreRejectedWithoutSave()
    {
        var fixture = new Fixture();
        var unitMismatch = await fixture.Workflow.PrepareAsync(fixture.Command(5m, 5m) with
        {
            IdempotencyKey = Guid.NewGuid(),
            Outputs = [fixture.MeasuredOutput(5m, "Milliliter")]
        }, CancellationToken.None);
        Assert.Equal("domain_rule_violated", unitMismatch.Problem!.ErrorCode);
        Assert.Null(fixture.Store.Saved);

        var tooManyDecimals = await fixture.Workflow.PrepareAsync(fixture.Command(5m, 5.0001m) with
        {
            IdempotencyKey = Guid.NewGuid(),
            DeclaredYieldValue = 5.0001m,
            Outputs = [fixture.MeasuredOutput(5.0001m)]
        }, CancellationToken.None);
        Assert.Equal("validation_failed", tooManyDecimals.Problem!.ErrorCode);
        Assert.Null(fixture.Store.Saved);
    }

    [Fact]
    public async Task OverConsumptionAndMissingVersionFailClosedBeforeMutation()
    {
        var fixture = new Fixture();
        var over = await fixture.Workflow.PrepareAsync(fixture.Command(5m, 5m) with
        {
            IdempotencyKey = Guid.NewGuid(),
            Inputs = [new PreparationInputCommand(fixture.ParentLot.Id, 6m, "Gram", InventoryVersionPrecondition.Valid(fixture.ParentLot.ConcurrencyToken))]
        }, CancellationToken.None);
        Assert.Equal("domain_rule_violated", over.Problem!.ErrorCode);
        Assert.Equal(5m, Assert.IsType<LotQuantity.Measured>(fixture.ParentLot.Quantity).Value);
        Assert.Null(fixture.Store.Saved);

        var missing = await fixture.Workflow.PrepareAsync(fixture.Command(5m, 5m) with
        {
            IdempotencyKey = Guid.NewGuid(),
            Inputs = [new PreparationInputCommand(fixture.ParentLot.Id, 1m, "Gram", InventoryVersionPrecondition.Missing)]
        }, CancellationToken.None);
        Assert.Equal("precondition_required", missing.Problem!.ErrorCode);
        Assert.Null(fixture.Store.Saved);
    }

    [Fact]
    public async Task SemanticKeyReuseWithDifferentCommandReturnsStableConflict()
    {
        var fixture = new Fixture();
        var key = Guid.NewGuid();
        var first = await fixture.Workflow.PrepareAsync(fixture.Command(5m, 5m, key: key), CancellationToken.None);
        Assert.Null(first.Problem);

        var reuse = await fixture.Workflow.PrepareAsync(fixture.Command(5m, 5m, key: key) with
        {
            Outputs = [fixture.MeasuredOutput(2m), fixture.MeasuredOutput(3m)]
        }, CancellationToken.None);
        Assert.Equal("idempotency_key_reused", reuse.Problem!.ErrorCode);
        Assert.Equal(1, fixture.Store.SaveCount);
    }

    [Fact]
    public async Task MultiParentInputOrderDoesNotChangeSemanticIdentity()
    {
        var fixture = new Fixture(parentCount: 2);
        var key = Guid.NewGuid();
        var first = await fixture.Workflow.PrepareAsync(fixture.MultiParentCommand(key, reverseInputs: false), CancellationToken.None);
        Assert.Null(first.Problem);

        var replay = await fixture.Workflow.PrepareAsync(fixture.MultiParentCommand(key, reverseInputs: true), CancellationToken.None);
        Assert.Null(replay.Problem);
        Assert.Equal(InventoryIdempotencyDisposition.Replayed, replay.Idempotency);
        Assert.Equal(first.Value!.BatchId, replay.Value!.BatchId);
        Assert.Equal(1, fixture.Store.SaveCount);
    }

    [Fact]
    public async Task FuturePreparedAtIsRejected()
    {
        var fixture = new Fixture();
        var result = await fixture.Workflow.PrepareAsync(fixture.Command(5m, 5m) with
        {
            IdempotencyKey = Guid.NewGuid(),
            PreparedAt = Now.AddMinutes(5)
        }, CancellationToken.None);
        Assert.Equal("validation_failed", result.Problem!.ErrorCode);
        Assert.Null(fixture.Store.Saved);
    }

    private sealed class Fixture
    {
        private readonly Guid _ownerId = Guid.NewGuid();
        private readonly List<PreparationInputState> _inputs = [];

        public Fixture(LotQuantity? parentQuantity = null, int parentCount = 1)
        {
            ProductName.TryCreate("Dry beans", out var parentName);
            var product = Product.Create(_ownerId, parentName!, Now);
            for (var index = 0; index < parentCount; index++)
            {
                var lot = InventoryLot.Create(_ownerId, product.Id, parentQuantity ?? new LotQuantity.Measured(5m, CanonicalUnit.Gram), Storage(), PackageState.Sealed, null, null, Now);
                _inputs.Add(new PreparationInputState(lot, product));
            }

            ParentLot = _inputs[0].Lot;
            Store = new TestStore(_inputs);
            Workflow = new PreparedComponentApplicationWorkflow(new CurrentUser(_ownerId), Store, new FixedTimeProvider(Now));
        }

        public InventoryLot ParentLot { get; }
        public TestStore Store { get; }
        public PreparedComponentApplicationWorkflow Workflow { get; }
        public Guid LastKey { get; private set; }

        public PrepareComponentsCommand Command(decimal declaredYield, decimal output, decimal? consumed = null, Guid? key = null)
        {
            LastKey = key ?? Guid.NewGuid();
            var consumption = consumed ?? Math.Min(declaredYield, Assert.IsType<LotQuantity.Measured>(ParentLot.Quantity).Value);
            return new(null, "Cooked beans", declaredYield, "Gram", null,
                [new PreparationInputCommand(ParentLot.Id, consumption, "Gram", InventoryVersionPrecondition.Valid(ParentLot.ConcurrencyToken))],
                [MeasuredOutput(output)], Now.AddMinutes(-1), LastKey, "plan-0026-unit");
        }

        public PrepareComponentsCommand QualitativeCommand()
        {
            LastKey = Guid.NewGuid();
            return new(null, "Prepared base", null, null, "Available",
                [new PreparationInputCommand(ParentLot.Id, 1m, "Gram", InventoryVersionPrecondition.Valid(ParentLot.ConcurrencyToken))],
                [new PreparationOutputCommand(null, null, "Available", "Refrigerator", null, "Opened", null, "Unknown", "Unknown", null)],
                Now.AddMinutes(-1), LastKey, "plan-0026-unit");
        }

        public PrepareComponentsCommand MultiParentCommand(Guid key, bool reverseInputs)
        {
            LastKey = key;
            var inputs = _inputs.Select(item => new PreparationInputCommand(item.Lot.Id, 1m, "Gram", InventoryVersionPrecondition.Valid(item.Lot.ConcurrencyToken))).ToList();
            if (reverseInputs)
            {
                inputs.Reverse();
            }

            return new(null, "Multi parent component", 2m, "Gram", null, inputs, [MeasuredOutput(2m)], Now.AddMinutes(-1), key, "plan-0026-unit");
        }

        public PreparationOutputCommand MeasuredOutput(decimal value, string unit = "Gram") =>
            new(value, unit, null, "Refrigerator", null, "Opened", null, "Unknown", "Unknown", null);

        private static LotStorage Storage()
        {
            LotStorage.TryCreate(StorageLocation.Pantry, null, out var storage);
            return storage!;
        }
    }

    private sealed class CurrentUser(Guid ownerId) : ICurrentUserAccessor
    {
        public Task<InternalUser> GetCurrentAsync(CancellationToken cancellationToken) =>
            Task.FromResult(new InternalUser(ownerId, "https://issuer.test", "plan-0026", Now));
    }

    private sealed class TestStore(IReadOnlyList<PreparationInputState> inputs) : IInventoryPreparationStore
    {
        private readonly Dictionary<Guid, PreparationIdempotencyRead> _records = [];
        public PreparationWrite? Saved { get; private set; }
        public int SaveCount { get; private set; }

        public Task<PreparationIdempotencyRead?> FindIdempotencyAsync(Guid ownerUserId, Guid key, CancellationToken cancellationToken) =>
            Task.FromResult(_records.TryGetValue(key, out var record) ? record : null);

        public Task<IReadOnlyList<PreparationInputState>> LoadActiveInputsAsync(Guid ownerUserId, IReadOnlyList<Guid> lotIds, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<PreparationInputState>>(inputs.Where(item => lotIds.Contains(item.Lot.Id)).ToList());

        public Task<Product?> FindActiveProductAsync(Guid ownerUserId, Guid productId, CancellationToken cancellationToken) =>
            Task.FromResult<Product?>(null);

        public Task<PreparationWriteOutcome> SaveAsync(PreparationWrite write, CancellationToken cancellationToken)
        {
            Saved = write;
            SaveCount++;
            _records[write.Idempotency.Key] = new PreparationIdempotencyRead(write.Idempotency.RequestHash, write.Idempotency.Response, write.Idempotency.CreatedAt);
            return Task.FromResult(PreparationWriteOutcome.Saved);
        }

        public Task<PreparationBatchView?> GetAsync(Guid ownerUserId, Guid batchId, CancellationToken cancellationToken) =>
            Task.FromResult<PreparationBatchView?>(null);

        public Task<InventoryLotProvenanceView?> GetLotProvenanceAsync(Guid ownerUserId, Guid lotId, CancellationToken cancellationToken) =>
            Task.FromResult<InventoryLotProvenanceView?>(null);
    }

    private sealed class FixedTimeProvider(DateTimeOffset value) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => value;
    }
}
