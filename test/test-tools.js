#!/usr/bin/env node
/**
 * Tool Execution Test Script
 *
 * Tests individual tool execution with various scenarios including
 * valid inputs, invalid inputs, and error handling.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { join } from "path";
import { logger, colors, sleep, testFixtures } from "./utils/test-helpers.js";
const results = [];
function recordResult(tool, passed, message, error) {
    results.push({ tool, passed, message, error });
    if (passed) {
        logger.success(`${tool}: ${message}`);
    }
    else {
        logger.error(`${tool}: ${message}${error ? ` - ${error}` : ""}`);
    }
}
async function createMcpClient() {
    const serverPath = join(process.cwd(), "dist", "index.js");
    const transport = new StdioClientTransport({
        command: "node",
        args: [serverPath]
    });
    const client = new Client({
        name: "tool-test-client",
        version: "1.0.0"
    }, {
        capabilities: {}
    });
    await client.connect(transport);
    await sleep(1000); // Give server time to initialize
    return client;
}
async function testTool(client, test) {
    try {
        logger.test(`Testing ${test.toolName}...`);
        const result = await client.callTool({
            name: test.toolName,
            arguments: test.args
        });
        if (test.expectSuccess) {
            if (result.content && result.content.length > 0) {
                recordResult(test.toolName, true, test.description);
            }
            else {
                recordResult(test.toolName, false, `${test.description} - No content returned`, JSON.stringify(result).substring(0, 200));
            }
        }
        else {
            // For error cases, check if error is in content
            const contentStr = JSON.stringify(result.content);
            const hasError = contentStr.includes("Error") || contentStr.includes("error");
            recordResult(test.toolName, hasError, hasError
                ? `${test.description} - Error handled correctly`
                : `${test.description} - Expected error but got success`);
        }
    }
    catch (error) {
        if (test.expectSuccess) {
            const message = error instanceof Error ? error.message : String(error);
            recordResult(test.toolName, false, `${test.description} - Unexpected error`, message);
        }
        else {
            recordResult(test.toolName, true, `${test.description} - Error thrown as expected`);
        }
    }
}
async function runToolTests() {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
        logger.error("ELEVENLABS_API_KEY not set - cannot run tool tests");
        process.exit(1);
    }
    console.log(`${colors.cyan}=== Tool Execution Tests ===${colors.reset}\n`);
    const client = await createMcpClient();
    // Define test cases for different tool categories
    const tests = [
        // Utility tools (read-only, safe to test)
        {
            name: "List Voices",
            toolName: "elevenlabs_list_voices",
            args: { limit: 5, response_format: "json" },
            expectSuccess: true,
            description: "List available voices"
        },
        {
            name: "List Voices Invalid Limit",
            toolName: "elevenlabs_list_voices",
            args: { limit: 1000, response_format: "json" }, // Should be capped at 100
            expectSuccess: true,
            description: "List voices with high limit (should be capped)"
        },
        // Agent tools (read operations)
        {
            name: "List Agents",
            toolName: "elevenlabs_list_agents",
            args: { limit: 5, response_format: "json" },
            expectSuccess: true,
            description: "List agents"
        },
        {
            name: "Get Agent Invalid ID",
            toolName: "elevenlabs_get_agent",
            args: { agent_id: testFixtures.invalidAgentId, response_format: "json" },
            expectSuccess: false,
            description: "Get agent with invalid ID (should error)"
        },
        // Conversation tools (read operations)
        {
            name: "List Conversations",
            toolName: "elevenlabs_list_conversations",
            args: { limit: 5, response_format: "json" },
            expectSuccess: true,
            description: "List conversations"
        },
        // Batch calling tools (read operations)
        {
            name: "List Batch Calls",
            toolName: "elevenlabs_list_batch_calls",
            args: { limit: 5, response_format: "json" },
            expectSuccess: true,
            description: "List batch calls"
        },
        // Phone number tools (read operations)
        {
            name: "List Phone Numbers",
            toolName: "elevenlabs_list_phone_numbers",
            args: { response_format: "json" },
            expectSuccess: true,
            description: "List phone numbers"
        }
    ];
    // Run tests sequentially to avoid rate limiting
    for (const test of tests) {
        await testTool(client, test);
        await sleep(500); // Small delay between tests
    }
    // Cleanup
    try {
        await client.close();
    }
    catch (error) {
        // Ignore cleanup errors
    }
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
        console.log(`  ${color}${icon}${colors.reset} ${result.tool}: ${result.message}`);
        if (result.error) {
            console.log(`    ${colors.yellow}→ ${result.error}${colors.reset}`);
        }
    });
    process.exit(failed > 0 ? 1 : 0);
}
// Run tests
runToolTests().catch((error) => {
    logger.error(`Test execution failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
});
//# sourceMappingURL=test-tools.js.map