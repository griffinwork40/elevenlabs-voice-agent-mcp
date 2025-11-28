# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server that provides 23 specialized tools for developing and managing ElevenLabs Voice Agents. It enables Claude and other MCP clients to create, configure, test, monitor, and deploy AI-powered voice agents with outbound calling capabilities.

## Development Commands

### Build and Run
```bash
npm run build          # Compile TypeScript to JavaScript (outputs to dist/)
npm run dev            # Development mode with auto-reload (uses tsx watch)
npm start              # Run the compiled server from dist/
npm run clean          # Remove build artifacts
```

### Environment Setup
- Copy `.env.example` to `.env`
- Set `ELEVENLABS_API_KEY` with your ElevenLabs API key
- The server validates the API key on startup

### Testing the Server
After building, configure in Claude Desktop's config file (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):
```json
{
  "mcpServers": {
    "elevenlabs-voice-agents": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": {
        "ELEVENLABS_API_KEY": "your_key_here"
      }
    }
  }
}
```

## Architecture

### Core Structure

The codebase follows a modular architecture with clear separation of concerns:

1. **Entry Point** (`src/index.ts`)
   - Initializes MCP server using `@modelcontextprotocol/sdk`
   - Validates API key on startup
   - Registers all tools from different modules
   - Sets up stdio transport for communication

2. **API Layer** (`src/services/elevenlabs-api.ts`)
   - Central HTTP client for all ElevenLabs API requests
   - Handles authentication via `xi-api-key` header
   - Provides typed request helpers (GET, POST, PUT, PATCH, DELETE)
   - 30-second request timeout

3. **Tools Layer** (`src/tools/`)
   - Each file exports MCP tool definitions with:
     - `name`: Tool identifier
     - `description`: What the tool does
     - `inputSchema`: Zod schema for validation
     - `handler`: Async function that executes the tool
   - Tools are organized by functionality:
     - `agent-tools.ts`: CRUD operations for voice agents
     - `knowledge-tools.ts`: Adding knowledge bases to agents
     - `tool-tools.ts`: Creating/managing webhook tools
     - `conversation-tools.ts`: Retrieving conversation data
     - `utility-tools.ts`: Voice listing, widget generation
     - `outbound-tools.ts`: Single outbound call initiation
     - `batch-calling-tools.ts`: Batch calling jobs management
     - `phone-number-tools.ts`: Phone number import/management

4. **Validation Layer** (`src/schemas/`)
   - Zod schemas for runtime type validation
   - Organized by domain (agents, tools, conversations, etc.)
   - Defines input schemas used by MCP tools
   - Reusable schema components in `common-schemas.ts`

5. **Type System** (`src/types.ts`, `src/constants.ts`)
   - TypeScript interfaces for all API entities
   - Constants for supported models, languages, limits
   - Type-safe enums derived from constant arrays

### Data Flow

1. MCP client (Claude) calls a tool with parameters
2. Tool handler receives validated input (Zod schema)
3. Handler calls API service with appropriate HTTP method
4. API service authenticates and makes request to ElevenLabs
5. Response is formatted (markdown or JSON) and returned
6. Error handling catches and formats API errors

### Key Design Patterns

**Tool Structure**: Every tool follows this pattern:
```typescript
export const toolName = {
  name: "elevenlabs_action_name",
  description: "What it does",
  inputSchema: zodSchema,
  handler: async (args: SchemaType) => {
    // 1. Make API request
    // 2. Format response
    // 3. Return formatted result
  }
};
```

**Response Formatting**: Tools support two formats:
- `response_format: "markdown"` (default): Human-readable formatted output
- `response_format: "json"`: Raw structured data

**Pagination**: List endpoints use consistent pagination:
- `limit`: Items per page (1-100, default 20)
- `offset`: Skip N items
- Response includes `has_more`, `next_offset`, `total`

**Error Handling**: Centralized in `src/utils/error-handlers.ts`:
- `handleElevenLabsError()`: Parses axios errors, provides actionable messages
- `validateApiKey()`: Checks for API key on startup
- HTTP status codes are mapped to user-friendly error messages

**Response Truncation**: `src/utils/truncation.ts`:
- Automatically truncates responses over 25,000 characters
- Appends guidance on using pagination or filtering

## Important Implementation Notes

### API Authentication
- All requests require `xi-api-key` header with ElevenLabs API key
- Key is read from `process.env.ELEVENLABS_API_KEY`
- Server exits with error if key is not set

### Type Safety
- Use strict TypeScript (`strict: true` in tsconfig.json)
- ES2022 module system with Node16 resolution
- All `.ts` imports must include `.js` extension (ESM requirement)

### Tool Registration
When adding new tools:
1. Create tool definition in appropriate `src/tools/*.ts` file
2. Create/update Zod schema in `src/schemas/*.ts`
3. Add types to `src/types.ts` if needed
4. Import and add to tools array in `src/index.ts`
5. Rebuild with `npm run build`

### Constants and Defaults
- Default LLM: `gpt-4o-mini`
- Default voice model: `eleven_flash_v2_5`
- Default language: `en`
- Character limit: 25,000
- Request timeout: 30 seconds
- Max batch recipients: 10,000

### Outbound Calling Architecture
- Requires Twilio integration
- Phone numbers must be imported before use
- Phone numbers must be assigned to agents
- Batch calling supports up to 10,000 recipients
- Supports dynamic variables via `conversation_initiation_client_data`
  - Dynamic variables must be nested: `{dynamic_variables: {name: 'John', user_id: '123'}}`
  - Can also include `conversation_config_override` for per-call customization
  - Example: `{dynamic_variables: {customer_name: "Alice"}, conversation_config_override: {agent: {first_message: "Hi!"}}}`

## Common Patterns

### Making API Requests
```typescript
import { postRequest, getRequest } from "../services/elevenlabs-api.js";

// POST request
const result = await postRequest<ResponseType>(
  "/convai/agents",
  requestBody
);

// GET request with params
const result = await getRequest<ResponseType>(
  "/convai/agents",
  { limit: 20, offset: 0 }
);
```

### Creating Zod Schemas
```typescript
import { z } from "zod";

export const MyToolInputSchema = z.object({
  required_field: z.string(),
  optional_field: z.string().optional(),
  enum_field: z.enum(["option1", "option2"]),
  response_format: z.enum(["markdown", "json"]).default("markdown")
});

export type MyToolInput = z.infer<typeof MyToolInputSchema>;
```

### Formatting Responses
```typescript
if (args.response_format === "json") {
  return JSON.stringify(data, null, 2);
}

// Return markdown formatted string
return `# Heading\n\n**Field**: ${data.field}\n`;
```

## Dependencies

### Runtime
- `@modelcontextprotocol/sdk`: ^1.6.1 - MCP server implementation
- `axios`: ^1.7.9 - HTTP client for API requests
- `zod`: ^3.23.8 - Runtime type validation

### Development
- `typescript`: ^5.7.2 - TypeScript compiler
- `tsx`: ^4.19.2 - TypeScript execution and watch mode
- `@types/node`: ^22.10.0 - Node.js type definitions

### Requirements
- Node.js 18 or higher (specified in package.json engines)

## API Integration Notes

- Base URL: `https://api.elevenlabs.io/v1`
- All endpoints are under `/convai/` prefix
- Rate limiting: 429 errors suggest waiting 60 seconds
- Authentication: Header-based with `xi-api-key`
- Conversation IDs start with `conv_`
- Agent IDs start with `ag_`
- Phone number IDs start with `pn_`
- Batch IDs start with `batch_`
