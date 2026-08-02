import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useInventoryRepository } from "./InventoryProvider";
import {
  InventoryApiError,
  type InventoryLotView,
  type PackageState,
  type StorageLocation,
} from "@/adapters/live/inventoryTypes";
import { useSession } from "@/app/session/SessionProvider";
import { useProductionI18n } from "@/app/i18n/ProductionI18nProvider";
import { isCalendarDateString } from "@/lib/calendarDate";
import { parseLocaleDecimal } from "@/lib/localeDecimal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mode = "measured" | "qualitative";
const CUSTOM_LOCATION_MAX = 80;

/**
 * Create or edit inventory lot metadata / initial quantity.
 */
export function ProductionInventoryForm({ mode }: { mode: "create" | "edit" }) {
  const { lotId = "" } = useParams();
  const repo = useInventoryRepository();
  const { session } = useSession();
  const { t, locale } = useProductionI18n();
  const navigate = useNavigate();
  const [existing, setExisting] = useState<InventoryLotView | null>(null);
  const [productName, setProductName] = useState("");
  const [quantityMode, setQuantityMode] = useState<Mode>("measured");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<"Gram" | "Milliliter" | "Unit">("Gram");
  const [availability, setAvailability] = useState<
    "Available" | "Low" | "Unavailable"
  >("Available");
  const [storageLocation, setStorageLocation] =
    useState<StorageLocation>("Pantry");
  const [customLocation, setCustomLocation] = useState("");
  const [packageState, setPackageState] = useState<PackageState | "">("");
  const [printedDate, setPrintedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [conflict, setConflict] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (mode !== "edit") return;
    void (async () => {
      const lot = await repo.getLot(lotId);
      setExisting(lot);
      setProductName(lot.productName);
      setStorageLocation(lot.storageLocation as StorageLocation);
      setCustomLocation(lot.customLocation ?? "");
      setPackageState((lot.packageState as PackageState) || "");
      setPrintedDate(lot.printedExpirationDate ?? "");
      setNotes(lot.notes ?? "");
      if (lot.quantity.kind === "measured") {
        setQuantityMode("measured");
        setAmount(
          String(lot.quantity.value).replace(".", locale === "en" ? "." : ","),
        );
        setUnit(lot.quantity.unit);
      } else {
        setQuantityMode("qualitative");
        setAvailability(lot.quantity.availability);
      }
    })();
  }, [locale, lotId, mode, repo]);

  function setStorage(next: StorageLocation) {
    setStorageLocation(next);
    if (next !== "Other") {
      setCustomLocation("");
    }
  }

  function mapBackendFieldErrors(errors: Record<string, string[]>) {
    const mapped: Record<string, string> = {};
    for (const [key, values] of Object.entries(errors)) {
      if (values?.[0]) mapped[key] = values[0];
    }
    setFieldErrors(mapped);
    if (mapped.customLocation) {
      setFieldError(mapped.customLocation);
    } else if (mapped.productName) {
      setFieldError(mapped.productName);
    } else if (Object.keys(mapped).length) {
      setFieldError(Object.values(mapped)[0]);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldError(null);
    setFieldErrors({});
    setConflict(false);
    if (!productName.trim()) {
      setFieldError(t("inventory.error.productName"));
      return;
    }
    if (storageLocation === "Other") {
      const trimmed = customLocation.trim();
      if (!trimmed) {
        setFieldError(t("inventory.error.customLocationRequired"));
        setFieldErrors({
          customLocation: t("inventory.error.customLocationRequired"),
        });
        return;
      }
      if ([...trimmed].length > CUSTOM_LOCATION_MAX) {
        setFieldError(t("inventory.error.customLocationLength"));
        setFieldErrors({
          customLocation: t("inventory.error.customLocationLength"),
        });
        return;
      }
    }
    if (printedDate && !isCalendarDateString(printedDate)) {
      setFieldError(t("inventory.error.printedDate"));
      return;
    }
    if (!session.csrfToken) {
      setFieldError(t("inventory.error.session"));
      return;
    }

    setBusy(true);
    try {
      const resolvedCustom =
        storageLocation === "Other" ? customLocation.trim() : null;

      if (mode === "create") {
        let quantity;
        if (quantityMode === "measured") {
          const parsed = parseLocaleDecimal(amount, locale);
          if (!parsed.ok) {
            setFieldError(t("inventory.error.invalidDecimal"));
            setBusy(false);
            return;
          }
          quantity = {
            kind: "measured" as const,
            value: parsed.value,
            unit,
          };
        } else {
          quantity = {
            kind: "qualitative" as const,
            availability,
          };
        }
        const created = await repo.createLot(
          {
            productName: productName.trim(),
            quantity,
            storageLocation,
            packageState: packageState || null,
            printedExpirationDate: printedDate || null,
            notes: notes || null,
            customLocation: resolvedCustom,
          },
          {
            csrfToken: session.csrfToken,
            idempotencyKey: crypto.randomUUID(),
          },
        );
        navigate(`/app/despensa/${created.lotId}`);
        return;
      }

      if (!existing) return;
      const updated = await repo.updateLot(
        existing.lotId,
        {
          productName: productName.trim(),
          storageLocation,
          customLocation: resolvedCustom,
          packageState: packageState || null,
          printedExpirationDate: printedDate || null,
          notes: notes || null,
        },
        { csrfToken: session.csrfToken, etag: existing.etag },
      );
      navigate(`/app/despensa/${updated.lotId}`);
    } catch (err) {
      if (
        err instanceof InventoryApiError &&
        err.code === "precondition_failed"
      ) {
        setConflict(true);
        setFieldError(t("inventory.error.staleVersion"));
      } else if (
        err instanceof InventoryApiError &&
        err.code === "precondition_required"
      ) {
        setFieldError(t("inventory.error.missingPrecondition"));
      } else if (
        err instanceof InventoryApiError &&
        err.code === "validation_failed"
      ) {
        mapBackendFieldErrors(err.fieldErrors);
        if (!Object.keys(err.fieldErrors).length) {
          setFieldError(err.message || t("inventory.error.validation"));
        }
      } else {
        setFieldError(t("inventory.error.save"));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      data-testid="production-inventory-form"
      className="mx-auto max-w-xl space-y-4"
      onSubmit={(event) => void onSubmit(event)}
      noValidate
    >
      <h1 className="font-display text-3xl">
        {mode === "create"
          ? t("inventory.form.createTitle")
          : t("inventory.form.editTitle")}
      </h1>

      {conflict && (
        <div role="alert" data-testid="inventory-form-conflict">
          <p>{t("inventory.error.staleHint")}</p>
          <Button asChild className="mt-2" variant="secondary">
            <Link to={`/app/despensa/${lotId}`}>
              {t("inventory.actions.reloadReview")}
            </Link>
          </Button>
        </div>
      )}

      <label className="block space-y-1">
        <span>{t("inventory.fields.productName")}</span>
        <Input
          data-testid="inventory-product-name"
          value={productName}
          disabled={busy}
          onChange={(event) => setProductName(event.target.value)}
          required
          aria-invalid={Boolean(fieldErrors.productName)}
        />
      </label>

      {mode === "create" && (
        <>
          <fieldset className="space-y-2">
            <legend>{t("inventory.fields.quantityMode")}</legend>
            <label className="mr-4 inline-flex items-center gap-2">
              <input
                type="radio"
                name="qty-mode"
                checked={quantityMode === "measured"}
                disabled={busy}
                onChange={() => setQuantityMode("measured")}
              />
              {t("inventory.quantityMode.measured")}
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="qty-mode"
                checked={quantityMode === "qualitative"}
                disabled={busy}
                onChange={() => setQuantityMode("qualitative")}
              />
              {t("inventory.quantityMode.qualitative")}
            </label>
          </fieldset>

          {quantityMode === "measured" ? (
            <div className="flex flex-wrap gap-2">
              <label className="min-w-[8rem] flex-1 space-y-1">
                <span>{t("inventory.fields.amount")}</span>
                <Input
                  data-testid="inventory-amount"
                  value={amount}
                  disabled={busy}
                  onChange={(event) => setAmount(event.target.value)}
                  inputMode="decimal"
                />
              </label>
              <label className="space-y-1">
                <span>{t("inventory.fields.unit")}</span>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={unit}
                  disabled={busy}
                  onChange={(event) =>
                    setUnit(event.target.value as typeof unit)
                  }
                >
                  <option value="Gram">{t("inventory.unit.Gram")}</option>
                  <option value="Milliliter">
                    {t("inventory.unit.Milliliter")}
                  </option>
                  <option value="Unit">{t("inventory.unit.Unit")}</option>
                </select>
              </label>
            </div>
          ) : (
            <label className="block space-y-1">
              <span>{t("inventory.fields.availability")}</span>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={availability}
                disabled={busy}
                onChange={(event) =>
                  setAvailability(event.target.value as typeof availability)
                }
              >
                <option value="Available">
                  {t("inventory.availability.Available")}
                </option>
                <option value="Low">{t("inventory.availability.Low")}</option>
                <option value="Unavailable">
                  {t("inventory.availability.Unavailable")}
                </option>
              </select>
            </label>
          )}
        </>
      )}

      <label className="block space-y-1">
        <span>{t("inventory.fields.location")}</span>
        <select
          data-testid="inventory-location"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          value={storageLocation}
          disabled={busy}
          onChange={(event) =>
            setStorage(event.target.value as StorageLocation)
          }
        >
          {(["Pantry", "Refrigerator", "Freezer", "Other"] as const).map(
            (loc) => (
              <option key={loc} value={loc}>
                {t(`inventory.location.${loc}`)}
              </option>
            ),
          )}
        </select>
      </label>

      {storageLocation === "Other" && (
        <label className="block space-y-1">
          <span>{t("inventory.fields.customLocation")}</span>
          <Input
            data-testid="inventory-custom-location"
            value={customLocation}
            disabled={busy}
            maxLength={CUSTOM_LOCATION_MAX}
            onChange={(event) => setCustomLocation(event.target.value)}
            required
            aria-invalid={Boolean(fieldErrors.customLocation)}
            aria-describedby={
              fieldErrors.customLocation ? "custom-location-error" : undefined
            }
          />
          {fieldErrors.customLocation && (
            <span
              id="custom-location-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {fieldErrors.customLocation}
            </span>
          )}
        </label>
      )}

      <label className="block space-y-1">
        <span>{t("inventory.fields.packageState")}</span>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          value={packageState}
          disabled={busy}
          onChange={(event) =>
            setPackageState(event.target.value as PackageState | "")
          }
        >
          <option value="">{t("inventory.fields.none")}</option>
          <option value="Sealed">{t("inventory.package.Sealed")}</option>
          <option value="Opened">{t("inventory.package.Opened")}</option>
          <option value="Unknown">{t("inventory.package.Unknown")}</option>
        </select>
      </label>

      <label className="block space-y-1">
        <span>{t("inventory.fields.printedDate")}</span>
        <Input
          data-testid="inventory-printed-date-input"
          type="text"
          inputMode="numeric"
          placeholder="YYYY-MM-DD"
          value={printedDate}
          disabled={busy}
          onChange={(event) => setPrintedDate(event.target.value)}
        />
        <span className="block text-xs text-muted-foreground">
          {t("inventory.printedDateDisclaimer")}
        </span>
      </label>

      <label className="block space-y-1">
        <span>{t("inventory.fields.notes")}</span>
        <Input
          value={notes}
          disabled={busy}
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>

      {fieldError && (
        <p role="alert" data-testid="inventory-form-error">
          {fieldError}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          data-testid="inventory-save"
          disabled={busy || !session.csrfToken}
        >
          {t("inventory.actions.save")}
        </Button>
        <Button asChild type="button" variant="secondary">
          <Link
            to={mode === "edit" ? `/app/despensa/${lotId}` : "/app/despensa"}
          >
            {t("inventory.actions.cancel")}
          </Link>
        </Button>
      </div>
    </form>
  );
}
