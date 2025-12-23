/**
 * Tests for conversation retrieval tools
 *
 * Tests conversation listing and transcript retrieval.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import {
  elevenlabs_get_conversation,
  elevenlabs_list_conversations
} from "../../tools/conversation-tools.js";
import {
  mockConversation,
  mockConversationInProgress
} from "../mocks/fixtures.js";
import { ResponseFormat } from "../../types.js";

// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios);

describe("Conversation Tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ELEVENLABS_API_KEY = "test_api_key_12345";
  });

  describe("elevenlabs_get_conversation", () => {
    it("should have correct tool metadata", () => {
      expect(elevenlabs_get_conversation.name).toBe("elevenlabs_get_conversation");
      expect(elevenlabs_get_conversation.description).toContain("transcript");
      expect(elevenlabs_get_conversation.annotations?.readOnlyHint).toBe(true);
    });

    it("should get conversation with full transcript", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockConversation });

      const result = await elevenlabs_get_conversation.handler({
        conversation_id: "conv_test456",
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("conv_test456");
      expect(result.content[0].text).toContain("Transcript");
      expect(result.content[0].text).toContain("AGENT");
      expect(result.content[0].text).toContain("USER");
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: expect.stringContaining("/convai/conversations/conv_test456")
        })
      );
    });

    it("should return JSON format with all details", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockConversation });

      const result = await elevenlabs_get_conversation.handler({
        conversation_id: "conv_test456",
        response_format: ResponseFormat.JSON
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.conversation_id).toBe("conv_test456");
      expect(parsed.status).toBe("completed");
      expect(parsed.transcript).toHaveLength(3);
      expect(parsed.analysis.user_sentiment).toBe("positive");
    });

    it("should get in-progress conversation", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockConversationInProgress });

      const result = await elevenlabs_get_conversation.handler({
        conversation_id: "conv_active789",
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("in_progress");
    });

    it("should handle API error for non-existent conversation", async () => {
      const error = {
        response: { status: 404, data: { detail: "Conversation not found" } },
        isAxiosError: true
      };
      mockedAxios.mockRejectedValueOnce(error);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      await expect(
        elevenlabs_get_conversation.handler({
          conversation_id: "conv_nonexistent",
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow("not found");
    });

    it("should validate conversation_id format", async () => {
      await expect(
        elevenlabs_get_conversation.handler({
          conversation_id: "",
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow();
    });

    it("should handle conversation_id with special characters", async () => {
      await expect(
        elevenlabs_get_conversation.handler({
          conversation_id: "invalid!@#$",
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow();
    });
  });

  describe("elevenlabs_list_conversations", () => {
    it("should have correct tool metadata", () => {
      expect(elevenlabs_list_conversations.name).toBe("elevenlabs_list_conversations");
      expect(elevenlabs_list_conversations.annotations?.readOnlyHint).toBe(true);
    });

    it("should list conversations with default pagination", async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { conversations: [mockConversation, mockConversationInProgress] }
      });

      const result = await elevenlabs_list_conversations.handler({
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("Conversations");
      expect(result.content[0].text).toContain("conv_test456");
      expect(result.content[0].text).toContain("conv_active789");
    });

    it("should filter by agent_id", async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { conversations: [mockConversation] }
      });

      await elevenlabs_list_conversations.handler({
        agent_id: "ag_test123",
        response_format: ResponseFormat.MARKDOWN
      });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ agent_id: "ag_test123" })
        })
      );
    });

    it("should filter by status", async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { conversations: [mockConversation] }
      });

      await elevenlabs_list_conversations.handler({
        status: "completed",
        response_format: ResponseFormat.MARKDOWN
      });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ status: "completed" })
        })
      );
    });

    it("should filter by date range", async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { conversations: [mockConversation] }
      });

      await elevenlabs_list_conversations.handler({
        date_range: {
          start: "2025-01-01T00:00:00Z",
          end: "2025-01-31T23:59:59Z"
        },
        response_format: ResponseFormat.MARKDOWN
      });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            start_date: "2025-01-01T00:00:00Z",
            end_date: "2025-01-31T23:59:59Z"
          })
        })
      );
    });

    it("should use custom pagination", async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { conversations: [mockConversation] }
      });

      await elevenlabs_list_conversations.handler({
        limit: 50,
        offset: 10,
        response_format: ResponseFormat.MARKDOWN
      });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ limit: 50, offset: 10 })
        })
      );
    });

    it("should return JSON format", async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { conversations: [mockConversation] }
      });

      const result = await elevenlabs_list_conversations.handler({
        response_format: ResponseFormat.JSON
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.items).toHaveLength(1);
      expect(parsed.total).toBe(1);
    });

    it("should handle empty conversation list", async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { conversations: [] }
      });

      const result = await elevenlabs_list_conversations.handler({
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("No conversations found");
    });

    it("should indicate when more conversations are available", async () => {
      const manyConversations = Array(20).fill(mockConversation);
      mockedAxios.mockResolvedValueOnce({
        data: { conversations: manyConversations }
      });

      const result = await elevenlabs_list_conversations.handler({
        limit: 20,
        offset: 0,
        response_format: ResponseFormat.JSON
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.has_more).toBe(true);
      expect(parsed.next_offset).toBe(20);
    });

    it("should combine multiple filters", async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { conversations: [mockConversation] }
      });

      await elevenlabs_list_conversations.handler({
        agent_id: "ag_test123",
        status: "completed",
        limit: 10,
        offset: 5,
        response_format: ResponseFormat.MARKDOWN
      });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            agent_id: "ag_test123",
            status: "completed",
            limit: 10,
            offset: 5
          })
        })
      );
    });
  });
});
