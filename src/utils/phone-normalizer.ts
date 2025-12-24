/**
 * @fileoverview Phone number normalization utilities
 * @description Converts various phone number formats to E.164 format required by ElevenLabs.
 * Handles common US/Canadian formats and strips extensions.
 * @module utils/phone-normalizer
 */

/**
 * Normalizes a phone number to E.164 format.
 * @description Cleans and standardizes phone numbers to the E.164 international format
 * required by telephony APIs. Handles various input formats including parentheses,
 * dashes, dots, spaces, and extensions.
 *
 * E.164 format requirements:
 * - Starts with + followed by country code
 * - Contains only digits after the +
 * - Total length 1-15 digits
 * - Must start with 1-9 (no leading zeros)
 *
 * @param {string | null | undefined} phoneNumber - Raw phone number in any format
 * @param {string} [defaultCountryCode='+1'] - Default country code for US/Canada
 * @returns {string | null} Normalized phone number in E.164 format, or null if invalid
 *
 * @example
 * normalizePhoneNumber('+1 412 481 2210')  // Returns: '+14124812210'
 * normalizePhoneNumber('(623) 258-3673')   // Returns: '+16232583673'
 * normalizePhoneNumber('817.527.9708')     // Returns: '+18175279708'
 * normalizePhoneNumber('518-434-8128 x206') // Returns: '+15184348128'
 * normalizePhoneNumber('')                  // Returns: null
 * normalizePhoneNumber(null)                // Returns: null
 */
export function normalizePhoneNumber(
  phoneNumber: string | null | undefined,
  defaultCountryCode: string = '+1'
): string | null {
  if (!phoneNumber) {
    return null;
  }

  // Remove all whitespace
  let normalized = phoneNumber.trim();

  if (normalized.length === 0) {
    return null;
  }

  // Remove extensions (x, ext, extension, etc.)
  const extensionPattern = /\s*(?:x|ext|extension|ex)[\s:]*\d+/i;
  normalized = normalized.replace(extensionPattern, '');

  // Check if it starts with +
  const hasPlus = normalized.startsWith('+');
  if (hasPlus) {
    normalized = normalized.substring(1);
  }

  // Remove all non-digit characters
  const digits = normalized.replace(/\D/g, '');

  if (digits.length === 0) {
    return null;
  }

  // Remove leading zeros (E.164 must start with 1-9)
  let cleanDigits = digits.replace(/^0+/, '');
  if (cleanDigits.length === 0) {
    return null;
  }

  // Ensure it starts with 1-9 (E.164 requirement)
  if (!/^[1-9]/.test(cleanDigits)) {
    return null;
  }

  // Add country code if missing
  let finalNumber = cleanDigits;
  if (hasPlus) {
    // Already had +, so we need to determine if country code is present
    // For US/Canada, if it starts with 1 and has 11 digits, country code is present
    // Otherwise, assume country code is missing and add default
    if (defaultCountryCode === '+1' && cleanDigits.length === 10) {
      // 10 digits, add +1
      finalNumber = `1${cleanDigits}`;
    } else if (defaultCountryCode === '+1' && cleanDigits.length === 11 && cleanDigits.startsWith('1')) {
      // Already has country code
      finalNumber = cleanDigits;
    } else if (!hasPlus || cleanDigits.length < 10) {
      // Add default country code
      const countryCodeDigits = defaultCountryCode.replace(/\D/g, '');
      finalNumber = `${countryCodeDigits}${cleanDigits}`;
    }
  } else {
    // No + prefix, add country code
    const countryCodeDigits = defaultCountryCode.replace(/\D/g, '');
    
    // For US/Canada: if 10 digits, add 1; if 11 digits starting with 1, use as-is
    if (defaultCountryCode === '+1') {
      if (cleanDigits.length === 10) {
        finalNumber = `1${cleanDigits}`;
      } else if (cleanDigits.length === 11 && cleanDigits.startsWith('1')) {
        finalNumber = cleanDigits;
      } else {
        finalNumber = `${countryCodeDigits}${cleanDigits}`;
      }
    } else {
      finalNumber = `${countryCodeDigits}${cleanDigits}`;
    }
  }

  // Validate E.164 format: ^\+?[1-9]\d{1,14}$
  const e164Pattern = /^\+?[1-9]\d{1,14}$/;
  const withPlus = `+${finalNumber}`;
  
  if (!e164Pattern.test(withPlus)) {
    return null;
  }

  return withPlus;
}

/**
 * Validates if a phone number is in E.164 format.
 * @description Checks if the provided string matches the E.164 phone number format
 * without attempting to normalize it.
 *
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} True if valid E.164 format, false otherwise
 *
 * @example
 * isValidE164('+14155551234')  // Returns: true
 * isValidE164('4155551234')    // Returns: true (without +)
 * isValidE164('(415) 555-1234') // Returns: false
 */
export function isValidE164(phoneNumber: string): boolean {
  const e164Pattern = /^\+?[1-9]\d{1,14}$/;
  return e164Pattern.test(phoneNumber);
}

/**
 * Normalizes an array of phone numbers, separating valid from invalid.
 * @description Batch processes phone numbers, returning successfully normalized
 * numbers and tracking which entries failed validation with their original indices.
 *
 * @param {(string | null | undefined)[]} phoneNumbers - Array of raw phone numbers
 * @param {string} [defaultCountryCode='+1'] - Default country code for US/Canada
 * @returns {{ normalized: string[], invalid: Array<{ index: number, original: string | null | undefined }> }}
 *   Object containing array of normalized numbers and array of invalid entries with indices
 *
 * @example
 * const result = normalizePhoneNumbers(['(415) 555-1234', 'invalid', '+1234567890']);
 * // result.normalized: ['+14155551234', '+1234567890']
 * // result.invalid: [{ index: 1, original: 'invalid' }]
 */
export function normalizePhoneNumbers(
  phoneNumbers: (string | null | undefined)[],
  defaultCountryCode: string = '+1'
): {
  normalized: string[];
  invalid: Array<{ index: number; original: string | null | undefined }>;
} {
  const normalized: string[] = [];
  const invalid: Array<{ index: number; original: string | null | undefined }> = [];

  phoneNumbers.forEach((phone, index) => {
    const normalizedPhone = normalizePhoneNumber(phone, defaultCountryCode);
    if (normalizedPhone) {
      normalized.push(normalizedPhone);
    } else {
      invalid.push({ index, original: phone });
    }
  });

  return { normalized, invalid };
}




