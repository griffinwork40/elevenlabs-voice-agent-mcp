/**
 * Agent tool management
 *
 * MCP tools for creating, listing, and deleting webhook tools that agents can invoke.
 */

import { getRequest, postRequest, deleteRequest } from "../services/elevenlabs-api.js";
import { formatResponse } from "../services/formatters/index.js";
import { ToolConfig, Agent } from "../types.js";
import {
  CreateWebhookToolSchema,
  ListToolsSchema,
  DeleteToolSchema
} from "../schemas/tool-schemas.js";

/**
 * Creates a webhook tool for an agent
 */
export const elevenlabs_create_webhook_tool = {
  name: "elevenlabs_create_webhook_tool",
  description: `Create a webhook tool that the agent can invoke during conversations.

This tool allows agents to interact with external APIs and services. When the agent determines it needs to use the tool, it will make an HTTP request to the specified URL with the provided parameters. The webhook response can inform the agent's next response.

Args:
  - agent_id (string): Agent to add the tool to
  - name (string): Unique tool name (alphanumeric, hyphens, underscores only, max 64 chars)
  - description (string): Clear description of what the tool does (10-500 chars)
  - url (string): Webhook URL to call when tool is invoked
  - method (string): HTTP method (GET, POST, PUT, PATCH, DELETE, default: POST)
  - headers (object): Optional custom headers as key-value pairs
  - parameters (array): Array of parameter definitions with:
    - name (string): Parameter name
    - type (string): Data type (string, number, boolean, object, array)
    - description (string): Parameter description
    - required (boolean): Whether parameter is required
    - enum (array): Optional array of allowed values
  - response_format ('markdown' | 'json'): Output format

Returns:
  Created tool configuration.

Examples:
  - Use when: "Add a tool to check order status from our API"
  - Use when: "Create a webhook tool to schedule callbacks"
  - Use when: "Give the agent ability to search our product catalog"
  - Don't use when: You want to add knowledge/documents (use elevenlabs_add_knowledge_base)

Error Handling:
  - Returns "Error: Agent not found" if agent_id doesn't exist
  - Returns "Error: Tool name already exists" if name is taken
  - Returns "Error: Invalid URL" if webhook URL is not valid`,

  zodSchema: CreateWebhookToolSchema,

  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true
  },

  handler: async (args: unknown) => {
    const parsed = CreateWebhookToolSchema.parse(args);

    const toolData = {
      name: parsed.name,
      description: parsed.description,
      type: "webhook",
      url: parsed.url,
      method: parsed.method,
      ...(parsed.headers && { headers: parsed.headers }),
      parameters: parsed.parameters
    };

    const tool = await postRequest<ToolConfig>(
      `/convai/agents/${parsed.agent_id}/tools`,
      toolData
    );

    return {
      content: [
        {
          type: "text",
          text: formatResponse(tool, parsed.response_format, "tool")
        }
      ]
    };
  }
};

/**
 * Lists all tools configured for an agent
 */
export const elevenlabs_list_tools = {
  name: "elevenlabs_list_tools",
  description: `List all tools configured for an agent.

This tool retrieves all webhook tools that have been added to an agent. Use this to see what external capabilities the agent currently has access to.

Args:
  - agent_id (string): Agent identifier
  - response_format ('markdown' | 'json'): Output format

Returns:
  Array of tool configurations including names, descriptions, URLs, and parameters.

Examples:
  - Use when: "Show me all tools for this agent"
  - Use when: "What APIs can the agent access?"
  - Use when: "List the webhook tools configured"
  - Don't use when: You want to see agent configuration (use elevenlabs_get_agent)

Error Handling:
  - Returns "Error: Agent not found" if agent_id doesn't exist
  - Returns empty list if agent has no tools`,

  zodSchema: ListToolsSchema,

  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
  },

  handler: async (args: unknown) => {
    const parsed = ListToolsSchema.parse(args);

    // Get agent to access tools from conversation config
    const agent = await getRequest<Agent>(`/convai/agents/${parsed.agent_id}`);
    const tools = agent.conversation_config.agent.prompt.tools || [];

    return {
      content: [
        {
          type: "text",
          text: formatResponse(tools, parsed.response_format, "tool_list")
        }
      ]
    };
  }
};

/**
 * Deletes a tool from an agent
 */
export const elevenlabs_delete_tool = {
  name: "elevenlabs_delete_tool",
  description: `Remove a webhook tool from an agent.

This tool permanently deletes a webhook tool from an agent's configuration. The agent will no longer be able to invoke this tool in conversations. This action cannot be undone.

Args:
  - agent_id (string): Agent identifier
  - tool_name (string): Name of the tool to delete

Returns:
  Confirmation message indicating successful deletion.

Examples:
  - Use when: "Remove the order_status tool from the agent"
  - Use when: "Delete the deprecated webhook tool"
  - Don't use when: You want to modify the tool (delete and recreate instead)

Error Handling:
  - Returns "Error: Agent not found" if agent_id doesn't exist
  - Returns "Error: Tool not found" if tool_name doesn't exist`,

  zodSchema: DeleteToolSchema,

  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true
  },

  handler: async (args: unknown) => {
    const parsed = DeleteToolSchema.parse(args);

    await deleteRequest(
      `/convai/agents/${parsed.agent_id}/tools/${parsed.tool_name}`
    );

    return {
      content: [
        {
          type: "text",
          text: `Successfully deleted tool "${parsed.tool_name}" from agent ${parsed.agent_id}`
        }
      ]
    };
  }
};
