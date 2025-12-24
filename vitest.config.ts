/**
 * Vitest configuration for ElevenLabs Voice Agent MCP tests
 *
 * Configures test environment, coverage, and paths.
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Test environment
    environment: "node",

    // Include pattern for test files
    include: ["src/__tests__/**/*.test.ts"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html"],
      reportsDirectory: "./coverage",
      include: [
        "src/services/**/*.ts",
        "src/tools/**/*.ts",
        "src/schemas/**/*.ts",
        "src/utils/**/*.ts"
      ],
      exclude: [
        "src/__tests__/**",
        "src/index.ts",
        "src/types.ts",
        "src/constants.ts"
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 75,
        statements: 85
      }
    },

    // Globals for describe, it, expect
    globals: true,

    // Setup file
    setupFiles: ["./src/__tests__/setup.ts"],

    // Timeout for tests
    testTimeout: 10000,

    // Mock clear between tests
    clearMocks: true,

    // Reset mocks between tests
    restoreMocks: true
  }
});
