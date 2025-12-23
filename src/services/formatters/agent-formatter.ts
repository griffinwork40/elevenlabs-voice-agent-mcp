/**
 * Agent formatter utilities
 *
 * Formats ElevenLabs voice agent data for display in Markdown format.
 */

import { Agent } from "../../types.js";
import { truncateIfNeeded } from "../../utils/truncation.js";

/**
 * Formats a single agent in Markdown format
 *
 * @param agent - The agent object to format
 * @returns Formatted Markdown string
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
 *
 * @param agents - Array of agents to format
 * @param total - Total number of agents available
 * @param offset - Current pagination offset
 * @param hasMore - Whether more agents are available
 * @returns Formatted Markdown string with pagination info
 */
export function formatAgentListMarkdown(
  agents: Agent[],
  total: number,
  offset: number,
  hasMore: boolean
): string {
  let markdown = `# Agents (${agents.length} of ${total})\n\n`;

  if (agents.length === 0) {
    return markdown + "No agents found.\n";
  }

  agents.forEach((agent, idx) => {
    const num = offset + idx + 1;
    markdown += `## ${num}. ${agent.name}\n`;
    markdown += `- **ID**: ${agent.agent_id}\n`;
    markdown += `- **LLM**: ${agent.conversation_config.agent.prompt.llm}\n`;
    markdown += `- **Language**: ${agent.conversation_config.agent.language}\n`;
    markdown += `- **Created**: ${new Date(agent.created_at).toISOString()}\n\n`;
  });

  if (hasMore) {
    const nextOffset = offset + agents.length;
    markdown += `\n**More agents available.** Use \`offset=${nextOffset}\` to see the next page.\n`;
  }

  return truncateIfNeeded(markdown, `Use offset=${offset + agents.length} to continue`);
}
