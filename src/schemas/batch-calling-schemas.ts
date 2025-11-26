/**
 * Zod validation schemas for batch calling operations
 *
 * Provides strict input validation for submitting batch call jobs,
 * listing batch calls, and retrieving batch call details.
 */

import { z } from "zod";
import { ResponseFormatSchema, AgentIdSchema, LimitSchema } from "./common-schemas.js";
import { PhoneNumberSchema, PhoneNumberIdSchema } from "./outbound-schemas.js";

/**
 * Batch ID schema
 */
export const BatchIdSchema = z.string()
  .min(1, "Batch ID is required")
  .regex(/^[a-zA-Z0-9_-]+$/, "Batch ID must contain only alphanumeric characters, hyphens, and underscores")
  .describe("Unique identifier for the batch call job");

/**
 * Recipient schema for batch calling
 */
export const OutboundCallRecipientSchema = z.object({
  id: z.string()
    .optional()
    .describe("Optional recipient identifier for tracking"),

  phone_number: PhoneNumberSchema
    .optional()
    .describe("Recipient phone number (required if whatsapp_user_id not provided)"),

  whatsapp_user_id: z.string()
    .optional()
    .describe("WhatsApp user ID (alternative to phone_number)"),

  conversation_initiation_client_data: z.record(z.any())
    .optional()
    .describe("Dynamic variables for this recipient (e.g., {name: 'John', account_id: '123'})")
}).refine(
  (data) => data.phone_number || data.whatsapp_user_id,
  {
    message: "Either phone_number or whatsapp_user_id must be provided"
  }
);

/**
 * Schema for submitting a batch call job
 */
export const SubmitBatchCallSchema = z.object({
  call_name: z.string()
    .min(1, "Call name is required")
    .max(200, "Call name must not exceed 200 characters")
    .describe("Descriptive name for this batch call job"),

  agent_id: AgentIdSchema,

  recipients: z.array(OutboundCallRecipientSchema)
    .min(1, "At least one recipient is required")
    .max(10000, "Maximum 10,000 recipients per batch")
    .describe("Array of recipients to call"),

  scheduled_time_unix: z.number()
    .int("Scheduled time must be a Unix timestamp")
    .positive("Scheduled time must be in the future")
    .optional()
    .describe("Optional Unix timestamp to schedule the batch for future execution"),

  agent_phone_number_id: PhoneNumberIdSchema
    .optional()
    .describe("Phone number to use as caller ID (optional)"),

  response_format: ResponseFormatSchema
}).passthrough();

/**
 * Schema for listing batch calls
 */
export const ListBatchCallsSchema = z.object({
  limit: LimitSchema,

  last_doc: z.string()
    .optional()
    .nullable()
    .describe("Pagination cursor from previous response"),

  response_format: ResponseFormatSchema
}).passthrough();

/**
 * Schema for getting batch call details
 */
export const GetBatchCallSchema = z.object({
  batch_id: BatchIdSchema,

  response_format: ResponseFormatSchema
}).passthrough();
