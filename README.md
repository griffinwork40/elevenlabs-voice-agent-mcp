# ElevenLabs Voice Agent MCP Server

A Model Context Protocol (MCP) server for developing and managing ElevenLabs Voice Agents. This server provides 23 specialized tools for creating, configuring, testing, monitoring, and deploying voice agents through Claude and other MCP clients.

## Features

### Core Agent Management (Tier 1)
- **elevenlabs_create_agent** - Create new voice agents with full configuration
- **elevenlabs_get_agent** - Retrieve agent details and configuration
- **elevenlabs_update_agent** - Modify existing agent settings
- **elevenlabs_delete_agent** - Permanently remove agents
- **elevenlabs_list_agents** - Browse all agents with pagination

### Knowledge Base & Tools (Tier 2)
- **elevenlabs_add_knowledge_base** - Add documents or URLs to agent knowledge
- **elevenlabs_create_webhook_tool** - Create webhook integrations for agents
- **elevenlabs_list_tools** - View all tools configured for an agent
- **elevenlabs_delete_tool** - Remove tools from agents

### Testing & Monitoring (Tier 3)
- **elevenlabs_get_conversation** - Retrieve conversation transcripts and analysis
- **elevenlabs_list_conversations** - Browse conversations with filtering
- **elevenlabs_generate_widget_code** - Generate HTML embed code for testing

### Utilities (Tier 4)
- **elevenlabs_list_voices** - Browse available voices with filtering

### Outbound Calling & Phone Management (Tier 5)
- **elevenlabs_start_outbound_call** - Initiate single outbound calls via Twilio
- **elevenlabs_submit_batch_call** - Submit batch calling jobs for multiple recipients
- **elevenlabs_list_batch_calls** - Browse all batch calling jobs
- **elevenlabs_get_batch_call** - Get detailed batch call status with recipient info
- **elevenlabs_list_phone_numbers** - List all connected phone numbers
- **elevenlabs_get_phone_number** - Get phone number details and configuration
- **elevenlabs_import_phone_number** - Import Twilio phone numbers
- **elevenlabs_update_phone_number** - Update phone number settings (assign agents)
- **elevenlabs_delete_phone_number** - Remove phone numbers from workspace

## Installation

### Prerequisites
- Node.js 18 or higher
- ElevenLabs API key ([Get one here](https://elevenlabs.io))

### Setup

1. **Clone or navigate to the project directory:**
   ```bash
   cd elevenlabs-voice-agent-mcp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your ElevenLabs API key
   ```

4. **Build the project:**
   ```bash
   npm run build
   ```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

Get your API key from [ElevenLabs Settings](https://elevenlabs.io/app/settings/api-keys).

### Claude Desktop Configuration

Add this to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "elevenlabs-voice-agents": {
      "command": "node",
      "args": [
        "/absolute/path/to/elevenlabs-voice-agent-mcp/dist/index.js"
      ],
      "env": {
        "ELEVENLABS_API_KEY": "your_elevenlabs_api_key_here"
      }
    }
  }
}
```

After adding the configuration:
1. Save the file
2. Restart Claude Desktop
3. Look for the 🔌 icon to verify the server is connected

## Quick Start: Outbound Calling

### 1. Import a Twilio Phone Number

```typescript
elevenlabs_import_phone_number({
  phone_number: "+14155551234",
  label: "Sales Line",
  sid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx",  // Your Twilio Account SID
  token: "your_twilio_auth_token",
  provider: "twilio",
  supports_inbound: true,
  supports_outbound: true
})
// Returns: { phone_number_id: "pn_abc123" }
```

### 2. Assign Phone Number to Agent

```typescript
elevenlabs_update_phone_number({
  phone_number_id: "pn_abc123",
  agent_id: "ag_xyz789"
})
```

### 3. Make a Single Outbound Call

```typescript
elevenlabs_start_outbound_call({
  agent_id: "ag_xyz789",
  agent_phone_number_id: "pn_abc123",
  to_number: "+19175551234",
  conversation_initiation_client_data: {
    dynamic_variables: {
      customer_name: "John Smith",
      account_balance: 1500
    }
  }
})
```

### 4. Submit a Batch Calling Job

```typescript
elevenlabs_submit_batch_call({
  call_name: "Q4 Customer Survey",
  agent_id: "ag_xyz789",
  agent_phone_number_id: "pn_abc123",
  recipients: [
    {
      phone_number: "+14155551234",
      conversation_initiation_client_data: {
        dynamic_variables: {
          name: "Alice Johnson",
          account_id: "A123"
        }
      }
    },
    {
      phone_number: "+19175555678",
      conversation_initiation_client_data: {
        dynamic_variables: {
          name: "Bob Williams",
          account_id: "B456"
        }
      }
    }
  ]
})
```

### 5. Monitor Batch Progress

```typescript
elevenlabs_get_batch_call({
  batch_id: "batch_abc123"
})
// Shows status for each recipient: completed, in_progress, failed, voicemail, etc.
```

## Usage

### Creating a Voice Agent

```typescript
// Create a basic customer service agent
elevenlabs_create_agent({
  name: "Customer Support Bot",
  prompt: "You are a helpful customer service agent for TechCorp. Be friendly, professional, and solve customer issues efficiently.",
  llm: "gpt-4o-mini",
  voice_id: "21m00Tcm4TlvDq8ikWAM",
  first_message: "Hi! How can I help you today?",
  language: "en"
})
```

### Adding Knowledge Base

```typescript
// Add company documentation
elevenlabs_add_knowledge_base({
  agent_id: "ag_abc123",
  documents: [
    {
      type: "url",
      content: "https://example.com/company-policies"
    },
    {
      type: "text",
      content: "Our support hours are Monday-Friday, 9 AM to 6 PM EST."
    }
  ]
})
```

### Creating Webhook Tools

```typescript
// Add order status checking capability
elevenlabs_create_webhook_tool({
  agent_id: "ag_abc123",
  name: "check_order_status",
  description: "Check the status of a customer order by order ID",
  url: "https://api.example.com/orders/status",
  method: "POST",
  parameters: [
    {
      name: "order_id",
      type: "string",
      description: "The unique order identifier",
      required: true
    }
  ]
})
```

### Testing Your Agent

```typescript
// Generate widget code for testing
elevenlabs_generate_widget_code({
  agent_id: "ag_abc123",
  color: "#4A90E2",
  avatar_url: "https://example.com/avatar.png"
})
```

### Monitoring Conversations

```typescript
// List recent conversations
elevenlabs_list_conversations({
  agent_id: "ag_abc123",
  limit: 10,
  status: "completed"
})

// Get full transcript
elevenlabs_get_conversation({
  conversation_id: "conv_xyz789"
})
```

## Tool Details

### Response Formats

All tools support two response formats:

- **markdown** (default) - Human-readable formatted output
- **json** - Structured data for programmatic use

Example:
```typescript
elevenlabs_get_agent({
  agent_id: "ag_abc123",
  response_format: "json"
})
```

### Pagination

List endpoints support pagination:

```typescript
elevenlabs_list_agents({
  limit: 20,      // Items per page (1-100)
  offset: 0       // Skip this many items
})
```

The response includes:
- `has_more` - Whether more items exist
- `next_offset` - Offset value for next page
- `total` - Total number of items

### Supported LLM Models

- `gpt-4o`
- `gpt-4o-mini` (default)
- `claude-3-5-sonnet-20241022`
- `claude-3-5-haiku-20241022`
- `gemini-2.0-flash-exp`

### Supported Voice Models

- `eleven_turbo_v2_5` - Fastest, lowest latency
- `eleven_flash_v2_5` (default) - Balanced speed and quality
- `eleven_multilingual_v2` - Best for multiple languages

### Supported Languages

`en`, `es`, `fr`, `de`, `it`, `pt`, `pl`, `nl`, `ja`, `zh`, `ko`, `ar`, `hi`

## Development

### Project Structure

```
elevenlabs-voice-agent-mcp/
├── src/
│   ├── index.ts                 # Server initialization
│   ├── types.ts                 # TypeScript interfaces
│   ├── constants.ts             # API URLs and defaults
│   ├── schemas/                 # Zod validation schemas
│   │   ├── agent-schemas.ts
│   │   ├── tool-schemas.ts
│   │   ├── conversation-schemas.ts
│   │   └── common-schemas.ts
│   ├── services/                # API clients and utilities
│   │   ├── elevenlabs-api.ts
│   │   └── formatters.ts
│   ├── tools/                   # MCP tool implementations
│   │   ├── agent-tools.ts
│   │   ├── knowledge-tools.ts
│   │   ├── tool-tools.ts
│   │   ├── conversation-tools.ts
│   │   └── utility-tools.ts
│   └── utils/                   # Helper functions
│       ├── error-handlers.ts
│       └── truncation.ts
└── dist/                        # Compiled JavaScript
```

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run in watch mode with auto-reload
- `npm start` - Run the compiled server
- `npm run clean` - Remove build artifacts

### Adding New Tools

1. Create tool definition in appropriate file under `src/tools/`
2. Add Zod schema in `src/schemas/`
3. Register tool in `src/index.ts`
4. Rebuild with `npm run build`

## Error Handling

The server provides clear, actionable error messages:

- **401 Unauthorized** - Invalid API key, check `ELEVENLABS_API_KEY`
- **404 Not Found** - Agent/conversation ID doesn't exist
- **429 Rate Limited** - Too many requests, wait 60 seconds
- **400 Bad Request** - Invalid parameters, check tool documentation

## Character Limits

Responses are automatically truncated at 25,000 characters with guidance for pagination or filtering.

## Best Practices

### Agent Creation
- Write clear, specific system prompts
- Test different LLM models for your use case
- Use appropriate voice models (flash for speed, multilingual for languages)
- Set reasonable temperature values (0-0.7 for consistent, 0.8-2.0 for creative)

### Knowledge Base
- Add focused, relevant documents
- Use URLs for content that updates frequently
- Include metadata for better organization
- Keep documents concise and well-structured

### Webhook Tools
- Provide clear, descriptive tool names
- Write detailed parameter descriptions
- Test webhook endpoints before adding
- Handle errors gracefully in your webhook responses

### Testing
- Generate widget code for easy browser testing
- Review conversation transcripts regularly
- Monitor conversation analysis metrics
- Test with various user inputs and edge cases

## Troubleshooting

### Server won't start
- Verify `ELEVENLABS_API_KEY` is set in environment
- Check Node.js version (18+ required)
- Run `npm install` to ensure dependencies are installed
- Check for port conflicts if running multiple MCP servers

### Tools not appearing in Claude
- Verify server is registered in `claude_desktop_config.json`
- Use absolute paths in configuration
- Restart Claude Desktop after config changes
- Check Claude Desktop logs for errors

### API errors
- Verify API key is valid at [ElevenLabs Settings](https://elevenlabs.io/app/settings/api-keys)
- Check ElevenLabs account has required permissions
- Ensure you're not exceeding rate limits
- Verify agent/conversation IDs are correct

## Support

- **ElevenLabs Documentation**: https://elevenlabs.io/docs
- **MCP Documentation**: https://modelcontextprotocol.io
- **Issues**: Report bugs or request features via GitHub issues

## License

MIT

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## Use Cases

### Customer Outreach
```typescript
// Import leads from CSV and call them all
elevenlabs_submit_batch_call({
  call_name: "Lead Qualification Q1",
  agent_id: "ag_sales",
  recipients: [
    { phone_number: "+1...", conversation_initiation_client_data: { name: "...", company: "..." } },
    // ... up to 10,000 recipients
  ]
})
```

### Appointment Reminders
```typescript
// Call customers with personalized reminders
elevenlabs_start_outbound_call({
  agent_id: "ag_scheduler",
  agent_phone_number_id: "pn_main",
  to_number: "+14155551234",
  conversation_initiation_client_data: {
    dynamic_variables: {
      patient_name: "Sarah",
      appointment_time: "3:00 PM tomorrow",
      doctor_name: "Dr. Smith"
    }
  }
})
```

### Survey & Feedback Collection
```typescript
// Batch call for post-purchase surveys
elevenlabs_submit_batch_call({
  call_name: "Post-Purchase NPS Survey",
  agent_id: "ag_survey",
  recipients: recentCustomers.map(c => ({
    phone_number: c.phone,
    conversation_initiation_client_data: {
      dynamic_variables: {
        name: c.name,
        product: c.lastPurchase,
        order_id: c.orderId
      }
    }
  }))
})
```

## Changelog

### v2.0.0 (2025-01-24)
- Added 9 new tools for outbound calling and phone management
- Outbound calling via Twilio integration
- Batch calling for mass outreach (up to 10,000 recipients)
- Phone number management (import, assign, configure)
- Support for dynamic variables and call personalization
- Voicemail detection in batch calling
- Total tools: 23 (up from 14)

### v1.0.0 (2025-01-20)
- Initial release
- 14 tools for voice agent development
- Comprehensive agent management
- Knowledge base and webhook tool support
- Conversation monitoring and analytics
- Widget generation for testing
