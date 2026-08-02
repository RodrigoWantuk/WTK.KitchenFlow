/**
 * Application-owned inventory presentation models.
 * Isolated from generated OpenAPI DTO shapes used by the wire client.
 */

export type StorageLocation = "Pantry" | "Refrigerator" | "Freezer" | "Other";

export type PackageState = "Sealed" | "Opened" | "Unknown";

export type AvailabilityState = "Available" | "Low" | "Unavailable";

export type MeasuredUnit = "Gram" | "Milliliter" | "Unit";

export type InventoryQuantity =
  | {
      kind: "measured";
      value: number;
      unit: MeasuredUnit;
    }
  | {
      kind: "qualitative";
      availability: AvailabilityState;
    };

export interface InventoryLotView {
  lotId: string;
  productId: string;
  productName: string;
  quantity: InventoryQuantity;
  storageLocation: StorageLocation | string;
  customLocation: string | null;
  packageState: PackageState | string | null;
  /** Calendar date YYYY-MM-DD; never a timezone-shifted instant. */
  printedExpirationDate: string | null;
  notes: string | null;
  version: string;
  etag: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryListPage {
  items: InventoryLotView[];
  nextCursor: string | null;
}

export interface InventoryHistoryEntry {
  entryId: string;
  kind: string;
  type: string | null;
  reasonCode: string | null;
  changedFields: string[] | null;
  occurredAt: string;
}

export type AdjustmentType =
  | "Consume"
  | "Discard"
  | "Correct"
  | "AvailabilityChanged";

export interface CreateLotInput {
  productName: string;
  quantity: InventoryQuantity;
  storageLocation: StorageLocation;
  customLocation?: string | null;
  packageState?: PackageState | null;
  printedExpirationDate?: string | null;
  notes?: string | null;
}

export interface UpdateLotInput {
  productName?: string;
  storageLocation?: StorageLocation;
  customLocation?: string | null;
  packageState?: PackageState | null;
  printedExpirationDate?: string | null;
  notes?: string | null;
}

export interface AdjustLotInput {
  type: AdjustmentType;
  value?: number | null;
  availabilityState?: AvailabilityState | null;
  reasonCode?: string | null;
  note?: string | null;
}

export type InventoryApiErrorCode =
  | "authentication_required"
  | "validation_failed"
  | "precondition_required"
  | "precondition_failed"
  | "not_found"
  | "conflict"
  | "unavailable"
  | "cancelled"
  | "unexpected";

export class InventoryApiError extends Error {
  readonly code: InventoryApiErrorCode;
  readonly status: number;
  readonly fieldErrors: Record<string, string[]>;

  constructor(
    code: InventoryApiErrorCode,
    message: string,
    status: number,
    fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "InventoryApiError";
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export interface InventoryRepository {
  listLots(params?: {
    search?: string;
    status?: string;
    storageLocation?: string;
    cursor?: string;
    pageSize?: number;
    signal?: AbortSignal;
  }): Promise<InventoryListPage>;
  getLot(lotId: string, signal?: AbortSignal): Promise<InventoryLotView>;
  createLot(
    input: CreateLotInput,
    options: {
      csrfToken: string;
      idempotencyKey: string;
      signal?: AbortSignal;
    },
  ): Promise<InventoryLotView>;
  updateLot(
    lotId: string,
    input: UpdateLotInput,
    options: {
      csrfToken: string;
      etag: string;
      signal?: AbortSignal;
    },
  ): Promise<InventoryLotView>;
  adjustLot(
    lotId: string,
    input: AdjustLotInput,
    options: {
      csrfToken: string;
      etag: string;
      idempotencyKey: string;
      signal?: AbortSignal;
    },
  ): Promise<InventoryLotView>;
  deleteLot(
    lotId: string,
    options: { csrfToken: string; etag: string; signal?: AbortSignal },
  ): Promise<void>;
  getHistory(
    lotId: string,
    signal?: AbortSignal,
  ): Promise<InventoryHistoryEntry[]>;
}
