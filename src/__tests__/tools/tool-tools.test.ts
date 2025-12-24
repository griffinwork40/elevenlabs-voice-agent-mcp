/**
 * Tests for agent tool management tools
 *
 * Tests creating, listing, and deleting webhook tools for agents.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import {
  elevenlabs_create_webhook_tool,
  elevenlabs_list_tools,
  elevenlabs_delete_tool
} from "../../tools/tool-tools.js";
import {
  mockAgent,
  mockTool,
  mockToolWithEnum
} from "../mocks/fixtures.js";
import { ResponseFormat } from "../../types.js";

// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios);

describe("Tool Management Tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ELEVENLABS_API_KEY = "test_api_key_12345";
  });

  describe("elevenlabs_create_webhook_tool", () => {
    it("should have correct tool metadata", () => {
      expect(elevenlabs_create_webhook_tool.name).toBe("elevenlabs_create_webhook_tool");
      expect(elevenlabs_create_webhook_tool.description).toContain("webhook tool");
      expect(elevenlabs_create_webhook_tool.annotations?.readOnlyHint).toBe(false);
    });

    it("should create a webhook tool with all parameters", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockTool });

      const result = await elevenlabs_create_webhook_tool.handler({
        agent_id: "ag_test123",
        name: "check_order_status",
        description: "Check the status of a customer order by order ID.",
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
        ],
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("check_order_status");
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          url: expect.stringContaining("/convai/agents/ag_test123/tools"),
          data: expect.objectContaining({
            name: "check_order_status",
            description: "Check the status of a customer order by order ID.",
            type: "webhook",
            url: "https://api.example.com/orders/status",
            method: "POST",
            headers: { "Authorization": "Bearer token123" },
            parameters: expect.arrayContaining([
              expect.objectContaining({ name: "order_id", required: true })
            ])
          })
        })
      );
    });

    it("should create a tool with enum parameters", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockToolWithEnum });

      const result = await elevenlabs_create_webhook_tool.handler({
        agent_id: "ag_test123",
        name: "get_shipping_rates",
        description: "Get shipping rates for different carriers.",
        url: "https://api.example.com/shipping/rates",
        method: "GET",
        parameters: [
          {
            name: "carrier",
            type: "string",
            description: "Shipping carrier",
            required: true,
            enum: ["fedex", "ups", "usps"]
          }
        ],
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("get_shipping_rates");
    });

    it("should create a tool with default method", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockTool });

      await elevenlabs_create_webhook_tool.handler({
        agent_id: "ag_test123",
        name: "simple_tool",
        description: "A simple webhook tool.",
        url: "https://api.example.com/simple",
        parameters: [],
        response_format: ResponseFormat.MARKDOWN
      });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            method: "POST"
          })
        })
      );
    });

    it("should return JSON format", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockTool });

      const result = await elevenlabs_create_webhook_tool.handler({
        agent_id: "ag_test123",
        name: "test_tool",
        description: "A test webhook tool for testing.",
        url: "https://api.example.com/test",
        parameters: [],
        response_format: ResponseFormat.JSON
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.name).toBe("check_order_status");
      expect(parsed.type).toBe("webhook");
    });

    it("should validate tool name format", async () => {
      await expect(
        elevenlabs_create_webhook_tool.handler({
          agent_id: "ag_test123",
          name: "invalid name with spaces!",
          description: "A test webhook tool.",
          url: "https://api.example.com/test",
          parameters: [],
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow();
    });

    it("should validate description minimum length", async () => {
      await expect(
        elevenlabs_create_webhook_tool.handler({
          agent_id: "ag_test123",
          name: "test_tool",
          description: "Too short",
          url: "https://api.example.com/test",
          parameters: [],
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow();
    });

    it("should validate URL format", async () => {
      await expect(
        elevenlabs_create_webhook_tool.handler({
          agent_id: "ag_test123",
          name: "test_tool",
          description: "A valid description here.",
          url: "not-a-valid-url",
          parameters: [],
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow();
    });

    it("should handle API error for non-existent agent", async () => {
      const error = {
        response: { status: 404, data: { detail: "Agent not found" } },
        isAxiosError: true
      };
      mockedAxios.mockRejectedValueOnce(error);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      await expect(
        elevenlabs_create_webhook_tool.handler({
          agent_id: "ag_nonexistent",
          name: "test_tool",
          description: "A valid description here.",
          url: "https://api.example.com/test",
          parameters: [],
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow("not found");
    });
  });

  describe("elevenlabs_list_tools", () => {
    it("should have correct tool metadata", () => {
      expect(elevenlabs_list_tools.name).toBe("elevenlabs_list_tools");
      expect(elevenlabs_list_tools.annotations?.readOnlyHint).toBe(true);
    });

    it("should list tools for an agent", async () => {
      const agentWithTools = {
        ...mockAgent,
        conversation_config: {
          ...mockAgent.conversation_config,
          agent: {
            ...mockAgent.conversation_config.agent,
            prompt: {
              ...mockAgent.conversation_config.agent.prompt,
              tools: [mockTool, mockToolWithEnum]
            }
          }
        }
      };
      mockedAxios.mockResolvedValueOnce({ data: agentWithTools });

      const result = await elevenlabs_list_tools.handler({
        agent_id: "ag_test123",
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("Tools (2)");
      expect(result.content[0].text).toContain("check_order_status");
      expect(result.content[0].text).toContain("get_shipping_rates");
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: expect.stringContaining("/convai/agents/ag_test123")
        })
      );
    });

    it("should return JSON format", async () => {
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
      mockedAxios.mockResolvedValueOnce({ data: agentWithTools });

      const result = await elevenlabs_list_tools.handler({
        agent_id: "ag_test123",
        response_format: ResponseFormat.JSON
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe("check_order_status");
    });

    it("should handle agent with no tools", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockAgent });

      const result = await elevenlabs_list_tools.handler({
        agent_id: "ag_test123",
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("No tools configured");
    });

    it("should handle API error for non-existent agent", async () => {
      const error = {
        response: { status: 404, data: { detail: "Agent not found" } },
        isAxiosError: true
      };
      mockedAxios.mockRejectedValueOnce(error);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      await expect(
        elevenlabs_list_tools.handler({
          agent_id: "ag_nonexistent",
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow("not found");
    });
  });

  describe("elevenlabs_delete_tool", () => {
    it("should have correct tool metadata", () => {
      expect(elevenlabs_delete_tool.name).toBe("elevenlabs_delete_tool");
      expect(elevenlabs_delete_tool.annotations?.destructiveHint).toBe(true);
    });

    it("should delete a tool from agent", async () => {
      mockedAxios.mockResolvedValueOnce({ data: {} });

      const result = await elevenlabs_delete_tool.handler({
        agent_id: "ag_test123",
        tool_name: "check_order_status"
      });

      expect(result.content[0].text).toContain("Successfully deleted tool");
      expect(result.content[0].text).toContain("check_order_status");
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "DELETE",
          url: expect.stringContaining("/convai/agents/ag_test123/tools/check_order_status")
        })
      );
    });

    it("should handle API error for non-existent tool", async () => {
      const error = {
        response: { status: 404, data: { detail: "Tool not found" } },
        isAxiosError: true
      };
      mockedAxios.mockRejectedValueOnce(error);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      await expect(
        elevenlabs_delete_tool.handler({
          agent_id: "ag_test123",
          tool_name: "nonexistent_tool"
        })
      ).rejects.toThrow("not found");
    });

    it("should validate tool_name is required", async () => {
      await expect(
        elevenlabs_delete_tool.handler({
          agent_id: "ag_test123",
          tool_name: ""
        })
      ).rejects.toThrow();
    });

    it("should validate agent_id is required", async () => {
      await expect(
        elevenlabs_delete_tool.handler({
          agent_id: "",
          tool_name: "test_tool"
        })
      ).rejects.toThrow();
    });
  });
});
