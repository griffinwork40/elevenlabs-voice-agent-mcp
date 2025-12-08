/**
 * Response utilities for MCP tool handlers
 *
 * Provides helper functions for creating consistent MCP-compliant responses.
 */

import { MCPToolResponse } from "../types.js";

/**
 * Creates a standard MCP text response
 *
 * @param text - The text content to return
 * @returns MCP-compliant tool response with text content
 *
 * @example
 * return createTextResponse(formatResponse(data, format, "agent"));
 *
 * @example
 * return createTextResponse(`Successfully deleted agent: ${agentId}`);
 */
export function createTextResponse(text: string): MCPToolResponse {
  return {
    content: [
      {
        type: "text",
        text
      }
    ]
  };
}
