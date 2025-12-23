/**
 * Tool formatter utilities
 *
 * Formats ElevenLabs tool configuration data for display in Markdown format.
 */

import { ToolConfig } from "../../types.js";
import { truncateIfNeeded, truncateMiddle } from "../../utils/truncation.js";

/**
 * Formats a single tool configuration in Markdown format
 *
 * @param tool - The tool configuration to format
 * @returns Formatted Markdown string with tool details and parameters
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
 *
 * @param tools - Array of tool configurations to format
 * @returns Formatted Markdown string with tool list
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
