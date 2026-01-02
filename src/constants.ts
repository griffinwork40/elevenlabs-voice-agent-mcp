/**
 * @fileoverview Constants for ElevenLabs Voice Agent MCP Server
 * @description Contains API URLs, character limits, default values, and supported options
 * for ElevenLabs Voice Agent API integration. These constants define the operational
 * parameters and configuration options available throughout the MCP server.
 * @module constants
 */

/**
 * Base URL for all ElevenLabs API requests.
 * @description The root endpoint for the ElevenLabs REST API. All API calls
 * are made relative to this URL.
 * @constant {string}
 * @example
 * // Used internally by the API client
 * const url = `${API_BASE_URL}/convai/agents`;
 */
export const API_BASE_URL = "https://api.elevenlabs.io/v1";

// ============================================================================
// Response Limits
// ============================================================================

/**
 * Maximum character limit for MCP tool responses.
 * @description Responses exceeding this limit are automatically truncated
 * with pagination guidance to prevent overwhelming clients.
 * @constant {number}
 */
export const CHARACTER_LIMIT = 100000;

/**
 * Default number of items returned in paginated list responses.
 * @description Used when no limit is specified in list operations.
 * @constant {number}
 */
export const DEFAULT_LIMIT = 20;

/**
 * Maximum number of items that can be requested in a single paginated response.
 * @description Prevents excessive data transfer in single requests.
 * @constant {number}
 */
export const MAX_LIMIT = 100;

// ============================================================================
// Default Configuration Values
// ============================================================================

/**
 * Default LLM model for voice agents.
 * @description Claude Sonnet 4.5 with version date. The @ format specifies
 * the exact model version for consistent behavior.
 * @constant {string}
 */
export const DEFAULT_LLM = "claude-sonnet-4-5@20250929";

/**
 * Default voice synthesis model for agents.
 * @description Turbo v2.5 provides high-quality synthesis with support for
 * 32 languages. Balances speed and quality for conversational AI.
 * @constant {string}
 */
export const DEFAULT_VOICE_MODEL = "eleven_turbo_v2_5";

/**
 * Default voice ID for new agents.
 * @description Rachel voice - a natural, professional female voice suitable
 * for customer service and general conversation.
 * @constant {string}
 */
export const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

/**
 * Default language code for voice agents.
 * @description English (US) is the default language for agent conversations.
 * @constant {string}
 */
export const DEFAULT_LANGUAGE = "en";

// ============================================================================
// Supported Models and Options
// ============================================================================

/**
 * Array of commonly used LLM model identifiers.
 * @description These are provided as defaults/examples. ElevenLabs may add new
 * models that work without code changes. Any valid ElevenLabs model identifier
 * is accepted by the API. Use @ format for versioned models.
 * @constant {readonly string[]}
 * @example
 * // Using a supported LLM
 * const agent = await createAgent({
 *   llm: "claude-sonnet-4-5@20250929",
 *   // ... other config
 * });
 */
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

/**
 * Supported voice models for conversational AI agents.
 * @description Each model has different characteristics:
 * - `eleven_turbo_v2`: English only, optimized for speed
 * - `eleven_turbo_v2_5`: 32 languages, higher quality
 * - `eleven_flash_v2`: English only, lowest latency
 * - `eleven_flash_v2_5`: 32 languages, low latency
 * - `eleven_multilingual_v2`: Full multilingual support
 * @constant {readonly string[]}
 */
export const SUPPORTED_VOICE_MODELS = [
  "eleven_turbo_v2",
  "eleven_turbo_v2_5",
  "eleven_flash_v2",
  "eleven_flash_v2_5",
  "eleven_multilingual_v2"
] as const;

/**
 * Supported language codes for voice agents.
 * @description ISO 639-1 language codes supported by ElevenLabs voice agents.
 * The actual language support depends on the selected voice model.
 * @constant {readonly string[]}
 */
export const SUPPORTED_LANGUAGES = [
  "en", "es", "fr", "de", "it", "pt", "pl", "nl", "ja", "zh", "ko", "ar", "hi"
] as const;

/**
 * Widget authentication types.
 * @description Controls how users authenticate when using the web widget:
 * - `none`: No authentication required
 * - `manual`: Requires manual authentication
 * - `open`: Open access with optional authentication
 * @constant {readonly string[]}
 */
export const AUTH_TYPES = ["none", "manual", "open"] as const;

// ============================================================================
// API Configuration
// ============================================================================

/**
 * Request timeout in milliseconds.
 * @description Maximum time to wait for an API response before timing out.
 * Set to 30 seconds to accommodate voice agent operations.
 * @constant {number}
 */
export const REQUEST_TIMEOUT = 30000;

// ============================================================================
// Batch Calling Limits
// ============================================================================

/**
 * Maximum number of recipients in a single batch call job.
 * @description ElevenLabs limits batch calling to 10,000 recipients per job
 * to ensure system stability and processing capacity.
 * @constant {number}
 */
export const MAX_BATCH_RECIPIENTS = 10000;

/**
 * Minimum number of recipients required for a batch call job.
 * @description At least one recipient must be specified for batch calling.
 * @constant {number}
 */
export const MIN_BATCH_RECIPIENTS = 1;

// ============================================================================
// Phone Number Configuration
// ============================================================================

/**
 * Supported phone number providers.
 * @description Phone numbers can be provisioned through:
 * - `twilio`: Twilio-managed phone numbers
 * - `sip_trunk`: Self-managed SIP trunk connections
 * @constant {readonly string[]}
 */
export const PHONE_PROVIDERS = ["twilio", "sip_trunk"] as const;

/**
 * ElevenLabs region identifiers.
 * @description Geographic regions for phone number routing:
 * - `us1`: United States
 * - `ie1`: Ireland (Europe)
 * - `au1`: Australia
 * @constant {readonly string[]}
 */
export const REGION_IDS = ["us1", "ie1", "au1"] as const;

/**
 * Twilio edge locations for voice routing.
 * @description Geographic points of presence for Twilio voice traffic
 * optimization. Choose the location closest to your users for best latency.
 * @constant {readonly string[]}
 */
export const EDGE_LOCATIONS = [
  "ashburn", "dublin", "frankfurt", "sao-paulo",
  "singapore", "sydney", "tokyo", "umatilla", "roaming"
] as const;

// ============================================================================
// ASR (Automatic Speech Recognition) Configuration
// ============================================================================

/**
 * Supported ASR providers.
 * @description Speech recognition providers available for voice agents:
 * - `elevenlabs`: ElevenLabs' native transcription service
 * - `scribe_realtime`: Alternative real-time transcription provider
 * @constant {readonly string[]}
 */
export const ASR_PROVIDERS = ["elevenlabs", "scribe_realtime"] as const;

/**
 * Default ASR provider.
 * @description ElevenLabs' native transcription is the default.
 * @constant {string}
 */
export const DEFAULT_ASR_PROVIDER = "elevenlabs";

/**
 * Supported audio formats for ASR.
 * @description PCM formats at various sample rates and compressed formats:
 * - PCM formats: 8kHz, 16kHz, 22.05kHz, 24kHz, 44.1kHz, 48kHz
 * - Compressed: μ-law at 8kHz
 * @constant {readonly string[]}
 */
export const ASR_AUDIO_FORMATS = [
  "pcm_8000",
  "pcm_16000",
  "pcm_22050",
  "pcm_24000",
  "pcm_44100",
  "pcm_48000",
  "ulaw_8000"
] as const;

/**
 * Default audio format for ASR.
 * @description 16kHz PCM is a good balance of quality and bandwidth.
 * @constant {string}
 */
export const DEFAULT_ASR_AUDIO_FORMAT = "pcm_16000";

/**
 * Supported ASR quality levels.
 * @description Quality settings for speech recognition accuracy.
 * @constant {readonly string[]}
 */
export const ASR_QUALITY_LEVELS = ["low", "medium", "high"] as const;
