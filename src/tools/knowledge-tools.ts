/**
 * Knowledge base management tools
 *
 * MCP tools for adding documents and URLs to agent knowledge bases.
 */

import { postRequest } from "../services/elevenlabs-api.js";
import { formatResponse } from "../services/formatters.js";
import { createTextResponse } from "../utils/response.js";
import { ResponseFormat, MCPToolDefinition } from "../types.js";
import { AddKnowledgeBaseSchema } from "../schemas/tool-schemas.js";

/**
 * Adds documents to an agent's knowledge base
 */
export const elevenlabs_add_knowledge_base: MCPToolDefinition<typeof AddKnowledgeBaseSchema> = {
  name: "elevenlabs_add_knowledge_base",
  description: `Add documents or URLs to an agent's knowledge base.

This tool enables agents to reference custom knowledge when responding to users. You can add text documents or URLs that will be fetched and indexed. The agent will automatically use this information when relevant to the conversation.

Args:
  - agent_id (string): Agent identifier to add knowledge to
  - documents (array): Array of document objects with:
    - type ('text' | 'url'): Type of document
    - content (string): For 'text': the actual text. For 'url': the URL to fetch
    - metadata (object): Optional key-value metadata about the document
  - response_format ('markdown' | 'json'): Output format

Returns:
  Confirmation message indicating successful knowledge base update.

Examples:
  - Use when: "Add this FAQ document to the agent's knowledge base"
  - Use when: "Index the company policy page at https://example.com/policies"
  - Use when: "Give the agent access to product documentation"
  - Don't use when: You want to add webhook tools (use elevenlabs_create_webhook_tool)

Error Handling:
  - Returns "Error: Agent not found" if agent_id doesn't exist
  - Returns "Error: Invalid URL" if URL document is not accessible
  - Returns "Error: Document too large" if content exceeds size limits`,

  zodSchema: AddKnowledgeBaseSchema,

  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true
  },

  handler: async (args: unknown) => {
    const parsed = AddKnowledgeBaseSchema.parse(args);

    const result = await postRequest(
      `/convai/agents/${parsed.agent_id}/knowledge-base`,
      { documents: parsed.documents }
    );

    const message = `Successfully added ${parsed.documents.length} document(s) to agent ${parsed.agent_id}'s knowledge base.`;

    const responseText = parsed.response_format === ResponseFormat.JSON
      ? formatResponse({ success: true, message, documents_added: parsed.documents.length }, parsed.response_format, "generic")
      : message;

    return createTextResponse(responseText);
  }
};
