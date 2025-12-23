/**
 * Tests for outbound calling tools
 *
 * Tests single outbound call initiation via Twilio.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { elevenlabs_start_outbound_call } from "../../tools/outbound-tools.js";
import {
  mockOutboundCallSuccess,
  mockOutboundCallFailed
} from "../mocks/fixtures.js";
import { ResponseFormat } from "../../types.js";

// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios);

describe("Outbound Tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ELEVENLABS_API_KEY = "test_api_key_12345";
  });

  describe("elevenlabs_start_outbound_call", () => {
    it("should have correct tool metadata", () => {
      expect(elevenlabs_start_outbound_call.name).toBe("elevenlabs_start_outbound_call");
      expect(elevenlabs_start_outbound_call.description).toContain("outbound phone call");
      expect(elevenlabs_start_outbound_call.annotations?.readOnlyHint).toBe(false);
      expect(elevenlabs_start_outbound_call.annotations?.idempotentHint).toBe(false);
    });

    it("should initiate a basic outbound call", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockOutboundCallSuccess });

      const result = await elevenlabs_start_outbound_call.handler({
        agent_id: "ag_test123",
        agent_phone_number_id: "pn_test123",
        to_number: "+14155551234",
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("Initiated");
      expect(result.content[0].text).toContain("Success");
      expect(result.content[0].text).toContain("conv_outbound123");
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          url: expect.stringContaining("/convai/twilio/outbound-call"),
          data: expect.objectContaining({
            agent_id: "ag_test123",
            agent_phone_number_id: "pn_test123",
            to_number: "+14155551234"
          })
        })
      );
    });

    it("should initiate call with dynamic variables", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockOutboundCallSuccess });

      await elevenlabs_start_outbound_call.handler({
        agent_id: "ag_test123",
        agent_phone_number_id: "pn_test123",
        to_number: "+14155551234",
        conversation_initiation_client_data: {
          dynamic_variables: {
            customer_name: "John Smith",
            account_id: "12345",
            balance: 1500
          }
        },
        response_format: ResponseFormat.MARKDOWN
      });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            conversation_initiation_client_data: {
              dynamic_variables: {
                customer_name: "John Smith",
                account_id: "12345",
                balance: 1500
              }
            }
          })
        })
      );
    });

    it("should initiate call with config overrides", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockOutboundCallSuccess });

      await elevenlabs_start_outbound_call.handler({
        agent_id: "ag_test123",
        agent_phone_number_id: "pn_test123",
        to_number: "+14155551234",
        conversation_initiation_client_data: {
          dynamic_variables: { name: "Alice" },
          conversation_config_override: {
            agent: {
              first_message: "Hi Alice! This is a custom greeting."
            }
          }
        },
        response_format: ResponseFormat.MARKDOWN
      });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            conversation_initiation_client_data: expect.objectContaining({
              conversation_config_override: expect.objectContaining({
                agent: expect.objectContaining({
                  first_message: "Hi Alice! This is a custom greeting."
                })
              })
            })
          })
        })
      );
    });

    it("should return JSON format on success", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockOutboundCallSuccess });

      const result = await elevenlabs_start_outbound_call.handler({
        agent_id: "ag_test123",
        agent_phone_number_id: "pn_test123",
        to_number: "+14155551234",
        response_format: ResponseFormat.JSON
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.conversation_id).toBe("conv_outbound123");
      expect(parsed.callSid).toBe("CA1234567890abcdef");
    });

    it("should handle failed call response", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockOutboundCallFailed });

      const result = await elevenlabs_start_outbound_call.handler({
        agent_id: "ag_test123",
        agent_phone_number_id: "pn_invalid",
        to_number: "+14155551234",
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("Failed");
      expect(result.content[0].text).toContain("Phone number not found");
    });

    it("should validate phone number format (E.164)", async () => {
      await expect(
        elevenlabs_start_outbound_call.handler({
          agent_id: "ag_test123",
          agent_phone_number_id: "pn_test123",
          to_number: "1234567890", // Missing + prefix
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow();
    });

    it("should validate agent_id is required", async () => {
      await expect(
        elevenlabs_start_outbound_call.handler({
          agent_id: "",
          agent_phone_number_id: "pn_test123",
          to_number: "+14155551234",
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow();
    });

    it("should validate agent_phone_number_id is required", async () => {
      await expect(
        elevenlabs_start_outbound_call.handler({
          agent_id: "ag_test123",
          agent_phone_number_id: "",
          to_number: "+14155551234",
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
        elevenlabs_start_outbound_call.handler({
          agent_id: "ag_nonexistent",
          agent_phone_number_id: "pn_test123",
          to_number: "+14155551234",
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow("not found");
    });

    it("should handle API error for rate limiting", async () => {
      const error = {
        response: { status: 429, data: { detail: "Rate limit exceeded" } },
        isAxiosError: true
      };
      mockedAxios.mockRejectedValueOnce(error);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      await expect(
        elevenlabs_start_outbound_call.handler({
          agent_id: "ag_test123",
          agent_phone_number_id: "pn_test123",
          to_number: "+14155551234",
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow("Rate limit");
    });

    it("should accept international phone numbers", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockOutboundCallSuccess });

      await elevenlabs_start_outbound_call.handler({
        agent_id: "ag_test123",
        agent_phone_number_id: "pn_test123",
        to_number: "+447911123456", // UK number
        response_format: ResponseFormat.MARKDOWN
      });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            to_number: "+447911123456"
          })
        })
      );
    });
  });
});
