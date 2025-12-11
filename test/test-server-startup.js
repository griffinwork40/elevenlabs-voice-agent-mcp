#!/usr/bin/env node
/**
 * Server Startup Validation Test
 *
 * Tests that the MCP server starts correctly, registers all tools, and handles errors properly.
 */
import { spawnMcpServer, readProcessOutput, logger, colors, sleep } from "./utils/test-helpers.js";
import { spawn } from "child_process";
import { join } from "path";
import { existsSync } from "fs";
const results = [];
function recordTest(name, passed, message, error) {
    results.push({ name, passed, message, error });
    if (passed) {
        logger.success(`${name}: ${message}`);
    }
    else {
        logger.error(`${name}: ${message}${error ? ` - ${error}` : ""}`);
    }
}
async function testBuildExists() {
    const distPath = join(process.cwd(), "dist", "index.js");
    const exists = existsSync(distPath);
    recordTest("Build Exists", exists, exists ? `Found build at ${distPath}` : `Build not found at ${distPath} - run 'npm run build' first`);
}
async function testServerStartsWithoutApiKey() {
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
        recordTest("Server Fails Without API Key", hasError, hasError
            ? "Server correctly fails with clear error message"
            : "Server should fail when API key is missing", hasError ? undefined : `Stderr: ${output.stderr.substring(0, 200)}`);
    }
    catch (error) {
        server.kill();
        const message = error instanceof Error ? error.message : String(error);
        recordTest("Server Fails Without API Key", true, "Server exited (expected)", message);
    }
}
async function testServerStartsWithApiKey() {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
        recordTest("Server Starts With API Key", false, "Cannot test - ELEVENLABS_API_KEY not set");
        return;
    }
    const server = spawnMcpServer();
    try {
        await sleep(2000); // Give server time to start
        const output = await readProcessOutput(server, 1000);
        const hasStartupMessage = output.stderr.includes("ElevenLabs Voice Agent MCP server running") ||
            output.stderr.includes("Registered");
        recordTest("Server Starts With API Key", hasStartupMessage, hasStartupMessage
            ? "Server started successfully"
            : "Server did not output expected startup message", hasStartupMessage ? undefined : `Stderr: ${output.stderr.substring(0, 200)}`);
        server.kill();
    }
    catch (error) {
        server.kill();
        const message = error instanceof Error ? error.message : String(error);
        recordTest("Server Starts With API Key", false, "Server startup test failed", message);
    }
}
async function testToolRegistration() {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
        recordTest("Tool Registration", false, "Cannot test - ELEVENLABS_API_KEY not set");
        return;
    }
    const server = spawnMcpServer();
    try {
        await sleep(2000);
        const output = await readProcessOutput(server, 1000);
        // Check for tool registration message
        const toolMatch = output.stderr.match(/Registered (\d+) tools/);
        if (toolMatch) {
            const toolCount = parseInt(toolMatch[1], 10);
            const expectedCount = 23;
            recordTest("Tool Registration", toolCount === expectedCount, `Registered ${toolCount} tools (expected ${expectedCount})`, toolCount !== expectedCount ? `Expected ${expectedCount}, got ${toolCount}` : undefined);
        }
        else {
            recordTest("Tool Registration", false, "Could not find tool registration message", `Stderr: ${output.stderr.substring(0, 200)}`);
        }
        server.kill();
    }
    catch (error) {
        server.kill();
        const message = error instanceof Error ? error.message : String(error);
        recordTest("Tool Registration", false, "Tool registration test failed", message);
    }
}
async function testErrorMessages() {
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
        const hasClearError = output.stderr.includes("ELEVENLABS_API_KEY") ||
            output.stderr.includes("API key") ||
            output.stderr.includes("Failed to start");
        recordTest("Error Messages", hasClearError, hasClearError
            ? "Error messages are clear and actionable"
            : "Error messages could be clearer", hasClearError ? undefined : `Stderr: ${output.stderr.substring(0, 200)}`);
    }
    catch (error) {
        server.kill();
        const message = error instanceof Error ? error.message : String(error);
        recordTest("Error Messages", true, "Server exited with error (expected)", message);
    }
}
async function runAllTests() {
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
//# sourceMappingURL=test-server-startup.js.map