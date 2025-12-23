/**
 * Common formatter utilities
 *
 * Shared formatting functions and response routing used across all formatter modules.
 */

import {
  Agent,
  ConversationMetadata,
  ToolConfig,
  Voice,
  ResponseFormat,
  PaginatedResponse,
  OutboundCallResponse,
  BatchCallResponse,
  BatchCallDetailedResponse,
  WorkspaceBatchCallsResponse,
  PhoneNumber,
  ImportPhoneNumberResponse
} from "../../types.js";
import { formatJSON } from "../../utils/truncation.js";

// Import formatters from domain modules (will be available after index.ts is created)
import { formatAgentMarkdown, formatAgentListMarkdown } from "./agent-formatter.js";
import { formatConversationMarkdown, formatConversationListMarkdown } from "./conversation-formatter.js";
import { formatToolMarkdown, formatToolListMarkdown } from "./tool-formatter.js";
import { formatVoiceListMarkdown } from "./voice-formatter.js";
import {
  formatOutboundCallMarkdown,
  formatBatchCallMarkdown,
  formatBatchCallListMarkdown,
  formatBatchCallDetailMarkdown
} from "./call-formatter.js";
import {
  formatPhoneNumberListMarkdown,
  formatPhoneNumberMarkdown,
  formatPhoneNumberImportMarkdown
} from "./phone-formatter.js";

/**
 * Formats any response as JSON
 *
 * @param data - Any data to format as JSON
 * @returns Formatted JSON string
 */
export function formatAsJSON(data: unknown): string {
  return formatJSON(data);
}

/**
 * Response type identifier for routing to the appropriate formatter
 */
export type ResponseType =
  | "agent"
  | "agent_list"
  | "conversation"
  | "conversation_list"
  | "tool"
  | "tool_list"
  | "voice_list"
  | "widget"
  | "outbound_call"
  | "batch_call"
  | "batch_call_list"
  | "batch_call_detail"
  | "phone_number_list"
  | "phone_number"
  | "phone_number_import"
  | "generic";

/**
 * Main formatting function that routes to appropriate formatter
 *
 * @param data - The data to format
 * @param format - Response format (markdown or json)
 * @param type - Type of data being formatted
 * @returns Formatted string (Markdown or JSON)
 */
export function formatResponse(
  data: unknown,
  format: ResponseFormat,
  type: ResponseType
): string {
  if (format === ResponseFormat.JSON) {
    return formatAsJSON(data);
  }

  // Markdown formatting based on type
  switch (type) {
    case "agent":
      return formatAgentMarkdown(data as Agent);

    case "agent_list": {
      const paginated = data as PaginatedResponse<Agent>;
      return formatAgentListMarkdown(
        paginated.items,
        paginated.total,
        paginated.offset,
        paginated.has_more
      );
    }

    case "conversation":
      return formatConversationMarkdown(data as ConversationMetadata);

    case "conversation_list": {
      const paginated = data as PaginatedResponse<ConversationMetadata>;
      return formatConversationListMarkdown(
        paginated.items,
        paginated.total,
        paginated.offset,
        paginated.has_more
      );
    }

    case "tool":
      return formatToolMarkdown(data as ToolConfig);

    case "tool_list":
      return formatToolListMarkdown(data as ToolConfig[]);

    case "voice_list":
      return formatVoiceListMarkdown(data as Voice[]);

    case "widget":
      return data as string; // Already formatted by formatWidgetCode

    case "outbound_call":
      return formatOutboundCallMarkdown(data as OutboundCallResponse);

    case "batch_call":
      return formatBatchCallMarkdown(data as BatchCallResponse);

    case "batch_call_list":
      return formatBatchCallListMarkdown(data as WorkspaceBatchCallsResponse);

    case "batch_call_detail":
      return formatBatchCallDetailMarkdown(data as BatchCallDetailedResponse);

    case "phone_number_list":
      return formatPhoneNumberListMarkdown(data as PhoneNumber[]);

    case "phone_number":
      return formatPhoneNumberMarkdown(data as PhoneNumber);

    case "phone_number_import":
      return formatPhoneNumberImportMarkdown(data as ImportPhoneNumberResponse);

    case "generic":
    default:
      return formatAsJSON(data);
  }
}
