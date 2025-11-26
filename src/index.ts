#!/usr/bin/env node

/**
 * ElevenLabs Voice Agent MCP Server
 *
 * Main entry point for the MCP server providing tools for voice agent development.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { validateApiKey } from "./utils/error-handlers.js";

// Import all tools
import {
  elevenlabs_create_agent,
  elevenlabs_get_agent,
  elevenlabs_update_agent,
  elevenlabs_delete_agent,
  elevenlabs_list_agents
} from "./tools/agent-tools.js";

import { elevenlabs_add_knowledge_base } from "./tools/knowledge-tools.js";

import {
  elevenlabs_create_webhook_tool,
  elevenlabs_list_tools,
  elevenlabs_delete_tool
} from "./tools/tool-tools.js";

import {
  elevenlabs_get_conversation,
  elevenlabs_list_conversations
} from "./tools/conversation-tools.js";

import {
  elevenlabs_generate_widget_code,
  elevenlabs_list_voices
} from "./tools/utility-tools.js";

import { elevenlabs_start_outbound_call } from "./tools/outbound-tools.js";

import {
  elevenlabs_submit_batch_call,
  elevenlabs_list_batch_calls,
  elevenlabs_get_batch_call
} from "./tools/batch-calling-tools.js";

import {
  elevenlabs_list_phone_numbers,
  elevenlabs_get_phone_number,
  elevenlabs_import_phone_number,
  elevenlabs_update_phone_number,
  elevenlabs_delete_phone_number
} from "./tools/phone-number-tools.js";

/**
 * Initialize and start the MCP server
 */
async function main() {
  // Validate API key on startup
  try {
    validateApiKey();
  } catch (error) {
    console.error("Failed to start MCP server:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  // Create MCP server instance
  const server = new McpServer({
    name: "elevenlabs-voice-agent-mcp",
    version: "1.0.0"
  });

  // Register all tools
  const tools = [
    // Tier 1: Core Agent Management
    elevenlabs_create_agent,
    elevenlabs_get_agent,
    elevenlabs_update_agent,
    elevenlabs_delete_agent,
    elevenlabs_list_agents,

    // Tier 2: Knowledge Base & Tools
    elevenlabs_add_knowledge_base,
    elevenlabs_create_webhook_tool,
    elevenlabs_list_tools,
    elevenlabs_delete_tool,

    // Tier 3: Testing & Monitoring
    elevenlabs_get_conversation,
    elevenlabs_list_conversations,
    elevenlabs_generate_widget_code,

    // Tier 4: Utilities
    elevenlabs_list_voices,

    // Tier 5: Outbound Calling & Phone Management
    elevenlabs_start_outbound_call,
    elevenlabs_submit_batch_call,
    elevenlabs_list_batch_calls,
    elevenlabs_get_batch_call,
    elevenlabs_list_phone_numbers,
    elevenlabs_get_phone_number,
    elevenlabs_import_phone_number,
    elevenlabs_update_phone_number,
    elevenlabs_delete_phone_number
  ];

  // Register each tool with the server
  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        inputSchema: (tool as any).zodSchema,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        annotations: (tool as any).annotations
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tool.handler as any
    );
  }

  // Set up stdio transport
  const transport = new StdioServerTransport();

  // Connect server to transport
  await server.connect(transport);

  console.error("ElevenLabs Voice Agent MCP server running on stdio");
  console.error(`Registered ${tools.length} tools`);
  console.error("API Key:", process.env.ELEVENLABS_API_KEY ? "✓ Set" : "✗ Not set");
}

// Start the server
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
