/**
 * @fileoverview Conversation retrieval tools for ElevenLabs Voice Agents
 * @description MCP tools for accessing conversation histories, transcripts, and analytics.
 * These tools enable monitoring, debugging, and analysis of voice agent interactions
 * by providing access to conversation metadata, full transcripts, and AI-generated analysis.
 * @module tools/conversation-tools
 */

import { getRequest } from "../services/elevenlabs-api.js";
import { formatResponse } from "../services/formatters.js";
import { ConversationMetadata, PaginatedResponse } from "../types.js";
import {
  GetConversationSchema,
  ListConversationsSchema
} from "../schemas/conversation-schemas.js";

/**
 * Retrieves a single conversation with full transcript
 */
export const elevenlabs_get_conversation = {
  name: "elevenlabs_get_conversation",
  description: `Retrieve complete details and transcript for a specific conversation.

This tool fetches full conversation details including the complete transcript, tool calls made, analysis metrics, and metadata. Use this to review past conversations, debug issues, or analyze agent performance.

Args:
  - conversation_id (string): Unique conversation identifier
  - response_format ('markdown' | 'json'): Output format

Returns:
  Complete conversation object with:
  - Conversation metadata (status, timestamps, duration)
  - Full transcript with user and agent messages
  - Tool calls made during the conversation
  - Analysis data (sentiment, performance, key topics)

Examples:
  - Use when: "Show me the transcript for conversation conv_xyz789"
  - Use when: "What did the agent say in this conversation?"
  - Use when: "Review the conversation that failed"
  - Don't use when: You want to list multiple conversations (use elevenlabs_list_conversations)

Error Handling:
  - Returns "Error: Conversation not found" if conversation_id doesn't exist
  - Returns "Error: Invalid API key" if authentication fails`,

  zodSchema: GetConversationSchema,

  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
  },

  handler: async (args: unknown) => {
    const parsed = GetConversationSchema.parse(args);

    const conversation = await getRequest<ConversationMetadata>(
      `/convai/conversations/${parsed.conversation_id}`
    );

    return {
      content: [
        {
          type: "text",
          text: formatResponse(conversation, parsed.response_format, "conversation")
        }
      ]
    };
  }
};

/**
 * Lists conversations with filtering and pagination
 */
export const elevenlabs_list_conversations = {
  name: "elevenlabs_list_conversations",
  description: `List conversations with optional filtering by agent, status, and date range.

This tool retrieves a paginated list of conversations. You can filter by agent ID, conversation status, or date range to find specific conversations. Use this for monitoring, analytics, or reviewing agent interactions.

Args:
  - agent_id (string): Optional - filter by specific agent
  - status ('in_progress' | 'completed' | 'failed'): Optional - filter by status
  - date_range (object): Optional - filter by date range with:
    - start (string): Start date in ISO 8601 format
    - end (string): End date in ISO 8601 format
  - limit (number): Maximum conversations to return (1-100, default: 20)
  - offset (number): Number to skip for pagination (default: 0)
  - response_format ('markdown' | 'json'): Output format

Returns:
  For JSON format: Object with total count, items array, offset, has_more, and next_offset
  For Markdown format: Formatted list of conversations with key details and pagination guidance

Examples:
  - Use when: "Show me all conversations from yesterday"
  - Use when: "List failed conversations for agent ag_abc123"
  - Use when: "Get the last 50 conversations"
  - Use when: "Show conversations that are still in progress"
  - Don't use when: You want full transcript (use elevenlabs_get_conversation)

Error Handling:
  - Returns empty list if no conversations match filters
  - Returns "Error: Invalid date format" if date_range is malformed`,

  zodSchema: ListConversationsSchema,

  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
  },

  handler: async (args: unknown) => {
    const parsed = ListConversationsSchema.parse(args);

    const params: Record<string, unknown> = {
      limit: parsed.limit,
      offset: parsed.offset
    };

    if (parsed.agent_id) {
      params.agent_id = parsed.agent_id;
    }

    if (parsed.status) {
      params.status = parsed.status;
    }

    if (parsed.date_range) {
      if (parsed.date_range.start) {
        params.start_date = parsed.date_range.start;
      }
      if (parsed.date_range.end) {
        params.end_date = parsed.date_range.end;
      }
    }

    const response = await getRequest<{ conversations: ConversationMetadata[] }>(
      "/convai/conversations",
      params
    );

    const conversations = response.conversations || [];
    const total = conversations.length;
    const hasMore = conversations.length === parsed.limit;

    const paginatedResponse: PaginatedResponse<ConversationMetadata> = {
      total,
      count: conversations.length,
      offset: parsed.offset,
      items: conversations,
      has_more: hasMore,
      next_offset: hasMore ? parsed.offset + conversations.length : undefined
    };

    return {
      content: [
        {
          type: "text",
          text: formatResponse(paginatedResponse, parsed.response_format, "conversation_list")
        }
      ]
    };
  }
};
