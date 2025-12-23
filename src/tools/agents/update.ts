/**
 * Agent update tool
 *
 * MCP tool for updating existing ElevenLabs voice agents.
 */

import { getRequest, patchRequest } from "../../services/elevenlabs-api.js";
import { formatResponse } from "../../services/formatters.js";
import { Agent } from "../../types.js";
import { UpdateAgentSchema } from "../../schemas/agent-schemas.js";

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
  - widget_color (string): Updated widget color
  - widget_avatar_url (string): Updated widget avatar URL
  - response_format ('markdown' | 'json'): Output format

Returns:
  Updated agent configuration.

Examples:
  - Use when: "Change the agent's voice to voice ID xyz123"
  - Use when: "Update the system prompt to be more friendly"
  - Use when: "Make the agent respond faster with turn_eagerness: 'eager'"
  - Don't use when: You want to create a new agent (use elevenlabs_create_agent)`,

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
    const conversationConfigUpdates: Record<string, unknown> = {
      agent: { ...currentAgent.conversation_config.agent } as Record<string, unknown>,
      tts: { ...currentAgent.conversation_config.tts } as Record<string, unknown>
    };

    let hasConversationConfigChanges = false;

    // Agent updates
    if (parsed.prompt !== undefined || parsed.llm !== undefined ||
        parsed.temperature !== undefined || parsed.max_tokens !== undefined) {
      conversationConfigUpdates.agent = {
        ...(conversationConfigUpdates.agent as Record<string, unknown>),
        prompt: {
          ...(currentAgent.conversation_config.agent.prompt),
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

    // Turn configuration updates
    if (parsed.turn_eagerness !== undefined || parsed.turn_timeout !== undefined ||
        parsed.silence_end_call_timeout !== undefined) {
      const currentTurn = currentAgent.conversation_config.turn;
      conversationConfigUpdates.turn = {
        turn_timeout: currentTurn?.turn_timeout ?? 10,
        silence_end_call_timeout: currentTurn?.silence_end_call_timeout ?? 15,
        ...(currentTurn?.turn_eagerness && { turn_eagerness: currentTurn.turn_eagerness }),
        ...(parsed.turn_eagerness !== undefined && { turn_eagerness: parsed.turn_eagerness }),
        ...(parsed.turn_timeout !== undefined && { turn_timeout: parsed.turn_timeout }),
        ...(parsed.silence_end_call_timeout !== undefined && { silence_end_call_timeout: parsed.silence_end_call_timeout })
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
