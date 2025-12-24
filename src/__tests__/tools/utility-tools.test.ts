/**
 * Tests for utility tools
 *
 * Tests widget generation and voice listing.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import {
  elevenlabs_generate_widget_code,
  elevenlabs_list_voices
} from "../../tools/utility-tools.js";
import {
  mockAgent,
  mockVoice,
  mockVoiceMale
} from "../mocks/fixtures.js";
import { ResponseFormat } from "../../types.js";

// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios);

describe("Utility Tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ELEVENLABS_API_KEY = "test_api_key_12345";
  });

  describe("elevenlabs_generate_widget_code", () => {
    it("should have correct tool metadata", () => {
      expect(elevenlabs_generate_widget_code.name).toBe("elevenlabs_generate_widget_code");
      expect(elevenlabs_generate_widget_code.description).toContain("widget");
      expect(elevenlabs_generate_widget_code.annotations?.readOnlyHint).toBe(true);
    });

    it("should generate basic widget code", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockAgent });

      const result = await elevenlabs_generate_widget_code.handler({
        agent_id: "ag_test123"
      });

      expect(result.content[0].text).toContain("Widget Embed Code");
      expect(result.content[0].text).toContain('agentId: "ag_test123"');
      expect(result.content[0].text).toContain("elevenlabs.io/convai-widget/index.js");

      // Verify agent exists check
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: expect.stringContaining("/convai/agents/ag_test123")
        })
      );
    });

    it("should generate widget code with custom color", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockAgent });

      const result = await elevenlabs_generate_widget_code.handler({
        agent_id: "ag_test123",
        color: "#FF5733"
      });

      expect(result.content[0].text).toContain('color: "#FF5733"');
    });

    it("should generate widget code with custom avatar", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockAgent });

      const result = await elevenlabs_generate_widget_code.handler({
        agent_id: "ag_test123",
        avatar_url: "https://example.com/avatar.png"
      });

      expect(result.content[0].text).toContain('avatarUrl: "https://example.com/avatar.png"');
    });

    it("should generate widget code with both color and avatar", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockAgent });

      const result = await elevenlabs_generate_widget_code.handler({
        agent_id: "ag_test123",
        color: "#00FF00",
        avatar_url: "https://example.com/custom-avatar.png"
      });

      expect(result.content[0].text).toContain('color: "#00FF00"');
      expect(result.content[0].text).toContain('avatarUrl: "https://example.com/custom-avatar.png"');
    });

    it("should handle API error for non-existent agent", async () => {
      const error = {
        response: { status: 404, data: { detail: "Agent not found" } },
        isAxiosError: true
      };
      mockedAxios.mockRejectedValueOnce(error);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      await expect(
        elevenlabs_generate_widget_code.handler({
          agent_id: "ag_nonexistent"
        })
      ).rejects.toThrow("not found");
    });

    it("should validate color format", async () => {
      await expect(
        elevenlabs_generate_widget_code.handler({
          agent_id: "ag_test123",
          color: "invalid-color"
        })
      ).rejects.toThrow();
    });

    it("should validate avatar URL format", async () => {
      await expect(
        elevenlabs_generate_widget_code.handler({
          agent_id: "ag_test123",
          avatar_url: "not-a-url"
        })
      ).rejects.toThrow();
    });
  });

  describe("elevenlabs_list_voices", () => {
    it("should have correct tool metadata", () => {
      expect(elevenlabs_list_voices.name).toBe("elevenlabs_list_voices");
      expect(elevenlabs_list_voices.annotations?.readOnlyHint).toBe(true);
    });

    it("should list voices with default parameters", async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { voices: [mockVoice, mockVoiceMale] }
      });

      const result = await elevenlabs_list_voices.handler({
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("Voices");
      expect(result.content[0].text).toContain("Rachel");
      expect(result.content[0].text).toContain("Adam");
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: expect.stringContaining("/voices")
        })
      );
    });

    it("should filter by language", async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { voices: [mockVoice] }
      });

      await elevenlabs_list_voices.handler({
        language: "en",
        response_format: ResponseFormat.MARKDOWN
      });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ language: "en" })
        })
      );
    });

    it("should filter by gender", async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { voices: [mockVoice] }
      });

      await elevenlabs_list_voices.handler({
        gender: "female",
        response_format: ResponseFormat.MARKDOWN
      });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ gender: "female" })
        })
      );
    });

    it("should filter by age", async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { voices: [mockVoice] }
      });

      await elevenlabs_list_voices.handler({
        age: "middle_aged",
        response_format: ResponseFormat.MARKDOWN
      });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ age: "middle_aged" })
        })
      );
    });

    it("should respect limit parameter", async () => {
      const manyVoices = Array(30).fill(mockVoice);
      mockedAxios.mockResolvedValueOnce({
        data: { voices: manyVoices }
      });

      const result = await elevenlabs_list_voices.handler({
        limit: 10,
        response_format: ResponseFormat.JSON
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveLength(10);
    });

    it("should return JSON format", async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { voices: [mockVoice] }
      });

      const result = await elevenlabs_list_voices.handler({
        response_format: ResponseFormat.JSON
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].voice_id).toBe("21m00Tcm4TlvDq8ikWAM");
    });

    it("should handle empty voice list", async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { voices: [] }
      });

      const result = await elevenlabs_list_voices.handler({
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("No voices found");
    });

    it("should combine multiple filters", async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { voices: [mockVoice] }
      });

      await elevenlabs_list_voices.handler({
        language: "en",
        gender: "female",
        age: "middle_aged",
        limit: 5,
        response_format: ResponseFormat.MARKDOWN
      });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            language: "en",
            gender: "female",
            age: "middle_aged"
          })
        })
      );
    });

    it("should handle null voices response", async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { voices: null }
      });

      const result = await elevenlabs_list_voices.handler({
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("No voices found");
    });
  });
});
