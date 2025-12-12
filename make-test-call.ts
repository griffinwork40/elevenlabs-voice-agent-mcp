#!/usr/bin/env node

/**
 * Quick script to make a test outbound call
 * Uses Griffin clone voice
 */

import "dotenv/config";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { join } from "path";

async function makeCall() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("ELEVENLABS_API_KEY not set");
    process.exit(1);
  }

  const serverPath = join(process.cwd(), "dist", "index.js");
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
    env: {
      ...process.env,
      ELEVENLABS_API_KEY: apiKey
    }
  });

  const client = new Client(
    {
      name: "test-call-client",
      version: "1.0.0"
    },
    {
      capabilities: {}
    }
  );

  await client.connect(transport);
  
  // Wait a bit for server to initialize
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    // First, list agents to find one with Griffin voice or get agent ID
    console.log("Listing agents...");
    const agentsResult = await client.callTool({
      name: "elevenlabs_list_agents",
      arguments: { limit: 20, response_format: "json" }
    });
    
    const agents = JSON.parse(agentsResult.content[0].text).items || [];
    console.log(`Found ${agents.length} agents`);

    // List phone numbers
    console.log("Listing phone numbers...");
    const phoneResult = await client.callTool({
      name: "elevenlabs_list_phone_numbers",
      arguments: { response_format: "json" }
    });
    
    const phoneNumbers = JSON.parse(phoneResult.content[0].text) || [];
    console.log(`Found ${phoneNumbers.length} phone numbers`);

    if (phoneNumbers.length === 0) {
      console.error("No phone numbers found. Please import a phone number first.");
      process.exit(1);
    }

    if (agents.length === 0) {
      console.error("No agents found. Please create an agent first.");
      process.exit(1);
    }

    // Find an agent with Griffin voice or use first agent
    let agent = agents.find((a: any) => 
      a.conversation_config?.tts?.voice_id?.toLowerCase().includes('griffin') ||
      a.name?.toLowerCase().includes('griffin')
    ) || agents[0];

    // Get full agent details to see current voice
    console.log("Getting agent details...");
    const agentDetailsResult = await client.callTool({
      name: "elevenlabs_get_agent",
      arguments: { agent_id: agent.agent_id, response_format: "json" }
    });
    
    const agentDetails = JSON.parse(agentDetailsResult.content[0].text);
    const currentVoiceId = agentDetails.conversation_config?.tts?.voice_id;
    console.log(`Agent current voice ID: ${currentVoiceId}`);

    const phoneNumber = phoneNumbers[0];
    
    console.log(`Using agent: ${agent.agent_id} (${agent.name})`);
    console.log(`Using phone number: ${phoneNumber.phone_number_id} (${phoneNumber.phone_number})`);

    // Try to find Griffin voice - search user's voices
    let griffinVoiceId: string | null = null;
    try {
      console.log("Searching for Griffin voice in your voice library...");
      const voicesResult = await client.callTool({
        name: "elevenlabs_list_voices",
        arguments: { limit: 50, response_format: "markdown" }
      });
      
      const voicesText = voicesResult.content[0].text;
      // Look for Griffin in the markdown response
      const griffinMatch = voicesText.match(/griffin.*?ID[:\s]+([a-zA-Z0-9_-]+)/i);
      if (griffinMatch) {
        griffinVoiceId = griffinMatch[1];
        console.log(`Found Griffin voice ID: ${griffinVoiceId}`);
      } else {
        // Try to find any voice ID that might be Griffin
        const voiceIdMatches = voicesText.matchAll(/ID[:\s]+([a-zA-Z0-9_-]+)/g);
        for (const match of voiceIdMatches) {
          // Check if the line contains griffin
          const lines = voicesText.split('\n');
          for (const line of lines) {
            if (line.toLowerCase().includes('griffin') && line.includes(match[1])) {
              griffinVoiceId = match[1];
              console.log(`Found Griffin voice ID: ${griffinVoiceId}`);
              break;
            }
          }
          if (griffinVoiceId) break;
        }
      }
    } catch (error) {
      console.log("Could not search voices, will use agent's current voice");
    }

    const toNumber = "+13213682581"; // 321 368 2581 in E.164 format
    
    console.log(`\nMaking call to ${toNumber}...`);
    
    const callData: any = {
      agent_id: agent.agent_id,
      agent_phone_number_id: phoneNumber.phone_number_id,
      to_number: toNumber,
      response_format: "json"
    };

    // Override voice to Griffin if found, or if current voice is already Griffin, just use it
    if (griffinVoiceId) {
      console.log(`Overriding voice to Griffin: ${griffinVoiceId}`);
      callData.conversation_initiation_client_data = {
        conversation_config_override: {
          tts: {
            voice_id: griffinVoiceId
          }
        }
      };
    } else if (currentVoiceId && currentVoiceId.toLowerCase().includes('griffin')) {
      console.log(`Agent already using Griffin voice: ${currentVoiceId}`);
    } else {
      console.log("Warning: Griffin voice not found. Using agent's current voice.");
      console.log(`Current voice ID: ${currentVoiceId}`);
      console.log("Note: You may need to update the agent's voice to Griffin's clone voice ID.");
    }

    const result = await client.callTool({
      name: "elevenlabs_start_outbound_call",
      arguments: callData
    });

    console.log("\nCall result:");
    console.log(result.content[0].text);

  } catch (error) {
    console.error("Error making call:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

makeCall().catch(console.error);
