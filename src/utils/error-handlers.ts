/**
 * @fileoverview Error handling utilities for ElevenLabs API requests
 * @description Provides consistent error handling and user-friendly error messages
 * for various API error scenarios. Maps HTTP status codes to actionable guidance.
 * @module utils/error-handlers
 */

import axios from "axios";

/**
 * Handles errors from ElevenLabs API requests and returns user-friendly messages.
 * @description Parses axios errors and other exceptions, mapping them to clear,
 * actionable error messages. Handles network errors, HTTP status codes, and
 * API-specific error responses.
 *
 * @param {unknown} error - The error object from axios or other sources
 * @param {string} [context] - Additional context about the operation (e.g., "creating agent")
 * @returns {string} User-friendly error message with actionable guidance
 *
 * @example
 * try {
 *   await makeApiRequest();
 * } catch (error) {
 *   const message = handleElevenLabsError(error, "creating agent");
 *   // Returns: "Error creating agent: Invalid API key. Please check your ELEVENLABS_API_KEY..."
 * }
 */
export function handleElevenLabsError(error: unknown, context?: string): string {
  const prefix = context ? `Error ${context}: ` : "Error: ";

  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as { detail?: unknown; message?: string };
      // Handle case where detail is an object (stringify it for readability)
      const detail = typeof data?.detail === 'object'
        ? JSON.stringify(data.detail)
        : (data?.detail as string | undefined) || data?.message;

      switch (status) {
        case 400:
          return `${prefix}Invalid request - ${detail || "Check your parameters"}`;
        case 401:
          return `${prefix}Invalid API key. Please check your ELEVENLABS_API_KEY environment variable.`;
        case 403:
          return `${prefix}Access forbidden. Your API key may not have permission for this operation.`;
        case 404:
          return `${prefix}Resource not found. Please verify the ID is correct.`;
        case 409:
          return `${prefix}Conflict - ${detail || "Resource already exists or is in use"}`;
        case 422:
          return `${prefix}Validation error - ${detail || "Invalid data format"}`;
        case 429:
          return `${prefix}Rate limit exceeded. Please wait 60 seconds before retrying.`;
        case 500:
          return `${prefix}ElevenLabs server error. Please try again in a few moments.`;
        case 503:
          return `${prefix}Service temporarily unavailable. Please try again later.`;
        default:
          return `${prefix}API request failed with status ${status}${detail ? `: ${detail}` : ""}`;
      }
    } else if (error.code === "ECONNABORTED") {
      return `${prefix}Request timed out. Please try again or check your network connection.`;
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      return `${prefix}Cannot connect to ElevenLabs API. Please check your internet connection.`;
    } else if (error.message) {
      return `${prefix}Network error - ${error.message}`;
    }
  }

  // Generic error handling
  if (error instanceof Error) {
    return `${prefix}${error.message}`;
  }

  return `${prefix}Unexpected error occurred: ${String(error)}`;
}

/**
 * Validates that the ElevenLabs API key is present in the environment.
 * @description Checks for the ELEVENLABS_API_KEY environment variable.
 * Should be called at server startup to fail fast if not configured.
 *
 * @throws {Error} If ELEVENLABS_API_KEY environment variable is not set
 *
 * @example
 * // At server startup
 * try {
 *   validateApiKey();
 * } catch (error) {
 *   console.error("API key not configured");
 *   process.exit(1);
 * }
 */
export function validateApiKey(): void {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error(
      "ELEVENLABS_API_KEY environment variable is not set. " +
      "Please set it to your ElevenLabs API key."
    );
  }
}

/**
 * Higher-order function that wraps an async function with error handling.
 * @description Creates a new function that catches errors and formats them
 * consistently using handleElevenLabsError.
 *
 * @template T - Tuple type of the function arguments
 * @template R - Return type of the function
 * @param {(...args: T) => Promise<R>} fn - The async function to wrap
 * @param {string} [context] - Context for error messages (e.g., "fetching agent")
 * @returns {(...args: T) => Promise<R>} Wrapped function with consistent error handling
 *
 * @example
 * const safeGetAgent = withErrorHandling(
 *   async (id: string) => await api.getAgent(id),
 *   "fetching agent"
 * );
 * // Errors now include context: "Error fetching agent: ..."
 */
export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw new Error(handleElevenLabsError(error, context));
    }
  };
}
