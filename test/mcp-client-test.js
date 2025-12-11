#!/usr/bin/env node
/**
 * MCP Protocol Test Client
 *
 * A simple MCP client that connects to the server via stdio transport,
 * lists available tools, and can execute individual tools for testing.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { join } from "path";
import { logger, colors, sleep } from "./utils/test-helpers.js";
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
async function createMcpClient() {
    const serverPath = join(process.cwd(), "dist", "index.js");
    const transport = new StdioClientTransport({
        command: "node",
        args: [serverPath]
    });
    const client = new Client({
        name: "mcp-test-client",
        version: "1.0.0"
    }, {
        capabilities: {}
    });
    await client.connect(transport);
    return client;
}
async function testClientConnection() {
    try {
        const { client } = await createMcpClient();
        await sleep(1000); // Give server time to initialize
        recordTest("Client Connection", true, "Successfully connected to MCP server");
        return client;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        recordTest("Client Connection", false, "Failed to connect to MCP server", message);
        return null;
    }
}
async function testListTools(client) {
    try {
        const tools = await client.listTools();
        const toolCount = tools.tools?.length || 0;
        const expectedCount = 23;
        recordTest("List Tools", toolCount === expectedCount, `Found ${toolCount} tools (expected ${expectedCount})`, toolCount !== expectedCount ? `Expected ${expectedCount}, got ${toolCount}` : undefined);
        if (tools.tools && tools.tools.length > 0) {
            logger.info(`Sample tools: ${tools.tools.slice(0, 3).map((t) => t.name).join(", ")}...`);
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        recordTest("List Tools", false, "Failed to list tools", message);
    }
}
async function testToolSchema(client) {
    try {
        const tools = await client.listTools();
        if (!tools.tools || tools.tools.length === 0) {
            recordTest("Tool Schema", false, "No tools available to test schema");
            return;
        }
        // Test a simple tool that doesn't require complex parameters
        const listVoicesTool = tools.tools.find((t) => t.name === "elevenlabs_list_voices");
        if (!listVoicesTool) {
            recordTest("Tool Schema", false, "Could not find elevenlabs_list_voices tool");
            return;
        }
        const hasSchema = !!listVoicesTool.inputSchema;
        recordTest("Tool Schema", hasSchema, hasSchema ? "Tool has input schema defined" : "Tool missing input schema");
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        recordTest("Tool Schema", false, "Failed to test tool schema", message);
    }
}
async function testToolExecution(client) {
    try {
        // Test with a simple read-only tool that doesn't require complex setup
        const result = await client.callTool({
            name: "elevenlabs_list_voices",
            arguments: {
                limit: 1,
                response_format: "json"
            }
        });
        if (result.content && result.content.length > 0) {
            recordTest("Tool Execution", true, "Successfully executed tool");
            logger.info(`Tool returned ${result.content.length} content item(s)`);
        }
        else {
            recordTest("Tool Execution", false, "Tool executed but returned no content", JSON.stringify(result).substring(0, 200));
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        recordTest("Tool Execution", false, "Failed to execute tool", message);
    }
}
async function testErrorHandling(client) {
    try {
        // Try to execute a tool with invalid parameters
        try {
            await client.callTool({
                name: "elevenlabs_get_agent",
                arguments: {
                    agent_id: "invalid_agent_id_that_does_not_exist"
                }
            });
            // If we get here, the tool executed but should have returned an error
            recordTest("Error Handling", true, "Tool handled invalid input (may return error in content)");
        }
        catch (error) {
            // Expected - tool should handle errors gracefully
            const message = error instanceof Error ? error.message : String(error);
            const isExpectedError = message.includes("agent") || message.includes("not found") || message.includes("404");
            recordTest("Error Handling", isExpectedError, isExpectedError
                ? "Tool properly handles invalid input"
                : "Unexpected error format", isExpectedError ? undefined : message);
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        recordTest("Error Handling", false, "Error handling test failed", message);
    }
}
async function testToolDescriptions(client) {
    try {
        const tools = await client.listTools();
        if (!tools.tools || tools.tools.length === 0) {
            recordTest("Tool Descriptions", false, "No tools available");
            return;
        }
        const toolsWithoutDescriptions = tools.tools.filter((t) => !t.description || t.description.trim() === "");
        const allHaveDescriptions = toolsWithoutDescriptions.length === 0;
        recordTest("Tool Descriptions", allHaveDescriptions, allHaveDescriptions
            ? "All tools have descriptions"
            : `${toolsWithoutDescriptions.length} tools missing descriptions`);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        recordTest("Tool Descriptions", false, "Failed to check tool descriptions", message);
    }
}
async function runAllTests() {
    console.log(`${colors.cyan}=== MCP Protocol Client Tests ===${colors.reset}\n`);
    const client = await testClientConnection();
    if (!client) {
        console.log(`\n${colors.red}Cannot continue tests without client connection${colors.reset}`);
        process.exit(1);
    }
    await testListTools(client);
    await testToolSchema(client);
    await testToolExecution(client);
    await testErrorHandling(client);
    await testToolDescriptions(client);
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
//# sourceMappingURL=mcp-client-test.js.map