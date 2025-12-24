/**
 * Test setup file
 *
 * Configures global test environment and mocks.
 */

import { vi } from "vitest";

// Mock environment variables
process.env.ELEVENLABS_API_KEY = "sk_test_mock_key_do_not_use";

// Global mock for axios to prevent actual HTTP calls
vi.mock("axios", async () => {
  const actual = await vi.importActual<typeof import("axios")>("axios");
  return {
    ...actual,
    default: {
      ...actual.default,
      request: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn()
    }
  };
});
