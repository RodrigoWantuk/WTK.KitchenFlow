/**
 * Production stub for PrototypeApp — must never render mock UX in production bundles.
 */
export default function PrototypeAppUnavailable(): never {
  throw new Error(
    "PrototypeApp is not available in production builds. Use ProductionApp.",
  );
}
