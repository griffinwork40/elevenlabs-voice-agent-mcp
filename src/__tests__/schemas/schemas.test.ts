/**
 * Tests for Zod schema validation
 *
 * Tests input validation for all tool schemas.
 */

import { describe, it, expect } from "vitest";
import {
  CreateAgentSchema,
  GetAgentSchema,
  UpdateAgentSchema,
  DeleteAgentSchema,
  ListAgentsSchema
} from "../../schemas/agent-schemas.js";
import {
  SubmitBatchCallSchema,
  ListBatchCallsSchema,
  GetBatchCallSchema
} from "../../schemas/batch-calling-schemas.js";
import {
  GetConversationSchema,
  ListConversationsSchema
} from "../../schemas/conversation-schemas.js";
import {
  CreateWebhookToolSchema,
  ListToolsSchema,
  DeleteToolSchema,
  AddKnowledgeBaseSchema,
  GenerateWidgetCodeSchema,
  ListVoicesSchema
} from "../../schemas/tool-schemas.js";
import {
  StartOutboundCallSchema
} from "../../schemas/outbound-schemas.js";
import {
  ListPhoneNumbersSchema,
  GetPhoneNumberSchema,
  ImportPhoneNumberSchema,
  UpdatePhoneNumberSchema,
  DeletePhoneNumberSchema
} from "../../schemas/phone-number-schemas.js";
import {
  ResponseFormatSchema,
  LimitSchema,
  OffsetSchema,
  AgentIdSchema,
  ConversationIdSchema,
  VoiceIdSchema,
  URLSchema,
  ColorSchema
} from "../../schemas/common-schemas.js";
import { ResponseFormat } from "../../types.js";

describe("Schema Validation", () => {
  describe("Common Schemas", () => {
    describe("ResponseFormatSchema", () => {
      it("should accept markdown", () => {
        expect(ResponseFormatSchema.parse(ResponseFormat.MARKDOWN)).toBe("markdown");
      });

      it("should accept json", () => {
        expect(ResponseFormatSchema.parse(ResponseFormat.JSON)).toBe("json");
      });

      it("should default to markdown", () => {
        expect(ResponseFormatSchema.parse(undefined)).toBe("markdown");
      });

      it("should reject invalid format", () => {
        expect(() => ResponseFormatSchema.parse("xml")).toThrow();
      });
    });

    describe("LimitSchema", () => {
      it("should accept valid limits", () => {
        expect(LimitSchema.parse(1)).toBe(1);
        expect(LimitSchema.parse(50)).toBe(50);
        expect(LimitSchema.parse(100)).toBe(100);
      });

      it("should default to 20", () => {
        expect(LimitSchema.parse(undefined)).toBe(20);
      });

      it("should reject limit below 1", () => {
        expect(() => LimitSchema.parse(0)).toThrow();
        expect(() => LimitSchema.parse(-5)).toThrow();
      });

      it("should reject limit above 100", () => {
        expect(() => LimitSchema.parse(101)).toThrow();
        expect(() => LimitSchema.parse(1000)).toThrow();
      });

      it("should reject non-integer", () => {
        expect(() => LimitSchema.parse(10.5)).toThrow();
      });
    });

    describe("OffsetSchema", () => {
      it("should accept valid offsets", () => {
        expect(OffsetSchema.parse(0)).toBe(0);
        expect(OffsetSchema.parse(100)).toBe(100);
      });

      it("should default to 0", () => {
        expect(OffsetSchema.parse(undefined)).toBe(0);
      });

      it("should reject negative offset", () => {
        expect(() => OffsetSchema.parse(-1)).toThrow();
      });
    });

    describe("AgentIdSchema", () => {
      it("should accept valid agent IDs", () => {
        expect(AgentIdSchema.parse("ag_abc123")).toBe("ag_abc123");
        expect(AgentIdSchema.parse("agent-test-123")).toBe("agent-test-123");
        expect(AgentIdSchema.parse("ABC_123_def")).toBe("ABC_123_def");
      });

      it("should reject empty string", () => {
        expect(() => AgentIdSchema.parse("")).toThrow();
      });

      it("should reject special characters", () => {
        expect(() => AgentIdSchema.parse("ag@123")).toThrow();
        expect(() => AgentIdSchema.parse("agent.test")).toThrow();
        expect(() => AgentIdSchema.parse("agent test")).toThrow();
      });
    });

    describe("ConversationIdSchema", () => {
      it("should accept valid conversation IDs", () => {
        expect(ConversationIdSchema.parse("conv_xyz789")).toBe("conv_xyz789");
        expect(ConversationIdSchema.parse("conversation-123")).toBe("conversation-123");
      });

      it("should reject invalid IDs", () => {
        expect(() => ConversationIdSchema.parse("")).toThrow();
        expect(() => ConversationIdSchema.parse("conv@123")).toThrow();
      });
    });

    describe("VoiceIdSchema", () => {
      it("should accept valid voice IDs", () => {
        expect(VoiceIdSchema.parse("21m00Tcm4TlvDq8ikWAM")).toBe("21m00Tcm4TlvDq8ikWAM");
        expect(VoiceIdSchema.parse("custom-voice-id")).toBe("custom-voice-id");
      });

      it("should reject empty string", () => {
        expect(() => VoiceIdSchema.parse("")).toThrow();
      });
    });

    describe("URLSchema", () => {
      it("should accept valid URLs", () => {
        expect(URLSchema.parse("https://example.com")).toBe("https://example.com");
        expect(URLSchema.parse("http://api.test.com/endpoint")).toBe("http://api.test.com/endpoint");
        expect(URLSchema.parse("https://sub.domain.com/path?query=1")).toBe("https://sub.domain.com/path?query=1");
      });

      it("should reject invalid URLs", () => {
        expect(() => URLSchema.parse("not-a-url")).toThrow();
        expect(() => URLSchema.parse("example.com")).toThrow();
        expect(() => URLSchema.parse("")).toThrow();
      });
    });

    describe("ColorSchema", () => {
      it("should accept valid hex colors", () => {
        expect(ColorSchema.parse("#FF5733")).toBe("#FF5733");
        expect(ColorSchema.parse("#000000")).toBe("#000000");
        expect(ColorSchema.parse("#ffffff")).toBe("#ffffff");
        expect(ColorSchema.parse("#AbCdEf")).toBe("#AbCdEf");
      });

      it("should reject invalid colors", () => {
        expect(() => ColorSchema.parse("FF5733")).toThrow(); // Missing #
        expect(() => ColorSchema.parse("#FFF")).toThrow(); // Too short
        expect(() => ColorSchema.parse("#FFFFFFF")).toThrow(); // Too long
        expect(() => ColorSchema.parse("#GGGGGG")).toThrow(); // Invalid hex
        expect(() => ColorSchema.parse("red")).toThrow(); // Not hex
      });
    });
  });

  describe("Agent Schemas", () => {
    describe("CreateAgentSchema", () => {
      it("should accept valid full input", () => {
        const input = {
          name: "Test Agent",
          prompt: "You are a helpful assistant.",
          llm: "claude-sonnet-4-5@20250929",
          voice_id: "21m00Tcm4TlvDq8ikWAM",
          voice_model: "eleven_turbo_v2_5",
          first_message: "Hello!",
          language: "en",
          temperature: 0.7,
          max_tokens: 1024,
          stability: 0.5,
          similarity_boost: 0.75,
          speed: 1.0,
          turn_eagerness: "normal",
          turn_timeout: 10,
          silence_end_call_timeout: 15
        };

        const result = CreateAgentSchema.parse(input);
        expect(result.name).toBe("Test Agent");
        expect(result.llm).toBe("claude-sonnet-4-5@20250929");
      });

      it("should accept minimal input with defaults", () => {
        const input = {
          name: "Minimal Agent",
          prompt: "A minimal agent prompt."
        };

        const result = CreateAgentSchema.parse(input);
        expect(result.name).toBe("Minimal Agent");
        expect(result.llm).toBe("claude-sonnet-4-5@20250929"); // Default
        expect(result.voice_id).toBe("21m00Tcm4TlvDq8ikWAM"); // Default
        expect(result.language).toBe("en"); // Default
      });

      it("should reject name exceeding 100 characters", () => {
        expect(() => CreateAgentSchema.parse({
          name: "x".repeat(101),
          prompt: "Valid prompt here."
        })).toThrow();
      });

      it("should reject prompt less than 10 characters", () => {
        expect(() => CreateAgentSchema.parse({
          name: "Test",
          prompt: "Short"
        })).toThrow();
      });

      it("should reject prompt exceeding 5000 characters", () => {
        expect(() => CreateAgentSchema.parse({
          name: "Test",
          prompt: "x".repeat(5001)
        })).toThrow();
      });

      it("should reject invalid voice_model", () => {
        expect(() => CreateAgentSchema.parse({
          name: "Test",
          prompt: "Valid prompt here.",
          voice_model: "invalid_model"
        })).toThrow();
      });

      it("should reject temperature outside 0-2", () => {
        expect(() => CreateAgentSchema.parse({
          name: "Test",
          prompt: "Valid prompt here.",
          temperature: -0.5
        })).toThrow();
        expect(() => CreateAgentSchema.parse({
          name: "Test",
          prompt: "Valid prompt here.",
          temperature: 2.5
        })).toThrow();
      });

      it("should reject stability outside 0-1", () => {
        expect(() => CreateAgentSchema.parse({
          name: "Test",
          prompt: "Valid prompt here.",
          stability: 1.5
        })).toThrow();
      });

      it("should reject speed outside 0.5-2.0", () => {
        expect(() => CreateAgentSchema.parse({
          name: "Test",
          prompt: "Valid prompt here.",
          speed: 0.3
        })).toThrow();
        expect(() => CreateAgentSchema.parse({
          name: "Test",
          prompt: "Valid prompt here.",
          speed: 2.5
        })).toThrow();
      });

      it("should reject invalid turn_eagerness", () => {
        expect(() => CreateAgentSchema.parse({
          name: "Test",
          prompt: "Valid prompt here.",
          turn_eagerness: "invalid"
        })).toThrow();
      });
    });

    describe("UpdateAgentSchema", () => {
      it("should accept partial update", () => {
        const result = UpdateAgentSchema.parse({
          agent_id: "ag_test123",
          name: "New Name"
        });
        expect(result.agent_id).toBe("ag_test123");
        expect(result.name).toBe("New Name");
        expect(result.prompt).toBeUndefined();
      });

      it("should require agent_id", () => {
        expect(() => UpdateAgentSchema.parse({
          name: "New Name"
        })).toThrow();
      });
    });

    describe("ListAgentsSchema", () => {
      it("should accept empty input with defaults", () => {
        const result = ListAgentsSchema.parse({});
        expect(result.limit).toBe(20);
        expect(result.offset).toBe(0);
        expect(result.response_format).toBe("markdown");
      });
    });
  });

  describe("Batch Calling Schemas", () => {
    describe("SubmitBatchCallSchema", () => {
      it("should accept valid batch call", () => {
        const result = SubmitBatchCallSchema.parse({
          call_name: "Test Batch",
          agent_id: "ag_test123",
          recipients: [
            { phone_number: "+14155551234" }
          ]
        });
        expect(result.call_name).toBe("Test Batch");
        expect(result.recipients).toHaveLength(1);
      });

      it("should accept recipients with dynamic variables", () => {
        const result = SubmitBatchCallSchema.parse({
          call_name: "Personalized Batch",
          agent_id: "ag_test123",
          recipients: [
            {
              phone_number: "+14155551234",
              conversation_initiation_client_data: {
                dynamic_variables: { name: "John" }
              }
            }
          ]
        });
        expect(result.recipients[0].conversation_initiation_client_data).toBeDefined();
      });

      it("should reject empty recipients", () => {
        expect(() => SubmitBatchCallSchema.parse({
          call_name: "Test",
          agent_id: "ag_test123",
          recipients: []
        })).toThrow();
      });

      it("should reject recipients without phone or whatsapp", () => {
        expect(() => SubmitBatchCallSchema.parse({
          call_name: "Test",
          agent_id: "ag_test123",
          recipients: [{ id: "rec_001" }]
        })).toThrow();
      });

      it("should accept whatsapp_user_id as alternative", () => {
        const result = SubmitBatchCallSchema.parse({
          call_name: "WhatsApp Batch",
          agent_id: "ag_test123",
          recipients: [
            { whatsapp_user_id: "wa_user_123" }
          ]
        });
        expect(result.recipients[0].whatsapp_user_id).toBe("wa_user_123");
      });
    });
  });

  describe("Conversation Schemas", () => {
    describe("ListConversationsSchema", () => {
      it("should accept all filters", () => {
        const result = ListConversationsSchema.parse({
          agent_id: "ag_test123",
          status: "completed",
          date_range: {
            start: "2025-01-01T00:00:00Z",
            end: "2025-01-31T23:59:59Z"
          },
          limit: 50,
          offset: 10
        });
        expect(result.agent_id).toBe("ag_test123");
        expect(result.status).toBe("completed");
      });

      it("should reject invalid status", () => {
        expect(() => ListConversationsSchema.parse({
          status: "invalid_status"
        })).toThrow();
      });
    });
  });

  describe("Tool Schemas", () => {
    describe("CreateWebhookToolSchema", () => {
      it("should accept valid webhook tool", () => {
        const result = CreateWebhookToolSchema.parse({
          agent_id: "ag_test123",
          name: "test_tool",
          description: "A valid description for the tool.",
          url: "https://api.example.com/webhook",
          parameters: []
        });
        expect(result.name).toBe("test_tool");
        expect(result.method).toBe("POST"); // Default
      });

      it("should reject tool name with spaces", () => {
        expect(() => CreateWebhookToolSchema.parse({
          agent_id: "ag_test123",
          name: "invalid name",
          description: "A valid description here.",
          url: "https://api.example.com/webhook",
          parameters: []
        })).toThrow();
      });

      it("should reject description less than 10 chars", () => {
        expect(() => CreateWebhookToolSchema.parse({
          agent_id: "ag_test123",
          name: "test_tool",
          description: "Too short",
          url: "https://api.example.com/webhook",
          parameters: []
        })).toThrow();
      });

      it("should accept parameters with enum", () => {
        const result = CreateWebhookToolSchema.parse({
          agent_id: "ag_test123",
          name: "test_tool",
          description: "Tool with enum parameter.",
          url: "https://api.example.com/webhook",
          parameters: [
            {
              name: "carrier",
              type: "string",
              description: "Shipping carrier",
              required: true,
              enum: ["fedex", "ups", "usps"]
            }
          ]
        });
        expect(result.parameters[0].enum).toEqual(["fedex", "ups", "usps"]);
      });
    });

    describe("AddKnowledgeBaseSchema", () => {
      it("should accept text documents", () => {
        const result = AddKnowledgeBaseSchema.parse({
          agent_id: "ag_test123",
          documents: [
            { type: "text", content: "Document content here." }
          ]
        });
        expect(result.documents).toHaveLength(1);
      });

      it("should accept URL documents", () => {
        const result = AddKnowledgeBaseSchema.parse({
          agent_id: "ag_test123",
          documents: [
            { type: "url", content: "https://example.com/doc" }
          ]
        });
        expect(result.documents[0].type).toBe("url");
      });

      it("should reject empty documents array", () => {
        expect(() => AddKnowledgeBaseSchema.parse({
          agent_id: "ag_test123",
          documents: []
        })).toThrow();
      });

      it("should reject too many documents", () => {
        const tooMany = Array(101).fill({ type: "text", content: "Doc" });
        expect(() => AddKnowledgeBaseSchema.parse({
          agent_id: "ag_test123",
          documents: tooMany
        })).toThrow();
      });
    });

    describe("ListVoicesSchema", () => {
      it("should accept all filters", () => {
        const result = ListVoicesSchema.parse({
          language: "en",
          gender: "female",
          age: "middle_aged",
          limit: 50
        });
        expect(result.gender).toBe("female");
        expect(result.age).toBe("middle_aged");
      });

      it("should reject invalid gender", () => {
        expect(() => ListVoicesSchema.parse({
          gender: "other"
        })).toThrow();
      });

      it("should reject invalid age", () => {
        expect(() => ListVoicesSchema.parse({
          age: "very_old"
        })).toThrow();
      });
    });
  });

  describe("Phone Number Schemas", () => {
    describe("ImportPhoneNumberSchema", () => {
      it("should accept valid import request", () => {
        const result = ImportPhoneNumberSchema.parse({
          phone_number: "+14155551234",
          label: "Support Line",
          sid: "ACtest123",
          token: "auth_token",
          provider: "twilio"
        });
        expect(result.phone_number).toBe("+14155551234");
        expect(result.supports_inbound).toBe(true); // Default
        expect(result.supports_outbound).toBe(true); // Default
      });

      it("should reject invalid phone number format", () => {
        // Phone number starting with 0 is invalid in E.164
        expect(() => ImportPhoneNumberSchema.parse({
          phone_number: "0123456789",
          label: "Test",
          sid: "ACtest123",
          token: "auth_token",
          provider: "twilio"
        })).toThrow();
      });

      it("should reject provider other than twilio", () => {
        expect(() => ImportPhoneNumberSchema.parse({
          phone_number: "+14155551234",
          label: "Test",
          sid: "ACtest123",
          token: "auth_token",
          provider: "sip_trunk"
        })).toThrow();
      });

      it("should accept region configuration", () => {
        const result = ImportPhoneNumberSchema.parse({
          phone_number: "+14155551234",
          label: "Regional",
          sid: "ACtest123",
          token: "auth_token",
          provider: "twilio",
          region_config: {
            region_id: "us1",
            token: "region_token",
            edge_location: "ashburn"
          }
        });
        expect(result.region_config?.region_id).toBe("us1");
      });
    });

    describe("UpdatePhoneNumberSchema", () => {
      it("should accept agent assignment", () => {
        const result = UpdatePhoneNumberSchema.parse({
          phone_number_id: "pn_test123",
          agent_id: "ag_agent456"
        });
        expect(result.agent_id).toBe("ag_agent456");
      });

      it("should accept null agent_id for unassignment", () => {
        const result = UpdatePhoneNumberSchema.parse({
          phone_number_id: "pn_test123",
          agent_id: null
        });
        expect(result.agent_id).toBeNull();
      });

      it("should accept livekit_stack", () => {
        const result = UpdatePhoneNumberSchema.parse({
          phone_number_id: "pn_test123",
          livekit_stack: "static"
        });
        expect(result.livekit_stack).toBe("static");
      });
    });
  });

  describe("Outbound Call Schemas", () => {
    describe("StartOutboundCallSchema", () => {
      it("should accept valid outbound call", () => {
        const result = StartOutboundCallSchema.parse({
          agent_id: "ag_test123",
          agent_phone_number_id: "pn_phone123",
          to_number: "+14155551234"
        });
        expect(result.to_number).toBe("+14155551234");
      });

      it("should accept conversation initiation data", () => {
        const result = StartOutboundCallSchema.parse({
          agent_id: "ag_test123",
          agent_phone_number_id: "pn_phone123",
          to_number: "+14155551234",
          conversation_initiation_client_data: {
            dynamic_variables: { name: "John" }
          }
        });
        expect(result.conversation_initiation_client_data).toBeDefined();
      });

      it("should reject invalid phone number", () => {
        expect(() => StartOutboundCallSchema.parse({
          agent_id: "ag_test123",
          agent_phone_number_id: "pn_phone123",
          to_number: "not-a-phone"
        })).toThrow();
      });
    });
  });
});
