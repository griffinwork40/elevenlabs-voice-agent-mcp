/**
 * Tests for batch calling tools
 *
 * Tests batch call submission, listing, and detail retrieval.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import {
  elevenlabs_submit_batch_call,
  elevenlabs_list_batch_calls,
  elevenlabs_get_batch_call
} from "../../tools/batch-calling-tools.js";
import {
  mockBatchCall,
  mockBatchCallDetailed,
  mockBatchCallsList,
  validBatchCallInput
} from "../mocks/fixtures.js";
import { ResponseFormat } from "../../types.js";

// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios);

describe("Batch Calling Tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ELEVENLABS_API_KEY = "test_api_key_12345";
  });

  describe("elevenlabs_submit_batch_call", () => {
    it("should have correct tool metadata", () => {
      expect(elevenlabs_submit_batch_call.name).toBe("elevenlabs_submit_batch_call");
      expect(elevenlabs_submit_batch_call.description).toContain("batch calling job");
      expect(elevenlabs_submit_batch_call.annotations?.readOnlyHint).toBe(false);
      expect(elevenlabs_submit_batch_call.annotations?.idempotentHint).toBe(false);
    });

    it("should submit a batch call successfully", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockBatchCall });

      const result = await elevenlabs_submit_batch_call.handler({
        call_name: "Q4 Customer Survey",
        agent_id: "ag_test123",
        recipients: [
          { phone_number: "+14155551234" },
          { phone_number: "+14155555678" }
        ],
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("Q4 Customer Survey");
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          url: expect.stringContaining("/convai/batch-calling/submit"),
          data: expect.objectContaining({
            call_name: "Q4 Customer Survey",
            agent_id: "ag_test123",
            recipients: expect.arrayContaining([
              expect.objectContaining({ phone_number: "+14155551234" })
            ])
          })
        })
      );
    });

    it("should submit batch call with dynamic variables", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockBatchCall });

      await elevenlabs_submit_batch_call.handler({
        call_name: "Personalized Survey",
        agent_id: "ag_test123",
        recipients: [
          {
            phone_number: "+14155551234",
            conversation_initiation_client_data: {
              dynamic_variables: { name: "John", account_id: "123" }
            }
          }
        ],
        response_format: ResponseFormat.MARKDOWN
      });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            recipients: expect.arrayContaining([
              expect.objectContaining({
                conversation_initiation_client_data: expect.objectContaining({
                  dynamic_variables: { name: "John", account_id: "123" }
                })
              })
            ])
          })
        })
      );
    });

    it("should submit scheduled batch call", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockBatchCall });

      await elevenlabs_submit_batch_call.handler({
        call_name: "Scheduled Survey",
        agent_id: "ag_test123",
        recipients: [{ phone_number: "+14155551234" }],
        scheduled_time_unix: 1705400000,
        response_format: ResponseFormat.MARKDOWN
      });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            scheduled_time_unix: 1705400000
          })
        })
      );
    });

    it("should submit batch call with specific phone number ID", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockBatchCall });

      await elevenlabs_submit_batch_call.handler({
        call_name: "Test Batch",
        agent_id: "ag_test123",
        recipients: [{ phone_number: "+14155551234" }],
        agent_phone_number_id: "pn_specific123",
        response_format: ResponseFormat.MARKDOWN
      });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            agent_phone_number_id: "pn_specific123"
          })
        })
      );
    });

    it("should return JSON format", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockBatchCall });

      const result = await elevenlabs_submit_batch_call.handler({
        call_name: "Test Batch",
        agent_id: "ag_test123",
        recipients: [{ phone_number: "+14155551234" }],
        response_format: ResponseFormat.JSON
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.id).toBe("batch_test123");
    });

    it("should validate empty recipients array", async () => {
      await expect(
        elevenlabs_submit_batch_call.handler({
          call_name: "Test Batch",
          agent_id: "ag_test123",
          recipients: [],
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow();
    });

    it("should validate phone number format", async () => {
      await expect(
        elevenlabs_submit_batch_call.handler({
          call_name: "Test Batch",
          agent_id: "ag_test123",
          recipients: [{ phone_number: "invalid-phone" }],
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow();
    });
  });

  describe("elevenlabs_list_batch_calls", () => {
    it("should have correct tool metadata", () => {
      expect(elevenlabs_list_batch_calls.name).toBe("elevenlabs_list_batch_calls");
      expect(elevenlabs_list_batch_calls.annotations?.readOnlyHint).toBe(true);
    });

    it("should list batch calls with default pagination", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockBatchCallsList });

      const result = await elevenlabs_list_batch_calls.handler({
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("Batch Calls");
      expect(result.content[0].text).toContain("Q4 Customer Survey");
    });

    it("should list batch calls with custom limit", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockBatchCallsList });

      await elevenlabs_list_batch_calls.handler({
        limit: 50,
        response_format: ResponseFormat.MARKDOWN
      });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ limit: 50 })
        })
      );
    });

    it("should support cursor-based pagination", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockBatchCallsList });

      await elevenlabs_list_batch_calls.handler({
        limit: 20,
        last_doc: "cursor_abc123",
        response_format: ResponseFormat.MARKDOWN
      });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ last_doc: "cursor_abc123" })
        })
      );
    });

    it("should return JSON format", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockBatchCallsList });

      const result = await elevenlabs_list_batch_calls.handler({
        response_format: ResponseFormat.JSON
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.batch_calls).toHaveLength(1);
      expect(parsed.has_more).toBe(true);
    });

    it("should handle empty batch list", async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { batch_calls: [], next_doc: null, has_more: false }
      });

      const result = await elevenlabs_list_batch_calls.handler({
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("No batch calling jobs found");
    });
  });

  describe("elevenlabs_get_batch_call", () => {
    it("should have correct tool metadata", () => {
      expect(elevenlabs_get_batch_call.name).toBe("elevenlabs_get_batch_call");
      expect(elevenlabs_get_batch_call.annotations?.readOnlyHint).toBe(true);
    });

    it("should get batch call details", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockBatchCallDetailed });

      const result = await elevenlabs_get_batch_call.handler({
        batch_id: "batch_test123",
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("Q4 Customer Survey");
      expect(result.content[0].text).toContain("Recipients");
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: expect.stringContaining("/convai/batch-calling/batch_test123")
        })
      );
    });

    it("should return JSON format with recipient details", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockBatchCallDetailed });

      const result = await elevenlabs_get_batch_call.handler({
        batch_id: "batch_test123",
        response_format: ResponseFormat.JSON
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.recipients).toHaveLength(3);
      expect(parsed.recipients[0].status).toBe("completed");
    });

    it("should handle API error for non-existent batch", async () => {
      const error = {
        response: { status: 404, data: { detail: "Batch not found" } },
        isAxiosError: true
      };
      mockedAxios.mockRejectedValueOnce(error);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      await expect(
        elevenlabs_get_batch_call.handler({
          batch_id: "batch_nonexistent",
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow("not found");
    });

    it("should validate batch_id format", async () => {
      await expect(
        elevenlabs_get_batch_call.handler({
          batch_id: "",
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow();
    });
  });
});
