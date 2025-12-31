/**
 * @fileoverview TypeScript type definitions for ElevenLabs Voice Agent API
 * @description Defines interfaces for agents, conversations, tools, and API responses.
 * These types provide type safety and documentation for all API interactions.
 * @module types
 */

import { SUPPORTED_LLMS, SUPPORTED_VOICE_MODELS, SUPPORTED_LANGUAGES, AUTH_TYPES } from "./constants.js";

// ============================================================================
// Enums
// ============================================================================

/**
 * Output format options for MCP tool responses.
 * @description Controls how tool responses are formatted:
 * - `MARKDOWN`: Human-readable formatted output with headers and lists
 * - `JSON`: Structured data suitable for programmatic consumption
 * @enum {string}
 */
export enum ResponseFormat {
  /** Human-readable Markdown format */
  MARKDOWN = "markdown",
  /** Structured JSON format */
  JSON = "json"
}

// ============================================================================
// Type Aliases
// ============================================================================

/**
 * LLM model identifier type.
 * @description Accepts any string to accommodate new models that ElevenLabs
 * may add without requiring code updates. Common values include Claude and GPT models.
 * @typedef {string} LLMModel
 * @example "claude-sonnet-4-5@20250929"
 * @example "gpt-4o-mini"
 */
export type LLMModel = string;

/**
 * Voice synthesis model type.
 * @description One of the supported ElevenLabs voice models for TTS.
 * @typedef {string} VoiceModel
 */
export type VoiceModel = typeof SUPPORTED_VOICE_MODELS[number];

/**
 * Supported language code type.
 * @description ISO 639-1 language codes supported by the platform.
 * @typedef {string} Language
 */
export type Language = typeof SUPPORTED_LANGUAGES[number];

/**
 * Widget authentication type.
 * @description Controls authentication behavior for embedded widgets.
 * @typedef {string} AuthType
 */
export type AuthType = typeof AUTH_TYPES[number];

// ============================================================================
// Agent Configuration Types
// ============================================================================

/**
 * Agent prompt and LLM configuration.
 * @description Defines the system prompt and language model settings for an agent's
 * conversational behavior.
 * @interface AgentPromptConfig
 */
export interface AgentPromptConfig {
  /**
   * System prompt defining the agent's behavior and personality.
   * @description This prompt sets the context for all agent responses.
   */
  prompt: string;

  /**
   * The LLM model identifier to use for generating responses.
   * @example "claude-sonnet-4-5@20250929"
   */
  llm: LLMModel;

  /**
   * LLM temperature for response randomness.
   * @description Range 0-2. Higher values produce more creative/random responses.
   */
  temperature?: number;

  /**
   * Maximum tokens for LLM responses.
   * @description Limits the length of generated responses (1-4096).
   */
  max_tokens?: number;

  /**
   * Webhook tools the agent can invoke during conversations.
   */
  tools?: ToolConfig[];

  /**
   * Knowledge base document references.
   * @description IDs of documents added to the agent's knowledge base.
   */
  knowledge_base?: string[];
}

/**
 * Text-to-speech configuration.
 * @description Controls voice synthesis settings for agent responses.
 * @interface TTSConfig
 */
export interface TTSConfig {
  /**
   * ElevenLabs voice ID for speech synthesis.
   * @example "21m00Tcm4TlvDq8ikWAM"
   */
  voice_id: string;

  /**
   * Voice model to use for synthesis.
   * @example "eleven_turbo_v2_5"
   */
  model_id: VoiceModel;

  /**
   * Latency optimization level for streaming.
   * @description Higher values reduce latency but may affect quality.
   */
  optimize_streaming_latency?: number;

  /**
   * Voice stability setting.
   * @description Range 0-1. Higher values produce more consistent voice output.
   */
  stability?: number;

  /**
   * Voice similarity boost.
   * @description Range 0-1. Higher values make output closer to the original voice.
   */
  similarity_boost?: number;

  /**
   * Speech rate multiplier.
   * @description Range 0.5-2.0. Default is 1.0 (normal speed).
   */
  speed?: number;
}

/**
 * Turn-taking configuration for voice agent conversations.
 * @description Controls how the agent manages conversational flow and timing.
 * @interface TurnConfig
 */
export interface TurnConfig {
  /**
   * Controls how quickly the agent interrupts or waits for user pauses.
   * @description
   * - `patient`: Waits longer before responding
   * - `normal`: Balanced turn-taking
   * - `eager`: Responds quickly to user pauses
   */
  turn_eagerness?: 'patient' | 'normal' | 'eager';

  /**
   * Maximum seconds to wait for user to continue speaking before agent responds.
   * @description Range 1-30 seconds. Default is 10 seconds.
   */
  turn_timeout?: number;

  /**
   * Seconds of complete silence before automatically ending the call.
   * @description Range 1-600 seconds. Default is 15 seconds.
   */
  silence_end_call_timeout?: number;
}

/**
 * Automatic speech recognition configuration.
 * @description Controls how the agent processes user audio input.
 * @interface ASRConfig
 */
export interface ASRConfig {
  /**
   * ASR provider for speech recognition.
   * @description The transcription service to use:
   * - `elevenlabs`: ElevenLabs' native transcription (default)
   * - `scribe_realtime`: Alternative real-time transcription
   */
  provider?: "elevenlabs" | "scribe_realtime";

  /**
   * Recognition quality level.
   * @description Higher quality may increase latency.
   */
  quality?: "low" | "medium" | "high";

  /**
   * Audio format for user input.
   * @description PCM and compressed formats at various sample rates.
   */
  user_input_audio_format?: "pcm_8000" | "pcm_16000" | "pcm_22050" | "pcm_24000" | "pcm_44100" | "pcm_48000" | "ulaw_8000";

  /**
   * Keywords to boost recognition probability.
   * @description Array of domain-specific terms to improve recognition accuracy.
   * Useful for specialized vocabulary like product names, technical terms, etc.
   */
  keywords?: string[];
}

/**
 * Complete conversation configuration for an agent.
 * @description Combines all settings that control how an agent conducts conversations.
 * @interface ConversationConfig
 */
export interface ConversationConfig {
  /**
   * Agent behavior and prompt configuration.
   */
  agent: {
    /** LLM and prompt settings */
    prompt: AgentPromptConfig;
    /** Optional greeting message spoken first */
    first_message?: string;
    /** Primary language for the conversation */
    language: Language;
  };

  /** Text-to-speech configuration */
  tts: TTSConfig;

  /** Automatic speech recognition configuration */
  asr?: ASRConfig;

  /** Turn-taking behavior configuration */
  turn?: TurnConfig;
}

/**
 * Platform-specific settings for the agent.
 * @description Configures widget appearance and authentication behavior.
 * @interface PlatformSettings
 */
export interface PlatformSettings {
  /**
   * Widget appearance settings.
   */
  widget?: {
    /** Widget theme color in hex format (e.g., "#FF5733") */
    color?: string;
    /** URL to avatar image for the widget */
    avatar_url?: string;
  };

  /**
   * Authentication settings.
   */
  auth?: {
    /** Authentication type for widget access */
    type: AuthType;
    /** Whether open authentication is allowed */
    open_auth_allowed?: boolean;
  };
}

/**
 * Complete voice agent entity.
 * @description Represents a fully configured ElevenLabs Voice Agent with all its settings.
 * @interface Agent
 * @example
 * const agent: Agent = {
 *   agent_id: "ag_abc123",
 *   name: "Customer Support Bot",
 *   conversation_config: { ... },
 *   created_at: "2025-01-01T00:00:00Z"
 * };
 */
export interface Agent {
  /** Unique agent identifier (e.g., "ag_abc123") */
  agent_id: string;

  /** Display name for the agent */
  name: string;

  /** Complete conversation configuration */
  conversation_config: ConversationConfig;

  /** Platform-specific settings */
  platform_settings?: PlatformSettings;

  /** ISO 8601 timestamp when the agent was created */
  created_at: string;

  /** ISO 8601 timestamp when the agent was last updated */
  updated_at?: string;
}

// ============================================================================
// Tool Configuration Types
// ============================================================================

/**
 * Parameter definition for webhook tools.
 * @description Defines a single parameter that a webhook tool accepts.
 * @interface ToolParameter
 */
export interface ToolParameter {
  /** Parameter name (used as the key in the request) */
  name: string;

  /** Data type of the parameter */
  type: "string" | "number" | "boolean" | "object" | "array";

  /** Human-readable description of what this parameter does */
  description: string;

  /** Whether this parameter must be provided */
  required: boolean;

  /** Optional array of allowed values (for enumerated types) */
  enum?: string[];
}

/**
 * Webhook tool configuration.
 * @description Defines an external tool that the agent can invoke during conversations.
 * @interface ToolConfig
 * @example
 * const tool: ToolConfig = {
 *   name: "check_order_status",
 *   description: "Look up order status by order ID",
 *   type: "webhook",
 *   url: "https://api.example.com/orders/status",
 *   method: "POST",
 *   parameters: [{ name: "order_id", type: "string", required: true, description: "Order ID" }]
 * };
 */
export interface ToolConfig {
  /** Unique tool name (alphanumeric, hyphens, underscores) */
  name: string;

  /** Clear description of what the tool does */
  description: string;

  /** Tool type - webhook for external HTTP calls, client for browser-side */
  type: "webhook" | "client";

  /** Webhook URL to call when tool is invoked */
  url?: string;

  /** HTTP method for the webhook request */
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

  /** Custom headers to include in webhook requests */
  headers?: Record<string, string>;

  /** Array of parameters the tool accepts */
  parameters: ToolParameter[];
}

// ============================================================================
// Conversation Types
// ============================================================================

/**
 * Conversation metadata and content.
 * @description Contains all information about a voice agent conversation including
 * transcript, timing, and analysis data.
 * @interface ConversationMetadata
 */
export interface ConversationMetadata {
  /** Unique conversation identifier (e.g., "conv_xyz789") */
  conversation_id: string;

  /** ID of the agent that handled this conversation */
  agent_id: string;

  /** Current status of the conversation */
  status: "in_progress" | "completed" | "failed";

  /** ISO 8601 timestamp when the conversation started */
  started_at: string;

  /** ISO 8601 timestamp when the conversation ended */
  ended_at?: string;

  /** Total duration of the conversation in seconds */
  duration_seconds?: number;

  /** Complete conversation transcript */
  transcript?: TranscriptEntry[];

  /** AI-generated analysis of the conversation */
  analysis?: ConversationAnalysis;
}

/**
 * Single entry in a conversation transcript.
 * @description Represents one message in the conversation flow.
 * @interface TranscriptEntry
 */
export interface TranscriptEntry {
  /** Who sent this message */
  role: "agent" | "user";

  /** The message content */
  message: string;

  /** ISO 8601 timestamp of the message */
  timestamp: string;

  /** Tool invocations made during this turn */
  tool_calls?: ToolCall[];
}

/**
 * Record of a tool invocation during conversation.
 * @description Captures details of when an agent invoked a webhook tool.
 * @interface ToolCall
 */
export interface ToolCall {
  /** Name of the tool that was called */
  tool_name: string;

  /** Parameters passed to the tool */
  parameters: Record<string, unknown>;

  /** Result returned by the tool */
  result?: unknown;

  /** Error message if the tool call failed */
  error?: string;
}

/**
 * AI-generated conversation analysis.
 * @description Provides insights about the conversation quality and content.
 * @interface ConversationAnalysis
 */
export interface ConversationAnalysis {
  /** Detected sentiment of the user during the conversation */
  user_sentiment?: "positive" | "neutral" | "negative";

  /** Performance score for the agent (0-10) */
  agent_performance?: number;

  /** Key topics discussed in the conversation */
  key_topics?: string[];
}

// ============================================================================
// Voice Types
// ============================================================================

/**
 * ElevenLabs voice entity.
 * @description Represents an available voice for text-to-speech synthesis.
 * @interface Voice
 */
export interface Voice {
  /** Unique voice identifier */
  voice_id: string;

  /** Display name of the voice */
  name: string;

  /** Voice category (e.g., "premade", "cloned") */
  category?: string;

  /** Human-readable description of the voice */
  description?: string;

  /** URL to audio preview of the voice */
  preview_url?: string;

  /** Descriptive labels for the voice */
  labels?: {
    /** Voice accent (e.g., "british", "american") */
    accent?: string;
    /** Additional description */
    description?: string;
    /** Age category (e.g., "young", "middle_aged", "old") */
    age?: string;
    /** Gender (e.g., "male", "female") */
    gender?: string;
    /** Suggested use case (e.g., "narration", "conversational") */
    use_case?: string;
  };
}

// ============================================================================
// Pagination Types
// ============================================================================

/**
 * Generic paginated response wrapper.
 * @description Standard pagination structure used across all list endpoints.
 * @interface PaginatedResponse
 * @template T The type of items in the response
 * @example
 * const response: PaginatedResponse<Agent> = {
 *   total: 50,
 *   count: 20,
 *   offset: 0,
 *   items: [...],
 *   has_more: true,
 *   next_offset: 20
 * };
 */
export interface PaginatedResponse<T> {
  /** Total number of items available */
  total: number;

  /** Number of items in this response */
  count: number;

  /** Starting offset for this page */
  offset: number;

  /** Array of items */
  items: T[];

  /** Whether more items exist beyond this page */
  has_more: boolean;

  /** Offset value for fetching the next page */
  next_offset?: number;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Generic API response wrapper.
 * @description Standard response structure for API operations.
 * @interface APIResponse
 * @template T The type of data in the response
 */
export interface APIResponse<T> {
  /** Whether the operation succeeded */
  success: boolean;

  /** Response data (present on success) */
  data?: T;

  /** Error message (present on failure) */
  error?: string;
}

// ============================================================================
// Knowledge Base Types
// ============================================================================

/**
 * Knowledge base document for agent training.
 * @description Represents a document that can be added to an agent's knowledge base.
 * @interface KnowledgeBaseDocument
 */
export interface KnowledgeBaseDocument {
  /** Type of document content */
  type: "text" | "url" | "file";

  /** Document content or URL to fetch */
  content: string;

  /** Optional metadata about the document */
  metadata?: Record<string, string>;
}

// ============================================================================
// Widget Types
// ============================================================================

/**
 * Widget embed configuration.
 * @description Settings for generating embeddable voice agent widgets.
 * @interface WidgetConfig
 */
export interface WidgetConfig {
  /** Agent ID to embed */
  agent_id: string;

  /** Widget theme color (hex format) */
  color?: string;

  /** Avatar image URL */
  avatar_url?: string;
}

// ============================================================================
// Outbound Calling Types
// ============================================================================

/**
 * Request parameters for initiating a single outbound call.
 * @description Contains all information needed to place an outbound call via Twilio.
 * @interface OutboundCallRequest
 */
export interface OutboundCallRequest {
  /** Agent ID to use for the call */
  agent_id: string;

  /** Phone number ID to use as caller ID */
  agent_phone_number_id: string;

  /** Destination phone number in E.164 format */
  to_number: string;

  /**
   * Conversation initiation data for personalization.
   * @description Allows passing dynamic variables and configuration overrides
   * to customize the call for each recipient.
   * @example
   * {
   *   dynamic_variables: {
   *     customer_name: "John Smith",
   *     account_id: "12345"
   *   },
   *   conversation_config_override: {
   *     agent: {
   *       first_message: "Custom greeting"
   *     }
   *   }
   * }
   */
  conversation_initiation_client_data?: Record<string, unknown> | null;
}

/**
 * Response from initiating an outbound call.
 * @description Contains the result of a call initiation attempt.
 * @interface OutboundCallResponse
 */
export interface OutboundCallResponse {
  /** Whether the call was successfully initiated */
  success: boolean;

  /** Human-readable status message */
  message: string;

  /** Conversation ID for tracking (null if initiation failed) */
  conversation_id: string | null;

  /** Twilio call SID (null if initiation failed) */
  callSid: string | null;
}

// ============================================================================
// Batch Calling Types
// ============================================================================

/**
 * Status values for batch calling jobs.
 * @typedef {string} BatchStatus
 */
export type BatchStatus = "pending" | "in_progress" | "completed" | "failed" | "cancelled";

/**
 * Status values for individual recipients in a batch.
 * @description Extends BatchStatus with additional recipient-specific states.
 * @typedef {string} RecipientStatus
 */
export type RecipientStatus = BatchStatus | "initiated" | "voicemail";

/**
 * Phone number provider type.
 * @typedef {string} PhoneProvider
 */
export type PhoneProvider = "twilio" | "sip_trunk";

/**
 * Single recipient in a batch calling job.
 * @description Defines one recipient to call with optional personalization data.
 * @interface OutboundCallRecipient
 */
export interface OutboundCallRecipient {
  /** Optional custom tracking ID for this recipient */
  id?: string;

  /** Phone number in E.164 format (required if whatsapp_user_id not provided) */
  phone_number?: string;

  /** WhatsApp user ID (alternative to phone_number) */
  whatsapp_user_id?: string;

  /**
   * Conversation initiation data for personalization.
   * @description Allows passing dynamic variables specific to this recipient.
   * @example
   * {
   *   dynamic_variables: {
   *     name: "Alice Johnson",
   *     account_id: "A123"
   *   }
   * }
   */
  conversation_initiation_client_data?: Record<string, unknown>;
}

/**
 * Request parameters for submitting a batch calling job.
 * @description Contains all configuration for a batch of outbound calls.
 * @interface BatchCallRequest
 */
export interface BatchCallRequest {
  /** Descriptive name for this batch job */
  call_name: string;

  /** Agent ID to use for all calls */
  agent_id: string;

  /** Array of recipients to call (1-10,000) */
  recipients: OutboundCallRecipient[];

  /** Optional Unix timestamp to schedule batch for future execution */
  scheduled_time_unix?: number | null;

  /** Optional phone number ID to use as caller ID */
  agent_phone_number_id?: string | null;
}

/**
 * Response from submitting a batch calling job.
 * @description Contains batch job metadata and status information.
 * @interface BatchCallResponse
 */
export interface BatchCallResponse {
  /** Unique batch job identifier */
  id: string;

  /** Batch job name */
  name: string;

  /** Agent ID used for the batch */
  agent_id: string;

  /** Display name of the agent */
  agent_name: string;

  /** Current batch status */
  status: BatchStatus;

  /** Unix timestamp when batch was created */
  created_at_unix: number;

  /** Unix timestamp when batch is scheduled to run */
  scheduled_time_unix: number;

  /** Unix timestamp of last status update */
  last_updated_at_unix: number;

  /** Number of calls already dispatched */
  total_calls_dispatched: number;

  /** Total number of calls scheduled */
  total_calls_scheduled: number;

  /** Phone number ID used for calling */
  phone_number_id: string | null;

  /** Phone provider used */
  phone_provider: PhoneProvider | null;
}

/**
 * Individual recipient status within a batch.
 * @description Tracks the call status for each recipient in a batch job.
 * @interface BatchCallRecipient
 */
export interface BatchCallRecipient {
  /** Recipient tracking ID */
  id: string;

  /** Recipient phone number */
  phone_number?: string;

  /** Recipient WhatsApp user ID */
  whatsapp_user_id?: string;

  /** Current call status for this recipient */
  status: RecipientStatus;

  /** Conversation ID for this call (for transcript lookup) */
  conversation_id: string;

  /** Unix timestamp when recipient was added */
  created_at_unix: number;

  /** Unix timestamp of last status update */
  updated_at_unix: number;

  /**
   * Conversation initiation data used for this recipient.
   * @example
   * {
   *   dynamic_variables: {
   *     name: "Bob Wilson",
   *     appointment_time: "3pm"
   *   }
   * }
   */
  conversation_initiation_client_data?: Record<string, unknown>;
}

/**
 * Detailed batch call response including all recipients.
 * @description Extends BatchCallResponse with the full list of recipient statuses.
 * @interface BatchCallDetailedResponse
 */
export interface BatchCallDetailedResponse extends BatchCallResponse {
  /** Array of all recipients with their current statuses */
  recipients: BatchCallRecipient[];
}

/**
 * Response from listing workspace batch calls.
 * @description Paginated list of batch calling jobs.
 * @interface WorkspaceBatchCallsResponse
 */
export interface WorkspaceBatchCallsResponse {
  /** Array of batch call summaries */
  batch_calls: BatchCallResponse[];

  /** Cursor for fetching the next page (null if no more pages) */
  next_doc: string | null;

  /** Whether more batch calls exist beyond this page */
  has_more: boolean;
}

// ============================================================================
// Phone Number Management Types
// ============================================================================

/**
 * Twilio-provisioned phone number.
 * @description Represents a phone number imported from Twilio.
 * @interface TwilioPhoneNumber
 */
export interface TwilioPhoneNumber {
  /** The actual phone number in E.164 format */
  phone_number: string;

  /** Human-readable label for the phone number */
  label: string;

  /** Unique identifier for API operations */
  phone_number_id: string;

  /** Whether this number can receive inbound calls */
  supports_inbound: boolean;

  /** Whether this number can make outbound calls */
  supports_outbound: boolean;

  /** Provider type - always "twilio" for this interface */
  provider: "twilio";

  /** Currently assigned agent (null if unassigned) */
  assigned_agent: {
    agent_id: string;
    agent_name: string;
  } | null;
}

/**
 * SIP trunk-provisioned phone number.
 * @description Represents a phone number connected via SIP trunk.
 * @interface SIPTrunkPhoneNumber
 */
export interface SIPTrunkPhoneNumber {
  /** The actual phone number in E.164 format */
  phone_number: string;

  /** Human-readable label for the phone number */
  label: string;

  /** Unique identifier for API operations */
  phone_number_id: string;

  /** Whether this number can receive inbound calls */
  supports_inbound: boolean;

  /** Whether this number can make outbound calls */
  supports_outbound: boolean;

  /** Provider type - always "sip_trunk" for this interface */
  provider: "sip_trunk";

  /** LiveKit stack configuration */
  livekit_stack: "standard" | "static";

  /** Currently assigned agent (null if unassigned) */
  assigned_agent: {
    agent_id: string;
    agent_name: string;
  } | null;

  /** Outbound SIP trunk configuration */
  outbound_trunk?: Record<string, unknown> | null;

  /** Inbound SIP trunk configuration */
  inbound_trunk?: Record<string, unknown> | null;

  /** Additional provider-specific configuration */
  provider_config?: Record<string, unknown> | null;
}

/**
 * Union type for all phone number types.
 * @description Can be either a Twilio or SIP trunk phone number.
 * @typedef {TwilioPhoneNumber | SIPTrunkPhoneNumber} PhoneNumber
 */
export type PhoneNumber = TwilioPhoneNumber | SIPTrunkPhoneNumber;

/**
 * Request parameters for importing a Twilio phone number.
 * @description Contains Twilio credentials and phone number details.
 * @interface ImportPhoneNumberRequest
 */
export interface ImportPhoneNumberRequest {
  /** Phone number to import in E.164 format */
  phone_number: string;

  /** Descriptive label for the phone number */
  label: string;

  /** Twilio Account SID */
  sid: string;

  /** Twilio Auth Token */
  token: string;

  /** Provider type - must be "twilio" */
  provider: "twilio";

  /** Enable inbound call handling (default: true) */
  supports_inbound?: boolean;

  /** Enable outbound call capability (default: true) */
  supports_outbound?: boolean;

  /** Optional regional configuration for Twilio */
  region_config?: {
    /** ElevenLabs region identifier */
    region_id: "us1" | "ie1" | "au1";
    /** Regional token */
    token: string;
    /** Twilio edge location for voice routing */
    edge_location: "ashburn" | "dublin" | "frankfurt" | "sao-paulo" | "singapore" | "sydney" | "tokyo" | "umatilla" | "roaming";
  };
}

/**
 * Response from importing a phone number.
 * @description Contains the newly created phone number identifier.
 * @interface ImportPhoneNumberResponse
 */
export interface ImportPhoneNumberResponse {
  /** Unique identifier for the imported phone number */
  phone_number_id: string;
}
