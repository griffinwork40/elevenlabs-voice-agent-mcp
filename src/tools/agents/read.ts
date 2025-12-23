/**
 * Agent read tools
 *
 * MCP tools for retrieving and listing ElevenLabs voice agents.
 */

import { getRequest } from "../../services/elevenlabs-api.js";
import { formatResponse } from "../../services/formatters.js";
import { Agent, PaginatedResponse } from "../../types.js";
import { GetAgentSchema, ListAgentsSchema } from "../../schemas/agent-schemas.js";

/**
 * Retrieves an agent by ID
 */
export const elevenlabs_get_agent = {
  name: "elevenlabs_get_agent",
  description: `Retrieve complete configuration for an existing ElevenLabs Voice Agent.

This tool fetches all details about an agent including its conversation configuration, tools, knowledge base, and platform settings. Use this to inspect an agent before modifying it or to check current settings.

Args:
  - agent_id (string): Unique agent identifier (e.g., 'ag_abc123')
  - response_format ('markdown' | 'json'): Output format

Returns:
  Complete agent configuration including prompt, LLM settings, voice configuration, tools, and knowledge base.

Examples:
  - Use when: "Show me the configuration for agent ag_abc123"
  - Use when: "What's the current prompt for this agent?"
  - Don't use when: You want to list all agents (use elevenlabs_list_agents)`,

  zodSchema: GetAgentSchema,

  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
  },

  handler: async (args: unknown) => {
    const parsed = GetAgentSchema.parse(args);
    const agent = await getRequest<Agent>(`/convai/agents/${parsed.agent_id}`);

    return {
      content: [
        {
          type: "text",
          text: formatResponse(agent, parsed.response_format, "agent")
        }
      ]
    };
  }
};

/**
 * Lists all agents with pagination
 */
export const elevenlabs_list_agents = {
  name: "elevenlabs_list_agents",
  description: `List all ElevenLabs Voice Agents with pagination.

This tool retrieves a paginated list of all your voice agents. Use the offset and limit parameters to navigate through large agent lists. The response includes pagination metadata to help you fetch additional pages.

Args:
  - limit (number): Maximum agents to return (1-100, default: 20)
  - offset (number): Number of agents to skip (default: 0)
  - response_format ('markdown' | 'json'): Output format

Returns:
  For JSON format: Object with total count, items array, offset, has_more, and next_offset
  For Markdown format: Formatted list of agents with key details and pagination guidance

Examples:
  - Use when: "Show me all my voice agents"
  - Use when: "List the first 10 agents"
  - Use when: "Get the next page of agents with offset=20"
  - Don't use when: You want details about a specific agent (use elevenlabs_get_agent)`,

  zodSchema: ListAgentsSchema,

  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
  },

  handler: async (args: unknown) => {
    const parsed = ListAgentsSchema.parse(args);

    const response = await getRequest<{ agents: Agent[] }>(
      "/convai/agents",
      {
        limit: parsed.limit,
        offset: parsed.offset
      }
    );

    const agents = response.agents || [];
    const total = agents.length;
    const hasMore = agents.length === parsed.limit;

    const paginatedResponse: PaginatedResponse<Agent> = {
      total,
      count: agents.length,
      offset: parsed.offset,
      items: agents,
      has_more: hasMore,
      next_offset: hasMore ? parsed.offset + agents.length : undefined
    };

    return {
      content: [
        {
          type: "text",
          text: formatResponse(paginatedResponse, parsed.response_format, "agent_list")
        }
      ]
    };
  }
};
