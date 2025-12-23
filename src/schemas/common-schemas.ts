/**
 * @fileoverview Common Zod validation schemas
 * @description Shared schemas used across multiple tools for pagination,
 * formatting, and common parameters. These schemas ensure consistent
 * validation behavior across all MCP tools.
 * @module schemas/common-schemas
 */

import { z } from "zod";
import { DEFAULT_LIMIT, MAX_LIMIT } from "../constants.js";
import { ResponseFormat } from "../types.js";

/**
 * Response format schema for MCP tool outputs.
 * @description Validates the output format preference. Accepts 'json' for
 * structured data or 'markdown' (default) for human-readable output.
 * @type {z.ZodDefault<z.ZodNativeEnum<typeof ResponseFormat>>}
 */
export const ResponseFormatSchema = z.nativeEnum(ResponseFormat, {
  errorMap: () => ({ message: "Format must be 'json' or 'markdown'" })
}).default(ResponseFormat.MARKDOWN).describe(
  "Output format: 'markdown' for human-readable or 'json' for structured data"
);

/**
 * Pagination limit schema.
 * @description Validates the number of items to return in a paginated request.
 * Enforces a range of 1 to MAX_LIMIT (100) with a default of DEFAULT_LIMIT (20).
 * @type {z.ZodDefault<z.ZodNumber>}
 */
export const LimitSchema = z.number()
  .int("Limit must be an integer")
  .min(1, "Limit must be at least 1")
  .max(MAX_LIMIT, `Limit must not exceed ${MAX_LIMIT}`)
  .default(DEFAULT_LIMIT)
  .describe(`Maximum number of items to return (1-${MAX_LIMIT}, default: ${DEFAULT_LIMIT})`);

/**
 * Pagination offset schema.
 * @description Validates the number of items to skip for pagination.
 * Must be 0 or greater, defaults to 0.
 * @type {z.ZodDefault<z.ZodNumber>}
 */
export const OffsetSchema = z.number()
  .int("Offset must be an integer")
  .min(0, "Offset must be 0 or greater")
  .default(0)
  .describe("Number of items to skip for pagination (default: 0)");

/**
 * Agent ID validation schema.
 * @description Validates ElevenLabs agent identifiers. Must be non-empty
 * and contain only alphanumeric characters, hyphens, and underscores.
 * @type {z.ZodString}
 * @example
 * AgentIdSchema.parse("ag_abc123"); // Valid
 * AgentIdSchema.parse(""); // Throws validation error
 */
export const AgentIdSchema = z.string()
  .min(1, "Agent ID is required")
  .regex(/^[a-zA-Z0-9_-]+$/, "Agent ID must contain only alphanumeric characters, hyphens, and underscores")
  .describe("Unique identifier for the agent (e.g., 'ag_abc123')");

/**
 * Conversation ID validation schema.
 * @description Validates ElevenLabs conversation identifiers. Must be non-empty
 * and contain only alphanumeric characters, hyphens, and underscores.
 * @type {z.ZodString}
 */
export const ConversationIdSchema = z.string()
  .min(1, "Conversation ID is required")
  .regex(/^[a-zA-Z0-9_-]+$/, "Conversation ID must contain only alphanumeric characters, hyphens, and underscores")
  .describe("Unique identifier for the conversation (e.g., 'conv_xyz789')");

/**
 * Voice ID validation schema.
 * @description Validates ElevenLabs voice identifiers. Must be non-empty.
 * @type {z.ZodString}
 * @example
 * VoiceIdSchema.parse("21m00Tcm4TlvDq8ikWAM"); // Valid - Rachel voice
 */
export const VoiceIdSchema = z.string()
  .min(1, "Voice ID is required")
  .describe("ElevenLabs voice ID (e.g., '21m00Tcm4TlvDq8ikWAM' for Rachel)");

/**
 * URL validation schema.
 * @description Validates HTTP or HTTPS URLs.
 * @type {z.ZodString}
 */
export const URLSchema = z.string()
  .url("Must be a valid URL")
  .describe("A valid HTTP or HTTPS URL");

/**
 * Hex color code validation schema.
 * @description Validates CSS hex color codes in 6-character format.
 * @type {z.ZodString}
 * @example
 * ColorSchema.parse("#FF5733"); // Valid
 * ColorSchema.parse("#FFF"); // Invalid - must be 6 characters
 */
export const ColorSchema = z.string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (e.g., #FF5733)")
  .describe("Hex color code (e.g., '#FF5733')");

/**
 * Date range filter schema.
 * @description Optional schema for filtering by date range with ISO 8601 timestamps.
 * @type {z.ZodOptional<z.ZodObject>}
 */
export const DateRangeSchema = z.object({
  start: z.string().datetime().optional().describe("Start date in ISO 8601 format"),
  end: z.string().datetime().optional().describe("End date in ISO 8601 format")
}).optional().describe("Optional date range filter");
