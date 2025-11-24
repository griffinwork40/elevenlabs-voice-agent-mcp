/**
 * Zod validation schemas for tool and knowledge base operations
 *
 * Provides strict input validation for managing agent tools and knowledge bases.
 */

import { z } from "zod";
import { AgentIdSchema, ResponseFormatSchema, URLSchema } from "./common-schemas.js";

/**
 * Tool parameter schema
 */
const ToolParameterSchema = z.object({
  name: z.string()
    .min(1, "Parameter name is required")
    .describe("Name of the parameter"),

  type: z.enum(["string", "number", "boolean", "object", "array"], {
    errorMap: () => ({ message: "Type must be: string, number, boolean, object, or array" })
  }).describe("Data type of the parameter"),

  description: z.string()
    .min(1, "Parameter description is required")
    .describe("Description of what this parameter does"),

  required: z.boolean()
    .describe("Whether this parameter is required"),

  enum: z.array(z.string())
    .optional()
    .describe("Optional array of allowed values for this parameter")
}).strict();

/**
 * Schema for creating a webhook tool
 */
export const CreateWebhookToolSchema = z.object({
  agent_id: AgentIdSchema,

  name: z.string()
    .min(1, "Tool name is required")
    .max(64, "Tool name must not exceed 64 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Tool name must contain only alphanumeric characters, hyphens, and underscores")
    .describe("Unique name for the tool (e.g., 'check_order_status')"),

  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must not exceed 500 characters")
    .describe("Clear description of what this tool does"),

  url: URLSchema
    .describe("Webhook URL that will be called when the tool is invoked"),

  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"], {
    errorMap: () => ({ message: "Method must be: GET, POST, PUT, PATCH, or DELETE" })
  })
    .default("POST")
    .describe("HTTP method to use (default: POST)"),

  headers: z.record(z.string(), z.string())
    .optional()
    .describe("Optional custom headers to send with the request"),

  parameters: z.array(ToolParameterSchema)
    .min(0, "Parameters array is required (can be empty)")
    .describe("Array of parameters the tool accepts"),

  response_format: ResponseFormatSchema
}).strict();

/**
 * Schema for listing tools
 */
export const ListToolsSchema = z.object({
  agent_id: AgentIdSchema,
  response_format: ResponseFormatSchema
}).strict();

/**
 * Schema for deleting a tool
 */
export const DeleteToolSchema = z.object({
  agent_id: AgentIdSchema,

  tool_name: z.string()
    .min(1, "Tool name is required")
    .describe("Name of the tool to delete")
}).strict();

/**
 * Knowledge base document schema
 */
const KnowledgeBaseDocumentSchema = z.object({
  type: z.enum(["text", "url"], {
    errorMap: () => ({ message: "Document type must be 'text' or 'url'" })
  }).describe("Type of document to add"),

  content: z.string()
    .min(1, "Document content is required")
    .describe("For 'text' type: the actual text content. For 'url' type: the URL to fetch"),

  metadata: z.record(z.string(), z.string())
    .optional()
    .describe("Optional metadata about the document")
}).strict();

/**
 * Schema for adding knowledge base documents
 */
export const AddKnowledgeBaseSchema = z.object({
  agent_id: AgentIdSchema,

  documents: z.array(KnowledgeBaseDocumentSchema)
    .min(1, "At least one document is required")
    .max(100, "Cannot add more than 100 documents at once")
    .describe("Array of documents to add to the agent's knowledge base"),

  response_format: ResponseFormatSchema
}).strict();

/**
 * Schema for generating widget code
 */
export const GenerateWidgetCodeSchema = z.object({
  agent_id: AgentIdSchema,

  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (e.g., #FF5733)")
    .optional()
    .describe("Optional widget color (hex format)"),

  avatar_url: URLSchema
    .optional()
    .describe("Optional avatar image URL for the widget")
}).strict();

/**
 * Schema for listing voices
 */
export const ListVoicesSchema = z.object({
  language: z.string()
    .optional()
    .describe("Filter by language code (e.g., 'en', 'es')"),

  gender: z.enum(["male", "female"])
    .optional()
    .describe("Filter by gender"),

  age: z.enum(["young", "middle_aged", "old"])
    .optional()
    .describe("Filter by age category"),

  limit: z.number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe("Maximum number of voices to return"),

  response_format: ResponseFormatSchema
}).strict();
