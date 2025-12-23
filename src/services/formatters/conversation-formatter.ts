/**
 * Conversation formatter utilities
 *
 * Formats ElevenLabs conversation data for display in Markdown format.
 */

import { ConversationMetadata } from "../../types.js";
import { truncateIfNeeded } from "../../utils/truncation.js";

/**
 * Formats a single conversation in Markdown format
 *
 * @param conversation - The conversation metadata to format
 * @returns Formatted Markdown string with transcript and analysis
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

    conversation.transcript.forEach((entry) => {
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
 *
 * @param conversations - Array of conversations to format
 * @param total - Total number of conversations available
 * @param offset - Current pagination offset
 * @param hasMore - Whether more conversations are available
 * @returns Formatted Markdown string with pagination info
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
