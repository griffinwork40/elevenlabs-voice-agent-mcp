/**
 * Constants for ElevenLabs Voice Agent MCP Server
 *
 * Contains API URLs, character limits, default values, and supported options
 * for ElevenLabs Voice Agent API integration.
 */

export const API_BASE_URL = "https://api.elevenlabs.io/v1";

// Response limits
export const CHARACTER_LIMIT = 25000;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// Default configuration values
export const DEFAULT_LLM = "gpt-4o-mini";
export const DEFAULT_VOICE_MODEL = "eleven_flash_v2_5";
export const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel voice
export const DEFAULT_LANGUAGE = "en";

// Supported LLM models
export const SUPPORTED_LLMS = [
  "gpt-4o",
  "gpt-4o-mini",
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-20241022",
  "gemini-2.0-flash-exp"
] as const;

// Supported voice models
export const SUPPORTED_VOICE_MODELS = [
  "eleven_turbo_v2_5",
  "eleven_flash_v2_5",
  "eleven_multilingual_v2"
] as const;

// Supported languages
export const SUPPORTED_LANGUAGES = [
  "en", "es", "fr", "de", "it", "pt", "pl", "nl", "ja", "zh", "ko", "ar", "hi"
] as const;

// Authentication types
export const AUTH_TYPES = ["none", "manual", "open"] as const;

// API timeouts
export const REQUEST_TIMEOUT = 30000; // 30 seconds

// Batch calling limits
export const MAX_BATCH_RECIPIENTS = 10000;
export const MIN_BATCH_RECIPIENTS = 1;

// Phone providers
export const PHONE_PROVIDERS = ["twilio", "sip_trunk"] as const;

// Phone number regions
export const REGION_IDS = ["us1", "ie1", "au1"] as const;

// Edge locations
export const EDGE_LOCATIONS = [
  "ashburn", "dublin", "frankfurt", "sao-paulo",
  "singapore", "sydney", "tokyo", "umatilla", "roaming"
] as const;
