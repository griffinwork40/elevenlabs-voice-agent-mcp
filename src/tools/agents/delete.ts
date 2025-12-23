/**
 * Agent deletion tool
 *
 * MCP tool for permanently deleting ElevenLabs voice agents.
 */

import { deleteRequest } from "../../services/elevenlabs-api.js";
import { DeleteAgentSchema } from "../../schemas/agent-schemas.js";

/**
 * Deletes an agent permanently
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
  - Don't use when: You're not sure - this is permanent!`,

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
