#!/usr/bin/env node

import { DEFAULT_ASR_CONFIG, DEFAULT_LLM, DEFAULT_TURN_CONFIG, DEFAULT_VOICE_MODEL } from "../src/constants.js";
import { CreateAgentSchema, UpdateAgentSchema } from "../src/schemas/agent-schemas.js";
import { logger, colors } from "./utils/test-helpers.js";

function assert(condition: unknown, message: string): void {
  if (!condition) {
    console.error(`${colors.red}${message}${colors.reset}`);
    process.exit(1);
  }
}

// Validate CreateAgentSchema defaults for LLM, voice model, ASR, and turn configs
const createParsed = CreateAgentSchema.parse({
  name: "Test Agent",
  prompt: "This is a test prompt that exceeds the minimum length."
});

assert(createParsed.llm === DEFAULT_LLM, `Expected default llm to be ${DEFAULT_LLM}`);
assert(createParsed.voice_model === DEFAULT_VOICE_MODEL, `Expected default voice model to be ${DEFAULT_VOICE_MODEL}`);
assert(createParsed.asr?.provider === DEFAULT_ASR_CONFIG.provider, "Default ASR provider mismatch");
assert(
  createParsed.asr?.user_input_audio_format === DEFAULT_ASR_CONFIG.user_input_audio_format,
  "Default ASR audio format mismatch"
);
assert(createParsed.turn?.turn_timeout === DEFAULT_TURN_CONFIG.turn_timeout, "Default turn timeout mismatch");
assert(
  createParsed.turn?.silence_end_call_timeout === DEFAULT_TURN_CONFIG.silence_end_call_timeout,
  "Default silence end call timeout mismatch"
);

// Validate UpdateAgentSchema accepts partial ASR/turn updates
const updateParsed = UpdateAgentSchema.parse({
  agent_id: "ag_test123",
  asr: { provider: "custom" },
  turn: { turn_timeout: 5 },
  response_format: "json"
});

assert(updateParsed.asr?.provider === "custom", "Update schema ASR provider not parsed correctly");
assert(updateParsed.turn?.turn_timeout === 5, "Update schema turn timeout not parsed correctly");

logger.success("Agent schema defaults validated successfully");
