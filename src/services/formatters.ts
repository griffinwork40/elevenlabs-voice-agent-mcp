/**
 * Response formatting utilities
 *
 * Converts API responses to human-readable Markdown or structured JSON format.
 * Provides consistent formatting across all MCP tools.
 */

import {
  Agent,
  AgentListItem,
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
} from "../types.js";
import { truncateIfNeeded, formatJSON, truncateMiddle } from "../utils/truncation.js";

/**
 * Formats an agent in Markdown format
 */
export function formatAgentMarkdown(agent: Agent): string {
  const config = agent.conversation_config;
  const prompt = config.agent.prompt;

  let markdown = `# Agent: ${agent.name} (${agent.agent_id})\n\n`;
  markdown += `**Created**: ${new Date(agent.created_at).toISOString()}\n\n`;

  // Configuration section
  markdown += `## Configuration\n`;
  markdown += `- **LLM**: ${prompt.llm}\n`;
  markdown += `- **Voice ID**: ${config.tts.voice_id}\n`;
  markdown += `- **Voice Model**: ${config.tts.model_id}\n`;
  markdown += `- **Language**: ${config.agent.language}\n`;

  if (prompt.temperature !== undefined) {
    markdown += `- **Temperature**: ${prompt.temperature}\n`;
  }

  if (config.agent.first_message) {
    markdown += `- **First Message**: "${config.agent.first_message}"\n`;
  }

  markdown += `\n`;

  // Prompt section
  markdown += `## System Prompt\n\`\`\`\n${prompt.prompt}\n\`\`\`\n\n`;

  // Tools section
  if (prompt.tools && prompt.tools.length > 0) {
    markdown += `## Tools (${prompt.tools.length})\n`;
    prompt.tools.forEach((tool, idx) => {
      markdown += `${idx + 1}. **${tool.name}** - ${tool.description}\n`;
    });
    markdown += `\n`;
  }

  // Knowledge Base section
  if (prompt.knowledge_base && prompt.knowledge_base.length > 0) {
    markdown += `## Knowledge Base (${prompt.knowledge_base.length} documents)\n`;
    markdown += `Documents have been added to the agent's knowledge base.\n\n`;
  }

  // Widget section
  if (agent.platform_settings?.widget) {
    markdown += `## Widget Settings\n`;
    if (agent.platform_settings.widget.color) {
      markdown += `- **Color**: ${agent.platform_settings.widget.color}\n`;
    }
    if (agent.platform_settings.widget.avatar_url) {
      markdown += `- **Avatar**: ${agent.platform_settings.widget.avatar_url}\n`;
    }
    markdown += `\n`;
  }

  return markdown;
}

/**
 * Formats a list of agents in Markdown format
 */
export function formatAgentListMarkdown(
  agents: AgentListItem[],
  offset: number,
  hasMore: boolean
): string {
  // Since the API doesn't provide a total count, show accurate pagination info
  const countLabel = hasMore ? `${agents.length} shown` : `${agents.length} total`;
  let markdown = `# Agents (${countLabel})\n\n`;

  if (agents.length === 0) {
    return markdown + "No agents found.\n";
  }

  agents.forEach((agent, idx) => {
    const num = offset + idx + 1;
    markdown += `## ${num}. ${agent.name}\n`;
    markdown += `- **ID**: ${agent.agent_id}\n`;

    // Defensive timestamp handling - ensure valid timestamp before conversion
    if (agent.created_at_unix_secs && agent.created_at_unix_secs > 0) {
      markdown += `- **Created**: ${new Date(agent.created_at_unix_secs * 1000).toISOString()}\n`;
    }

    if (agent.last_call_time_unix_secs && agent.last_call_time_unix_secs > 0) {
      markdown += `- **Last Call**: ${new Date(agent.last_call_time_unix_secs * 1000).toISOString()}\n`;
    }

    markdown += `- **Status**: ${agent.archived ? 'Archived' : 'Active'}\n`;

    // Use optional chaining for cleaner optional field checking
    if (agent.tags?.length) {
      markdown += `- **Tags**: ${agent.tags.join(', ')}\n`;
    }

    markdown += `\n`;
  });

  if (hasMore) {
    const nextOffset = offset + agents.length;
    markdown += `\n**More agents available.** Use \`offset=${nextOffset}\` to see the next page.\n`;
  }

  return truncateIfNeeded(markdown, `Use offset=${offset + agents.length} to continue`);
}

/**
 * Formats a conversation in Markdown format
 */
export function formatConversationMarkdown(conversation: ConversationMetadata): string {
  let markdown = `# Conversation: ${conversation.conversation_id}\n\n`;
  markdown += `- **Agent ID**: ${conversation.agent_id}\n`;
  markdown += `- **Status**: ${conversation.status}\n`;
  markdown += `- **Started**: ${new Date(conversation.started_at).toISOString()}\n`;

  if (conversation.ended_at) {
    markdown += `- **Ended**: ${new Date(conversation.ended_at).toISOString()}\n`;
  }

  if (conversation.duration_seconds !== undefined) {
    markdown += `- **Duration**: ${conversation.duration_seconds}s\n`;
  }

  markdown += `\n`;

  // Transcript
  if (conversation.transcript && conversation.transcript.length > 0) {
    markdown += `## Transcript (${conversation.transcript.length} messages)\n\n`;

    conversation.transcript.forEach((entry, idx) => {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      markdown += `**[${time}] ${entry.role.toUpperCase()}**: ${entry.message}\n`;

      if (entry.tool_calls && entry.tool_calls.length > 0) {
        markdown += `  *Tool calls: ${entry.tool_calls.map(t => t.tool_name).join(", ")}*\n`;
      }

      markdown += `\n`;
    });
  }

  // Analysis
  if (conversation.analysis) {
    markdown += `## Analysis\n`;
    if (conversation.analysis.user_sentiment) {
      markdown += `- **User Sentiment**: ${conversation.analysis.user_sentiment}\n`;
    }
    if (conversation.analysis.agent_performance !== undefined) {
      markdown += `- **Agent Performance**: ${conversation.analysis.agent_performance}/10\n`;
    }
    if (conversation.analysis.key_topics && conversation.analysis.key_topics.length > 0) {
      markdown += `- **Key Topics**: ${conversation.analysis.key_topics.join(", ")}\n`;
    }
    markdown += `\n`;
  }

  return truncateIfNeeded(markdown);
}

/**
 * Formats a list of conversations in Markdown format
 */
export function formatConversationListMarkdown(
  conversations: ConversationMetadata[],
  total: number,
  offset: number,
  hasMore: boolean
): string {
  let markdown = `# Conversations (${conversations.length} of ${total})\n\n`;

  if (conversations.length === 0) {
    return markdown + "No conversations found.\n";
  }

  conversations.forEach((conv, idx) => {
    const num = offset + idx + 1;
    markdown += `## ${num}. ${conv.conversation_id}\n`;
    markdown += `- **Status**: ${conv.status}\n`;
    markdown += `- **Started**: ${new Date(conv.started_at).toISOString()}\n`;

    if (conv.duration_seconds !== undefined) {
      markdown += `- **Duration**: ${conv.duration_seconds}s\n`;
    }

    markdown += `\n`;
  });

  if (hasMore) {
    const nextOffset = offset + conversations.length;
    markdown += `\n**More conversations available.** Use \`offset=${nextOffset}\` to see the next page.\n`;
  }

  return truncateIfNeeded(markdown, `Use offset=${offset + conversations.length} to continue`);
}

/**
 * Formats a tool configuration in Markdown format
 */
export function formatToolMarkdown(tool: ToolConfig): string {
  let markdown = `# Tool: ${tool.name}\n\n`;
  markdown += `**Type**: ${tool.type}\n`;
  markdown += `**Description**: ${tool.description}\n\n`;

  if (tool.url) {
    markdown += `**URL**: ${tool.url}\n`;
    markdown += `**Method**: ${tool.method || "POST"}\n\n`;
  }

  if (tool.parameters && tool.parameters.length > 0) {
    markdown += `## Parameters\n\n`;
    tool.parameters.forEach((param) => {
      markdown += `- **${param.name}** (${param.type})${param.required ? " *required*" : ""}\n`;
      markdown += `  ${param.description}\n`;
      if (param.enum) {
        markdown += `  Options: ${param.enum.join(", ")}\n`;
      }
      markdown += `\n`;
    });
  }

  return markdown;
}

/**
 * Formats a list of tools in Markdown format
 */
export function formatToolListMarkdown(tools: ToolConfig[]): string {
  if (tools.length === 0) {
    return "# Tools\n\nNo tools configured for this agent.\n";
  }

  let markdown = `# Tools (${tools.length})\n\n`;

  tools.forEach((tool, idx) => {
    markdown += `## ${idx + 1}. ${tool.name}\n`;
    markdown += `- **Type**: ${tool.type}\n`;
    markdown += `- **Description**: ${tool.description}\n`;

    if (tool.url) {
      markdown += `- **URL**: ${truncateMiddle(tool.url, 80)}\n`;
    }

    markdown += `\n`;
  });

  return truncateIfNeeded(markdown);
}

/**
 * Formats a list of voices in Markdown format
 */
export function formatVoiceListMarkdown(voices: Voice[]): string {
  if (voices.length === 0) {
    return "# Voices\n\nNo voices found matching the criteria.\n";
  }

  let markdown = `# Voices (${voices.length})\n\n`;

  voices.forEach((voice, idx) => {
    markdown += `## ${idx + 1}. ${voice.name}\n`;
    markdown += `- **ID**: ${voice.voice_id}\n`;

    if (voice.labels?.gender) {
      markdown += `- **Gender**: ${voice.labels.gender}\n`;
    }

    if (voice.labels?.age) {
      markdown += `- **Age**: ${voice.labels.age}\n`;
    }

    if (voice.labels?.accent) {
      markdown += `- **Accent**: ${voice.labels.accent}\n`;
    }

    if (voice.description) {
      markdown += `- **Description**: ${voice.description}\n`;
    }

    if (voice.preview_url) {
      markdown += `- **Preview**: ${voice.preview_url}\n`;
    }

    markdown += `\n`;
  });

  return truncateIfNeeded(markdown);
}

/**
 * Formats widget embed code
 */
export function formatWidgetCode(agentId: string, color?: string, avatarUrl?: string): string {
  let markdown = `# Widget Embed Code\n\n`;
  markdown += `Add this HTML to your website to embed the voice agent:\n\n`;
  markdown += `\`\`\`html\n`;
  markdown += `<script>\n`;
  markdown += `  window.elevenLabsConfig = {\n`;
  markdown += `    agentId: "${agentId}",\n`;

  if (color) {
    markdown += `    color: "${color}",\n`;
  }

  if (avatarUrl) {
    markdown += `    avatarUrl: "${avatarUrl}",\n`;
  }

  markdown += `  };\n`;
  markdown += `</script>\n`;
  markdown += `<script src="https://elevenlabs.io/convai-widget/index.js" async></script>\n`;
  markdown += `\`\`\`\n\n`;
  markdown += `The widget will appear as a floating button on your page.\n`;

  return markdown;
}

/**
 * Formats an outbound call response in Markdown format
 */
export function formatOutboundCallMarkdown(response: OutboundCallResponse): string {
  let markdown = `# Outbound Call ${response.success ? "Initiated" : "Failed"}\n\n`;
  markdown += `**Status**: ${response.success ? "✓ Success" : "✗ Failed"}\n`;
  markdown += `**Message**: ${response.message}\n`;

  if (response.conversation_id) {
    markdown += `**Conversation ID**: ${response.conversation_id}\n`;
  }

  if (response.callSid) {
    markdown += `**Twilio Call SID**: ${response.callSid}\n`;
  }

  if (response.success) {
    markdown += `\nThe call has been initiated. Use the conversation ID to track and retrieve the conversation transcript.\n`;
  }

  return markdown;
}

/**
 * Formats a batch call response in Markdown format
 */
export function formatBatchCallMarkdown(batch: BatchCallResponse): string {
  let markdown = `# Batch Call: ${batch.name}\n\n`;
  markdown += `**Batch ID**: ${batch.id}\n`;
  markdown += `**Status**: ${batch.status}\n`;
  markdown += `**Agent**: ${batch.agent_name} (${batch.agent_id})\n`;

  if (batch.phone_number_id) {
    markdown += `**Phone Number ID**: ${batch.phone_number_id}\n`;
  }

  if (batch.phone_provider) {
    markdown += `**Provider**: ${batch.phone_provider}\n`;
  }

  markdown += `\n## Timing\n`;
  markdown += `- **Created**: ${new Date(batch.created_at_unix * 1000).toISOString()}\n`;
  markdown += `- **Scheduled**: ${new Date(batch.scheduled_time_unix * 1000).toISOString()}\n`;
  markdown += `- **Last Updated**: ${new Date(batch.last_updated_at_unix * 1000).toISOString()}\n`;

  markdown += `\n## Call Statistics\n`;
  markdown += `- **Calls Dispatched**: ${batch.total_calls_dispatched}\n`;
  markdown += `- **Calls Scheduled**: ${batch.total_calls_scheduled}\n`;

  return markdown;
}

/**
 * Formats a batch call list in Markdown format
 */
export function formatBatchCallListMarkdown(response: WorkspaceBatchCallsResponse): string {
  const batches = response.batch_calls;

  if (batches.length === 0) {
    return "# Batch Calls\n\nNo batch calling jobs found.\n";
  }

  let markdown = `# Batch Calls (${batches.length})\n\n`;

  batches.forEach((batch, idx) => {
    markdown += `## ${idx + 1}. ${batch.name}\n`;
    markdown += `- **Batch ID**: ${batch.id}\n`;
    markdown += `- **Status**: ${batch.status}\n`;
    markdown += `- **Agent**: ${batch.agent_name}\n`;
    markdown += `- **Dispatched/Scheduled**: ${batch.total_calls_dispatched}/${batch.total_calls_scheduled}\n`;
    markdown += `- **Created**: ${new Date(batch.created_at_unix * 1000).toISOString()}\n\n`;
  });

  if (response.has_more) {
    markdown += `\n**More batches available.** Use \`last_doc="${response.next_doc}"\` to see the next page.\n`;
  }

  return truncateIfNeeded(markdown, response.has_more ? `Use last_doc="${response.next_doc}" to continue` : undefined);
}

/**
 * Formats detailed batch call information with recipient statuses
 */
export function formatBatchCallDetailMarkdown(batch: BatchCallDetailedResponse): string {
  let markdown = formatBatchCallMarkdown(batch);

  if (batch.recipients && batch.recipients.length > 0) {
    markdown += `\n## Recipients (${batch.recipients.length})\n\n`;

    // Group recipients by status
    const statusGroups: Record<string, typeof batch.recipients> = {};
    batch.recipients.forEach(recipient => {
      if (!statusGroups[recipient.status]) {
        statusGroups[recipient.status] = [];
      }
      statusGroups[recipient.status].push(recipient);
    });

    // Show summary
    markdown += `**Status Summary**:\n`;
    Object.entries(statusGroups).forEach(([status, recipients]) => {
      markdown += `- ${status}: ${recipients.length}\n`;
    });
    markdown += `\n`;

    // Show first 20 recipients
    const displayLimit = 20;
    batch.recipients.slice(0, displayLimit).forEach((recipient, idx) => {
      markdown += `### ${idx + 1}. `;
      if (recipient.phone_number) {
        markdown += `${recipient.phone_number}`;
      } else if (recipient.whatsapp_user_id) {
        markdown += `WhatsApp: ${recipient.whatsapp_user_id}`;
      }
      markdown += `\n`;
      markdown += `- **Status**: ${recipient.status}\n`;
      markdown += `- **Conversation ID**: ${recipient.conversation_id}\n`;
      markdown += `- **Updated**: ${new Date(recipient.updated_at_unix * 1000).toISOString()}\n\n`;
    });

    if (batch.recipients.length > displayLimit) {
      markdown += `\n*Showing ${displayLimit} of ${batch.recipients.length} recipients. Use JSON format for complete list.*\n`;
    }
  }

  return truncateIfNeeded(markdown);
}

/**
 * Formats a list of phone numbers in Markdown format
 */
export function formatPhoneNumberListMarkdown(phoneNumbers: PhoneNumber[]): string {
  if (phoneNumbers.length === 0) {
    return "# Phone Numbers\n\nNo phone numbers found.\n";
  }

  let markdown = `# Phone Numbers (${phoneNumbers.length})\n\n`;

  phoneNumbers.forEach((phone, idx) => {
    markdown += `## ${idx + 1}. ${phone.label}\n`;
    markdown += `- **Number**: ${phone.phone_number}\n`;
    markdown += `- **ID**: ${phone.phone_number_id}\n`;
    markdown += `- **Provider**: ${phone.provider}\n`;
    markdown += `- **Inbound**: ${phone.supports_inbound ? "✓" : "✗"}\n`;
    markdown += `- **Outbound**: ${phone.supports_outbound ? "✓" : "✗"}\n`;

    if (phone.assigned_agent) {
      markdown += `- **Assigned Agent**: ${phone.assigned_agent.agent_name} (${phone.assigned_agent.agent_id})\n`;
    } else {
      markdown += `- **Assigned Agent**: None\n`;
    }

    if (phone.provider === "sip_trunk") {
      markdown += `- **LiveKit Stack**: ${phone.livekit_stack}\n`;
    }

    markdown += `\n`;
  });

  return truncateIfNeeded(markdown);
}

/**
 * Formats a single phone number in Markdown format
 */
export function formatPhoneNumberMarkdown(phone: PhoneNumber): string {
  let markdown = `# Phone Number: ${phone.label}\n\n`;
  markdown += `**Number**: ${phone.phone_number}\n`;
  markdown += `**ID**: ${phone.phone_number_id}\n`;
  markdown += `**Provider**: ${phone.provider}\n\n`;

  markdown += `## Capabilities\n`;
  markdown += `- **Inbound Calls**: ${phone.supports_inbound ? "Enabled" : "Disabled"}\n`;
  markdown += `- **Outbound Calls**: ${phone.supports_outbound ? "Enabled" : "Disabled"}\n\n`;

  if (phone.assigned_agent) {
    markdown += `## Assigned Agent\n`;
    markdown += `- **Name**: ${phone.assigned_agent.agent_name}\n`;
    markdown += `- **ID**: ${phone.assigned_agent.agent_id}\n\n`;
  } else {
    markdown += `## Assigned Agent\n`;
    markdown += `No agent currently assigned to this phone number.\n\n`;
  }

  if (phone.provider === "sip_trunk") {
    markdown += `## SIP Trunk Configuration\n`;
    markdown += `- **LiveKit Stack**: ${phone.livekit_stack}\n`;
    if (phone.inbound_trunk) {
      markdown += `- **Inbound Trunk**: Configured\n`;
    }
    if (phone.outbound_trunk) {
      markdown += `- **Outbound Trunk**: Configured\n`;
    }
    markdown += `\n`;
  }

  return markdown;
}

/**
 * Formats phone number import response in Markdown format
 */
export function formatPhoneNumberImportMarkdown(response: ImportPhoneNumberResponse): string {
  let markdown = `# Phone Number Imported Successfully\n\n`;
  markdown += `**Phone Number ID**: ${response.phone_number_id}\n\n`;
  markdown += `The phone number has been successfully imported and is ready to use.\n\n`;
  markdown += `**Next Steps**:\n`;
  markdown += `1. Assign an agent to this phone number using \`elevenlabs_update_phone_number\`\n`;
  markdown += `2. Start making outbound calls with \`elevenlabs_start_outbound_call\`\n`;

  return markdown;
}

/**
 * Formats any response as JSON
 */
export function formatAsJSON(data: unknown): string {
  return formatJSON(data);
}

/**
 * Main formatting function that routes to appropriate formatter
 */
export function formatResponse(
  data: unknown,
  format: ResponseFormat,
  type: "agent" | "agent_list" | "conversation" | "conversation_list" | "tool" | "tool_list" | "voice_list" | "widget" | "outbound_call" | "batch_call" | "batch_call_list" | "batch_call_detail" | "phone_number_list" | "phone_number" | "phone_number_import" | "generic"
): string {
  if (format === ResponseFormat.JSON) {
    return formatAsJSON(data);
  }

  // Markdown formatting based on type
  switch (type) {
    case "agent":
      return formatAgentMarkdown(data as Agent);

    case "agent_list": {
      const paginated = data as PaginatedResponse<AgentListItem>;
      return formatAgentListMarkdown(
        paginated.items,
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
