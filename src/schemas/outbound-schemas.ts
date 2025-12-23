/**
 * @fileoverview Zod validation schemas for outbound calling operations
 * @description Provides strict input validation for making single outbound calls via Twilio.
 * Includes phone number validation, configuration overrides, and personalization data.
 * @module schemas/outbound-schemas
 */

import { z } from "zod";
import { ResponseFormatSchema, AgentIdSchema } from "./common-schemas.js";

/**
 * Phone number schema with E.164 format validation.
 * @description Validates phone numbers conform to E.164 international format.
 * @type {z.ZodString}
 * @example
 * PhoneNumberSchema.parse("+14155551234"); // Valid
 */
export const PhoneNumberSchema = z.string()
  .min(1, "Phone number is required")
  .regex(/^\+?[1-9]\d{1,14}$/, "Phone number must be in E.164 format (e.g., +1234567890)")
  .describe("Phone number in E.164 format (e.g., '+1234567890')");

/**
 * Phone number ID validation schema.
 * @description Validates ElevenLabs phone number identifiers.
 * @type {z.ZodString}
 */
export const PhoneNumberIdSchema = z.string()
  .min(1, "Phone number ID is required")
  .regex(/^[a-zA-Z0-9_-]+$/, "Phone number ID must contain only alphanumeric characters, hyphens, and underscores")
  .describe("Unique identifier for the phone number");

/**
 * Configuration overrides schema for per-call customization.
 * @description Allows overriding agent settings for a specific call.
 * Includes agent behavior, TTS, turn-taking, and conversation settings.
 * @type {z.ZodOptional<z.ZodObject>}
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
 * Conversation initiation data schema.
 * @description Validates dynamic variables and configuration overrides for personalization.
 * @type {z.ZodOptional<z.ZodRecord>}
 */
export const ConversationInitDataSchema = z.record(z.any())
  .optional()
  .describe("Dynamic variables and configuration overrides for personalization");

/**
 * Schema for starting a single outbound call.
 * @description Validates input for the elevenlabs_start_outbound_call operation.
 * Requires agent ID, phone number ID, and destination number.
 * @type {z.ZodObject}
 */
export const StartOutboundCallSchema = z.object({
  agent_id: AgentIdSchema,

  agent_phone_number_id: PhoneNumberIdSchema,

  to_number: PhoneNumberSchema
    .describe("Destination phone number to call"),

  conversation_initiation_client_data: z.record(z.any())
    .optional()
    .describe("Personalization data including dynamic_variables object (e.g., {dynamic_variables: {name: 'John', user_id: '123'}})"),

  response_format: ResponseFormatSchema
}).passthrough();
