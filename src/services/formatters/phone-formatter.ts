/**
 * Phone number formatter utilities
 *
 * Formats phone number data for display in Markdown format.
 */

import { PhoneNumber, ImportPhoneNumberResponse } from "../../types.js";
import { truncateIfNeeded } from "../../utils/truncation.js";

/**
 * Formats a list of phone numbers in Markdown format
 *
 * @param phoneNumbers - Array of phone numbers to format
 * @returns Formatted Markdown string with phone number details
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
 *
 * @param phone - The phone number object to format
 * @returns Formatted Markdown string with detailed phone number info
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
 *
 * @param response - The import phone number response to format
 * @returns Formatted Markdown string with import confirmation and next steps
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
