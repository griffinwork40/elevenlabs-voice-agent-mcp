/**
 * Tests for error handling utilities
 *
 * Tests error parsing and user-friendly message generation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import {
  handleElevenLabsError,
  validateApiKey,
  withErrorHandling
} from "../../utils/error-handlers.js";

// Helper to create axios-like errors
function createAxiosError(status: number, detail: string | object) {
  const error = new Error("Request failed") as Error & {
    response?: { status: number; data: { detail?: string | object; message?: string } };
    code?: string;
    isAxiosError?: boolean;
  };
  error.response = { status, data: { detail } };
  error.isAxiosError = true;
  return error;
}

describe("Error Handlers", () => {
  describe("handleElevenLabsError", () => {
    // Mock axios.isAxiosError to check the isAxiosError property
    let isAxiosErrorSpy: ReturnType<typeof vi.spyOn>;
    
    beforeEach(() => {
      isAxiosErrorSpy = vi
        .spyOn(axios, "isAxiosError")
        .mockImplementation((error: unknown): boolean => {
          return !!(error as { isAxiosError?: boolean })?.isAxiosError;
        });
    });
    
    afterEach(() => {
      isAxiosErrorSpy.mockRestore();
    });

    describe("HTTP Status Code Errors", () => {
      it("should handle 400 Bad Request", () => {
        const error = createAxiosError(400, "Invalid field value");

        const result = handleElevenLabsError(error);

        expect(result).toContain("Invalid request");
        expect(result).toContain("Invalid field value");
      });

      it("should handle 400 without detail", () => {
        const error = createAxiosError(400, "");
        error.response!.data = {};

        const result = handleElevenLabsError(error);

        expect(result).toContain("Invalid request");
        expect(result).toContain("Check your parameters");
      });

      it("should handle 401 Unauthorized", () => {
        const error = createAxiosError(401, "Unauthorized");

        const result = handleElevenLabsError(error);

        expect(result).toContain("Invalid API key");
        expect(result).toContain("ELEVENLABS_API_KEY");
      });

      it("should handle 403 Forbidden", () => {
        const error = createAxiosError(403, "Access denied");

        const result = handleElevenLabsError(error);

        expect(result).toContain("Access forbidden");
        expect(result).toContain("permission");
      });

      it("should handle 404 Not Found", () => {
        const error = createAxiosError(404, "Agent not found");

        const result = handleElevenLabsError(error);

        expect(result).toContain("not found");
        expect(result).toContain("verify the ID");
      });

      it("should handle 409 Conflict", () => {
        const error = createAxiosError(409, "Resource already exists");

        const result = handleElevenLabsError(error);

        expect(result).toContain("Conflict");
        expect(result).toContain("Resource already exists");
      });

      it("should handle 422 Validation Error", () => {
        const error = createAxiosError(422, "Field validation failed");

        const result = handleElevenLabsError(error);

        expect(result).toContain("Validation error");
        expect(result).toContain("Field validation failed");
      });

      it("should handle 429 Rate Limit", () => {
        const error = createAxiosError(429, "Too many requests");

        const result = handleElevenLabsError(error);

        expect(result).toContain("Rate limit exceeded");
        expect(result).toContain("60 seconds");
      });

      it("should handle 500 Server Error", () => {
        const error = createAxiosError(500, "Internal error");

        const result = handleElevenLabsError(error);

        expect(result).toContain("server error");
        expect(result).toContain("try again");
      });

      it("should handle 503 Service Unavailable", () => {
        const error = createAxiosError(503, "Service down");

        const result = handleElevenLabsError(error);

        expect(result).toContain("temporarily unavailable");
        expect(result).toContain("try again later");
      });

      it("should handle unknown status codes", () => {
        const error = createAxiosError(418, "I'm a teapot");

        const result = handleElevenLabsError(error);

        expect(result).toContain("418");
        expect(result).toContain("I'm a teapot");
      });
    });

    describe("Network Errors", () => {
      it("should handle timeout error", () => {
        const error = new Error("timeout of 30000ms exceeded") as Error & {
          code?: string;
          isAxiosError?: boolean;
        };
        error.code = "ECONNABORTED";
        error.isAxiosError = true;

        const result = handleElevenLabsError(error);

        expect(result).toContain("timed out");
        expect(result).toContain("network connection");
      });

      it("should handle DNS resolution error", () => {
        const error = new Error("getaddrinfo ENOTFOUND api.elevenlabs.io") as Error & {
          code?: string;
          isAxiosError?: boolean;
        };
        error.code = "ENOTFOUND";
        error.isAxiosError = true;

        const result = handleElevenLabsError(error);

        expect(result).toContain("Cannot connect");
        expect(result).toContain("internet connection");
      });

      it("should handle connection refused error", () => {
        const error = new Error("connect ECONNREFUSED") as Error & {
          code?: string;
          isAxiosError?: boolean;
        };
        error.code = "ECONNREFUSED";
        error.isAxiosError = true;

        const result = handleElevenLabsError(error);

        expect(result).toContain("Cannot connect");
      });

      it("should handle generic network error", () => {
        const error = new Error("Network Error") as Error & {
          isAxiosError?: boolean;
        };
        error.isAxiosError = true;

        const result = handleElevenLabsError(error);

        expect(result).toContain("Network error");
        expect(result).toContain("Network Error");
      });
    });

    describe("Error Detail Formats", () => {
      it("should handle object detail", () => {
        const error = createAxiosError(422, { field: "name", error: "required" });

        const result = handleElevenLabsError(error);

        expect(result).toContain("Validation error");
        expect(result).toContain("field");
        expect(result).toContain("name");
      });

      it("should handle message instead of detail", () => {
        const error = createAxiosError(400, "");
        error.response!.data = { message: "Error message here" };

        const result = handleElevenLabsError(error);

        expect(result).toContain("Error message here");
      });
    });

    describe("Non-Axios Errors", () => {
      it("should handle standard Error", () => {
        // Reset axios.isAxiosError to return false for non-axios errors
        isAxiosErrorSpy.mockReturnValue(false);
        const error = new Error("Something went wrong");

        const result = handleElevenLabsError(error);

        expect(result).toContain("Something went wrong");
      });

      it("should handle string error", () => {
        isAxiosErrorSpy.mockReturnValue(false);
        const result = handleElevenLabsError("String error message");

        expect(result).toContain("String error message");
      });

      it("should handle unknown error type", () => {
        isAxiosErrorSpy.mockReturnValue(false);
        const result = handleElevenLabsError({ unknown: "object" });

        expect(result).toContain("Unexpected error");
      });

      it("should handle null error", () => {
        isAxiosErrorSpy.mockReturnValue(false);
        const result = handleElevenLabsError(null);

        expect(result).toContain("Unexpected error");
      });
    });

    describe("Context Parameter", () => {
      it("should include context in message", () => {
        isAxiosErrorSpy.mockReturnValue(false);
        const error = new Error("Test error");

        const result = handleElevenLabsError(error, "creating agent");

        expect(result).toContain("Error creating agent:");
        expect(result).toContain("Test error");
      });

      it("should work without context", () => {
        isAxiosErrorSpy.mockReturnValue(false);
        const error = new Error("Test error");

        const result = handleElevenLabsError(error);

        expect(result).toContain("Error:");
        expect(result).toContain("Test error");
      });
    });
  });

  describe("validateApiKey", () => {
    const originalEnv = process.env.ELEVENLABS_API_KEY;

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.ELEVENLABS_API_KEY = originalEnv;
      } else {
        delete process.env.ELEVENLABS_API_KEY;
      }
    });

    it("should not throw when API key is set", () => {
      process.env.ELEVENLABS_API_KEY = "test_key";

      expect(() => validateApiKey()).not.toThrow();
    });

    it("should throw when API key is not set", () => {
      delete process.env.ELEVENLABS_API_KEY;

      expect(() => validateApiKey()).toThrow("ELEVENLABS_API_KEY");
    });

    it("should throw when API key is empty string", () => {
      process.env.ELEVENLABS_API_KEY = "";

      expect(() => validateApiKey()).toThrow("ELEVENLABS_API_KEY");
    });
  });

  describe("withErrorHandling", () => {
    it("should return result on success", async () => {
      const fn = vi.fn().mockResolvedValue("success");
      const wrapped = withErrorHandling(fn, "testing");

      const result = await wrapped("arg1", "arg2");

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledWith("arg1", "arg2");
    });

    it("should wrap error with context", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("Original error"));
      const wrapped = withErrorHandling(fn, "custom operation");

      await expect(wrapped()).rejects.toThrow("Error custom operation:");
    });

    it("should handle function with no context", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("Test error"));
      const wrapped = withErrorHandling(fn);

      await expect(wrapped()).rejects.toThrow("Error:");
    });

    it("should preserve function arguments", async () => {
      const fn = vi.fn(async (a: number, b: string) => `${a}-${b}`);
      const wrapped = withErrorHandling(fn);

      const result = await wrapped(42, "test");

      expect(result).toBe("42-test");
      expect(fn).toHaveBeenCalledWith(42, "test");
    });
  });
});
