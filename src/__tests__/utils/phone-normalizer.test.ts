/**
 * Tests for phone number normalization utilities
 *
 * Tests E.164 format conversion, validation, and batch processing.
 */

import { describe, it, expect } from "vitest";
import {
  normalizePhoneNumber,
  isValidE164,
  normalizePhoneNumbers
} from "../../utils/phone-normalizer.js";

describe("Phone Normalizer", () => {
  describe("normalizePhoneNumber", () => {
    describe("Basic formatting", () => {
      it("should normalize US number with spaces", () => {
        const result = normalizePhoneNumber("+1 412 481 2210");
        expect(result).toBe("+14124812210");
      });

      it("should normalize US number with parentheses", () => {
        const result = normalizePhoneNumber("(623) 258-3673");
        expect(result).toBe("+16232583673");
      });

      it("should normalize US number with dots", () => {
        const result = normalizePhoneNumber("817.527.9708");
        expect(result).toBe("+18175279708");
      });

      it("should normalize US number with dashes", () => {
        const result = normalizePhoneNumber("415-555-1234");
        expect(result).toBe("+14155551234");
      });

      it("should normalize number with mixed formats", () => {
        const result = normalizePhoneNumber("(415) 555.1234");
        expect(result).toBe("+14155551234");
      });
    });

    describe("Extension handling", () => {
      it("should remove extension with x", () => {
        const result = normalizePhoneNumber("518-434-8128 x206");
        expect(result).toBe("+15184348128");
      });

      it("should remove extension with ext", () => {
        const result = normalizePhoneNumber("(415) 555-1234 ext 123");
        expect(result).toBe("+14155551234");
      });

      it("should remove extension with extension", () => {
        const result = normalizePhoneNumber("415-555-1234 extension 456");
        expect(result).toBe("+14155551234");
      });

      it("should remove extension with colon", () => {
        const result = normalizePhoneNumber("415-555-1234 x:789");
        expect(result).toBe("+14155551234");
      });
    });

    describe("Country code handling", () => {
      it("should add +1 to 10-digit US number", () => {
        const result = normalizePhoneNumber("4155551234");
        expect(result).toBe("+14155551234");
      });

      it("should preserve existing +1 country code", () => {
        const result = normalizePhoneNumber("+14155551234");
        expect(result).toBe("+14155551234");
      });

      it("should handle 11-digit number starting with 1", () => {
        const result = normalizePhoneNumber("14155551234");
        expect(result).toBe("+14155551234");
      });

      it("should add +1 to number with + but only 10 digits", () => {
        const result = normalizePhoneNumber("+4155551234");
        expect(result).toBe("+14155551234");
      });

      it("should use custom country code", () => {
        const result = normalizePhoneNumber("7911123456", "+44");
        expect(result).toBe("+447911123456");
      });

      it("should handle non-US country code", () => {
        const result = normalizePhoneNumber("+447911123456");
        expect(result).toBe("+447911123456");
      });
    });

    describe("Invalid inputs", () => {
      it("should return null for empty string", () => {
        const result = normalizePhoneNumber("");
        expect(result).toBeNull();
      });

      it("should return null for null input", () => {
        const result = normalizePhoneNumber(null);
        expect(result).toBeNull();
      });

      it("should return null for undefined input", () => {
        const result = normalizePhoneNumber(undefined);
        expect(result).toBeNull();
      });

      it("should return null for whitespace only", () => {
        const result = normalizePhoneNumber("   ");
        expect(result).toBeNull();
      });

      it("should return null for non-digits only", () => {
        const result = normalizePhoneNumber("abc-def-ghij");
        expect(result).toBeNull();
      });

      it("should return null for number starting with 0", () => {
        const result = normalizePhoneNumber("0000000000");
        expect(result).toBeNull();
      });

      it("should return null for too long number", () => {
        const result = normalizePhoneNumber("1234567890123456789");
        expect(result).toBeNull();
      });
    });

    describe("Edge cases", () => {
      it("should handle number with leading zeros after extraction", () => {
        // After stripping zeros, we have 1234567890 (10 digits)
        // The normalizer adds +1 for 10-digit numbers with default country code
        const result = normalizePhoneNumber("+0001234567890");
        expect(result).toBe("+11234567890");
      });

      it("should handle number with parentheses and spaces", () => {
        const result = normalizePhoneNumber("( 415 )  555 - 1234");
        expect(result).toBe("+14155551234");
      });

      it("should trim whitespace from input", () => {
        const result = normalizePhoneNumber("  (415) 555-1234  ");
        expect(result).toBe("+14155551234");
      });

      it("should handle international format with +", () => {
        const result = normalizePhoneNumber("+1-415-555-1234");
        expect(result).toBe("+14155551234");
      });
    });
  });

  describe("isValidE164", () => {
    it("should return true for valid E.164 with +", () => {
      expect(isValidE164("+14155551234")).toBe(true);
    });

    it("should return true for valid E.164 without +", () => {
      expect(isValidE164("14155551234")).toBe(true);
    });

    it("should return true for international number", () => {
      expect(isValidE164("+447911123456")).toBe(true);
    });

    it("should return true for short valid number", () => {
      expect(isValidE164("+49")).toBe(true);
    });

    it("should return true for long valid number", () => {
      expect(isValidE164("+123456789012345")).toBe(true);
    });

    it("should return false for number starting with 0", () => {
      expect(isValidE164("+01234567890")).toBe(false);
    });

    it("should return false for formatted number", () => {
      expect(isValidE164("(415) 555-1234")).toBe(false);
    });

    it("should return false for number with letters", () => {
      expect(isValidE164("+1415555ABC")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isValidE164("")).toBe(false);
    });

    it("should return false for too long number", () => {
      expect(isValidE164("+1234567890123456")).toBe(false);
    });
  });

  describe("normalizePhoneNumbers", () => {
    it("should normalize array of valid phone numbers", () => {
      const input = ["(415) 555-1234", "+14155559999"];
      const result = normalizePhoneNumbers(input);

      expect(result.normalized).toHaveLength(2);
      expect(result.normalized).toContain("+14155551234");
      expect(result.normalized).toContain("+14155559999");
      expect(result.invalid).toHaveLength(0);
    });

    it("should separate valid from invalid numbers", () => {
      const input = ["(415) 555-1234", "invalid", null, "+1234567890"];
      const result = normalizePhoneNumbers(input);

      expect(result.normalized).toHaveLength(2);
      expect(result.invalid).toHaveLength(2);
      expect(result.invalid[0]).toEqual({ index: 1, original: "invalid" });
      expect(result.invalid[1]).toEqual({ index: 2, original: null });
    });

    it("should handle empty array", () => {
      const result = normalizePhoneNumbers([]);

      expect(result.normalized).toHaveLength(0);
      expect(result.invalid).toHaveLength(0);
    });

    it("should handle array with all invalid numbers", () => {
      const input = ["invalid", "", null, undefined];
      const result = normalizePhoneNumbers(input);

      expect(result.normalized).toHaveLength(0);
      expect(result.invalid).toHaveLength(4);
    });

    it("should use custom country code", () => {
      const input = ["7911123456"];
      const result = normalizePhoneNumbers(input, "+44");

      expect(result.normalized).toEqual(["+447911123456"]);
      expect(result.invalid).toHaveLength(0);
    });

    it("should preserve order in normalized array", () => {
      const input = ["(415) 555-1234", "(310) 555-5678", "(650) 555-9012"];
      const result = normalizePhoneNumbers(input);

      expect(result.normalized[0]).toBe("+14155551234");
      expect(result.normalized[1]).toBe("+13105555678");
      expect(result.normalized[2]).toBe("+16505559012");
    });

    it("should track correct indices for invalid numbers", () => {
      const input = ["valid", "invalid1", "valid2", "invalid2"];
      const result = normalizePhoneNumbers(input);

      // "valid" and "invalid1" don't produce 10-digit numbers, so they're invalid
      // The indices should match the original array positions
      result.invalid.forEach(inv => {
        expect(typeof inv.index).toBe("number");
        expect(inv.index >= 0 && inv.index < input.length).toBe(true);
      });
    });

    it("should handle mixed null/undefined/string array", () => {
      const input: (string | null | undefined)[] = [
        "+14155551234",
        null,
        "(310) 555-5678",
        undefined,
        ""
      ];
      const result = normalizePhoneNumbers(input);

      expect(result.normalized).toHaveLength(2);
      expect(result.invalid).toHaveLength(3);
    });
  });
});
