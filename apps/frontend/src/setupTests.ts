import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "util";

// react-router@7 expects Web TextEncoder in the Jest/jsdom environment.
Object.assign(globalThis, { TextEncoder, TextDecoder });
