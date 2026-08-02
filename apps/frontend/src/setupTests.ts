import "@testing-library/jest-dom";
import { webcrypto } from "crypto";
import { TextDecoder, TextEncoder } from "util";

// react-router@7 expects Web TextEncoder in the Jest/jsdom environment.
Object.assign(globalThis, { TextEncoder, TextDecoder });

// jsdom does not expose Web Crypto; inventory mutations need randomUUID.
if (
  typeof globalThis.crypto === "undefined" ||
  typeof globalThis.crypto.randomUUID !== "function"
) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
}
