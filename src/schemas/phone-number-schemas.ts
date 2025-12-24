/**
 * @fileoverview Zod validation schemas for phone number management operations
 * @description Provides strict input validation for listing, importing, updating,
 * and deleting phone numbers connected to voice agents. Supports Twilio and SIP trunk providers.
 * @module schemas/phone-number-schemas
 */

import { z } from "zod";
import { ResponseFormatSchema, AgentIdSchema } from "./common-schemas.js";
import { PhoneNumberSchema, PhoneNumberIdSchema } from "./outbound-schemas.js";

/**
 * Phone provider validation schema.
 * @description Validates the phone number provider type.
 * @type {z.ZodEnum}
 */
export const PhoneProviderSchema = z.enum(["twilio", "sip_trunk"], {
  errorMap: () => ({ message: "Provider must be 'twilio' or 'sip_trunk'" })
}).describe("Phone number provider");

/**
 * ElevenLabs region ID validation schema.
 * @description Validates geographic region identifiers.
 * @type {z.ZodEnum}
 */
export const RegionIdSchema = z.enum(["us1", "ie1", "au1"], {
  errorMap: () => ({ message: "Region must be 'us1', 'ie1', or 'au1'" })
}).describe("ElevenLabs region identifier");

/**
 * Twilio edge location validation schema.
 * @description Validates Twilio edge locations for voice routing optimization.
 * @type {z.ZodEnum}
 */
export const EdgeLocationSchema = z.enum([
  "ashburn", "dublin", "frankfurt", "sao-paulo",
  "singapore", "sydney", "tokyo", "umatilla", "roaming"
], {
  errorMap: () => ({ message: "Invalid edge location" })
}).describe("Twilio edge location");

/**
 * LiveKit stack configuration schema.
 * @description Validates LiveKit stack type for SIP trunk configurations.
 * @type {z.ZodEnum}
 */
export const LiveKitStackSchema = z.enum(["standard", "static"], {
  errorMap: () => ({ message: "LiveKit stack must be 'standard' or 'static'" })
}).describe("LiveKit stack configuration");

/**
 * Regional configuration schema for Twilio phone numbers.
 * @description Validates region-specific settings for Twilio integration.
 * @type {z.ZodObject}
 */
export const RegionConfigSchema = z.object({
  region_id: RegionIdSchema,
  token: z.string().min(1, "Region token is required"),
  edge_location: EdgeLocationSchema
}).describe("Regional configuration for Twilio phone numbers");

/**
 * Schema for listing phone numbers in a workspace.
 * @description Validates input for the elevenlabs_list_phone_numbers operation.
 * @type {z.ZodObject}
 */
export const ListPhoneNumbersSchema = z.object({
  response_format: ResponseFormatSchema
}).passthrough();

/**
 * Schema for getting a specific phone number's details.
 * @description Validates input for the elevenlabs_get_phone_number operation.
 * @type {z.ZodObject}
 */
export const GetPhoneNumberSchema = z.object({
  phone_number_id: PhoneNumberIdSchema,

  response_format: ResponseFormatSchema
}).passthrough();

/**
 * Schema for importing a Twilio phone number.
 * @description Validates input for the elevenlabs_import_phone_number operation.
 * Requires Twilio credentials and phone number details.
 * @type {z.ZodObject}
 */
export const ImportPhoneNumberSchema = z.object({
  phone_number: PhoneNumberSchema
    .describe("Phone number to import from Twilio"),

  label: z.string()
    .min(1, "Label is required")
    .max(100, "Label must not exceed 100 characters")
    .describe("Descriptive label for this phone number"),

  sid: z.string()
    .min(1, "Twilio Account SID is required")
    .describe("Twilio Account SID"),

  token: z.string()
    .min(1, "Twilio Auth Token is required")
    .describe("Twilio Auth Token"),

  provider: z.literal("twilio")
    .describe("Must be 'twilio' for Twilio phone numbers"),

  supports_inbound: z.boolean()
    .default(true)
    .describe("Enable inbound call handling"),

  supports_outbound: z.boolean()
    .default(true)
    .describe("Enable outbound call capability"),

  region_config: RegionConfigSchema
    .optional()
    .describe("Optional regional configuration for Twilio"),

  response_format: ResponseFormatSchema
}).passthrough();

/**
 * Schema for updating a phone number's configuration.
 * @description Validates input for the elevenlabs_update_phone_number operation.
 * Primarily used for assigning/unassigning agents.
 * @type {z.ZodObject}
 */
export const UpdatePhoneNumberSchema = z.object({
  phone_number_id: PhoneNumberIdSchema,

  agent_id: AgentIdSchema
    .optional()
    .nullable()
    .describe("Assign or unassign agent (null to unassign)"),

  inbound_trunk_config: z.record(z.any())
    .optional()
    .nullable()
    .describe("SIP trunk configuration for inbound calls"),

  outbound_trunk_config: z.record(z.any())
    .optional()
    .nullable()
    .describe("SIP trunk configuration for outbound calls"),

  livekit_stack: LiveKitStackSchema
    .optional()
    .nullable()
    .describe("LiveKit stack configuration"),

  response_format: ResponseFormatSchema
}).passthrough();

/**
 * Schema for deleting a phone number from the workspace.
 * @description Validates input for the elevenlabs_delete_phone_number operation.
 * This is a destructive operation that cannot be undone.
 * @type {z.ZodObject}
 */
export const DeletePhoneNumberSchema = z.object({
  phone_number_id: PhoneNumberIdSchema
}).passthrough();
