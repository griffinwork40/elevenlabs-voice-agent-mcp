/**
 * Agent creation tool
 *
 * MCP tool for creating new ElevenLabs voice agents.
 */

import { postRequest } from "../../services/elevenlabs-api.js";
import { formatResponse } from "../../services/formatters.js";
import { Agent } from "../../types.js";
import { CreateAgentSchema } from "../../schemas/agent-schemas.js";

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
    Options: eleven_flash_v2, eleven_turbo_v2, eleven_flash_v2_5, eleven_turbo_v2_5, eleven_multilingual_v2
  - first_message (string): Optional greeting message (max 500 chars)
  - language (string): Primary language code (default: "en")
  - temperature (number): LLM temperature 0-2 for response randomness
  - max_tokens (number): Maximum tokens for LLM responses (1-4096)
  - stability (number): Voice stability 0-1
  - similarity_boost (number): Voice similarity boost 0-1
  - speed (number): Speech rate 0.5-2.0 (default 1.0)
  - turn_eagerness ('patient' | 'normal' | 'eager'): How quickly agent responds
  - turn_timeout (number): Seconds to wait for user response 1-30
  - silence_end_call_timeout (number): Seconds of silence before ending call 1-600
  - widget_color (string): Widget theme color in hex format
  - widget_avatar_url (string): Widget avatar image URL
  - response_format ('markdown' | 'json'): Output format

Returns:
  Complete agent object with agent_id, name, conversation_config, created_at

Examples:
  - Use when: "Create a customer service agent for tech support"
  - Use when: "Set up a voice agent for appointment scheduling"
  - Don't use when: You want to test an existing agent (use elevenlabs_generate_widget_code)
  - Don't use when: You want to modify an agent (use elevenlabs_update_agent)`,

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
          provider: "elevenlabs",
          user_input_audio_format: "pcm_16000"
        },
        // Turn-taking configuration
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
