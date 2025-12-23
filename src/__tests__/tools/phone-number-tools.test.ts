/**
 * Tests for phone number management tools
 *
 * Tests listing, importing, updating, and deleting phone numbers.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import {
  elevenlabs_list_phone_numbers,
  elevenlabs_get_phone_number,
  elevenlabs_import_phone_number,
  elevenlabs_update_phone_number,
  elevenlabs_delete_phone_number
} from "../../tools/phone-number-tools.js";
import {
  mockPhoneNumber,
  mockPhoneNumberUnassigned,
  mockImportPhoneNumber
} from "../mocks/fixtures.js";
import { ResponseFormat } from "../../types.js";

// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios);

describe("Phone Number Tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ELEVENLABS_API_KEY = "test_api_key_12345";
  });

  describe("elevenlabs_list_phone_numbers", () => {
    it("should have correct tool metadata", () => {
      expect(elevenlabs_list_phone_numbers.name).toBe("elevenlabs_list_phone_numbers");
      expect(elevenlabs_list_phone_numbers.annotations?.readOnlyHint).toBe(true);
    });

    it("should list all phone numbers", async () => {
      mockedAxios.mockResolvedValueOnce({
        data: [mockPhoneNumber, mockPhoneNumberUnassigned]
      });

      const result = await elevenlabs_list_phone_numbers.handler({
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("Phone Numbers");
      expect(result.content[0].text).toContain("Customer Support Line");
      expect(result.content[0].text).toContain("Backup Line");
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: expect.stringContaining("/convai/phone-numbers")
        })
      );
    });

    it("should return JSON format", async () => {
      mockedAxios.mockResolvedValueOnce({
        data: [mockPhoneNumber]
      });

      const result = await elevenlabs_list_phone_numbers.handler({
        response_format: ResponseFormat.JSON
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].phone_number_id).toBe("pn_test123");
    });

    it("should handle empty phone number list", async () => {
      mockedAxios.mockResolvedValueOnce({ data: [] });

      const result = await elevenlabs_list_phone_numbers.handler({
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("No phone numbers found");
    });
  });

  describe("elevenlabs_get_phone_number", () => {
    it("should have correct tool metadata", () => {
      expect(elevenlabs_get_phone_number.name).toBe("elevenlabs_get_phone_number");
      expect(elevenlabs_get_phone_number.annotations?.readOnlyHint).toBe(true);
    });

    it("should get phone number details", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockPhoneNumber });

      const result = await elevenlabs_get_phone_number.handler({
        phone_number_id: "pn_test123",
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("Customer Support Line");
      expect(result.content[0].text).toContain("+14155551234");
      expect(result.content[0].text).toContain("Assigned Agent");
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/convai/phone-numbers/pn_test123")
        })
      );
    });

    it("should return JSON format", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockPhoneNumber });

      const result = await elevenlabs_get_phone_number.handler({
        phone_number_id: "pn_test123",
        response_format: ResponseFormat.JSON
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.phone_number).toBe("+14155551234");
      expect(parsed.assigned_agent.agent_id).toBe("ag_test123");
    });

    it("should handle unassigned phone number", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockPhoneNumberUnassigned });

      const result = await elevenlabs_get_phone_number.handler({
        phone_number_id: "pn_backup456",
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("No agent currently assigned");
    });

    it("should handle API error for non-existent phone number", async () => {
      const error = {
        response: { status: 404, data: { detail: "Phone number not found" } },
        isAxiosError: true
      };
      mockedAxios.mockRejectedValueOnce(error);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      await expect(
        elevenlabs_get_phone_number.handler({
          phone_number_id: "pn_nonexistent",
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow("not found");
    });
  });

  describe("elevenlabs_import_phone_number", () => {
    it("should have correct tool metadata", () => {
      expect(elevenlabs_import_phone_number.name).toBe("elevenlabs_import_phone_number");
      expect(elevenlabs_import_phone_number.annotations?.readOnlyHint).toBe(false);
    });

    it("should import a Twilio phone number", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockImportPhoneNumber });

      const result = await elevenlabs_import_phone_number.handler({
        phone_number: "+14155551234",
        label: "New Support Line",
        sid: "ACtest123456",
        token: "auth_token_123",
        provider: "twilio",
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("Imported Successfully");
      expect(result.content[0].text).toContain("pn_newimport789");
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          url: expect.stringContaining("/convai/phone-numbers"),
          data: expect.objectContaining({
            phone_number: "+14155551234",
            label: "New Support Line",
            sid: "ACtest123456",
            token: "auth_token_123",
            provider: "twilio"
          })
        })
      );
    });

    it("should import with custom inbound/outbound settings", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockImportPhoneNumber });

      await elevenlabs_import_phone_number.handler({
        phone_number: "+14155551234",
        label: "Outbound Only",
        sid: "ACtest123456",
        token: "auth_token_123",
        provider: "twilio",
        supports_inbound: false,
        supports_outbound: true,
        response_format: ResponseFormat.MARKDOWN
      });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            supports_inbound: false,
            supports_outbound: true
          })
        })
      );
    });

    it("should import with region configuration", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockImportPhoneNumber });

      await elevenlabs_import_phone_number.handler({
        phone_number: "+14155551234",
        label: "Regional Line",
        sid: "ACtest123456",
        token: "auth_token_123",
        provider: "twilio",
        region_config: {
          region_id: "us1",
          token: "region_token_123",
          edge_location: "ashburn"
        },
        response_format: ResponseFormat.MARKDOWN
      });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            region_config: {
              region_id: "us1",
              token: "region_token_123",
              edge_location: "ashburn"
            }
          })
        })
      );
    });

    it("should return JSON format", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockImportPhoneNumber });

      const result = await elevenlabs_import_phone_number.handler({
        phone_number: "+14155551234",
        label: "Test Line",
        sid: "ACtest123456",
        token: "auth_token_123",
        provider: "twilio",
        response_format: ResponseFormat.JSON
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.phone_number_id).toBe("pn_newimport789");
    });

    it("should validate phone number format", async () => {
      await expect(
        elevenlabs_import_phone_number.handler({
          phone_number: "invalid",
          label: "Test",
          sid: "ACtest123456",
          token: "auth_token_123",
          provider: "twilio",
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow();
    });

    it("should validate required fields", async () => {
      await expect(
        elevenlabs_import_phone_number.handler({
          phone_number: "+14155551234",
          label: "",
          sid: "ACtest123456",
          token: "auth_token_123",
          provider: "twilio",
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow();
    });
  });

  describe("elevenlabs_update_phone_number", () => {
    it("should have correct tool metadata", () => {
      expect(elevenlabs_update_phone_number.name).toBe("elevenlabs_update_phone_number");
      expect(elevenlabs_update_phone_number.annotations?.destructiveHint).toBe(false);
    });

    it("should assign agent to phone number", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockPhoneNumber });

      const result = await elevenlabs_update_phone_number.handler({
        phone_number_id: "pn_test123",
        agent_id: "ag_newagent456",
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("Phone Number");
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "PATCH",
          url: expect.stringContaining("/convai/phone-numbers/pn_test123"),
          data: expect.objectContaining({
            agent_id: "ag_newagent456"
          })
        })
      );
    });

    it("should unassign agent from phone number", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockPhoneNumberUnassigned });

      await elevenlabs_update_phone_number.handler({
        phone_number_id: "pn_test123",
        agent_id: null,
        response_format: ResponseFormat.MARKDOWN
      });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            agent_id: null
          })
        })
      );
    });

    it("should update LiveKit stack", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockPhoneNumber });

      await elevenlabs_update_phone_number.handler({
        phone_number_id: "pn_test123",
        livekit_stack: "static",
        response_format: ResponseFormat.MARKDOWN
      });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            livekit_stack: "static"
          })
        })
      );
    });

    it("should return JSON format", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockPhoneNumber });

      const result = await elevenlabs_update_phone_number.handler({
        phone_number_id: "pn_test123",
        agent_id: "ag_test123",
        response_format: ResponseFormat.JSON
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.phone_number_id).toBe("pn_test123");
    });

    it("should validate phone_number_id is required", async () => {
      await expect(
        elevenlabs_update_phone_number.handler({
          phone_number_id: "",
          agent_id: "ag_test123",
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow();
    });
  });

  describe("elevenlabs_delete_phone_number", () => {
    it("should have correct tool metadata", () => {
      expect(elevenlabs_delete_phone_number.name).toBe("elevenlabs_delete_phone_number");
      expect(elevenlabs_delete_phone_number.annotations?.destructiveHint).toBe(true);
    });

    it("should delete phone number", async () => {
      mockedAxios.mockResolvedValueOnce({ data: {} });

      const result = await elevenlabs_delete_phone_number.handler({
        phone_number_id: "pn_test123"
      });

      expect(result.content[0].text).toContain("Successfully deleted");
      expect(result.content[0].text).toContain("pn_test123");
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "DELETE",
          url: expect.stringContaining("/convai/phone-numbers/pn_test123")
        })
      );
    });

    it("should handle API error for non-existent phone number", async () => {
      const error = {
        response: { status: 404, data: { detail: "Phone number not found" } },
        isAxiosError: true
      };
      mockedAxios.mockRejectedValueOnce(error);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      await expect(
        elevenlabs_delete_phone_number.handler({
          phone_number_id: "pn_nonexistent"
        })
      ).rejects.toThrow("not found");
    });

    it("should validate phone_number_id format", async () => {
      await expect(
        elevenlabs_delete_phone_number.handler({
          phone_number_id: ""
        })
      ).rejects.toThrow();
    });
  });
});
