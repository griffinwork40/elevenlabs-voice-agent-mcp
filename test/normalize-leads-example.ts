/**
 * Example script demonstrating phone number normalization for CSV leads
 *
 * This shows how to normalize the phone numbers from your ClickUp CSV export
 * to the E.164 format required by ElevenLabs.
 */

import { normalizePhoneNumber, normalizePhoneNumbers, isValidE164 } from "../src/utils/phone-normalizer.js";

// Example phone numbers from your CSV
const examplePhoneNumbers = [
  "+1 412 481 2210",        // Has spaces
  "+1 302 530 6667",        // Has spaces
  "817.527.9708",           // No country code, has dots
  "(623) 258-3673",         // Has parentheses and dashes
  "404.931.7899",           // No country code, has dots
  "518-434-8128 x206",      // Has dashes and extension
  "+44.1922.722723",        // UK number with dots
  "",                       // Empty
  null,                     // Null
  undefined,                // Undefined
];

console.log("=== Phone Number Normalization Examples ===\n");

examplePhoneNumbers.forEach((phone, index) => {
  const normalized = normalizePhoneNumber(phone);
  const isValid = normalized ? isValidE164(normalized) : false;
  
  console.log(`Example ${index + 1}:`);
  console.log(`  Original:  ${phone ?? '(empty/null)'}`);
  console.log(`  Normalized: ${normalized ?? 'INVALID'}`);
  console.log(`  Valid E.164: ${isValid ? '✓' : '✗'}`);
  console.log();
});

console.log("\n=== Batch Normalization ===\n");

const batchResult = normalizePhoneNumbers(examplePhoneNumbers);

console.log(`Valid normalized numbers (${batchResult.normalized.length}):`);
batchResult.normalized.forEach((phone, index) => {
  console.log(`  ${index + 1}. ${phone}`);
});

console.log(`\nInvalid numbers (${batchResult.invalid.length}):`);
batchResult.invalid.forEach(({ index, original }) => {
  console.log(`  Row ${index + 1}: ${original ?? '(empty)'}`);
});

console.log("\n=== Expected Output for ElevenLabs ===\n");
console.log("Recipients array format:");
console.log(JSON.stringify(
  batchResult.normalized.map((phone, idx) => ({
    id: `lead_${idx + 1}`,
    phone_number: phone,
    conversation_initiation_client_data: {
      dynamic_variables: {
        // Add your lead data here
        name: "Example Name",
        company: "Example Company"
      }
    }
  })),
  null,
  2
));




