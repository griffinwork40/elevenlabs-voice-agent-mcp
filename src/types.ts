/**
 * TypeScript type definitions for ElevenLabs Voice Agent API
 *
 * Defines interfaces for agents, conversations, tools, and API responses.
 */

import { SUPPORTED_LLMS, SUPPORTED_VOICE_MODELS, SUPPORTED_LANGUAGES, AUTH_TYPES } from "./constants.js";

// Enums
export enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json"
}

export type LLMModel = typeof SUPPORTED_LLMS[number];
export type VoiceModel = typeof SUPPORTED_VOICE_MODELS[number];
export type Language = typeof SUPPORTED_LANGUAGES[number];
export type AuthType = typeof AUTH_TYPES[number];

// Agent Configuration
export interface AgentPromptConfig {
  prompt: string;
  llm: LLMModel;
  temperature?: number;
  max_tokens?: number;
  tools?: ToolConfig[];
  knowledge_base?: string[];
}

export interface TTSConfig {
  voice_id: string;
  model_id: VoiceModel;
  optimize_streaming_latency?: number;
  stability?: number;
  similarity_boost?: number;
}

export interface ASRConfig {
  quality?: "low" | "medium" | "high";
  user_input_audio_format?: "pcm_16000" | "pcm_22050" | "pcm_44100";
}

export interface ConversationConfig {
  agent: {
    prompt: AgentPromptConfig;
    first_message?: string;
    language: Language;
  };
  tts: TTSConfig;
  asr?: ASRConfig;
}

export interface PlatformSettings {
  widget?: {
    color?: string;
    avatar_url?: string;
  };
  auth?: {
    type: AuthType;
    open_auth_allowed?: boolean;
  };
}

export interface Agent {
  agent_id: string;
  name: string;
  conversation_config: ConversationConfig;
  platform_settings?: PlatformSettings;
  created_at: string;
  updated_at?: string;
}

// Tool Configuration
export interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required: boolean;
  enum?: string[];
}

export interface ToolConfig {
  name: string;
  description: string;
  type: "webhook" | "client";
  url?: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  parameters: ToolParameter[];
}

// Conversation
export interface ConversationMetadata {
  conversation_id: string;
  agent_id: string;
  status: "in_progress" | "completed" | "failed";
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  transcript?: TranscriptEntry[];
  analysis?: ConversationAnalysis;
}

export interface TranscriptEntry {
  role: "agent" | "user";
  message: string;
  timestamp: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  tool_name: string;
  parameters: Record<string, unknown>;
  result?: unknown;
  error?: string;
}

export interface ConversationAnalysis {
  user_sentiment?: "positive" | "neutral" | "negative";
  agent_performance?: number;
  key_topics?: string[];
}

// Voice
export interface Voice {
  voice_id: string;
  name: string;
  category?: string;
  description?: string;
  preview_url?: string;
  labels?: {
    accent?: string;
    description?: string;
    age?: string;
    gender?: string;
    use_case?: string;
  };
}

// Pagination
export interface PaginatedResponse<T> {
  total: number;
  count: number;
  offset: number;
  items: T[];
  has_more: boolean;
  next_offset?: number;
}

// API Response wrappers
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Knowledge Base
export interface KnowledgeBaseDocument {
  type: "text" | "url" | "file";
  content: string;
  metadata?: Record<string, string>;
}

// Widget Configuration
export interface WidgetConfig {
  agent_id: string;
  color?: string;
  avatar_url?: string;
}

// Outbound Calling
export interface OutboundCallRequest {
  agent_id: string;
  agent_phone_number_id: string;
  to_number: string;
  /**
   * Conversation initiation data for personalization
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

export interface OutboundCallResponse {
  success: boolean;
  message: string;
  conversation_id: string | null;
  callSid: string | null;
}

// Batch Calling
export type BatchStatus = "pending" | "in_progress" | "completed" | "failed" | "cancelled";
export type RecipientStatus = BatchStatus | "initiated" | "voicemail";
export type PhoneProvider = "twilio" | "sip_trunk";

export interface OutboundCallRecipient {
  id?: string;
  phone_number?: string;
  whatsapp_user_id?: string;
  /**
   * Conversation initiation data for personalization
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

export interface BatchCallRequest {
  call_name: string;
  agent_id: string;
  recipients: OutboundCallRecipient[];
  scheduled_time_unix?: number | null;
  agent_phone_number_id?: string | null;
}

export interface BatchCallResponse {
  id: string;
  name: string;
  agent_id: string;
  agent_name: string;
  status: BatchStatus;
  created_at_unix: number;
  scheduled_time_unix: number;
  last_updated_at_unix: number;
  total_calls_dispatched: number;
  total_calls_scheduled: number;
  phone_number_id: string | null;
  phone_provider: PhoneProvider | null;
}

export interface BatchCallRecipient {
  id: string;
  phone_number?: string;
  whatsapp_user_id?: string;
  status: RecipientStatus;
  conversation_id: string;
  created_at_unix: number;
  updated_at_unix: number;
  /**
   * Conversation initiation data for personalization
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

export interface BatchCallDetailedResponse extends BatchCallResponse {
  recipients: BatchCallRecipient[];
}

export interface WorkspaceBatchCallsResponse {
  batch_calls: BatchCallResponse[];
  next_doc: string | null;
  has_more: boolean;
}

// Phone Number Management
export interface TwilioPhoneNumber {
  phone_number: string;
  label: string;
  phone_number_id: string;
  supports_inbound: boolean;
  supports_outbound: boolean;
  provider: "twilio";
  assigned_agent: {
    agent_id: string;
    agent_name: string;
  } | null;
}

export interface SIPTrunkPhoneNumber {
  phone_number: string;
  label: string;
  phone_number_id: string;
  supports_inbound: boolean;
  supports_outbound: boolean;
  provider: "sip_trunk";
  livekit_stack: "standard" | "static";
  assigned_agent: {
    agent_id: string;
    agent_name: string;
  } | null;
  outbound_trunk?: Record<string, unknown> | null;
  inbound_trunk?: Record<string, unknown> | null;
  provider_config?: Record<string, unknown> | null;
}

export type PhoneNumber = TwilioPhoneNumber | SIPTrunkPhoneNumber;

export interface ImportPhoneNumberRequest {
  phone_number: string;
  label: string;
  sid: string;
  token: string;
  provider: "twilio";
  supports_inbound?: boolean;
  supports_outbound?: boolean;
  region_config?: {
    region_id: "us1" | "ie1" | "au1";
    token: string;
    edge_location: "ashburn" | "dublin" | "frankfurt" | "sao-paulo" | "singapore" | "sydney" | "tokyo" | "umatilla" | "roaming";
  };
}

export interface ImportPhoneNumberResponse {
  phone_number_id: string;
}
