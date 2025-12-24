/**
 * @fileoverview Phone number management tools for ElevenLabs Voice Agents
 * @description MCP tools for listing, importing, updating, and deleting phone numbers
 * connected to voice agents via Twilio or SIP trunking. Phone numbers are required
 * for outbound calling and can be assigned to agents for inbound call handling.
 * @module tools/phone-number-tools
 */

import { getRequest, postRequest, patchRequest, deleteRequest } from "../services/elevenlabs-api.js";
import { formatResponse } from "../services/formatters.js";
import { PhoneNumber, ImportPhoneNumberResponse } from "../types.js";
import {
  ListPhoneNumbersSchema,
  GetPhoneNumberSchema,
  ImportPhoneNumberSchema,
  UpdatePhoneNumberSchema,
  DeletePhoneNumberSchema
} from "../schemas/phone-number-schemas.js";

/**
 * Lists all phone numbers connected to the workspace
 */
export const elevenlabs_list_phone_numbers = {
  name: "elevenlabs_list_phone_numbers",
  description: `List all phone numbers connected to your ElevenLabs workspace.

This tool retrieves all phone numbers you've imported (Twilio or SIP trunk), showing which agents they're assigned to, their capabilities (inbound/outbound), and configuration details.

Args:
  - response_format ('markdown' | 'json'): Output format

Returns:
  Array of phone number objects, each containing:
  - phone_number: The actual phone number
  - label: Descriptive name
  - phone_number_id: Unique identifier for API operations
  - provider: 'twilio' or 'sip_trunk'
  - supports_inbound: Whether it can receive calls
  - supports_outbound: Whether it can make calls
  - assigned_agent: Agent details (if assigned) or null

Examples:
  - Use when: "Show me all my phone numbers"
  - Use when: "List available phone numbers for outbound calling"
  - Use when: "Which phone numbers are assigned to agents?"
  - Don't use when: You want details about a specific phone number (use elevenlabs_get_phone_number)

Error Handling:
  - Returns empty array if no phone numbers exist
  - Returns "Error: Invalid API key" if authentication fails`,

  zodSchema: ListPhoneNumbersSchema,

  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
  },

  handler: async (args: unknown) => {
    const parsed = ListPhoneNumbersSchema.parse(args);

    const response = await getRequest<PhoneNumber[]>("/convai/phone-numbers");

    return {
      content: [
        {
          type: "text",
          text: formatResponse(response, parsed.response_format, "phone_number_list")
        }
      ]
    };
  }
};

/**
 * Gets details about a specific phone number
 */
export const elevenlabs_get_phone_number = {
  name: "elevenlabs_get_phone_number",
  description: `Get detailed information about a specific phone number.

This tool retrieves complete configuration details for a phone number, including provider settings, agent assignment, trunk configurations, and capability flags.

Args:
  - phone_number_id (string): Unique phone number identifier (e.g., 'pn_abc123')
  - response_format ('markdown' | 'json'): Output format

Returns:
  Complete phone number details including provider-specific configuration.

Examples:
  - Use when: "Show me details for phone number pn_abc123"
  - Use when: "What agent is assigned to phone pn_xyz789?"
  - Use when: "Get configuration for phone number ID pn_test456"
  - Don't use when: You want to list all phone numbers (use elevenlabs_list_phone_numbers)

Error Handling:
  - Returns "Error: Phone number not found" if phone_number_id doesn't exist
  - Returns "Error: Invalid API key" if authentication fails`,

  zodSchema: GetPhoneNumberSchema,

  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
  },

  handler: async (args: unknown) => {
    const parsed = GetPhoneNumberSchema.parse(args);

    const response = await getRequest<PhoneNumber>(
      `/convai/phone-numbers/${parsed.phone_number_id}`
    );

    return {
      content: [
        {
          type: "text",
          text: formatResponse(response, parsed.response_format, "phone_number")
        }
      ]
    };
  }
};

/**
 * Imports a Twilio phone number
 */
export const elevenlabs_import_phone_number = {
  name: "elevenlabs_import_phone_number",
  description: `Import a Twilio phone number to use with ElevenLabs Voice Agents.

This tool connects your existing Twilio phone number to ElevenLabs, enabling it for inbound and/or outbound voice agent calls. You'll need your Twilio Account SID and Auth Token.

Prerequisites:
  - Active Twilio account with a purchased phone number
  - Twilio Account SID and Auth Token
  - Phone number must not already be imported

Args:
  - phone_number (string): Phone number to import in E.164 format (e.g., '+1234567890')
  - label (string): Descriptive name for this number (e.g., 'Customer Support Line')
  - sid (string): Twilio Account SID (starts with 'AC')
  - token (string): Twilio Auth Token
  - provider (string): Must be 'twilio'
  - supports_inbound (boolean, optional): Enable inbound calls (default: true)
  - supports_outbound (boolean, optional): Enable outbound calls (default: true)
  - region_config (object, optional): Regional configuration
    - region_id: 'us1', 'ie1', or 'au1'
    - token: Regional token
    - edge_location: Twilio edge location
  - response_format ('markdown' | 'json'): Output format

Returns:
  - phone_number_id: Unique identifier for the imported phone number

Examples:
  - Use when: "Import my Twilio number +1234567890 for customer support"
  - Use when: "Connect Twilio phone number with SID AC123... for outbound calling"
  - Use when: "Add new phone number +447911123456 from Twilio account"
  - Don't use when: Number is already imported (update it instead)
  - Don't use when: You need to assign it to an agent (use elevenlabs_update_phone_number after)

Error Handling:
  - Returns "Error: Invalid Twilio credentials" if SID/token are wrong
  - Returns "Error: Phone number already exists" if already imported
  - Returns "Error: Invalid phone number format" if not E.164`,

  zodSchema: ImportPhoneNumberSchema,

  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true
  },

  handler: async (args: unknown) => {
    const parsed = ImportPhoneNumberSchema.parse(args);

    const requestData = {
      phone_number: parsed.phone_number,
      label: parsed.label,
      sid: parsed.sid,
      token: parsed.token,
      provider: parsed.provider,
      ...(parsed.supports_inbound !== undefined && {
        supports_inbound: parsed.supports_inbound
      }),
      ...(parsed.supports_outbound !== undefined && {
        supports_outbound: parsed.supports_outbound
      }),
      ...(parsed.region_config && {
        region_config: parsed.region_config
      })
    };

    const response = await postRequest<ImportPhoneNumberResponse>(
      "/convai/phone-numbers",
      requestData
    );

    return {
      content: [
        {
          type: "text",
          text: formatResponse(response, parsed.response_format, "phone_number_import")
        }
      ]
    };
  }
};

/**
 * Updates a phone number (primarily for agent assignment)
 */
export const elevenlabs_update_phone_number = {
  name: "elevenlabs_update_phone_number",
  description: `Update a phone number's configuration, primarily to assign or unassign agents.

This tool modifies phone number settings. The most common use is assigning an agent to a phone number so the agent can handle calls from that number. You can also configure SIP trunk settings for advanced deployments.

Args:
  - phone_number_id (string): Phone number identifier to update (e.g., 'pn_abc123')
  - agent_id (string, optional): Agent ID to assign (set to null to unassign)
  - inbound_trunk_config (object, optional): SIP trunk configuration for inbound
  - outbound_trunk_config (object, optional): SIP trunk configuration for outbound
  - livekit_stack ('standard' | 'static', optional): LiveKit stack configuration
  - response_format ('markdown' | 'json'): Output format

Returns:
  Updated phone number object with new configuration.

Examples:
  - Use when: "Assign agent ag_abc123 to phone number pn_xyz789"
  - Use when: "Connect my customer support agent to the main phone line"
  - Use when: "Unassign agent from phone number pn_test456"
  - Use when: "Update phone number pn_sales to use agent ag_sales"
  - Don't use when: You need to import a new number (use elevenlabs_import_phone_number)

Error Handling:
  - Returns "Error: Phone number not found" if phone_number_id doesn't exist
  - Returns "Error: Agent not found" if agent_id doesn't exist
  - Returns "Error: Invalid API key" if authentication fails`,

  zodSchema: UpdatePhoneNumberSchema,

  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
  },

  handler: async (args: unknown) => {
    const parsed = UpdatePhoneNumberSchema.parse(args);

    const updateData: Record<string, unknown> = {};

    if (parsed.agent_id !== undefined) {
      updateData.agent_id = parsed.agent_id;
    }

    if (parsed.inbound_trunk_config !== undefined) {
      updateData.inbound_trunk_config = parsed.inbound_trunk_config;
    }

    if (parsed.outbound_trunk_config !== undefined) {
      updateData.outbound_trunk_config = parsed.outbound_trunk_config;
    }

    if (parsed.livekit_stack !== undefined) {
      updateData.livekit_stack = parsed.livekit_stack;
    }

    const response = await patchRequest<PhoneNumber>(
      `/convai/phone-numbers/${parsed.phone_number_id}`,
      updateData
    );

    return {
      content: [
        {
          type: "text",
          text: formatResponse(response, parsed.response_format, "phone_number")
        }
      ]
    };
  }
};

/**
 * Deletes a phone number
 */
export const elevenlabs_delete_phone_number = {
  name: "elevenlabs_delete_phone_number",
  description: `Delete a phone number from your ElevenLabs workspace.

This tool permanently removes a phone number from ElevenLabs. This does NOT delete the number from your Twilio account - it only disconnects it from ElevenLabs. You can re-import it later if needed.

IMPORTANT: This action cannot be undone. Any agent assignments will be removed.

Args:
  - phone_number_id (string): Phone number identifier to delete (e.g., 'pn_abc123')

Returns:
  Confirmation message indicating successful deletion.

Examples:
  - Use when: "Delete phone number pn_test123"
  - Use when: "Remove phone number pn_old456 from ElevenLabs"
  - Use when: "Disconnect Twilio number pn_unused789"
  - Don't use when: You just want to unassign an agent (use elevenlabs_update_phone_number)
  - Don't use when: You're not sure - this is permanent!

Error Handling:
  - Returns "Error: Phone number not found" if phone_number_id doesn't exist
  - Returns "Error: Invalid API key" if authentication fails`,

  zodSchema: DeletePhoneNumberSchema,

  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true
  },

  handler: async (args: unknown) => {
    const parsed = DeletePhoneNumberSchema.parse(args);

    await deleteRequest(`/convai/phone-numbers/${parsed.phone_number_id}`);

    return {
      content: [
        {
          type: "text",
          text: `Successfully deleted phone number: ${parsed.phone_number_id}`
        }
      ]
    };
  }
};
