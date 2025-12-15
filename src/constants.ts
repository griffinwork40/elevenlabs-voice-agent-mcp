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
export const DEFAULT_LLM = "claude-sonnet-4-5@20250929"; // Claude Sonnet 4.5 (using @ date format)
export const DEFAULT_VOICE_MODEL = "eleven_turbo_v2_5"; // Turbo v2.5 (multilingual, higher quality)
export const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel voice
export const DEFAULT_LANGUAGE = "en";

// Default ASR (Automatic Speech Recognition) configuration required by the API
export const DEFAULT_ASR_CONFIG = {
  provider: "elevenlabs",
  user_input_audio_format: "pcm_16000"
} as const;

// Default turn-taking configuration required by the API
export const DEFAULT_TURN_CONFIG = {
  turn_timeout: 10,
  silence_end_call_timeout: 15
} as const;

// Common LLM models (examples - any valid ElevenLabs model identifier is accepted)
// These are provided as defaults/examples; ElevenLabs may add new models that work without code changes
// Note: Use @ format for versioned models (e.g., claude-sonnet-4-5@20250929)
export const SUPPORTED_LLMS = [
  "gpt-4o",
  "gpt-4o-mini",
  "claude-sonnet-4-5",
  "claude-sonnet-4-5@20250929",
  "claude-sonnet-4",
  "claude-sonnet-4@20250514",
  "claude-haiku-4-5",
  "claude-haiku-4-5@20251001",
  "claude-3-5-sonnet",
  "claude-3-5-sonnet@20240620",
  "claude-3-5-sonnet-v2@20241022",
  "claude-3-haiku",
  "claude-3-haiku@20240307",
  "gemini-2.0-flash",
  "gemini-2.0-flash-exp"
] as const;

// Supported voice models for conversational AI agents
// v2 models (turbo_v2, flash_v2) are optimized for English only
// v2.5 models (turbo_v2_5, flash_v2_5) support 32 languages
// multilingual_v2 supports multiple languages
export const SUPPORTED_VOICE_MODELS = [
  "eleven_turbo_v2",
  "eleven_turbo_v2_5",
  "eleven_flash_v2",
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
