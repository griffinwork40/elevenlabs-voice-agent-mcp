/**
 * @fileoverview Agent management tools for ElevenLabs Voice Agents
 * @description MCP tools for creating, retrieving, updating, deleting, and listing voice agents.
 * These tools provide full CRUD operations for managing voice agent configurations through
 * the ElevenLabs Conversational AI API.
 * @module tools/agent-tools
 */

import { z } from "zod";
import { getRequest, postRequest, patchRequest, deleteRequest } from "../services/elevenlabs-api.js";
import { formatResponse } from "../services/formatters.js";
import { Agent, PaginatedResponse, ResponseFormat } from "../types.js";
import {
  CreateAgentSchema,
  GetAgentSchema,
  UpdateAgentSchema,
  DeleteAgentSchema,
  ListAgentsSchema
} from "../schemas/agent-schemas.js";
import {
  DEFAULT_ASR_PROVIDER,
  DEFAULT_ASR_AUDIO_FORMAT
} from "../constants.js";

/**
 * Creates a new ElevenLabs Voice Agent
 */
export const elevenlabs_create_agent = {
  name: "elevenlabs_create_agent",
  description: `Create a new ElevenLabs Voice Agent with specified configuration.

This tool creates a complete voice agent with conversation settings, including the AI model, voice configuration, ASR settings, and initial behavior. It does NOT start conversations or deploy the agent - it only creates the configuration.

Args:
  - name (string): Display name for the agent (max 100 chars)
  - prompt (string): System prompt defining behavior (10-5000 chars)
  - llm (string): AI model identifier to use (default: "claude-sonnet-4-5@20250929")
    Common options: claude-sonnet-4-5@20250929, claude-sonnet-4@20250514, gpt-4o, gpt-4o-mini, gemini-2.0-flash-exp
    Any valid ElevenLabs model identifier is accepted (new models may be available)
  - voice_id (string): ElevenLabs voice ID (default: "21m00Tcm4TlvDq8ikWAM" - Rachel)
  - voice_model (string): Voice synthesis model (default: "eleven_turbo_v2_5")
    Options:
      - eleven_flash_v2 (English only, optimized for low latency)
      - eleven_turbo_v2 (English only, higher quality)
      - eleven_flash_v2_5 (32 languages, low latency)
      - eleven_turbo_v2_5 (32 languages, higher quality)
      - eleven_multilingual_v2 (multilingual support)
  - first_message (string): Optional greeting message (max 500 chars)
  - language (string): Primary language code (default: "en")
  - temperature (number): LLM temperature 0-2 for response randomness (higher = more creative)
  - max_tokens (number): Maximum tokens for LLM responses (1-4096)
  - stability (number): Voice stability 0-1 (higher = more consistent)
  - similarity_boost (number): Voice similarity boost 0-1 (higher = closer to original)
  - speed (number): Speech rate 0.5-2.0 (default 1.0)
  - turn_eagerness ('patient' | 'normal' | 'eager'): How quickly agent responds (default: normal)
  - turn_timeout (number): Seconds to wait for user response 1-30 (default: 10)
  - silence_end_call_timeout (number): Seconds of silence before ending call 1-600 (default: 15)
  - asr_provider ('elevenlabs' | 'scribe_realtime'): ASR provider (default: elevenlabs)
  - asr_audio_format (string): Audio format for input (default: pcm_16000)
    Options: pcm_8000, pcm_16000, pcm_22050, pcm_24000, pcm_44100, pcm_48000, ulaw_8000
  - asr_quality ('low' | 'medium' | 'high'): Speech recognition quality level
  - asr_keywords (string[]): Domain-specific terms to boost recognition
  - widget_color (string): Widget theme color in hex format (e.g., "#FF5733")
  - widget_avatar_url (string): Widget avatar image URL
  - response_format ('markdown' | 'json'): Output format

Returns:
  For JSON format: Complete agent object with agent_id, name, conversation_config, created_at
  For Markdown format: Formatted agent details with configuration summary

Examples:
  - Use when: "Create a customer service agent for tech support"
  - Use when: "Set up a voice agent for appointment scheduling"
  - Use when: "Create a fast-responding agent with turn_eagerness: 'eager'"
  - Don't use when: You want to test an existing agent (use elevenlabs_generate_widget_code)
  - Don't use when: You want to modify an agent (use elevenlabs_update_agent)

Error Handling:
  - Returns "Error: Invalid voice_id" if voice doesn't exist
  - Returns "Error: Invalid API key" if authentication fails
  - Returns "Error: Rate limit exceeded" if too many requests (wait 60s and retry)`,

  zodSchema: CreateAgentSchema,

  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true
  },

  handler: async (args: unknown) => {
    const parsed = CreateAgentSchema.parse(args);

    // Build agent configuration
    const agentData = {
      name: parsed.name,
      conversation_config: {
        agent: {
          prompt: {
            prompt: parsed.prompt,
            llm: parsed.llm,
            ...(parsed.temperature !== undefined && { temperature: parsed.temperature }),
            ...(parsed.max_tokens !== undefined && { max_tokens: parsed.max_tokens })
          },
          ...(parsed.first_message && { first_message: parsed.first_message }),
          language: parsed.language
        },
        tts: {
          voice_id: parsed.voice_id,
          model_id: parsed.voice_model,
          ...(parsed.stability !== undefined && { stability: parsed.stability }),
          ...(parsed.similarity_boost !== undefined && { similarity_boost: parsed.similarity_boost }),
          ...(parsed.speed !== undefined && { speed: parsed.speed })
        },
        // ASR (Automatic Speech Recognition) configuration
        asr: {
          provider: parsed.asr_provider ?? DEFAULT_ASR_PROVIDER,
          user_input_audio_format: parsed.asr_audio_format ?? DEFAULT_ASR_AUDIO_FORMAT,
          ...(parsed.asr_quality !== undefined && { quality: parsed.asr_quality }),
          ...(parsed.asr_keywords !== undefined && parsed.asr_keywords.length > 0 && { keywords: parsed.asr_keywords })
        },
        // Turn-taking configuration - required by ElevenLabs API
        turn: {
          turn_timeout: parsed.turn_timeout ?? 10,
          silence_end_call_timeout: parsed.silence_end_call_timeout ?? 15,
          ...(parsed.turn_eagerness !== undefined && { turn_eagerness: parsed.turn_eagerness })
        }
      },
      ...(parsed.widget_color || parsed.widget_avatar_url ? {
        platform_settings: {
          widget: {
            ...(parsed.widget_color && { color: parsed.widget_color }),
            ...(parsed.widget_avatar_url && { avatar_url: parsed.widget_avatar_url })
          }
        }
      } : {})
    };

    const agent = await postRequest<Agent>("/convai/agents/create", agentData);

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
  - Don't use when: You want to list all agents (use elevenlabs_list_agents)

Error Handling:
  - Returns "Error: Agent not found" if agent_id doesn't exist
  - Returns "Error: Invalid API key" if authentication fails`,

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
 * Updates an existing agent
 */
export const elevenlabs_update_agent = {
  name: "elevenlabs_update_agent",
  description: `Update an existing ElevenLabs Voice Agent's configuration.

This tool modifies one or more settings of an existing agent. You only need to provide the fields you want to change - all other settings will remain the same. Changes take effect immediately for new conversations.

Args:
  - agent_id (string): Unique agent identifier (e.g., 'ag_abc123')
  - name (string): Updated display name (max 100 chars)
  - prompt (string): Updated system prompt (10-5000 chars)
  - llm (string): Updated AI model
  - voice_id (string): Updated voice ID
  - voice_model (string): Updated voice model
  - first_message (string): Updated greeting (max 500 chars)
  - language (string): Updated language code
  - temperature (number): Updated temperature (0-2)
  - max_tokens (number): Updated max tokens (1-4096)
  - stability (number): Updated voice stability (0-1)
  - similarity_boost (number): Updated similarity boost (0-1)
  - speed (number): Speech rate 0.5-2.0 (default 1.0)
  - turn_eagerness ('patient' | 'normal' | 'eager'): How quickly agent responds
  - turn_timeout (number): Seconds to wait for user response (1-30)
  - silence_end_call_timeout (number): Seconds of silence before ending call (1-600)
  - asr_provider ('elevenlabs' | 'scribe_realtime'): Updated ASR provider
  - asr_audio_format (string): Updated audio format for input
  - asr_quality ('low' | 'medium' | 'high'): Updated ASR quality level
  - asr_keywords (string[]): Updated keywords for domain-specific recognition
  - widget_color (string): Updated widget color
  - widget_avatar_url (string): Updated widget avatar URL
  - response_format ('markdown' | 'json'): Output format

Returns:
  Updated agent configuration.

Examples:
  - Use when: "Change the agent's voice to voice ID xyz123"
  - Use when: "Update the system prompt to be more friendly"
  - Use when: "Switch the agent to use Claude instead of GPT"
  - Use when: "Make the agent respond faster with turn_eagerness: 'eager'"
  - Use when: "Slow down the speech rate to 0.8"
  - Use when: "Switch to high quality ASR for better accuracy"
  - Use when: "Add product name keywords for better recognition"
  - Don't use when: You want to create a new agent (use elevenlabs_create_agent)

Error Handling:
  - Returns "Error: Agent not found" if agent_id doesn't exist
  - Returns "Error: Invalid voice_id" if new voice doesn't exist`,

  zodSchema: UpdateAgentSchema,

  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
  },

  handler: async (args: unknown) => {
    const parsed = UpdateAgentSchema.parse(args);

    // Get current agent config
    const currentAgent = await getRequest<Agent>(`/convai/agents/${parsed.agent_id}`);

    // Build update payload with only changed fields
    const updateData: Record<string, unknown> = {};

    if (parsed.name !== undefined) {
      updateData.name = parsed.name;
    }

    // Build conversation config updates
    // When spreading the agent config, we need to exclude 'tools' from the prompt
    // to avoid "both_tools_and_tool_ids_provided" error when the agent uses tool_ids
    const { tools: _existingTools, ...promptWithoutTools } = currentAgent.conversation_config.agent.prompt;
    const conversationConfigUpdates: Record<string, unknown> = {
      agent: {
        ...currentAgent.conversation_config.agent,
        prompt: promptWithoutTools
      } as Record<string, unknown>,
      tts: { ...currentAgent.conversation_config.tts } as Record<string, unknown>
    };

    let hasConversationConfigChanges = false;

    // Agent updates (prompt already has tools excluded from promptWithoutTools above)
    if (parsed.prompt !== undefined || parsed.llm !== undefined ||
        parsed.temperature !== undefined || parsed.max_tokens !== undefined) {
      conversationConfigUpdates.agent = {
        ...(conversationConfigUpdates.agent as Record<string, unknown>),
        prompt: {
          ...promptWithoutTools,
          ...(parsed.prompt !== undefined && { prompt: parsed.prompt }),
          ...(parsed.llm !== undefined && { llm: parsed.llm }),
          ...(parsed.temperature !== undefined && { temperature: parsed.temperature }),
          ...(parsed.max_tokens !== undefined && { max_tokens: parsed.max_tokens })
        }
      };
      hasConversationConfigChanges = true;
    }

    if (parsed.first_message !== undefined) {
      (conversationConfigUpdates.agent as Record<string, unknown>).first_message = parsed.first_message;
      hasConversationConfigChanges = true;
    }

    if (parsed.language !== undefined) {
      (conversationConfigUpdates.agent as Record<string, unknown>).language = parsed.language;
      hasConversationConfigChanges = true;
    }

    // TTS updates
    if (parsed.voice_id !== undefined || parsed.voice_model !== undefined ||
        parsed.stability !== undefined || parsed.similarity_boost !== undefined ||
        parsed.speed !== undefined) {
      conversationConfigUpdates.tts = {
        ...(conversationConfigUpdates.tts as Record<string, unknown>),
        ...(parsed.voice_id !== undefined && { voice_id: parsed.voice_id }),
        ...(parsed.voice_model !== undefined && { model_id: parsed.voice_model }),
        ...(parsed.stability !== undefined && { stability: parsed.stability }),
        ...(parsed.similarity_boost !== undefined && { similarity_boost: parsed.similarity_boost }),
        ...(parsed.speed !== undefined && { speed: parsed.speed })
      };
      hasConversationConfigChanges = true;
    }

    // Turn configuration updates - only spread known fields to avoid including undocumented API fields
    if (parsed.turn_eagerness !== undefined || parsed.turn_timeout !== undefined ||
        parsed.silence_end_call_timeout !== undefined) {
      const currentTurn = currentAgent.conversation_config.turn;
      conversationConfigUpdates.turn = {
        // Preserve known current values with defaults
        turn_timeout: currentTurn?.turn_timeout ?? 10,
        silence_end_call_timeout: currentTurn?.silence_end_call_timeout ?? 15,
        ...(currentTurn?.turn_eagerness && { turn_eagerness: currentTurn.turn_eagerness }),
        // Apply user updates (these override current values)
        ...(parsed.turn_eagerness !== undefined && { turn_eagerness: parsed.turn_eagerness }),
        ...(parsed.turn_timeout !== undefined && { turn_timeout: parsed.turn_timeout }),
        ...(parsed.silence_end_call_timeout !== undefined && { silence_end_call_timeout: parsed.silence_end_call_timeout })
      };
      hasConversationConfigChanges = true;
    }

    // ASR configuration updates
    if (parsed.asr_provider !== undefined || parsed.asr_audio_format !== undefined ||
        parsed.asr_quality !== undefined || parsed.asr_keywords !== undefined) {
      const currentAsr = currentAgent.conversation_config.asr;
      conversationConfigUpdates.asr = {
        // Preserve current values with defaults
        provider: currentAsr?.provider ?? DEFAULT_ASR_PROVIDER,
        user_input_audio_format: currentAsr?.user_input_audio_format ?? DEFAULT_ASR_AUDIO_FORMAT,
        ...(currentAsr?.quality && { quality: currentAsr.quality }),
        ...(currentAsr?.keywords && { keywords: currentAsr.keywords }),
        // Apply user updates (these override current values)
        ...(parsed.asr_provider !== undefined && { provider: parsed.asr_provider }),
        ...(parsed.asr_audio_format !== undefined && { user_input_audio_format: parsed.asr_audio_format }),
        ...(parsed.asr_quality !== undefined && { quality: parsed.asr_quality }),
        ...(parsed.asr_keywords !== undefined && { keywords: parsed.asr_keywords })
      };
      hasConversationConfigChanges = true;
    }

    if (hasConversationConfigChanges) {
      updateData.conversation_config = conversationConfigUpdates;
    }

    // Widget updates
    if (parsed.widget_color !== undefined || parsed.widget_avatar_url !== undefined) {
      updateData.platform_settings = {
        ...(currentAgent.platform_settings || {}),
        widget: {
          ...(currentAgent.platform_settings?.widget || {}),
          ...(parsed.widget_color !== undefined && { color: parsed.widget_color }),
          ...(parsed.widget_avatar_url !== undefined && { avatar_url: parsed.widget_avatar_url })
        }
      };
    }

    const updatedAgent = await patchRequest<Agent>(
      `/convai/agents/${parsed.agent_id}`,
      updateData
    );

    return {
      content: [
        {
          type: "text",
          text: formatResponse(updatedAgent, parsed.response_format, "agent")
        }
      ]
    };
  }
};

/**
 * Deletes an agent
 */
export const elevenlabs_delete_agent = {
  name: "elevenlabs_delete_agent",
  description: `Delete an ElevenLabs Voice Agent permanently.

This tool permanently removes an agent and all its configuration. This action CANNOT be undone. All conversations associated with this agent will remain accessible, but the agent itself will be deleted.

Args:
  - agent_id (string): Unique agent identifier to delete (e.g., 'ag_abc123')

Returns:
  Confirmation message indicating successful deletion.

Examples:
  - Use when: "Delete the test agent ag_test123"
  - Use when: "Remove agent ag_old456 permanently"
  - Don't use when: You want to temporarily disable an agent (no disable feature - just don't use it)
  - Don't use when: You're not sure - this is permanent!

Error Handling:
  - Returns "Error: Agent not found" if agent_id doesn't exist
  - Returns "Error: Invalid API key" if authentication fails`,

  zodSchema: DeleteAgentSchema,

  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true
  },

  handler: async (args: unknown) => {
    const parsed = DeleteAgentSchema.parse(args);
    await deleteRequest(`/convai/agents/${parsed.agent_id}`);

    return {
      content: [
        {
          type: "text",
          text: `Successfully deleted agent: ${parsed.agent_id}`
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
  - Don't use when: You want details about a specific agent (use elevenlabs_get_agent)

Error Handling:
  - Returns empty list if no agents exist
  - Returns "Error: Invalid API key" if authentication fails`,

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
    const total = agents.length; // Note: ElevenLabs API may not return total count
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
