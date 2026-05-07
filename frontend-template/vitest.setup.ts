import { vi } from "vitest";

// Mock CSS imports
vi.mock("@miden-sdk/miden-wallet-adapter/styles.css", () => ({
  default: "",
}));

import "@testing-library/jest-dom/vitest";
