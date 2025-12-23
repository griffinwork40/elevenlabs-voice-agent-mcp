/**
 * Call formatter utilities
 *
 * Formats outbound call and batch calling data for display in Markdown format.
 */

import {
  OutboundCallResponse,
  BatchCallResponse,
  BatchCallDetailedResponse,
  WorkspaceBatchCallsResponse
} from "../../types.js";
import { truncateIfNeeded } from "../../utils/truncation.js";

/**
 * Formats an outbound call response in Markdown format
 *
 * @param response - The outbound call response to format
 * @returns Formatted Markdown string with call status and details
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
 *
 * @param batch - The batch call response to format
 * @returns Formatted Markdown string with batch details and statistics
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
 *
 * @param response - The workspace batch calls response to format
 * @returns Formatted Markdown string with list of batches and pagination
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
 *
 * @param batch - The detailed batch call response to format
 * @returns Formatted Markdown string with batch details and recipient list
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
