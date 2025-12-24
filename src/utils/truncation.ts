/**
 * @fileoverview Response truncation utilities
 * @description Handles truncation of large responses to stay within MCP character limits
 * while providing clear guidance to users. Prevents overwhelming clients with excessive data.
 * @module utils/truncation
 */

import { CHARACTER_LIMIT } from "../constants.js";

/**
 * Truncates content if it exceeds the character limit.
 * @description Checks content length against CHARACTER_LIMIT and truncates with
 * a helpful message if exceeded. Used to prevent response overflow in MCP tools.
 *
 * @param {string} content - The content to potentially truncate
 * @param {string} [context] - Additional context or guidance for the user
 * @returns {string} Original content if within limit, or truncated with indicator
 *
 * @example
 * const output = truncateIfNeeded(longMarkdown, "Use offset=100 to continue");
 * // If over limit: "...content...[TRUNCATED: Response exceeded 25000 characters. Use offset=100 to continue]"
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
 * Truncates an array of items with pagination guidance.
 * @description Formats array items one by one, stopping when the character limit
 * is reached. Provides pagination guidance for fetching remaining items.
 *
 * @template T - Type of items in the array
 * @param {T[]} items - Array of items that might need truncation
 * @param {(item: T, index: number) => string} formatter - Function to format each item as a string
 * @param {number} [currentOffset=0] - Current pagination offset for guidance
 * @param {string} [context] - Additional context for users
 * @returns {string} Formatted and potentially truncated string
 *
 * @example
 * const output = truncateArray(agents, (agent, i) => `${i}. ${agent.name}\n`, 0);
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
 * Safely truncates a string in the middle, preserving start and end.
 * @description Useful for displaying long strings (like URLs) in limited space
 * while showing both the beginning and end.
 *
 * @param {string} content - Content to truncate
 * @param {number} maxLength - Maximum length of output string
 * @returns {string} Truncated string with "..." indicator in the middle
 *
 * @example
 * truncateMiddle("https://example.com/very/long/path/to/resource", 30);
 * // Returns: "https://examp...to/resource"
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
 * Formats a large JSON object with optional truncation.
 * @description Converts any object to pretty-printed JSON, automatically
 * truncating if the result exceeds CHARACTER_LIMIT.
 *
 * @param {unknown} obj - Object to format as JSON
 * @param {number} [indent=2] - Number of spaces for indentation
 * @returns {string} JSON string, potentially truncated with guidance
 *
 * @example
 * const json = formatJSON({ agents: [...] });
 * // Returns pretty-printed JSON, truncated if over 25000 chars
 */
export function formatJSON(obj: unknown, indent: number = 2): string {
  const json = JSON.stringify(obj, null, indent);

  if (json.length > CHARACTER_LIMIT) {
    return truncateIfNeeded(json, "Response is very large. Consider using filters or requesting specific fields");
  }

  return json;
}
