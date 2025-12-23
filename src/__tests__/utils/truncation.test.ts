/**
 * Tests for truncation utilities
 *
 * Tests content truncation and formatting functions.
 */

import { describe, it, expect, vi } from "vitest";
import {
  truncateIfNeeded,
  truncateArray,
  truncateMiddle,
  formatJSON
} from "../../utils/truncation.js";
import { CHARACTER_LIMIT } from "../../constants.js";

describe("Truncation Utilities", () => {
  describe("truncateIfNeeded", () => {
    it("should return content unchanged if under limit", () => {
      const content = "Short content";

      const result = truncateIfNeeded(content);

      expect(result).toBe(content);
    });

    it("should return content unchanged at exactly limit", () => {
      const content = "x".repeat(CHARACTER_LIMIT);

      const result = truncateIfNeeded(content);

      expect(result).toBe(content);
    });

    it("should truncate content exceeding limit", () => {
      const content = "x".repeat(CHARACTER_LIMIT + 100);

      const result = truncateIfNeeded(content);

      // Result includes the truncated content + truncation message, so it's slightly longer
      // but the original content portion is truncated
      expect(result).toContain("[TRUNCATED:");
      expect(result).toContain(`${CHARACTER_LIMIT} characters`);
    });

    it("should include default guidance in truncation message", () => {
      const content = "x".repeat(CHARACTER_LIMIT + 100);

      const result = truncateIfNeeded(content);

      expect(result).toContain("Consider using filters or pagination");
    });

    it("should include custom context in truncation message", () => {
      const content = "x".repeat(CHARACTER_LIMIT + 100);
      const context = "Use offset=50 to continue";

      const result = truncateIfNeeded(content, context);

      expect(result).toContain("Use offset=50 to continue");
    });

    it("should preserve content start when truncating", () => {
      const content = "START" + "x".repeat(CHARACTER_LIMIT + 100);

      const result = truncateIfNeeded(content);

      expect(result.startsWith("START")).toBe(true);
    });
  });

  describe("truncateArray", () => {
    const formatter = (item: string, idx: number) => `${idx + 1}. ${item}\n`;

    it("should format all items if under limit", () => {
      const items = ["Item 1", "Item 2", "Item 3"];

      const result = truncateArray(items, formatter);

      expect(result).toContain("1. Item 1");
      expect(result).toContain("2. Item 2");
      expect(result).toContain("3. Item 3");
      expect(result).not.toContain("[TRUNCATED:");
    });

    it("should truncate when formatted content exceeds limit", () => {
      // Create items that will exceed CHARACTER_LIMIT when formatted
      const longItem = "x".repeat(5000);
      const items = Array(10).fill(longItem);

      const result = truncateArray(items, formatter);

      expect(result).toContain("[TRUNCATED:");
    });

    it("should include offset in truncation guidance", () => {
      const longItem = "x".repeat(5000);
      const items = Array(10).fill(longItem);

      const result = truncateArray(items, formatter, 5);

      // Should include next offset based on items processed
      expect(result).toContain("offset=");
    });

    it("should include custom context in truncation", () => {
      const longItem = "x".repeat(5000);
      const items = Array(10).fill(longItem);

      const result = truncateArray(items, formatter, 0, "Custom guidance here");

      expect(result).toContain("Custom guidance here");
    });

    it("should handle empty array", () => {
      const result = truncateArray([], formatter);

      expect(result).toBe("");
    });

    it("should handle single item", () => {
      const items = ["Single item"];

      const result = truncateArray(items, formatter);

      expect(result).toBe("1. Single item\n");
    });

    it("should work with complex formatter", () => {
      interface Agent { name: string; id: string }
      const agents: Agent[] = [
        { name: "Agent 1", id: "ag_1" },
        { name: "Agent 2", id: "ag_2" }
      ];
      const agentFormatter = (agent: Agent, idx: number) =>
        `## ${idx + 1}. ${agent.name}\nID: ${agent.id}\n\n`;

      const result = truncateArray(agents, agentFormatter);

      expect(result).toContain("## 1. Agent 1");
      expect(result).toContain("ID: ag_1");
      expect(result).toContain("## 2. Agent 2");
    });
  });

  describe("truncateMiddle", () => {
    it("should return content unchanged if under maxLength", () => {
      const content = "Short";

      const result = truncateMiddle(content, 10);

      expect(result).toBe("Short");
    });

    it("should return content unchanged at exactly maxLength", () => {
      const content = "Exactly10!";

      const result = truncateMiddle(content, 10);

      expect(result).toBe("Exactly10!");
    });

    it("should truncate middle when exceeding maxLength", () => {
      const content = "Hello World! This is a long string.";

      const result = truncateMiddle(content, 20);

      // The length may be slightly less than maxLength due to how halfLength is calculated
      expect(result.length).toBeLessThanOrEqual(20);
      expect(result).toContain("...");
      expect(result.startsWith("Hello")).toBe(true);
      expect(result.endsWith("ing.")).toBe(true);
    });

    it("should preserve start and end equally", () => {
      const content = "AAAAABBBBBCCCCC";

      const result = truncateMiddle(content, 11);

      // With maxLength 11 and "..." taking 3 chars, we have 8 chars for content
      // That's 4 chars at start and 4 at end
      expect(result).toMatch(/^AAAA\.\.\.CCCC$/);
    });

    it("should handle very short maxLength", () => {
      const content = "This is too long";

      const result = truncateMiddle(content, 5);

      expect(result.length).toBe(5);
      expect(result).toContain("...");
    });

    it("should handle maxLength of 3 (just ellipsis)", () => {
      const content = "Long content";

      const result = truncateMiddle(content, 3);

      // With maxLength 3, halfLength = (3-3)/2 = 0, so we get "..."
      expect(result).toBe("...");
    });
  });

  describe("formatJSON", () => {
    it("should format object with default indentation", () => {
      const obj = { key: "value", nested: { a: 1 } };

      const result = formatJSON(obj);

      expect(result).toBe(JSON.stringify(obj, null, 2));
    });

    it("should format object with custom indentation", () => {
      const obj = { key: "value" };

      const result = formatJSON(obj, 4);

      expect(result).toBe(JSON.stringify(obj, null, 4));
    });

    it("should truncate large JSON objects", () => {
      // Create object larger than CHARACTER_LIMIT
      const largeObj = {
        items: Array(1000).fill({ id: "x".repeat(100), data: "y".repeat(100) })
      };

      const result = formatJSON(largeObj);

      expect(result).toContain("[TRUNCATED:");
      expect(result).toContain(`${CHARACTER_LIMIT} characters`);
    });

    it("should not truncate small objects", () => {
      const smallObj = { a: 1, b: 2, c: 3 };

      const result = formatJSON(smallObj);

      expect(result).not.toContain("[TRUNCATED:");
    });

    it("should handle arrays", () => {
      const arr = [1, 2, 3];

      const result = formatJSON(arr);

      expect(result).toBe("[\n  1,\n  2,\n  3\n]");
    });

    it("should handle null", () => {
      const result = formatJSON(null);

      expect(result).toBe("null");
    });

    it("should handle strings", () => {
      const result = formatJSON("test string");

      expect(result).toBe('"test string"');
    });

    it("should handle numbers", () => {
      const result = formatJSON(42);

      expect(result).toBe("42");
    });

    it("should handle booleans", () => {
      expect(formatJSON(true)).toBe("true");
      expect(formatJSON(false)).toBe("false");
    });

    it("should handle deeply nested objects", () => {
      const obj = {
        level1: {
          level2: {
            level3: {
              value: "deep"
            }
          }
        }
      };

      const result = formatJSON(obj);

      expect(result).toContain('"level1"');
      expect(result).toContain('"level2"');
      expect(result).toContain('"level3"');
      expect(result).toContain('"deep"');
    });

    it("should handle special characters in strings", () => {
      const obj = { text: "Hello\nWorld\t\"Quoted\"" };

      const result = formatJSON(obj);

      expect(result).toContain("\\n");
      expect(result).toContain("\\t");
      expect(result).toContain('\\"');
    });
  });
});
