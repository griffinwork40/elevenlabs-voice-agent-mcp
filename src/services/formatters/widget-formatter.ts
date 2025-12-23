/**
 * Widget formatter utilities
 *
 * Generates embed code for ElevenLabs voice agent widgets.
 */

/**
 * Formats widget embed code for a voice agent
 *
 * @param agentId - The agent ID to embed
 * @param color - Optional widget color (hex code)
 * @param avatarUrl - Optional URL for the widget avatar
 * @returns Formatted Markdown string with HTML embed code
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
