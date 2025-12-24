/**
 * Tests for response formatters
 *
 * Tests all formatting functions for agents, conversations, tools, voices, etc.
 */

import { describe, it, expect } from "vitest";
import {
  formatAgentMarkdown,
  formatAgentListMarkdown,
  formatConversationMarkdown,
  formatConversationListMarkdown,
  formatToolMarkdown,
  formatToolListMarkdown,
  formatVoiceListMarkdown,
  formatWidgetCode,
  formatOutboundCallMarkdown,
  formatBatchCallMarkdown,
  formatBatchCallListMarkdown,
  formatBatchCallDetailMarkdown,
  formatPhoneNumberListMarkdown,
  formatPhoneNumberMarkdown,
  formatPhoneNumberImportMarkdown,
  formatAsJSON,
  formatResponse
} from "../../services/formatters.js";
import { ResponseFormat } from "../../types.js";
import {
  mockAgent,
  mockAgentMinimal,
  mockConversation,
  mockConversationInProgress,
  mockTool,
  mockToolWithEnum,
  mockVoice,
  mockVoiceMale,
  mockBatchCall,
  mockBatchCallDetailed,
  mockBatchCallsList,
  mockPhoneNumber,
  mockPhoneNumberUnassigned,
  mockOutboundCallSuccess,
  mockOutboundCallFailed,
  mockImportPhoneNumber
} from "../mocks/fixtures.js";

describe("Response Formatters", () => {
  describe("formatAgentMarkdown", () => {
    it("should format a full agent configuration", () => {
      const result = formatAgentMarkdown(mockAgent);

      expect(result).toContain("# Agent: Test Support Agent");
      expect(result).toContain("ag_test123");
      expect(result).toContain("## Configuration");
      expect(result).toContain("**LLM**: claude-sonnet-4-5@20250929");
      expect(result).toContain("**Voice ID**: 21m00Tcm4TlvDq8ikWAM");
      expect(result).toContain("**Voice Model**: eleven_turbo_v2_5");
      expect(result).toContain("**Language**: en");
      expect(result).toContain("**Temperature**: 0.7");
      expect(result).toContain("**First Message**:");
      expect(result).toContain("## System Prompt");
      expect(result).toContain("helpful customer support agent");
      expect(result).toContain("## Widget Settings");
      expect(result).toContain("#FF5733");
    });

    it("should format a minimal agent", () => {
      const result = formatAgentMarkdown(mockAgentMinimal);

      expect(result).toContain("# Agent: Minimal Agent");
      expect(result).toContain("ag_minimal789");
      expect(result).not.toContain("**Temperature**:");
      expect(result).not.toContain("## Widget Settings");
    });

    it("should include tools section when tools are present", () => {
      const agentWithTools = {
        ...mockAgent,
        conversation_config: {
          ...mockAgent.conversation_config,
          agent: {
            ...mockAgent.conversation_config.agent,
            prompt: {
              ...mockAgent.conversation_config.agent.prompt,
              tools: [mockTool]
            }
          }
        }
      };

      const result = formatAgentMarkdown(agentWithTools);

      expect(result).toContain("## Tools (1)");
      expect(result).toContain("check_order_status");
    });

    it("should include knowledge base section when present", () => {
      const agentWithKB = {
        ...mockAgent,
        conversation_config: {
          ...mockAgent.conversation_config,
          agent: {
            ...mockAgent.conversation_config.agent,
            prompt: {
              ...mockAgent.conversation_config.agent.prompt,
              knowledge_base: ["doc1", "doc2"]
            }
          }
        }
      };

      const result = formatAgentMarkdown(agentWithKB);

      expect(result).toContain("## Knowledge Base (2 documents)");
    });
  });

  describe("formatAgentListMarkdown", () => {
    it("should format a list of agents", () => {
      const result = formatAgentListMarkdown(
        [mockAgent, mockAgentMinimal],
        2,
        0,
        false
      );

      expect(result).toContain("# Agents (2 of 2)");
      expect(result).toContain("## 1. Test Support Agent");
      expect(result).toContain("## 2. Minimal Agent");
      expect(result).not.toContain("More agents available");
    });

    it("should show pagination message when more agents exist", () => {
      const result = formatAgentListMarkdown(
        [mockAgent],
        50,
        0,
        true
      );

      expect(result).toContain("More agents available");
      expect(result).toContain("offset=1");
    });

    it("should handle empty agent list", () => {
      const result = formatAgentListMarkdown([], 0, 0, false);

      expect(result).toContain("# Agents (0 of 0)");
      expect(result).toContain("No agents found");
    });

    it("should include offset in numbering", () => {
      const result = formatAgentListMarkdown(
        [mockAgent],
        10,
        5,
        false
      );

      expect(result).toContain("## 6. Test Support Agent");
    });
  });

  describe("formatConversationMarkdown", () => {
    it("should format a complete conversation", () => {
      const result = formatConversationMarkdown(mockConversation);

      expect(result).toContain("# Conversation: conv_test456");
      expect(result).toContain("**Agent ID**: ag_test123");
      expect(result).toContain("**Status**: completed");
      expect(result).toContain("**Duration**: 330s");
      expect(result).toContain("## Transcript");
      expect(result).toContain("AGENT");
      expect(result).toContain("USER");
      expect(result).toContain("## Analysis");
      expect(result).toContain("**User Sentiment**: positive");
      expect(result).toContain("**Agent Performance**: 8/10");
    });

    it("should format conversation in progress", () => {
      const result = formatConversationMarkdown(mockConversationInProgress);

      expect(result).toContain("**Status**: in_progress");
      expect(result).not.toContain("**Ended**:");
      expect(result).not.toContain("**Duration**:");
    });

    it("should include tool calls in transcript", () => {
      const result = formatConversationMarkdown(mockConversation);

      expect(result).toContain("Tool calls: lookup_order");
    });
  });

  describe("formatConversationListMarkdown", () => {
    it("should format a list of conversations", () => {
      const result = formatConversationListMarkdown(
        [mockConversation, mockConversationInProgress],
        2,
        0,
        false
      );

      expect(result).toContain("# Conversations (2 of 2)");
      expect(result).toContain("conv_test456");
      expect(result).toContain("conv_active789");
    });

    it("should handle empty conversation list", () => {
      const result = formatConversationListMarkdown([], 0, 0, false);

      expect(result).toContain("No conversations found");
    });

    it("should show pagination when more exist", () => {
      const result = formatConversationListMarkdown(
        [mockConversation],
        100,
        20,
        true
      );

      expect(result).toContain("More conversations available");
    });
  });

  describe("formatToolMarkdown", () => {
    it("should format a webhook tool", () => {
      const result = formatToolMarkdown(mockTool);

      expect(result).toContain("# Tool: check_order_status");
      expect(result).toContain("**Type**: webhook");
      expect(result).toContain("**URL**: https://api.example.com/orders/status");
      expect(result).toContain("**Method**: POST");
      expect(result).toContain("## Parameters");
      expect(result).toContain("**order_id** (string) *required*");
      expect(result).toContain("**include_history** (boolean)");
    });

    it("should include enum values for parameters", () => {
      const result = formatToolMarkdown(mockToolWithEnum);

      expect(result).toContain("Options: fedex, ups, usps");
    });
  });

  describe("formatToolListMarkdown", () => {
    it("should format a list of tools", () => {
      const result = formatToolListMarkdown([mockTool, mockToolWithEnum]);

      expect(result).toContain("# Tools (2)");
      expect(result).toContain("check_order_status");
      expect(result).toContain("get_shipping_rates");
    });

    it("should handle empty tools list", () => {
      const result = formatToolListMarkdown([]);

      expect(result).toContain("No tools configured");
    });
  });

  describe("formatVoiceListMarkdown", () => {
    it("should format a list of voices", () => {
      const result = formatVoiceListMarkdown([mockVoice, mockVoiceMale]);

      expect(result).toContain("# Voices (2)");
      expect(result).toContain("Rachel");
      expect(result).toContain("Adam");
      expect(result).toContain("**Gender**: female");
      expect(result).toContain("**Gender**: male");
      expect(result).toContain("**Age**: middle_aged");
      expect(result).toContain("**Preview**:");
    });

    it("should handle empty voice list", () => {
      const result = formatVoiceListMarkdown([]);

      expect(result).toContain("No voices found matching the criteria");
    });
  });

  describe("formatWidgetCode", () => {
    it("should generate basic widget code", () => {
      const result = formatWidgetCode("ag_test123");

      expect(result).toContain("# Widget Embed Code");
      expect(result).toContain('agentId: "ag_test123"');
      expect(result).toContain("elevenlabs.io/convai-widget/index.js");
    });

    it("should include color when provided", () => {
      const result = formatWidgetCode("ag_test123", "#FF5733");

      expect(result).toContain('color: "#FF5733"');
    });

    it("should include avatar URL when provided", () => {
      const result = formatWidgetCode("ag_test123", undefined, "https://example.com/avatar.png");

      expect(result).toContain('avatarUrl: "https://example.com/avatar.png"');
    });

    it("should include both color and avatar when provided", () => {
      const result = formatWidgetCode("ag_test123", "#FF5733", "https://example.com/avatar.png");

      expect(result).toContain('color: "#FF5733"');
      expect(result).toContain('avatarUrl: "https://example.com/avatar.png"');
    });
  });

  describe("formatOutboundCallMarkdown", () => {
    it("should format a successful call response", () => {
      const result = formatOutboundCallMarkdown(mockOutboundCallSuccess);

      expect(result).toContain("# Outbound Call Initiated");
      expect(result).toContain("✓ Success");
      expect(result).toContain("**Conversation ID**: conv_outbound123");
      expect(result).toContain("**Twilio Call SID**: CA1234567890abcdef");
    });

    it("should format a failed call response", () => {
      const result = formatOutboundCallMarkdown(mockOutboundCallFailed);

      expect(result).toContain("# Outbound Call Failed");
      expect(result).toContain("✗ Failed");
      expect(result).toContain("Phone number not found");
    });
  });

  describe("formatBatchCallMarkdown", () => {
    it("should format a batch call response", () => {
      const result = formatBatchCallMarkdown(mockBatchCall);

      expect(result).toContain("# Batch Call: Q4 Customer Survey");
      expect(result).toContain("**Batch ID**: batch_test123");
      expect(result).toContain("**Status**: in_progress");
      expect(result).toContain("**Agent**: Test Support Agent");
      expect(result).toContain("## Timing");
      expect(result).toContain("## Call Statistics");
      expect(result).toContain("**Calls Dispatched**: 150");
      expect(result).toContain("**Calls Scheduled**: 500");
    });
  });

  describe("formatBatchCallListMarkdown", () => {
    it("should format a list of batch calls", () => {
      const result = formatBatchCallListMarkdown(mockBatchCallsList);

      expect(result).toContain("# Batch Calls (1)");
      expect(result).toContain("Q4 Customer Survey");
      expect(result).toContain("More batches available");
    });

    it("should handle empty batch list", () => {
      const result = formatBatchCallListMarkdown({
        batch_calls: [],
        next_doc: null,
        has_more: false
      });

      expect(result).toContain("No batch calling jobs found");
    });
  });

  describe("formatBatchCallDetailMarkdown", () => {
    it("should format detailed batch call with recipients", () => {
      const result = formatBatchCallDetailMarkdown(mockBatchCallDetailed);

      expect(result).toContain("## Recipients (3)");
      expect(result).toContain("**Status Summary**:");
      expect(result).toContain("completed: 1");
      expect(result).toContain("pending: 1");
      expect(result).toContain("failed: 1");
      expect(result).toContain("+14155551234");
    });
  });

  describe("formatPhoneNumberListMarkdown", () => {
    it("should format a list of phone numbers", () => {
      const result = formatPhoneNumberListMarkdown([
        mockPhoneNumber,
        mockPhoneNumberUnassigned
      ]);

      expect(result).toContain("# Phone Numbers (2)");
      expect(result).toContain("Customer Support Line");
      expect(result).toContain("**Inbound**: ✓");
      expect(result).toContain("**Outbound**: ✓");
      expect(result).toContain("**Assigned Agent**: Test Support Agent");
      expect(result).toContain("**Assigned Agent**: None");
    });

    it("should handle empty phone number list", () => {
      const result = formatPhoneNumberListMarkdown([]);

      expect(result).toContain("No phone numbers found");
    });
  });

  describe("formatPhoneNumberMarkdown", () => {
    it("should format a phone number with assigned agent", () => {
      const result = formatPhoneNumberMarkdown(mockPhoneNumber);

      expect(result).toContain("# Phone Number: Customer Support Line");
      expect(result).toContain("**Number**: +14155551234");
      expect(result).toContain("**Provider**: twilio");
      expect(result).toContain("## Capabilities");
      expect(result).toContain("## Assigned Agent");
      expect(result).toContain("**Name**: Test Support Agent");
    });

    it("should format a phone number without assigned agent", () => {
      const result = formatPhoneNumberMarkdown(mockPhoneNumberUnassigned);

      expect(result).toContain("No agent currently assigned");
    });
  });

  describe("formatPhoneNumberImportMarkdown", () => {
    it("should format phone number import response", () => {
      const result = formatPhoneNumberImportMarkdown(mockImportPhoneNumber);

      expect(result).toContain("# Phone Number Imported Successfully");
      expect(result).toContain("**Phone Number ID**: pn_newimport789");
      expect(result).toContain("**Next Steps**:");
    });
  });

  describe("formatAsJSON", () => {
    it("should format data as JSON string", () => {
      const result = formatAsJSON({ key: "value", nested: { a: 1 } });

      expect(result).toBe(JSON.stringify({ key: "value", nested: { a: 1 } }, null, 2));
    });

    it("should handle arrays", () => {
      const result = formatAsJSON([1, 2, 3]);

      expect(result).toBe(JSON.stringify([1, 2, 3], null, 2));
    });

    it("should handle null", () => {
      const result = formatAsJSON(null);

      expect(result).toBe("null");
    });
  });

  describe("formatResponse", () => {
    it("should return JSON for JSON format", () => {
      const result = formatResponse(mockAgent, ResponseFormat.JSON, "agent");

      expect(JSON.parse(result)).toEqual(mockAgent);
    });

    it("should return markdown for MARKDOWN format", () => {
      const result = formatResponse(mockAgent, ResponseFormat.MARKDOWN, "agent");

      expect(result).toContain("# Agent:");
    });

    it("should handle agent type", () => {
      const result = formatResponse(mockAgent, ResponseFormat.MARKDOWN, "agent");

      expect(result).toContain("Test Support Agent");
    });

    it("should handle agent_list type", () => {
      const result = formatResponse(
        { items: [mockAgent], total: 1, count: 1, offset: 0, has_more: false },
        ResponseFormat.MARKDOWN,
        "agent_list"
      );

      expect(result).toContain("# Agents");
    });

    it("should handle conversation type", () => {
      const result = formatResponse(mockConversation, ResponseFormat.MARKDOWN, "conversation");

      expect(result).toContain("# Conversation:");
    });

    it("should handle conversation_list type", () => {
      const result = formatResponse(
        { items: [mockConversation], total: 1, count: 1, offset: 0, has_more: false },
        ResponseFormat.MARKDOWN,
        "conversation_list"
      );

      expect(result).toContain("# Conversations");
    });

    it("should handle tool type", () => {
      const result = formatResponse(mockTool, ResponseFormat.MARKDOWN, "tool");

      expect(result).toContain("# Tool:");
    });

    it("should handle tool_list type", () => {
      const result = formatResponse([mockTool], ResponseFormat.MARKDOWN, "tool_list");

      expect(result).toContain("# Tools");
    });

    it("should handle voice_list type", () => {
      const result = formatResponse([mockVoice], ResponseFormat.MARKDOWN, "voice_list");

      expect(result).toContain("# Voices");
    });

    it("should handle outbound_call type", () => {
      const result = formatResponse(mockOutboundCallSuccess, ResponseFormat.MARKDOWN, "outbound_call");

      expect(result).toContain("# Outbound Call");
    });

    it("should handle batch_call type", () => {
      const result = formatResponse(mockBatchCall, ResponseFormat.MARKDOWN, "batch_call");

      expect(result).toContain("# Batch Call:");
    });

    it("should handle batch_call_list type", () => {
      const result = formatResponse(mockBatchCallsList, ResponseFormat.MARKDOWN, "batch_call_list");

      expect(result).toContain("# Batch Calls");
    });

    it("should handle batch_call_detail type", () => {
      const result = formatResponse(mockBatchCallDetailed, ResponseFormat.MARKDOWN, "batch_call_detail");

      expect(result).toContain("## Recipients");
    });

    it("should handle phone_number_list type", () => {
      const result = formatResponse([mockPhoneNumber], ResponseFormat.MARKDOWN, "phone_number_list");

      expect(result).toContain("# Phone Numbers");
    });

    it("should handle phone_number type", () => {
      const result = formatResponse(mockPhoneNumber, ResponseFormat.MARKDOWN, "phone_number");

      expect(result).toContain("# Phone Number:");
    });

    it("should handle phone_number_import type", () => {
      const result = formatResponse(mockImportPhoneNumber, ResponseFormat.MARKDOWN, "phone_number_import");

      expect(result).toContain("# Phone Number Imported");
    });

    it("should handle generic type as JSON", () => {
      const data = { custom: "data" };
      const result = formatResponse(data, ResponseFormat.MARKDOWN, "generic");

      expect(JSON.parse(result)).toEqual(data);
    });

    it("should handle widget type by returning data as-is", () => {
      const widgetCode = "Some widget code";
      const result = formatResponse(widgetCode, ResponseFormat.MARKDOWN, "widget");

      expect(result).toBe(widgetCode);
    });
  });
});
