/**
 * Stable-code generation for user-entered custom preferences and equipment.
 *
 * The backend accepts any `stableCode` that satisfies its bounded, whitespace-free
 * format (2-64 characters); it does not own a fixed catalog. When a user adds a
 * preference, restriction, or equipment item that is not in the curated catalog
 * (see `./catalog`), the frontend must mint a private, opaque stable code rather than
 * deriving one from the user's free text.
 *
 * The code itself must never contain user-entered text: free text belongs in the
 * `note` (preferences) or `customName`/`constraintNote` (equipment) fields. Deriving a
 * code from user text would risk leaking private text into a field other code treats
 * as non-localized and non-sensitive (for example analytics or catalog matching), and
 * would defeat stable-code stability if the user later edits the text.
 */

const CUSTOM_STABLE_CODE_PREFIX = "custom_";
/** Backend `StableCode` bounds: 2-64 characters, no whitespace. */
const MIN_LENGTH = 2;
const MAX_LENGTH = 64;
/**
 * Exact UUID v4 shape produced by {@link createCustomStableCode}: version nibble `4`,
 * RFC 4122 variant `8`/`9`/`a`/`b`.
 */
const CUSTOM_STABLE_CODE_PATTERN =
  /^custom_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function randomUuid(): string {
  const cryptoObj = globalThis.crypto as Crypto | undefined;
  if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
    return cryptoObj.randomUUID();
  }
  if (cryptoObj && typeof cryptoObj.getRandomValues === "function") {
    const bytes = cryptoObj.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
    return [
      hex.slice(0, 4).join(""),
      hex.slice(4, 6).join(""),
      hex.slice(6, 8).join(""),
      hex.slice(8, 10).join(""),
      hex.slice(10, 16).join(""),
    ].join("-");
  }
  // Last-resort fallback: still opaque and UUID-v4 shaped (no user text).
  let fallback = "";
  for (let i = 0; i < 32; i += 1) {
    fallback += Math.floor(Math.random() * 16).toString(16);
  }
  const chars = fallback.split("");
  chars[12] = "4";
  chars[16] = ["8", "9", "a", "b"][Math.floor(Math.random() * 4)]!;
  return `${chars.slice(0, 8).join("")}-${chars.slice(8, 12).join("")}-${chars.slice(12, 16).join("")}-${chars.slice(16, 20).join("")}-${chars.slice(20, 32).join("")}`;
}

/**
 * Creates a new opaque, private stable code for a user-defined custom preference or
 * equipment entry. Always satisfies the backend `StableCode` bounds (2-64 characters,
 * no whitespace) and never embeds user-entered text.
 */
export function createCustomStableCode(): string {
  const code = `${CUSTOM_STABLE_CODE_PREFIX}${randomUuid()}`;
  if (
    code.length < MIN_LENGTH ||
    code.length > MAX_LENGTH ||
    /\s/.test(code) ||
    !CUSTOM_STABLE_CODE_PATTERN.test(code)
  ) {
    // Defensive: the generated shape above always satisfies these bounds; this
    // guards against a future change to the prefix or UUID format regressing them.
    throw new Error(
      "Generated custom stable code violates backend StableCode bounds.",
    );
  }
  return code;
}

/** Returns true when `code` was minted by {@link createCustomStableCode}. */
export function isCustomStableCode(code: string): boolean {
  return (
    code.length >= MIN_LENGTH &&
    code.length <= MAX_LENGTH &&
    CUSTOM_STABLE_CODE_PATTERN.test(code)
  );
}
