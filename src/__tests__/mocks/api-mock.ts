/**
 * API mock utilities for testing
 *
 * Provides helpers to mock axios responses in tests.
 */

import { vi } from "vitest";
import axios from "axios";

// Type for mocked axios
type MockedAxios = {
  (config: unknown): Promise<{ data: unknown }>;
  request: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  isAxiosError: (error: unknown) => boolean;
};

export const mockedAxios = axios as unknown as MockedAxios;

/**
 * Mock a successful axios response
 */
export function mockAxiosSuccess<T>(data: T) {
  return vi.fn().mockResolvedValue({ data });
}

/**
 * Mock an axios error response
 */
export function mockAxiosError(status: number, detail: string) {
  const error = {
    response: {
      status,
      data: { detail }
    },
    isAxiosError: true
  };
  return vi.fn().mockRejectedValue(error);
}

/**
 * Reset all axios mocks
 */
export function resetAxiosMocks() {
  vi.mocked(axios).mockReset();
}

/**
 * Setup axios to return a specific response for any request
 */
export function setupAxiosResponse<T>(data: T) {
  vi.mocked(axios).mockResolvedValue({ data });
}

/**
 * Setup axios to throw an error for any request
 */
export function setupAxiosError(status: number, detail: string) {
  const error = new Error(detail) as Error & {
    response?: { status: number; data: { detail: string } };
    isAxiosError?: boolean;
  };
  error.response = { status, data: { detail } };
  error.isAxiosError = true;
  vi.mocked(axios).mockRejectedValue(error);
}
