/**
 * Batch calling tools
 *
 * MCP tools for submitting batch call jobs, listing batches, and retrieving batch details.
 */

import { getRequest, postRequest } from "../services/elevenlabs-api.js";
import { formatResponse } from "../services/formatters.js";
import { BatchCallResponse, BatchCallDetailedResponse, WorkspaceBatchCallsResponse } from "../types.js";
import {
  SubmitBatchCallSchema,
  ListBatchCallsSchema,
  GetBatchCallSchema
} from "../schemas/batch-calling-schemas.js";

/**
 * Submits a batch calling job
 */
export const elevenlabs_submit_batch_call = {
  name: "elevenlabs_submit_batch_call",
  description: `Submit a batch calling job to initiate multiple outbound calls simultaneously.

This tool allows you to call multiple phone numbers in parallel using your voice agent. Upload a list of recipients with optional personalization data for each call. Batch calling is ideal for surveys, alerts, reminders, appointment confirmations, and mass outreach.

Prerequisites:
  - A Twilio phone number must be imported and associated with an agent
  - Zero Retention Mode (ZRM) must be disabled
  - Minimum 50% workspace concurrency or 70% agent concurrency available

Args:
  - call_name (string): Descriptive name for this batch (e.g., "Q4 Customer Survey")
  - agent_id (string): Agent to use for all calls (e.g., 'ag_abc123')
  - recipients (array): Array of recipient objects, each containing:
    - phone_number (string): Phone in E.164 format (e.g., '+1234567890')
    - OR whatsapp_user_id (string): WhatsApp user ID (alternative)
    - id (string, optional): Custom tracking ID for this recipient
    - conversation_initiation_client_data (object, optional): Personalization data
      - Dynamic variables like {name: 'John', appointment_time: '3pm'}
      - Special fields: language, first_message, system_prompt, voice_id
  - scheduled_time_unix (number, optional): Unix timestamp to schedule for future
  - agent_phone_number_id (string, optional): Phone number ID to use as caller ID
  - response_format ('markdown' | 'json'): Output format

Returns:
  Batch job details including ID, status, scheduling info, and call counts.

Limits:
  - Minimum: 1 recipient
  - Maximum: 10,000 recipients per batch

Examples:
  - Use when: "Call 500 customers with appointment reminders"
  - Use when: "Send survey to all users with personalized greetings"
  - Use when: "Dispatch agent to call lead list from CSV"
  - Don't use when: Making a single call (use elevenlabs_start_outbound_call)
  - Don't use when: Phone number isn't assigned to agent yet

Error Handling:
  - Returns "Error: Invalid recipient count" if outside 1-10,000 range
  - Returns "Error: Phone number not assigned" if agent lacks phone number
  - Returns "Error: ZRM enabled" if Zero Retention Mode is active`,

  inputSchema: {
    type: "object",
    properties: {
      call_name: { type: "string" },
      agent_id: { type: "string" },
      recipients: { type: "array" },
      scheduled_time_unix: { type: "number" },
      agent_phone_number_id: { type: "string" },
      response_format: { type: "string" }
    },
    required: ["call_name", "agent_id", "recipients"]
  },

  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true
  },

  handler: async (args: unknown) => {
    const parsed = SubmitBatchCallSchema.parse(args);

    const requestData = {
      call_name: parsed.call_name,
      agent_id: parsed.agent_id,
      recipients: parsed.recipients,
      ...(parsed.scheduled_time_unix !== undefined && {
        scheduled_time_unix: parsed.scheduled_time_unix
      }),
      ...(parsed.agent_phone_number_id && {
        agent_phone_number_id: parsed.agent_phone_number_id
      })
    };

    const response = await postRequest<BatchCallResponse>(
      "/convai/batch-calling/submit",
      requestData
    );

    return {
      content: [
        {
          type: "text",
          text: formatResponse(response, parsed.response_format, "batch_call")
        }
      ]
    };
  }
};

/**
 * Lists all batch calling jobs in workspace
 */
export const elevenlabs_list_batch_calls = {
  name: "elevenlabs_list_batch_calls",
  description: `List all batch calling jobs in your workspace with pagination.

This tool retrieves all batch call jobs you've submitted, showing their status, scheduling, and progress. Use cursor-based pagination to navigate through large lists.

Args:
  - limit (number): Maximum items to return (1-100, default: 20)
  - last_doc (string, optional): Pagination cursor from previous response
  - response_format ('markdown' | 'json'): Output format

Returns:
  - batch_calls: Array of batch job objects with status and metrics
  - next_doc: Cursor for next page (null if no more pages)
  - has_more: Whether more batches exist

Pagination:
  - First page: Don't include last_doc parameter
  - Next pages: Use next_doc value from previous response as last_doc

Examples:
  - Use when: "Show me all my batch calling jobs"
  - Use when: "List recent batch calls"
  - Use when: "Get next page of batches with cursor xyz123"
  - Don't use when: You want details about a specific batch (use elevenlabs_get_batch_call)

Error Handling:
  - Returns empty list if no batches exist
  - Returns "Error: Invalid API key" if authentication fails`,

  inputSchema: {
    type: "object",
    properties: {
      limit: { type: "number" },
      last_doc: { type: "string" },
      response_format: { type: "string" }
    }
  },

  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
  },

  handler: async (args: unknown) => {
    const parsed = ListBatchCallsSchema.parse(args);

    const params: Record<string, unknown> = {
      limit: parsed.limit
    };

    if (parsed.last_doc) {
      params.last_doc = parsed.last_doc;
    }

    const response = await getRequest<WorkspaceBatchCallsResponse>(
      "/convai/batch-calling/workspace",
      params
    );

    return {
      content: [
        {
          type: "text",
          text: formatResponse(response, parsed.response_format, "batch_call_list")
        }
      ]
    };
  }
};

/**
 * Gets detailed information about a specific batch call
 */
export const elevenlabs_get_batch_call = {
  name: "elevenlabs_get_batch_call",
  description: `Get detailed information about a specific batch calling job including all recipient statuses.

This tool retrieves complete details for a batch call job, including the status of each individual recipient. Use this to monitor batch progress, identify failed calls, detect voicemails, and track which recipients have been successfully contacted.

Args:
  - batch_id (string): Unique batch job identifier (e.g., 'batch_abc123')
  - response_format ('markdown' | 'json'): Output format

Returns:
  Complete batch details including:
  - Batch metadata (name, agent, status, timing)
  - Call metrics (dispatched, scheduled counts)
  - Recipients array with individual statuses:
    - pending: Not yet called
    - initiated: Call started
    - in_progress: Currently in conversation
    - completed: Call finished successfully
    - failed: Call failed
    - cancelled: Call was cancelled
    - voicemail: Went to voicemail
  - Each recipient includes conversation_id for transcript lookup

Examples:
  - Use when: "Check status of batch job batch_abc123"
  - Use when: "Show me which recipients answered in the sales batch"
  - Use when: "Get details on appointment reminder batch"
  - Use when: "Find failed calls in batch xyz789"
  - Don't use when: You want to list all batches (use elevenlabs_list_batch_calls)

Error Handling:
  - Returns "Error: Batch not found" if batch_id doesn't exist
  - Returns "Error: Invalid API key" if authentication fails`,

  inputSchema: {
    type: "object",
    properties: {
      batch_id: { type: "string" },
      response_format: { type: "string" }
    },
    required: ["batch_id"]
  },

  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
  },

  handler: async (args: unknown) => {
    const parsed = GetBatchCallSchema.parse(args);

    const response = await getRequest<BatchCallDetailedResponse>(
      `/convai/batch-calling/${parsed.batch_id}`
    );

    return {
      content: [
        {
          type: "text",
          text: formatResponse(response, parsed.response_format, "batch_call_detail")
        }
      ]
    };
  }
};
