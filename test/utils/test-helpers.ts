/**
 * Test utilities and helpers for MCP server testing
 *
 * Provides shared utilities for testing MCP protocol, API connections, and tool execution.
 */

import { spawn, ChildProcess } from "child_process";
import { join } from "path";

/**
 * Spawns the MCP server process for testing
 */
export function spawnMcpServer(): ChildProcess {
  const serverPath = join(process.cwd(), "dist", "index.js");
  return spawn("node", [serverPath], {
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || ""
    }
  });
}

/**
 * Validates API key format (basic check)
 */
export function isValidApiKeyFormat(key: string | undefined): boolean {
  if (!key) return false;
  // ElevenLabs API keys are typically alphanumeric strings
  return key.length > 10 && /^[a-zA-Z0-9_-]+$/.test(key);
}

/**
 * Sleep utility for async delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Reads stdout/stderr from a process with timeout
 */
export async function readProcessOutput(
  process: ChildProcess,
  timeout: number = 5000
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let resolved = false;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error(`Process output timeout after ${timeout}ms`));
      }
    }, timeout);

    if (process.stdout) {
      process.stdout.on("data", (data: Buffer) => {
        stdout += data.toString();
      });
    }

    if (process.stderr) {
      process.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });
    }

    process.on("exit", () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve({ stdout, stderr });
      }
    });

    process.on("error", (error) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        reject(error);
      }
    });
  });
}

/**
 * Test data fixtures
 */
export const testFixtures = {
  validAgentId: "ag_test123",
  invalidAgentId: "ag_invalid",
  validPhoneNumber: "+14155551234",
  validVoiceId: "21m00Tcm4TlvDq8ikWAM",
  validConversationId: "conv_test123"
};

/**
 * Color codes for terminal output
 */
export const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
};

/**
 * Logging utilities
 */
export const logger = {
  info: (msg: string) => console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}[PASS]${colors.reset} ${msg}`),
  error: (msg: string) => console.error(`${colors.red}[FAIL]${colors.reset} ${msg}`),
  warn: (msg: string) => console.warn(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  test: (msg: string) => console.log(`${colors.blue}[TEST]${colors.reset} ${msg}`)
};






