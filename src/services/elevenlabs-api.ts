/**
 * ElevenLabs API client service
 *
 * Provides core HTTP request functionality for interacting with the
 * ElevenLabs Voice Agent API, including authentication and error handling.
 */

import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { API_BASE_URL, REQUEST_TIMEOUT } from "../constants.js";
import { handleElevenLabsError } from "../utils/error-handlers.js";

/**
 * Makes an authenticated request to the ElevenLabs API
 *
 * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param endpoint - API endpoint path (e.g., "/convai/agents")
 * @param data - Request body data (for POST, PUT, PATCH)
 * @param params - URL query parameters
 * @returns Response data from the API
 */
export async function makeElevenLabsRequest<T = unknown>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  endpoint: string,
  data?: unknown,
  params?: Record<string, unknown>
): Promise<T> {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error(
      "ELEVENLABS_API_KEY environment variable is not set. " +
      "Please set it to your ElevenLabs API key."
    );
  }

  const config: AxiosRequestConfig = {
    method,
    url: `${API_BASE_URL}${endpoint}`,
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    timeout: REQUEST_TIMEOUT,
  };

  if (data) {
    config.data = data;
  }

  if (params) {
    config.params = params;
  }

  try {
    const response: AxiosResponse<T> = await axios(config);
    return response.data;
  } catch (error) {
    throw new Error(handleElevenLabsError(error));
  }
}

/**
 * GET request helper
 */
export async function getRequest<T>(
  endpoint: string,
  params?: Record<string, unknown>
): Promise<T> {
  return makeElevenLabsRequest<T>("GET", endpoint, undefined, params);
}

/**
 * POST request helper
 */
export async function postRequest<T>(
  endpoint: string,
  data: unknown,
  params?: Record<string, unknown>
): Promise<T> {
  return makeElevenLabsRequest<T>("POST", endpoint, data, params);
}

/**
 * PUT request helper
 */
export async function putRequest<T>(
  endpoint: string,
  data: unknown,
  params?: Record<string, unknown>
): Promise<T> {
  return makeElevenLabsRequest<T>("PUT", endpoint, data, params);
}

/**
 * PATCH request helper
 */
export async function patchRequest<T>(
  endpoint: string,
  data: unknown,
  params?: Record<string, unknown>
): Promise<T> {
  return makeElevenLabsRequest<T>("PATCH", endpoint, data, params);
}

/**
 * DELETE request helper
 */
export async function deleteRequest<T>(
  endpoint: string,
  params?: Record<string, unknown>
): Promise<T> {
  return makeElevenLabsRequest<T>("DELETE", endpoint, undefined, params);
}
