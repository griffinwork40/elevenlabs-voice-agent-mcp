/**
 * @fileoverview Zod validation schemas for conversation operations
 * @description Provides strict input validation for retrieving and managing conversations.
 * These schemas define expected input for conversation listing and retrieval.
 * @module schemas/conversation-schemas
 */

import { z } from "zod";
import {
  AgentIdSchema,
  ConversationIdSchema,
  ResponseFormatSchema,
  LimitSchema,
  OffsetSchema,
  DateRangeSchema
} from "./common-schemas.js";

/**
 * Schema for retrieving a single conversation.
 * @description Validates input for the elevenlabs_get_conversation operation.
 * Returns full transcript and analysis data.
 * @type {z.ZodObject}
 */
export const GetConversationSchema = z.object({
  conversation_id: ConversationIdSchema,
  response_format: ResponseFormatSchema
}).passthrough();

/**
 * Schema for listing conversations with filtering.
 * @description Validates input for the elevenlabs_list_conversations operation.
 * Supports filtering by agent, status, and date range with pagination.
 * @type {z.ZodObject}
 */
export const ListConversationsSchema = z.object({
  agent_id: AgentIdSchema
    .optional()
    .describe("Optional: filter by agent ID"),

  status: z.enum(["in_progress", "completed", "failed"])
    .optional()
    .describe("Optional: filter by conversation status"),

  date_range: DateRangeSchema,

  limit: LimitSchema,

  offset: OffsetSchema,

  response_format: ResponseFormatSchema
}).passthrough();
