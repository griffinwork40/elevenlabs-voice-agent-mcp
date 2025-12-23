/**
 * Voice formatter utilities
 *
 * Formats ElevenLabs voice data for display in Markdown format.
 */

import { Voice } from "../../types.js";
import { truncateIfNeeded } from "../../utils/truncation.js";

/**
 * Formats a list of voices in Markdown format
 *
 * @param voices - Array of voices to format
 * @returns Formatted Markdown string with voice details
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
