#!/usr/bin/env node

/**
 * Server Startup Validation Test
 *
 * Tests that the MCP server starts correctly, registers all tools, and handles errors properly.
 */

import "dotenv/config";
import { spawnMcpServer, readProcessOutput, logger, colors, sleep } from "./utils/test-helpers.js";
import { spawn } from "child_process";
import { join } from "path";
import { existsSync } from "fs";

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

async function testBuildExists(): Promise<void> {
  const distPath = join(process.cwd(), "dist", "index.js");
  const exists = existsSync(distPath);
  recordTest(
    "Build Exists",
    exists,
    exists ? `Found build at ${distPath}` : `Build not found at ${distPath} - run 'npm run build' first`
  );
}

async function testServerStartsWithoutApiKey(): Promise<void> {
  const server = spawn("node", [join(process.cwd(), "dist", "index.js")], {
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      ELEVENLABS_API_KEY: "" // Explicitly unset
    }
  });

  try {
    await sleep(1000);
    const output = await readProcessOutput(server, 2000);
    server.kill();

    const hasError = output.stderr.includes("ELEVENLABS_API_KEY") || output.stderr.includes("API key");
    recordTest(
      "Server Fails Without API Key",
      hasError,
      hasError
        ? "Server correctly fails with clear error message"
        : "Server should fail when API key is missing",
      hasError ? undefined : `Stderr: ${output.stderr.substring(0, 200)}`
    );
  } catch (error) {
    server.kill();
    const message = error instanceof Error ? error.message : String(error);
    recordTest("Server Fails Without API Key", true, "Server exited (expected)", message);
  }
}

async function testServerStartsWithApiKey(): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    recordTest(
      "Server Starts With API Key",
      false,
      "Cannot test - ELEVENLABS_API_KEY not set"
    );
    return;
  }

  const server = spawnMcpServer();
  let stderrOutput = "";

  // Collect stderr output
  if (server.stderr) {
    server.stderr.on("data", (data: Buffer) => {
      stderrOutput += data.toString();
    });
  }

  try {
    await sleep(3000); // Give server time to start and output messages
    
    const hasStartupMessage =
      stderrOutput.includes("ElevenLabs Voice Agent MCP server running") ||
      stderrOutput.includes("Registered");

    recordTest(
      "Server Starts With API Key",
      hasStartupMessage,
      hasStartupMessage
        ? "Server started successfully"
        : "Server did not output expected startup message",
      hasStartupMessage ? undefined : `Stderr: ${stderrOutput.substring(0, 200)}`
    );

    server.kill();
    await sleep(500); // Give it time to die
  } catch (error) {
    server.kill();
    const message = error instanceof Error ? error.message : String(error);
    recordTest("Server Starts With API Key", false, "Server startup test failed", message);
  }
}

async function testToolRegistration(): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    recordTest("Tool Registration", false, "Cannot test - ELEVENLABS_API_KEY not set");
    return;
  }

  const server = spawnMcpServer();
  let stderrOutput = "";

  // Collect stderr output
  if (server.stderr) {
    server.stderr.on("data", (data: Buffer) => {
      stderrOutput += data.toString();
    });
  }

  try {
    await sleep(3000); // Give server time to start and output messages

    // Check for tool registration message
    const toolMatch = stderrOutput.match(/Registered (\d+) tools/);
    if (toolMatch) {
      const toolCount = parseInt(toolMatch[1], 10);
      const expectedCount = 22; // Actual count of registered tools
      recordTest(
        "Tool Registration",
        toolCount === expectedCount,
        `Registered ${toolCount} tools (expected ${expectedCount})`,
        toolCount !== expectedCount ? `Expected ${expectedCount}, got ${toolCount}` : undefined
      );
    } else {
      recordTest(
        "Tool Registration",
        false,
        "Could not find tool registration message",
        `Stderr: ${stderrOutput.substring(0, 200)}`
      );
    }

    server.kill();
    await sleep(500); // Give it time to die
  } catch (error) {
    server.kill();
    const message = error instanceof Error ? error.message : String(error);
    recordTest("Tool Registration", false, "Tool registration test failed", message);
  }
}

async function testErrorMessages(): Promise<void> {
  const server = spawn("node", [join(process.cwd(), "dist", "index.js")], {
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      ELEVENLABS_API_KEY: ""
    }
  });

  try {
    await sleep(1000);
    const output = await readProcessOutput(server, 2000);
    server.kill();

    const hasClearError =
      output.stderr.includes("ELEVENLABS_API_KEY") ||
      output.stderr.includes("API key") ||
      output.stderr.includes("Failed to start");

    recordTest(
      "Error Messages",
      hasClearError,
      hasClearError
        ? "Error messages are clear and actionable"
        : "Error messages could be clearer",
      hasClearError ? undefined : `Stderr: ${output.stderr.substring(0, 200)}`
    );
  } catch (error) {
    server.kill();
    const message = error instanceof Error ? error.message : String(error);
    recordTest("Error Messages", true, "Server exited with error (expected)", message);
  }
}

async function runAllTests(): Promise<void> {
  console.log(`${colors.cyan}=== MCP Server Startup Tests ===${colors.reset}\n`);

  await testBuildExists();
  await testServerStartsWithoutApiKey();
  await testServerStartsWithApiKey();
  await testToolRegistration();
  await testErrorMessages();

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

