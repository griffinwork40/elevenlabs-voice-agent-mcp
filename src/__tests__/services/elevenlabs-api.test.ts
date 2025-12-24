/**
 * Tests for ElevenLabs API client service
 *
 * Tests HTTP request functionality, authentication, and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import {
  makeElevenLabsRequest,
  getRequest,
  postRequest,
  putRequest,
  patchRequest,
  deleteRequest
} from "../../services/elevenlabs-api.js";
import { API_BASE_URL, REQUEST_TIMEOUT } from "../../constants.js";

// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios);

describe("ElevenLabs API Service", () => {
  const originalEnv = process.env.ELEVENLABS_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ELEVENLABS_API_KEY = "test_api_key_12345";
  });

  afterEach(() => {
    process.env.ELEVENLABS_API_KEY = originalEnv;
  });

  describe("makeElevenLabsRequest", () => {
    it("should make a successful GET request", async () => {
      const mockData = { agents: [{ id: "ag_123", name: "Test Agent" }] };
      mockedAxios.mockResolvedValueOnce({ data: mockData });

      const result = await makeElevenLabsRequest("GET", "/convai/agents");

      expect(result).toEqual(mockData);
      expect(mockedAxios).toHaveBeenCalledWith({
        method: "GET",
        url: `${API_BASE_URL}/convai/agents`,
        headers: {
          "xi-api-key": "test_api_key_12345",
          "Content-Type": "application/json"
        },
        timeout: REQUEST_TIMEOUT
      });
    });

    it("should make a successful POST request with data", async () => {
      const mockData = { agent_id: "ag_new123" };
      const requestBody = { name: "New Agent", prompt: "Test prompt" };
      mockedAxios.mockResolvedValueOnce({ data: mockData });

      const result = await makeElevenLabsRequest("POST", "/convai/agents/create", requestBody);

      expect(result).toEqual(mockData);
      expect(mockedAxios).toHaveBeenCalledWith({
        method: "POST",
        url: `${API_BASE_URL}/convai/agents/create`,
        headers: {
          "xi-api-key": "test_api_key_12345",
          "Content-Type": "application/json"
        },
        timeout: REQUEST_TIMEOUT,
        data: requestBody
      });
    });

    it("should make a request with query params", async () => {
      const mockData = { conversations: [] };
      const params = { limit: 10, offset: 0 };
      mockedAxios.mockResolvedValueOnce({ data: mockData });

      const result = await makeElevenLabsRequest("GET", "/convai/conversations", undefined, params);

      expect(result).toEqual(mockData);
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          params: params
        })
      );
    });

    it("should throw error when API key is not set", async () => {
      delete process.env.ELEVENLABS_API_KEY;

      await expect(makeElevenLabsRequest("GET", "/test")).rejects.toThrow(
        "ELEVENLABS_API_KEY environment variable is not set"
      );
    });

    it("should handle 400 Bad Request error", async () => {
      const axiosError = {
        response: {
          status: 400,
          data: { detail: "Invalid parameters" }
        },
        isAxiosError: true
      };
      mockedAxios.mockRejectedValueOnce(axiosError);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      await expect(makeElevenLabsRequest("GET", "/test")).rejects.toThrow(
        "Invalid request"
      );
    });

    it("should handle 401 Unauthorized error", async () => {
      const axiosError = {
        response: {
          status: 401,
          data: { detail: "Unauthorized" }
        },
        isAxiosError: true
      };
      mockedAxios.mockRejectedValueOnce(axiosError);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      await expect(makeElevenLabsRequest("GET", "/test")).rejects.toThrow(
        "Invalid API key"
      );
    });

    it("should handle 404 Not Found error", async () => {
      const axiosError = {
        response: {
          status: 404,
          data: { detail: "Agent not found" }
        },
        isAxiosError: true
      };
      mockedAxios.mockRejectedValueOnce(axiosError);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      await expect(makeElevenLabsRequest("GET", "/convai/agents/ag_invalid")).rejects.toThrow(
        "not found"
      );
    });

    it("should handle 429 Rate Limit error", async () => {
      const axiosError = {
        response: {
          status: 429,
          data: { detail: "Rate limit exceeded" }
        },
        isAxiosError: true
      };
      mockedAxios.mockRejectedValueOnce(axiosError);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      await expect(makeElevenLabsRequest("GET", "/test")).rejects.toThrow(
        "Rate limit exceeded"
      );
    });

    it("should handle 500 Server error", async () => {
      const axiosError = {
        response: {
          status: 500,
          data: { detail: "Internal error" }
        },
        isAxiosError: true
      };
      mockedAxios.mockRejectedValueOnce(axiosError);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      await expect(makeElevenLabsRequest("GET", "/test")).rejects.toThrow(
        "server error"
      );
    });

    it("should handle timeout error", async () => {
      const axiosError = {
        code: "ECONNABORTED",
        message: "timeout of 30000ms exceeded",
        isAxiosError: true
      };
      mockedAxios.mockRejectedValueOnce(axiosError);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      await expect(makeElevenLabsRequest("GET", "/test")).rejects.toThrow(
        "timed out"
      );
    });

    it("should handle network connection error", async () => {
      const axiosError = {
        code: "ENOTFOUND",
        message: "getaddrinfo ENOTFOUND api.elevenlabs.io",
        isAxiosError: true
      };
      mockedAxios.mockRejectedValueOnce(axiosError);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      await expect(makeElevenLabsRequest("GET", "/test")).rejects.toThrow(
        "Cannot connect"
      );
    });
  });

  describe("Request Helper Functions", () => {
    describe("getRequest", () => {
      it("should call makeElevenLabsRequest with GET method", async () => {
        const mockData = { data: "test" };
        mockedAxios.mockResolvedValueOnce({ data: mockData });

        const result = await getRequest("/test/endpoint", { param1: "value1" });

        expect(result).toEqual(mockData);
        expect(mockedAxios).toHaveBeenCalledWith(
          expect.objectContaining({
            method: "GET",
            params: { param1: "value1" }
          })
        );
      });

      it("should work without params", async () => {
        const mockData = { data: "test" };
        mockedAxios.mockResolvedValueOnce({ data: mockData });

        const result = await getRequest("/test/endpoint");

        expect(result).toEqual(mockData);
        expect(mockedAxios).toHaveBeenCalledWith(
          expect.objectContaining({
            method: "GET"
          })
        );
      });
    });

    describe("postRequest", () => {
      it("should call makeElevenLabsRequest with POST method and data", async () => {
        const mockData = { id: "new_123" };
        const requestBody = { name: "Test" };
        mockedAxios.mockResolvedValueOnce({ data: mockData });

        const result = await postRequest("/test/endpoint", requestBody);

        expect(result).toEqual(mockData);
        expect(mockedAxios).toHaveBeenCalledWith(
          expect.objectContaining({
            method: "POST",
            data: requestBody
          })
        );
      });

      it("should support params with POST", async () => {
        const mockData = { success: true };
        mockedAxios.mockResolvedValueOnce({ data: mockData });

        await postRequest("/test", { body: "data" }, { query: "param" });

        expect(mockedAxios).toHaveBeenCalledWith(
          expect.objectContaining({
            method: "POST",
            data: { body: "data" },
            params: { query: "param" }
          })
        );
      });
    });

    describe("putRequest", () => {
      it("should call makeElevenLabsRequest with PUT method", async () => {
        const mockData = { updated: true };
        const requestBody = { name: "Updated" };
        mockedAxios.mockResolvedValueOnce({ data: mockData });

        const result = await putRequest("/test/endpoint", requestBody);

        expect(result).toEqual(mockData);
        expect(mockedAxios).toHaveBeenCalledWith(
          expect.objectContaining({
            method: "PUT",
            data: requestBody
          })
        );
      });
    });

    describe("patchRequest", () => {
      it("should call makeElevenLabsRequest with PATCH method", async () => {
        const mockData = { patched: true };
        const requestBody = { field: "value" };
        mockedAxios.mockResolvedValueOnce({ data: mockData });

        const result = await patchRequest("/test/endpoint", requestBody);

        expect(result).toEqual(mockData);
        expect(mockedAxios).toHaveBeenCalledWith(
          expect.objectContaining({
            method: "PATCH",
            data: requestBody
          })
        );
      });
    });

    describe("deleteRequest", () => {
      it("should call makeElevenLabsRequest with DELETE method", async () => {
        const mockData = { deleted: true };
        mockedAxios.mockResolvedValueOnce({ data: mockData });

        const result = await deleteRequest("/test/endpoint");

        expect(result).toEqual(mockData);
        expect(mockedAxios).toHaveBeenCalledWith(
          expect.objectContaining({
            method: "DELETE"
          })
        );
      });

      it("should support params with DELETE", async () => {
        mockedAxios.mockResolvedValueOnce({ data: {} });

        await deleteRequest("/test", { force: true });

        expect(mockedAxios).toHaveBeenCalledWith(
          expect.objectContaining({
            method: "DELETE",
            params: { force: true }
          })
        );
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty response data", async () => {
      mockedAxios.mockResolvedValueOnce({ data: null });

      const result = await getRequest("/test");

      expect(result).toBeNull();
    });

    it("should handle undefined response data", async () => {
      mockedAxios.mockResolvedValueOnce({ data: undefined });

      const result = await getRequest("/test");

      expect(result).toBeUndefined();
    });

    it("should handle array response", async () => {
      const mockData = [{ id: 1 }, { id: 2 }];
      mockedAxios.mockResolvedValueOnce({ data: mockData });

      const result = await getRequest("/test");

      expect(result).toEqual(mockData);
    });

    it("should handle error with object detail", async () => {
      const axiosError = {
        response: {
          status: 422,
          data: { detail: { field: "name", error: "required" } }
        },
        isAxiosError: true
      };
      mockedAxios.mockRejectedValueOnce(axiosError);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      await expect(makeElevenLabsRequest("POST", "/test", {})).rejects.toThrow();
    });
  });
});
