/**
 * Common Zod validation schemas
 *
 * Shared schemas used across multiple tools for pagination,
 * formatting, and common parameters.
 */

import { z } from "zod";
import { DEFAULT_LIMIT, MAX_LIMIT } from "../constants.js";
import { ResponseFormat } from "../types.js";

/**
 * Response format schema (JSON or Markdown)
 */
export const ResponseFormatSchema = z.nativeEnum(ResponseFormat, {
  errorMap: () => ({ message: "Format must be 'json' or 'markdown'" })
}).default(ResponseFormat.MARKDOWN).describe(
  "Output format: 'markdown' for human-readable or 'json' for structured data"
);

/**
 * Pagination limit schema
 */
export const LimitSchema = z.number()
  .int("Limit must be an integer")
  .min(1, "Limit must be at least 1")
  .max(MAX_LIMIT, `Limit must not exceed ${MAX_LIMIT}`)
  .default(DEFAULT_LIMIT)
  .describe(`Maximum number of items to return (1-${MAX_LIMIT}, default: ${DEFAULT_LIMIT})`);

/**
 * Pagination offset schema
 */
export const OffsetSchema = z.number()
  .int("Offset must be an integer")
  .min(0, "Offset must be 0 or greater")
  .default(0)
  .describe("Number of items to skip for pagination (default: 0)");

/**
 * Agent ID schema
 */
export const AgentIdSchema = z.string()
  .min(1, "Agent ID is required")
  .regex(/^[a-zA-Z0-9_-]+$/, "Agent ID must contain only alphanumeric characters, hyphens, and underscores")
  .describe("Unique identifier for the agent (e.g., 'ag_abc123')");

/**
 * Conversation ID schema
 */
export const ConversationIdSchema = z.string()
  .min(1, "Conversation ID is required")
  .regex(/^[a-zA-Z0-9_-]+$/, "Conversation ID must contain only alphanumeric characters, hyphens, and underscores")
  .describe("Unique identifier for the conversation (e.g., 'conv_xyz789')");

/**
 * Voice ID schema
 */
export const VoiceIdSchema = z.string()
  .min(1, "Voice ID is required")
  .describe("ElevenLabs voice ID (e.g., '21m00Tcm4TlvDq8ikWAM' for Rachel)");

/**
 * URL schema
 */
export const URLSchema = z.string()
  .url("Must be a valid URL")
  .describe("A valid HTTP or HTTPS URL");

/**
 * Color hex schema
 */
export const ColorSchema = z.string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (e.g., #FF5733)")
  .describe("Hex color code (e.g., '#FF5733')");

/**
 * Date range schema
 */
export const DateRangeSchema = z.object({
  start: z.string().datetime().optional().describe("Start date in ISO 8601 format"),
  end: z.string().datetime().optional().describe("End date in ISO 8601 format")
}).optional().describe("Optional date range filter");
