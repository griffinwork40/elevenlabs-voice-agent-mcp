/**
 * Zod validation schemas for phone number management operations
 *
 * Provides strict input validation for listing, importing, updating,
 * and deleting phone numbers connected to voice agents.
 */

import { z } from "zod";
import { ResponseFormatSchema, AgentIdSchema } from "./common-schemas.js";
import { PhoneNumberSchema, PhoneNumberIdSchema } from "./outbound-schemas.js";

/**
 * Phone provider enum
 */
export const PhoneProviderSchema = z.enum(["twilio", "sip_trunk"], {
  errorMap: () => ({ message: "Provider must be 'twilio' or 'sip_trunk'" })
}).describe("Phone number provider");

/**
 * Region ID schema
 */
export const RegionIdSchema = z.enum(["us1", "ie1", "au1"], {
  errorMap: () => ({ message: "Region must be 'us1', 'ie1', or 'au1'" })
}).describe("ElevenLabs region identifier");

/**
 * Edge location schema
 */
export const EdgeLocationSchema = z.enum([
  "ashburn", "dublin", "frankfurt", "sao-paulo",
  "singapore", "sydney", "tokyo", "umatilla", "roaming"
], {
  errorMap: () => ({ message: "Invalid edge location" })
}).describe("Twilio edge location");

/**
 * LiveKit stack schema
 */
export const LiveKitStackSchema = z.enum(["standard", "static"], {
  errorMap: () => ({ message: "LiveKit stack must be 'standard' or 'static'" })
}).describe("LiveKit stack configuration");

/**
 * Region config schema for Twilio
 */
export const RegionConfigSchema = z.object({
  region_id: RegionIdSchema,
  token: z.string().min(1, "Region token is required"),
  edge_location: EdgeLocationSchema
}).describe("Regional configuration for Twilio phone numbers");

/**
 * Schema for listing phone numbers
 */
export const ListPhoneNumbersSchema = z.object({
  response_format: ResponseFormatSchema
}).strict();

/**
 * Schema for getting a phone number
 */
export const GetPhoneNumberSchema = z.object({
  phone_number_id: PhoneNumberIdSchema,

  response_format: ResponseFormatSchema
}).strict();

/**
 * Schema for importing a Twilio phone number
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
}).strict();

/**
 * Schema for updating a phone number
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
}).strict();

/**
 * Schema for deleting a phone number
 */
export const DeletePhoneNumberSchema = z.object({
  phone_number_id: PhoneNumberIdSchema
}).strict();
