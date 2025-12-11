/**
 * Test utilities and helpers for MCP server testing
 *
 * Provides shared utilities for testing MCP protocol, API connections, and tool execution.
 */
import { ChildProcess } from "child_process";
/**
 * Spawns the MCP server process for testing
 */
export declare function spawnMcpServer(): ChildProcess;
/**
 * Validates API key format (basic check)
 */
export declare function isValidApiKeyFormat(key: string | undefined): boolean;
/**
 * Sleep utility for async delays
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Reads stdout/stderr from a process with timeout
 */
export declare function readProcessOutput(process: ChildProcess, timeout?: number): Promise<{
    stdout: string;
    stderr: string;
}>;
/**
 * Test data fixtures
 */
export declare const testFixtures: {
    validAgentId: string;
    invalidAgentId: string;
    validPhoneNumber: string;
    validVoiceId: string;
    validConversationId: string;
};
/**
 * Color codes for terminal output
 */
export declare const colors: {
    reset: string;
    red: string;
    green: string;
    yellow: string;
    blue: string;
    cyan: string;
};
/**
 * Logging utilities
 */
export declare const logger: {
    info: (msg: string) => void;
    success: (msg: string) => void;
    error: (msg: string) => void;
    warn: (msg: string) => void;
    test: (msg: string) => void;
};
//# sourceMappingURL=test-helpers.d.ts.map