#!/usr/bin/env node

/**
 * API Connection Test Script
 *
 * Tests connectivity to ElevenLabs API, validates API key, and checks basic endpoints.
 */

import "dotenv/config";
import axios from "axios";
import { API_BASE_URL } from "../src/constants.js";
import { isValidApiKeyFormat, logger, colors } from "./utils/test-helpers.js";

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  error?: string;
}

const results: TestResult[] = [];

function recordTest(name: string, passed: boolean, message: string, error?: string): void {
  results.push({ name, passed, message, error });
  if (passed) {
    logger.success(`${name}: ${message}`);
  } else {
    logger.error(`${name}: ${message}${error ? ` - ${error}` : ""}`);
  }
}

async function testApiKeyPresence(): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    recordTest(
      "API Key Presence",
      false,
      "ELEVENLABS_API_KEY environment variable is not set"
    );
    return;
  }
  recordTest("API Key Presence", true, "API key is set");
}

async function testApiKeyFormat(): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    recordTest("API Key Format", false, "Cannot test format - API key not set");
    return;
  }

  const isValid = isValidApiKeyFormat(apiKey);
  recordTest(
    "API Key Format",
    isValid,
    isValid ? "API key format appears valid" : "API key format may be invalid"
  );
}

async function testNetworkConnectivity(): Promise<void> {
  try {
    const response = await axios.get(API_BASE_URL, {
      timeout: 5000,
      validateStatus: () => true // Accept any status code
    });
    recordTest(
      "Network Connectivity",
      true,
      `Connected to ${API_BASE_URL} (status: ${response.status})`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    recordTest(
      "Network Connectivity",
      false,
      `Cannot connect to ${API_BASE_URL}`,
      message
    );
  }
}

async function testApiAuthentication(): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    recordTest("API Authentication", false, "Cannot test - API key not set");
    return;
  }

  try {
    // Test with a simple endpoint that requires auth
    const response = await axios.get(`${API_BASE_URL}/user`, {
      headers: {
        "xi-api-key": apiKey
      },
      timeout: 10000,
      validateStatus: () => true
    });

    if (response.status === 200) {
      recordTest("API Authentication", true, "API key is valid");
    } else if (response.status === 401) {
      recordTest(
        "API Authentication",
        false,
        "API key is invalid or expired",
        `Status: ${response.status}`
      );
    } else {
      recordTest(
        "API Authentication",
        false,
        `Unexpected response status: ${response.status}`,
        JSON.stringify(response.data).substring(0, 100)
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    recordTest("API Authentication", false, "Authentication test failed", message);
  }
}

async function testAgentsEndpoint(): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    recordTest("Agents Endpoint", false, "Cannot test - API key not set");
    return;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/convai/agents`, {
      headers: {
        "xi-api-key": apiKey
      },
      params: {
        limit: 1
      },
      timeout: 10000,
      validateStatus: () => true
    });

    if (response.status === 200) {
      recordTest("Agents Endpoint", true, "Agents endpoint is accessible");
    } else if (response.status === 401) {
      recordTest(
        "Agents Endpoint",
        false,
        "Unauthorized - check API key permissions",
        `Status: ${response.status}`
      );
    } else {
      recordTest(
        "Agents Endpoint",
        false,
        `Unexpected status: ${response.status}`,
        JSON.stringify(response.data).substring(0, 100)
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    recordTest("Agents Endpoint", false, "Agents endpoint test failed", message);
  }
}

async function testRateLimitDetection(): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    recordTest("Rate Limit Detection", false, "Cannot test - API key not set");
    return;
  }

  try {
    // Make a few rapid requests to check rate limiting
    const requests = Array(3)
      .fill(0)
      .map(() =>
        axios.get(`${API_BASE_URL}/user`, {
          headers: { "xi-api-key": apiKey },
          timeout: 5000,
          validateStatus: () => true
        })
      );

    const responses = await Promise.all(requests);
    const rateLimited = responses.some((r) => r.status === 429);

    if (rateLimited) {
      recordTest(
        "Rate Limit Detection",
        true,
        "Rate limiting detected (429 status) - this is expected behavior"
      );
    } else {
      recordTest(
        "Rate Limit Detection",
        true,
        "No rate limiting detected in test requests"
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    recordTest("Rate Limit Detection", false, "Rate limit test failed", message);
  }
}

async function runAllTests(): Promise<void> {
  console.log(`${colors.cyan}=== ElevenLabs API Connection Tests ===${colors.reset}\n`);

  await testApiKeyPresence();
  await testApiKeyFormat();
  await testNetworkConnectivity();
  await testApiAuthentication();
  await testAgentsEndpoint();
  await testRateLimitDetection();

  console.log(`\n${colors.cyan}=== Test Summary ===${colors.reset}`);
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const failed = total - passed;

  console.log(`Total: ${total}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  if (failed > 0) {
    console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  }

  console.log("\nDetailed Results:");
  results.forEach((result) => {
    const icon = result.passed ? "✓" : "✗";
    const color = result.passed ? colors.green : colors.red;
    console.log(`  ${color}${icon}${colors.reset} ${result.name}: ${result.message}`);
    if (result.error) {
      console.log(`    ${colors.yellow}→ ${result.error}${colors.reset}`);
    }
  });

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  logger.error(`Test execution failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

