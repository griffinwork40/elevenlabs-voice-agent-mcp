/**
 * Zod validation schemas for outbound calling operations
 *
 * Provides strict input validation for making single outbound calls via Twilio.
 */

import { z } from "zod";
import { ResponseFormatSchema, AgentIdSchema } from "./common-schemas.js";

/**
 * Phone number schema with E.164 format validation
 */
export const PhoneNumberSchema = z.string()
  .min(1, "Phone number is required")
  .regex(/^\+?[1-9]\d{1,14}$/, "Phone number must be in E.164 format (e.g., +1234567890)")
  .describe("Phone number in E.164 format (e.g., '+1234567890')");

/**
 * Phone number ID schema
 */
export const PhoneNumberIdSchema = z.string()
  .min(1, "Phone number ID is required")
  .regex(/^[a-zA-Z0-9_-]+$/, "Phone number ID must contain only alphanumeric characters, hyphens, and underscores")
  .describe("Unique identifier for the phone number");

/**
 * Config overrides schema for conversation customization
 */
export const ConfigOverridesSchema = z.object({
  agent: z.object({
    first_message: z.string().optional(),
    system_prompt: z.string().optional(),
    language: z.string().optional()
  }).optional(),
  tts: z.object({
    voice_id: z.string().optional(),
    model_id: z.string().optional()
  }).optional(),
  turn: z.object({
    mode: z.string().optional()
  }).optional(),
  conversation: z.object({
    max_duration_seconds: z.number().int().positive().optional()
  }).optional()
}).optional().describe("Configuration overrides for this specific call");

/**
 * Conversation initiation data schema
 */
export const ConversationInitDataSchema = z.record(z.any())
  .optional()
  .describe("Dynamic variables and configuration overrides for personalization");

/**
 * Schema for starting an outbound call
 */
export const StartOutboundCallSchema = z.object({
  agent_id: AgentIdSchema,

  agent_phone_number_id: PhoneNumberIdSchema,

  to_number: PhoneNumberSchema
    .describe("Destination phone number to call"),

  conversation_initiation_client_data: z.record(z.any())
    .optional()
    .describe("Dynamic variables for personalization (e.g., {name: 'John', user_id: '123'})"),

  response_format: ResponseFormatSchema
}).strict();
