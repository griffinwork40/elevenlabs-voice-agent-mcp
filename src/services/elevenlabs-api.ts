/**
 * @fileoverview ElevenLabs API client service
 * @description Provides core HTTP request functionality for interacting with the
 * ElevenLabs Voice Agent API, including authentication and error handling.
 * This module serves as the central communication layer for all API operations.
 * @module services/elevenlabs-api
 */

import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { API_BASE_URL, REQUEST_TIMEOUT } from "../constants.js";
import { handleElevenLabsError } from "../utils/error-handlers.js";

/**
 * Makes an authenticated request to the ElevenLabs API.
 * @description Core function that handles all HTTP communication with ElevenLabs.
 * Automatically adds authentication headers and handles errors consistently.
 *
 * @template T - The expected response data type
 * @param {("GET" | "POST" | "PUT" | "PATCH" | "DELETE")} method - HTTP method to use
 * @param {string} endpoint - API endpoint path (e.g., "/convai/agents")
 * @param {unknown} [data] - Request body data (for POST, PUT, PATCH methods)
 * @param {Record<string, unknown>} [params] - URL query parameters
 * @returns {Promise<T>} Response data from the API
 * @throws {Error} If ELEVENLABS_API_KEY is not set
 * @throws {Error} If the API request fails (with user-friendly message)
 *
 * @example
 * // GET request
 * const agent = await makeElevenLabsRequest<Agent>("GET", "/convai/agents/ag_123");
 *
 * @example
 * // POST request with data
 * const newAgent = await makeElevenLabsRequest<Agent>("POST", "/convai/agents/create", {
 *   name: "Support Bot",
 *   // ... config
 * });
 *
 * @example
 * // GET request with query params
 * const agents = await makeElevenLabsRequest<{agents: Agent[]}>("GET", "/convai/agents", undefined, {
 *   limit: 20,
 *   offset: 0
 * });
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
 * Performs an authenticated GET request to the ElevenLabs API.
 * @description Convenience wrapper for GET requests that fetch data without a body.
 *
 * @template T - The expected response data type
 * @param {string} endpoint - API endpoint path (e.g., "/convai/agents/ag_123")
 * @param {Record<string, unknown>} [params] - Optional URL query parameters
 * @returns {Promise<T>} Response data from the API
 * @throws {Error} If the request fails
 *
 * @example
 * // Fetch a single agent
 * const agent = await getRequest<Agent>("/convai/agents/ag_abc123");
 *
 * @example
 * // Fetch agents with pagination
 * const response = await getRequest<{agents: Agent[]}>("/convai/agents", {
 *   limit: 20,
 *   offset: 0
 * });
 */
export async function getRequest<T>(
  endpoint: string,
  params?: Record<string, unknown>
): Promise<T> {
  return makeElevenLabsRequest<T>("GET", endpoint, undefined, params);
}

/**
 * Performs an authenticated POST request to the ElevenLabs API.
 * @description Convenience wrapper for POST requests that create new resources.
 *
 * @template T - The expected response data type
 * @param {string} endpoint - API endpoint path (e.g., "/convai/agents/create")
 * @param {unknown} data - Request body data to send
 * @param {Record<string, unknown>} [params] - Optional URL query parameters
 * @returns {Promise<T>} Response data from the API
 * @throws {Error} If the request fails
 *
 * @example
 * // Create a new agent
 * const agent = await postRequest<Agent>("/convai/agents/create", {
 *   name: "Customer Support",
 *   conversation_config: { ... }
 * });
 */
export async function postRequest<T>(
  endpoint: string,
  data: unknown,
  params?: Record<string, unknown>
): Promise<T> {
  return makeElevenLabsRequest<T>("POST", endpoint, data, params);
}

/**
 * Performs an authenticated PUT request to the ElevenLabs API.
 * @description Convenience wrapper for PUT requests that replace resources entirely.
 *
 * @template T - The expected response data type
 * @param {string} endpoint - API endpoint path
 * @param {unknown} data - Request body data to send
 * @param {Record<string, unknown>} [params] - Optional URL query parameters
 * @returns {Promise<T>} Response data from the API
 * @throws {Error} If the request fails
 *
 * @example
 * // Replace a resource
 * const updated = await putRequest<Resource>("/resource/123", { ... });
 */
export async function putRequest<T>(
  endpoint: string,
  data: unknown,
  params?: Record<string, unknown>
): Promise<T> {
  return makeElevenLabsRequest<T>("PUT", endpoint, data, params);
}

/**
 * Performs an authenticated PATCH request to the ElevenLabs API.
 * @description Convenience wrapper for PATCH requests that partially update resources.
 *
 * @template T - The expected response data type
 * @param {string} endpoint - API endpoint path (e.g., "/convai/agents/ag_123")
 * @param {unknown} data - Partial update data to send
 * @param {Record<string, unknown>} [params] - Optional URL query parameters
 * @returns {Promise<T>} Response data from the API
 * @throws {Error} If the request fails
 *
 * @example
 * // Update specific agent fields
 * const updated = await patchRequest<Agent>("/convai/agents/ag_abc123", {
 *   name: "Updated Name"
 * });
 */
export async function patchRequest<T>(
  endpoint: string,
  data: unknown,
  params?: Record<string, unknown>
): Promise<T> {
  return makeElevenLabsRequest<T>("PATCH", endpoint, data, params);
}

/**
 * Performs an authenticated DELETE request to the ElevenLabs API.
 * @description Convenience wrapper for DELETE requests that remove resources.
 *
 * @template T - The expected response data type (often void or confirmation)
 * @param {string} endpoint - API endpoint path (e.g., "/convai/agents/ag_123")
 * @param {Record<string, unknown>} [params] - Optional URL query parameters
 * @returns {Promise<T>} Response data from the API (may be empty)
 * @throws {Error} If the request fails
 *
 * @example
 * // Delete an agent
 * await deleteRequest("/convai/agents/ag_abc123");
 */
export async function deleteRequest<T>(
  endpoint: string,
  params?: Record<string, unknown>
): Promise<T> {
  return makeElevenLabsRequest<T>("DELETE", endpoint, undefined, params);
}
