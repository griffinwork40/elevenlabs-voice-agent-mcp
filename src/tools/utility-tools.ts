/**
 * Utility tools
 *
 * MCP tools for widget generation, voice browsing, and other utilities.
 */

import { getRequest } from "../services/elevenlabs-api.js";
import { formatResponse, formatWidgetCode } from "../services/formatters.js";
import { Voice } from "../types.js";
import {
  GenerateWidgetCodeSchema,
  ListVoicesSchema
} from "../schemas/tool-schemas.js";

/**
 * Generates widget embed code for testing an agent
 */
export const elevenlabs_generate_widget_code = {
  name: "elevenlabs_generate_widget_code",
  description: `Generate HTML embed code to test a voice agent on a webpage.

This tool creates ready-to-use HTML code that embeds a voice agent widget on any webpage. The widget appears as a floating button that users can click to start a voice conversation with the agent. Perfect for testing agents or deploying them on websites.

Args:
  - agent_id (string): Agent to generate widget code for
  - color (string): Optional widget color in hex format (e.g., "#FF5733")
  - avatar_url (string): Optional avatar image URL for the widget

Returns:
  HTML code snippet with <script> tags ready to paste into a webpage.

Examples:
  - Use when: "Generate embed code to test this agent"
  - Use when: "Create a widget for agent ag_abc123"
  - Use when: "I want to add this agent to my website"
  - Don't use when: You want to create a new agent (use elevenlabs_create_agent)

Error Handling:
  - Returns "Error: Agent not found" if agent_id doesn't exist
  - Returns "Error: Invalid color format" if color is not valid hex`,

  zodSchema: GenerateWidgetCodeSchema,

  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
  },

  handler: async (args: unknown) => {
    const parsed = GenerateWidgetCodeSchema.parse(args);

    // Verify agent exists
    await getRequest(`/convai/agents/${parsed.agent_id}`);

    const widgetCode = formatWidgetCode(
      parsed.agent_id,
      parsed.color,
      parsed.avatar_url
    );

    return {
      content: [
        {
          type: "text",
          text: widgetCode
        }
      ]
    };
  }
};

/**
 * Lists available voices with filtering
 */
export const elevenlabs_list_voices = {
  name: "elevenlabs_list_voices",
  description: `Browse available ElevenLabs voices with optional filtering.

This tool retrieves voices you can use for your agents. Filter by language, gender, or age to find the perfect voice. Each voice includes a preview URL so you can listen before choosing.

Args:
  - language (string): Optional - filter by language code (e.g., 'en', 'es', 'fr')
  - gender ('male' | 'female'): Optional - filter by gender
  - age ('young' | 'middle_aged' | 'old'): Optional - filter by age category
  - limit (number): Maximum voices to return (1-100, default: 20)
  - response_format ('markdown' | 'json'): Output format

Returns:
  List of voices with:
  - Voice ID (for use in agent configuration)
  - Voice name and description
  - Labels (gender, age, accent, use case)
  - Preview URL to listen to the voice

Examples:
  - Use when: "Show me all female voices"
  - Use when: "Find voices suitable for customer service"
  - Use when: "List English voices with British accents"
  - Use when: "I need to choose a voice for my agent"
  - Don't use when: You already know the voice_id you want to use

Error Handling:
  - Returns empty list if no voices match filters
  - Returns "Error: Invalid API key" if authentication fails`,

  zodSchema: ListVoicesSchema,

  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
  },

  handler: async (args: unknown) => {
    const parsed = ListVoicesSchema.parse(args);

    const params: Record<string, unknown> = {};

    if (parsed.language) {
      params.language = parsed.language;
    }

    if (parsed.gender) {
      params.gender = parsed.gender;
    }

    if (parsed.age) {
      params.age = parsed.age;
    }

    const response = await getRequest<{ voices: Voice[] }>("/voices", params);

    const voices = (response.voices || []).slice(0, parsed.limit);

    return {
      content: [
        {
          type: "text",
          text: formatResponse(voices, parsed.response_format, "voice_list")
        }
      ]
    };
  }
};
