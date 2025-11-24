/**
 * Zod validation schemas for conversation operations
 *
 * Provides strict input validation for retrieving and managing conversations.
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
 * Schema for getting a single conversation
 */
export const GetConversationSchema = z.object({
  conversation_id: ConversationIdSchema,
  response_format: ResponseFormatSchema
}).strict();

/**
 * Schema for listing conversations
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
}).strict();
