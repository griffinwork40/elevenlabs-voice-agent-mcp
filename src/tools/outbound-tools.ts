/**
 * @fileoverview Outbound calling tools for ElevenLabs Voice Agents
 * @description MCP tool for initiating single outbound phone calls via Twilio.
 * Enables voice agents to proactively call customers with support for dynamic
 * variables and per-call configuration overrides for personalization.
 * @module tools/outbound-tools
 */

import { postRequest } from "../services/elevenlabs-api.js";
import { formatResponse } from "../services/formatters.js";
import { OutboundCallResponse } from "../types.js";
import { StartOutboundCallSchema } from "../schemas/outbound-schemas.js";

/**
 * Starts a single outbound call via Twilio
 */
export const elevenlabs_start_outbound_call = {
  name: "elevenlabs_start_outbound_call",
  description: `Initiate a single outbound phone call using an ElevenLabs Voice Agent via Twilio.

This tool starts an AI-powered phone call to a specific phone number. The agent will use its configured prompt, voice, and tools to have a conversation with the person who answers. You can personalize the call with dynamic variables and override agent settings for this specific call.

Prerequisites:
  - A Twilio phone number must be imported and associated with an agent
  - The agent must be properly configured
  - Destination phone number must be valid

Args:
  - agent_id (string): Agent to use for this call (e.g., 'ag_abc123')
  - agent_phone_number_id (string): Phone number ID to use as caller ID
  - to_number (string): Destination phone number in E.164 format (e.g., '+1234567890')
  - conversation_initiation_client_data (object): Optional personalization data
    - dynamic_variables (object): Dynamic variables for personalization
      Example: {dynamic_variables: {name: 'John', user_id: '123', account_balance: 1500}}
    - conversation_config_override (object): Override agent settings for this call
      - agent.first_message: Custom greeting for this call
      - agent.prompt.prompt: Custom system prompt for this call
      - agent.language: Language override
      - tts.voice_id: Voice override
      - conversation.max_duration_seconds: Maximum call duration
  - response_format ('markdown' | 'json'): Output format

Returns:
  - success: Whether the call was initiated
  - message: Human-readable status message
  - conversation_id: ID to track this conversation (null if failed)
  - callSid: Twilio call identifier (null if failed)

Examples:
  - Use when: "Call +14155551234 with the sales agent"
  - Use when: "Start outbound call to check appointment with customer John"
  - Use when: "Dispatch agent to +447911123456 with custom greeting"
  - Don't use when: You want to make multiple calls at once (use elevenlabs_submit_batch_call)
  - Don't use when: Phone number isn't set up yet (use elevenlabs_import_phone_number first)

Error Handling:
  - Returns success: false if call initiation fails
  - Returns "Error: Phone number not found" if agent_phone_number_id is invalid
  - Returns "Error: Agent not found" if agent_id doesn't exist
  - Returns "Error: Invalid phone number format" if to_number is malformed`,

  zodSchema: StartOutboundCallSchema,

  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true
  },

  handler: async (args: unknown) => {
    const parsed = StartOutboundCallSchema.parse(args);

    const requestData = {
      agent_id: parsed.agent_id,
      agent_phone_number_id: parsed.agent_phone_number_id,
      to_number: parsed.to_number,
      ...(parsed.conversation_initiation_client_data && {
        conversation_initiation_client_data: parsed.conversation_initiation_client_data
      })
    };

    const response = await postRequest<OutboundCallResponse>(
      "/convai/twilio/outbound-call",
      requestData
    );

    return {
      content: [
        {
          type: "text",
          text: formatResponse(response, parsed.response_format, "outbound_call")
        }
      ]
    };
  }
};
