/**
 * Zod validation schemas for agent-related operations
 *
 * Provides strict input validation for creating, updating, and managing agents.
 */

import { z } from "zod";
import {
  SUPPORTED_LLMS,
  SUPPORTED_VOICE_MODELS,
  SUPPORTED_LANGUAGES,
  DEFAULT_LLM,
  DEFAULT_VOICE_MODEL,
  DEFAULT_VOICE_ID,
  DEFAULT_LANGUAGE
} from "../constants.js";
import {
  ResponseFormatSchema,
  LimitSchema,
  OffsetSchema,
  AgentIdSchema,
  VoiceIdSchema,
  ColorSchema,
  URLSchema
} from "./common-schemas.js";

/**
 * Schema for creating a new agent
 */
export const CreateAgentSchema = z.object({
  name: z.string()
    .min(1, "Agent name is required")
    .max(100, "Name must not exceed 100 characters")
    .describe("Display name for the agent (e.g., 'Customer Support Bot')"),

  prompt: z.string()
    .min(10, "Prompt must be at least 10 characters")
    .max(5000, "Prompt must not exceed 5000 characters")
    .describe("System prompt defining agent behavior and personality"),

  llm: z.string()
    .min(1, "LLM model name is required")
    .default(DEFAULT_LLM)
    .describe(`LLM model identifier (default: ${DEFAULT_LLM}). Common options: ${SUPPORTED_LLMS.join(", ")}. Any valid ElevenLabs model identifier is accepted.`),

  voice_id: VoiceIdSchema
    .default(DEFAULT_VOICE_ID)
    .describe(`ElevenLabs voice ID (default: ${DEFAULT_VOICE_ID} - Rachel)`),

  voice_model: z.enum(SUPPORTED_VOICE_MODELS, {
    errorMap: () => ({ message: `Voice model must be one of: ${SUPPORTED_VOICE_MODELS.join(", ")}` })
  })
    .default(DEFAULT_VOICE_MODEL)
    .describe(`Voice model to use (default: ${DEFAULT_VOICE_MODEL})`),

  first_message: z.string()
    .max(500, "First message must not exceed 500 characters")
    .optional()
    .describe("Optional greeting message the agent will say first"),

  language: z.enum(SUPPORTED_LANGUAGES, {
    errorMap: () => ({ message: `Language must be one of: ${SUPPORTED_LANGUAGES.join(", ")}` })
  })
    .default(DEFAULT_LANGUAGE)
    .describe(`Primary language code (default: ${DEFAULT_LANGUAGE})`),

  temperature: z.number()
    .min(0, "Temperature must be between 0 and 2")
    .max(2, "Temperature must be between 0 and 2")
    .optional()
    .describe("LLM temperature for response randomness (0-2, higher = more creative)"),

  max_tokens: z.number()
    .int("Max tokens must be an integer")
    .min(1, "Max tokens must be at least 1")
    .max(4096, "Max tokens must not exceed 4096")
    .optional()
    .describe("Maximum tokens for LLM responses"),

  stability: z.number()
    .min(0, "Stability must be between 0 and 1")
    .max(1, "Stability must be between 0 and 1")
    .optional()
    .describe("Voice stability (0-1, higher = more consistent)"),

  similarity_boost: z.number()
    .min(0, "Similarity boost must be between 0 and 1")
    .max(1, "Similarity boost must be between 0 and 1")
    .optional()
    .describe("Voice similarity boost (0-1, higher = closer to original voice)"),

  speed: z.number()
    .min(0.5, "Speed must be between 0.5 and 2.0")
    .max(2.0, "Speed must be between 0.5 and 2.0")
    .optional()
    .describe("Speech rate (0.5-2.0, default 1.0)"),

  turn_eagerness: z.enum(['patient', 'normal', 'eager'])
    .optional()
    .describe("How quickly agent responds to user (default: normal)"),

  turn_timeout: z.number()
    .min(1, "Turn timeout must be between 1 and 30")
    .max(30, "Turn timeout must be between 1 and 30")
    .optional()
    .describe("Seconds to wait for user response (1-30, default: 10)"),

  silence_end_call_timeout: z.number()
    .min(1, "Silence timeout must be between 1 and 600")
    .max(600, "Silence timeout must be between 1 and 600")
    .optional()
    .describe("Seconds of silence before ending call (1-600, default: 15)"),

  widget_color: ColorSchema.optional().describe("Widget theme color"),

  widget_avatar_url: URLSchema.optional().describe("Widget avatar image URL"),

  response_format: ResponseFormatSchema
}).passthrough();

/**
 * Schema for getting an agent by ID
 */
export const GetAgentSchema = z.object({
  agent_id: AgentIdSchema,
  response_format: ResponseFormatSchema
}).passthrough();

/**
 * Schema for updating an agent
 */
export const UpdateAgentSchema = z.object({
  agent_id: AgentIdSchema,

  name: z.string()
    .min(1, "Agent name cannot be empty")
    .max(100, "Name must not exceed 100 characters")
    .optional()
    .describe("New display name for the agent"),

  prompt: z.string()
    .min(10, "Prompt must be at least 10 characters")
    .max(5000, "Prompt must not exceed 5000 characters")
    .optional()
    .describe("Updated system prompt"),

  llm: z.string()
    .min(1, "LLM model name cannot be empty")
    .optional()
    .describe(`Updated LLM model identifier. Common options: ${SUPPORTED_LLMS.join(", ")}. Any valid ElevenLabs model identifier is accepted.`),

  voice_id: VoiceIdSchema
    .optional()
    .describe("Updated voice ID"),

  voice_model: z.enum(SUPPORTED_VOICE_MODELS)
    .optional()
    .describe("Updated voice model"),

  first_message: z.string()
    .max(500, "First message must not exceed 500 characters")
    .optional()
    .describe("Updated first message"),

  language: z.enum(SUPPORTED_LANGUAGES)
    .optional()
    .describe("Updated language"),

  temperature: z.number()
    .min(0)
    .max(2)
    .optional()
    .describe("Updated temperature"),

  max_tokens: z.number()
    .int("Max tokens must be an integer")
    .min(1, "Max tokens must be at least 1")
    .max(4096, "Max tokens must not exceed 4096")
    .optional()
    .describe("Updated max tokens"),

  stability: z.number()
    .min(0, "Stability must be between 0 and 1")
    .max(1, "Stability must be between 0 and 1")
    .optional()
    .describe("Updated voice stability"),

  similarity_boost: z.number()
    .min(0, "Similarity boost must be between 0 and 1")
    .max(1, "Similarity boost must be between 0 and 1")
    .optional()
    .describe("Updated similarity boost"),

  speed: z.number()
    .min(0.5, "Speed must be between 0.5 and 2.0")
    .max(2.0, "Speed must be between 0.5 and 2.0")
    .optional()
    .describe("Speech rate (0.5-2.0, default 1.0)"),

  turn_eagerness: z.enum(['patient', 'normal', 'eager'])
    .optional()
    .describe("How quickly agent responds to user"),

  turn_timeout: z.number()
    .min(1, "Turn timeout must be between 1 and 30")
    .max(30, "Turn timeout must be between 1 and 30")
    .optional()
    .describe("Seconds to wait for user response (1-30)"),

  silence_end_call_timeout: z.number()
    .min(1, "Silence timeout must be between 1 and 600")
    .max(600, "Silence timeout must be between 1 and 600")
    .optional()
    .describe("Seconds of silence before ending call (1-600)"),

  widget_color: ColorSchema.optional().describe("Updated widget color"),

  widget_avatar_url: URLSchema.optional().describe("Updated widget avatar URL"),

  response_format: ResponseFormatSchema
}).passthrough();

/**
 * Schema for deleting an agent
 */
export const DeleteAgentSchema = z.object({
  agent_id: AgentIdSchema
}).passthrough();

/**
 * Schema for listing agents
 */
export const ListAgentsSchema = z.object({
  limit: LimitSchema,
  offset: OffsetSchema,
  response_format: ResponseFormatSchema
}).passthrough();
