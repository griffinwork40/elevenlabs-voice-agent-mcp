/**
 * Response truncation utilities
 *
 * Handles truncation of large responses to stay within MCP character limits
 * while providing clear guidance to users.
 */

import { CHARACTER_LIMIT } from "../constants.js";

/**
 * Truncates content if it exceeds the character limit
 *
 * @param content - The content to potentially truncate
 * @param context - Additional context or guidance for the user
 * @returns Original or truncated content with indicator
 */
export function truncateIfNeeded(content: string, context?: string): string {
  if (content.length <= CHARACTER_LIMIT) {
    return content;
  }

  const truncated = content.substring(0, CHARACTER_LIMIT);
  const guidance = context || "Consider using filters or pagination to see more results";

  return `${truncated}\n\n[TRUNCATED: Response exceeded ${CHARACTER_LIMIT} characters. ${guidance}]`;
}

/**
 * Truncates an array of items and provides pagination guidance
 *
 * @param items - Array of items that might need truncation
 * @param formatter - Function to format each item as a string
 * @param currentOffset - Current pagination offset
 * @param context - Additional context for users
 * @returns Formatted and potentially truncated string
 */
export function truncateArray<T>(
  items: T[],
  formatter: (item: T, index: number) => string,
  currentOffset: number = 0,
  context?: string
): string {
  let result = "";
  let count = 0;

  for (let i = 0; i < items.length; i++) {
    const formatted = formatter(items[i], i);

    if (result.length + formatted.length > CHARACTER_LIMIT) {
      const nextOffset = currentOffset + count;
      const guidance = context || `Use offset=${nextOffset} to continue from where truncation occurred`;
      result += `\n\n[TRUNCATED: Response exceeded ${CHARACTER_LIMIT} characters. ${guidance}]`;
      break;
    }

    result += formatted;
    count++;
  }

  return result;
}

/**
 * Safely truncates a string in the middle, preserving start and end
 *
 * @param content - Content to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string with "..." indicator
 */
export function truncateMiddle(content: string, maxLength: number): string {
  if (content.length <= maxLength) {
    return content;
  }

  const halfLength = Math.floor((maxLength - 3) / 2);
  const start = content.substring(0, halfLength);
  const end = content.substring(content.length - halfLength);

  return `${start}...${end}`;
}

/**
 * Formats a large JSON object with optional truncation
 *
 * @param obj - Object to format
 * @param indent - Indentation spaces (default: 2)
 * @returns JSON string, potentially truncated
 */
export function formatJSON(obj: unknown, indent: number = 2): string {
  const json = JSON.stringify(obj, null, indent);

  if (json.length > CHARACTER_LIMIT) {
    return truncateIfNeeded(json, "Response is very large. Consider using filters or requesting specific fields");
  }

  return json;
}
