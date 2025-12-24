/**
 * Test fixtures and mock data
 *
 * Provides consistent mock data for all tests.
 */

import {
  Agent,
  ConversationMetadata,
  ToolConfig,
  Voice,
  BatchCallResponse,
  BatchCallDetailedResponse,
  WorkspaceBatchCallsResponse,
  PhoneNumber,
  OutboundCallResponse,
  ImportPhoneNumberResponse,
  ResponseFormat
} from "../../types.js";

// ============================================
// Agent Fixtures
// ============================================

export const mockAgent: Agent = {
  agent_id: "ag_test123",
  name: "Test Support Agent",
  conversation_config: {
    agent: {
      prompt: {
        prompt: "You are a helpful customer support agent. Be friendly and professional.",
        llm: "claude-sonnet-4-5@20250929",
        temperature: 0.7,
        max_tokens: 1024,
        tools: [],
        knowledge_base: []
      },
      first_message: "Hello! How can I help you today?",
      language: "en"
    },
    tts: {
      voice_id: "21m00Tcm4TlvDq8ikWAM",
      model_id: "eleven_turbo_v2_5",
      stability: 0.5,
      similarity_boost: 0.75,
      speed: 1.0
    },
    asr: {
      quality: "high",
      user_input_audio_format: "pcm_16000"
    },
    turn: {
      turn_eagerness: "normal",
      turn_timeout: 10,
      silence_end_call_timeout: 15
    }
  },
  platform_settings: {
    widget: {
      color: "#FF5733",
      avatar_url: "https://example.com/avatar.png"
    }
  },
  created_at: "2025-01-15T10:30:00Z",
  updated_at: "2025-01-15T11:00:00Z"
};

export const mockAgentMinimal: Agent = {
  agent_id: "ag_minimal789",
  name: "Minimal Agent",
  conversation_config: {
    agent: {
      prompt: {
        prompt: "A simple test agent prompt.",
        llm: "gpt-4o"
      },
      language: "en"
    },
    tts: {
      voice_id: "21m00Tcm4TlvDq8ikWAM",
      model_id: "eleven_turbo_v2_5"
    }
  },
  created_at: "2025-01-15T09:00:00Z"
};

export const mockAgentsList = [mockAgent, mockAgentMinimal];

// ============================================
// Conversation Fixtures
// ============================================

export const mockConversation: ConversationMetadata = {
  conversation_id: "conv_test456",
  agent_id: "ag_test123",
  status: "completed",
  started_at: "2025-01-15T12:00:00Z",
  ended_at: "2025-01-15T12:05:30Z",
  duration_seconds: 330,
  transcript: [
    {
      role: "agent",
      message: "Hello! How can I help you today?",
      timestamp: "2025-01-15T12:00:00Z"
    },
    {
      role: "user",
      message: "I need help with my order.",
      timestamp: "2025-01-15T12:00:05Z"
    },
    {
      role: "agent",
      message: "I'd be happy to help! What's your order number?",
      timestamp: "2025-01-15T12:00:10Z",
      tool_calls: [
        {
          tool_name: "lookup_order",
          parameters: { order_id: "12345" },
          result: { status: "shipped" }
        }
      ]
    }
  ],
  analysis: {
    user_sentiment: "positive",
    agent_performance: 8,
    key_topics: ["order status", "shipping"]
  }
};

export const mockConversationInProgress: ConversationMetadata = {
  conversation_id: "conv_active789",
  agent_id: "ag_test123",
  status: "in_progress",
  started_at: "2025-01-15T14:00:00Z"
};

export const mockConversationsList = [mockConversation, mockConversationInProgress];

// ============================================
// Tool Fixtures
// ============================================

export const mockTool: ToolConfig = {
  name: "check_order_status",
  description: "Check the status of a customer order by order ID.",
  type: "webhook",
  url: "https://api.example.com/orders/status",
  method: "POST",
  headers: {
    "Authorization": "Bearer token123"
  },
  parameters: [
    {
      name: "order_id",
      type: "string",
      description: "The unique order identifier",
      required: true
    },
    {
      name: "include_history",
      type: "boolean",
      description: "Include order history",
      required: false
    }
  ]
};

export const mockToolWithEnum: ToolConfig = {
  name: "get_shipping_rates",
  description: "Get shipping rates for different carriers.",
  type: "webhook",
  url: "https://api.example.com/shipping/rates",
  method: "GET",
  parameters: [
    {
      name: "carrier",
      type: "string",
      description: "Shipping carrier",
      required: true,
      enum: ["fedex", "ups", "usps"]
    },
    {
      name: "weight",
      type: "number",
      description: "Package weight in pounds",
      required: true
    }
  ]
};

export const mockToolsList = [mockTool, mockToolWithEnum];

// ============================================
// Voice Fixtures
// ============================================

export const mockVoice: Voice = {
  voice_id: "21m00Tcm4TlvDq8ikWAM",
  name: "Rachel",
  category: "premade",
  description: "A warm, professional American female voice.",
  preview_url: "https://api.elevenlabs.io/v1/voices/21m00Tcm4TlvDq8ikWAM/preview",
  labels: {
    accent: "American",
    gender: "female",
    age: "middle_aged",
    use_case: "customer service"
  }
};

export const mockVoiceMale: Voice = {
  voice_id: "pNInz6obpgDQGcFmaJgB",
  name: "Adam",
  category: "premade",
  description: "A deep, confident American male voice.",
  preview_url: "https://api.elevenlabs.io/v1/voices/pNInz6obpgDQGcFmaJgB/preview",
  labels: {
    accent: "American",
    gender: "male",
    age: "middle_aged",
    use_case: "narration"
  }
};

export const mockVoicesList = [mockVoice, mockVoiceMale];

// ============================================
// Batch Call Fixtures
// ============================================

export const mockBatchCall: BatchCallResponse = {
  id: "batch_test123",
  name: "Q4 Customer Survey",
  agent_id: "ag_test123",
  agent_name: "Test Support Agent",
  status: "in_progress",
  created_at_unix: 1705320000,
  scheduled_time_unix: 1705323600,
  last_updated_at_unix: 1705327200,
  total_calls_dispatched: 150,
  total_calls_scheduled: 500,
  phone_number_id: "pn_test123",
  phone_provider: "twilio"
};

export const mockBatchCallDetailed: BatchCallDetailedResponse = {
  ...mockBatchCall,
  recipients: [
    {
      id: "rec_001",
      phone_number: "+14155551234",
      status: "completed",
      conversation_id: "conv_batch001",
      created_at_unix: 1705320000,
      updated_at_unix: 1705323600,
      conversation_initiation_client_data: {
        dynamic_variables: { name: "John Smith" }
      }
    },
    {
      id: "rec_002",
      phone_number: "+14155555678",
      status: "pending",
      conversation_id: "conv_batch002",
      created_at_unix: 1705320000,
      updated_at_unix: 1705320000
    },
    {
      id: "rec_003",
      phone_number: "+14155559012",
      status: "failed",
      conversation_id: "conv_batch003",
      created_at_unix: 1705320000,
      updated_at_unix: 1705325000
    }
  ]
};

export const mockBatchCallsList: WorkspaceBatchCallsResponse = {
  batch_calls: [mockBatchCall],
  next_doc: "cursor_xyz",
  has_more: true
};

// ============================================
// Phone Number Fixtures
// ============================================

export const mockPhoneNumber: PhoneNumber = {
  phone_number: "+14155551234",
  label: "Customer Support Line",
  phone_number_id: "pn_test123",
  provider: "twilio",
  supports_inbound: true,
  supports_outbound: true,
  assigned_agent: {
    agent_id: "ag_test123",
    agent_name: "Test Support Agent"
  }
};

export const mockPhoneNumberUnassigned: PhoneNumber = {
  phone_number: "+14155559999",
  label: "Backup Line",
  phone_number_id: "pn_backup456",
  provider: "twilio",
  supports_inbound: true,
  supports_outbound: false,
  assigned_agent: null
};

export const mockPhoneNumbersList = [mockPhoneNumber, mockPhoneNumberUnassigned];

// ============================================
// Outbound Call Fixtures
// ============================================

export const mockOutboundCallSuccess: OutboundCallResponse = {
  success: true,
  message: "Call initiated successfully",
  conversation_id: "conv_outbound123",
  callSid: "CA1234567890abcdef"
};

export const mockOutboundCallFailed: OutboundCallResponse = {
  success: false,
  message: "Failed to initiate call: Phone number not found",
  conversation_id: null,
  callSid: null
};

// ============================================
// Import Phone Number Fixtures
// ============================================

export const mockImportPhoneNumber: ImportPhoneNumberResponse = {
  phone_number_id: "pn_newimport789"
};

// ============================================
// API Error Response Fixtures
// ============================================

export const mockApiError400 = {
  response: {
    status: 400,
    data: { detail: "Invalid request parameters" }
  }
};

export const mockApiError401 = {
  response: {
    status: 401,
    data: { detail: "Invalid API key" }
  }
};

export const mockApiError404 = {
  response: {
    status: 404,
    data: { detail: "Resource not found" }
  }
};

export const mockApiError429 = {
  response: {
    status: 429,
    data: { detail: "Rate limit exceeded" }
  }
};

export const mockApiError500 = {
  response: {
    status: 500,
    data: { detail: "Internal server error" }
  }
};

// ============================================
// Input Fixtures for Schema Testing
// ============================================

export const validCreateAgentInput = {
  name: "Test Agent",
  prompt: "You are a helpful assistant for answering questions.",
  llm: "claude-sonnet-4-5@20250929",
  voice_id: "21m00Tcm4TlvDq8ikWAM",
  voice_model: "eleven_turbo_v2_5" as const,
  first_message: "Hello! How can I help you?",
  language: "en" as const,
  temperature: 0.7,
  max_tokens: 1024,
  response_format: ResponseFormat.MARKDOWN
};

export const validUpdateAgentInput = {
  agent_id: "ag_test123",
  name: "Updated Agent",
  prompt: "Updated prompt text for the agent.",
  response_format: ResponseFormat.JSON
};

export const invalidCreateAgentInputs = {
  emptyName: {
    name: "",
    prompt: "Valid prompt here"
  },
  shortPrompt: {
    name: "Valid Name",
    prompt: "Too short"
  },
  invalidVoiceModel: {
    name: "Valid Name",
    prompt: "Valid prompt text here",
    voice_model: "invalid_model"
  },
  invalidTemperature: {
    name: "Valid Name",
    prompt: "Valid prompt text here",
    temperature: 3.0
  }
};

export const validBatchCallInput = {
  call_name: "Test Batch",
  agent_id: "ag_test123",
  recipients: [
    { phone_number: "+14155551234" },
    { phone_number: "+14155555678", conversation_initiation_client_data: { dynamic_variables: { name: "John" } } }
  ],
  response_format: ResponseFormat.MARKDOWN
};

export const invalidBatchCallInputs = {
  emptyRecipients: {
    call_name: "Test Batch",
    agent_id: "ag_test123",
    recipients: []
  },
  invalidPhoneNumber: {
    call_name: "Test Batch",
    agent_id: "ag_test123",
    recipients: [{ phone_number: "not-a-phone" }]
  }
};
