/**
 * Tests for agent management tools
 *
 * Tests CRUD operations for voice agents.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import {
  elevenlabs_create_agent,
  elevenlabs_get_agent,
  elevenlabs_update_agent,
  elevenlabs_delete_agent,
  elevenlabs_list_agents
} from "../../tools/agent-tools.js";
import { mockAgent, mockAgentMinimal, validCreateAgentInput } from "../mocks/fixtures.js";
import { ResponseFormat } from "../../types.js";

// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios);

describe("Agent Tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ELEVENLABS_API_KEY = "test_api_key_12345";
  });

  describe("elevenlabs_create_agent", () => {
    it("should have correct tool metadata", () => {
      expect(elevenlabs_create_agent.name).toBe("elevenlabs_create_agent");
      expect(elevenlabs_create_agent.description).toContain("Create a new ElevenLabs Voice Agent");
      expect(elevenlabs_create_agent.annotations?.readOnlyHint).toBe(false);
      expect(elevenlabs_create_agent.annotations?.destructiveHint).toBe(false);
    });

    it("should create an agent successfully with all parameters", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockAgent });

      const result = await elevenlabs_create_agent.handler({
        name: "Test Support Agent",
        prompt: "You are a helpful customer support agent.",
        llm: "claude-sonnet-4-5@20250929",
        voice_id: "21m00Tcm4TlvDq8ikWAM",
        voice_model: "eleven_turbo_v2_5",
        first_message: "Hello! How can I help you today?",
        language: "en",
        temperature: 0.7,
        max_tokens: 1024,
        stability: 0.5,
        similarity_boost: 0.75,
        speed: 1.0,
        turn_eagerness: "normal",
        turn_timeout: 10,
        silence_end_call_timeout: 15,
        widget_color: "#FF5733",
        widget_avatar_url: "https://example.com/avatar.png",
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain("Test Support Agent");

      // Verify the request was made with correct data
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          data: expect.objectContaining({
            name: "Test Support Agent",
            conversation_config: expect.objectContaining({
              agent: expect.objectContaining({
                prompt: expect.objectContaining({
                  prompt: "You are a helpful customer support agent.",
                  llm: "claude-sonnet-4-5@20250929"
                }),
                language: "en"
              }),
              tts: expect.objectContaining({
                voice_id: "21m00Tcm4TlvDq8ikWAM",
                model_id: "eleven_turbo_v2_5"
              })
            })
          })
        })
      );
    });

    it("should create agent with minimal parameters using defaults", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockAgentMinimal });

      const result = await elevenlabs_create_agent.handler({
        name: "Minimal Agent",
        prompt: "A simple test agent prompt."
      });

      expect(result.content[0].text).toContain("Minimal Agent");
    });

    it("should return JSON format when specified", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockAgent });

      const result = await elevenlabs_create_agent.handler({
        name: "Test Agent",
        prompt: "Test prompt for agent.",
        response_format: ResponseFormat.JSON
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.agent_id).toBe("ag_test123");
    });

    it("should validate required fields", async () => {
      await expect(
        elevenlabs_create_agent.handler({
          name: "",
          prompt: "Valid prompt"
        })
      ).rejects.toThrow();
    });

    it("should validate prompt minimum length", async () => {
      await expect(
        elevenlabs_create_agent.handler({
          name: "Valid Name",
          prompt: "Short"
        })
      ).rejects.toThrow();
    });
  });

  describe("elevenlabs_get_agent", () => {
    it("should have correct tool metadata", () => {
      expect(elevenlabs_get_agent.name).toBe("elevenlabs_get_agent");
      expect(elevenlabs_get_agent.annotations?.readOnlyHint).toBe(true);
    });

    it("should retrieve agent by ID", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockAgent });

      const result = await elevenlabs_get_agent.handler({
        agent_id: "ag_test123",
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("Test Support Agent");
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: expect.stringContaining("/convai/agents/ag_test123")
        })
      );
    });

    it("should return JSON when format specified", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockAgent });

      const result = await elevenlabs_get_agent.handler({
        agent_id: "ag_test123",
        response_format: ResponseFormat.JSON
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.agent_id).toBe("ag_test123");
    });

    it("should handle API error for non-existent agent", async () => {
      const error = {
        response: { status: 404, data: { detail: "Agent not found" } },
        isAxiosError: true
      };
      mockedAxios.mockRejectedValueOnce(error);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      await expect(
        elevenlabs_get_agent.handler({
          agent_id: "ag_nonexistent",
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow("not found");
    });

    it("should validate agent_id format", async () => {
      await expect(
        elevenlabs_get_agent.handler({
          agent_id: "",
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow();
    });
  });

  describe("elevenlabs_update_agent", () => {
    it("should have correct tool metadata", () => {
      expect(elevenlabs_update_agent.name).toBe("elevenlabs_update_agent");
      expect(elevenlabs_update_agent.annotations?.destructiveHint).toBe(false);
      expect(elevenlabs_update_agent.annotations?.idempotentHint).toBe(true);
    });

    it("should update agent name", async () => {
      // First call to get current agent
      mockedAxios.mockResolvedValueOnce({ data: mockAgent });
      // Second call to update
      mockedAxios.mockResolvedValueOnce({
        data: { ...mockAgent, name: "Updated Name" }
      });

      const result = await elevenlabs_update_agent.handler({
        agent_id: "ag_test123",
        name: "Updated Name",
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("Updated Name");
    });

    it("should update prompt and LLM", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockAgent });
      mockedAxios.mockResolvedValueOnce({
        data: {
          ...mockAgent,
          conversation_config: {
            ...mockAgent.conversation_config,
            agent: {
              ...mockAgent.conversation_config.agent,
              prompt: {
                ...mockAgent.conversation_config.agent.prompt,
                prompt: "New prompt",
                llm: "gpt-4o"
              }
            }
          }
        }
      });

      const result = await elevenlabs_update_agent.handler({
        agent_id: "ag_test123",
        prompt: "New prompt",
        llm: "gpt-4o",
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("gpt-4o");
    });

    it("should update TTS settings", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockAgent });
      mockedAxios.mockResolvedValueOnce({
        data: {
          ...mockAgent,
          conversation_config: {
            ...mockAgent.conversation_config,
            tts: {
              ...mockAgent.conversation_config.tts,
              voice_id: "new_voice_id",
              stability: 0.8
            }
          }
        }
      });

      const result = await elevenlabs_update_agent.handler({
        agent_id: "ag_test123",
        voice_id: "new_voice_id",
        stability: 0.8,
        response_format: ResponseFormat.JSON
      });

      expect(result.content[0].text).toContain("new_voice_id");
    });

    it("should update turn configuration", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockAgent });
      mockedAxios.mockResolvedValueOnce({ data: mockAgent });

      await elevenlabs_update_agent.handler({
        agent_id: "ag_test123",
        turn_eagerness: "eager",
        turn_timeout: 5,
        response_format: ResponseFormat.MARKDOWN
      });

      expect(mockedAxios).toHaveBeenCalledTimes(2);
    });

    it("should update widget settings", async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockAgent });
      mockedAxios.mockResolvedValueOnce({ data: mockAgent });

      await elevenlabs_update_agent.handler({
        agent_id: "ag_test123",
        widget_color: "#00FF00",
        response_format: ResponseFormat.MARKDOWN
      });

      expect(mockedAxios).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          method: "PATCH",
          data: expect.objectContaining({
            platform_settings: expect.objectContaining({
              widget: expect.objectContaining({
                color: "#00FF00"
              })
            })
          })
        })
      );
    });
  });

  describe("elevenlabs_delete_agent", () => {
    it("should have correct tool metadata", () => {
      expect(elevenlabs_delete_agent.name).toBe("elevenlabs_delete_agent");
      expect(elevenlabs_delete_agent.annotations?.destructiveHint).toBe(true);
    });

    it("should delete agent successfully", async () => {
      mockedAxios.mockResolvedValueOnce({ data: {} });

      const result = await elevenlabs_delete_agent.handler({
        agent_id: "ag_test123"
      });

      expect(result.content[0].text).toContain("Successfully deleted");
      expect(result.content[0].text).toContain("ag_test123");
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "DELETE",
          url: expect.stringContaining("/convai/agents/ag_test123")
        })
      );
    });

    it("should handle deletion of non-existent agent", async () => {
      const error = {
        response: { status: 404, data: { detail: "Agent not found" } },
        isAxiosError: true
      };
      mockedAxios.mockRejectedValueOnce(error);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      await expect(
        elevenlabs_delete_agent.handler({ agent_id: "ag_nonexistent" })
      ).rejects.toThrow("not found");
    });
  });

  describe("elevenlabs_list_agents", () => {
    it("should have correct tool metadata", () => {
      expect(elevenlabs_list_agents.name).toBe("elevenlabs_list_agents");
      expect(elevenlabs_list_agents.annotations?.readOnlyHint).toBe(true);
    });

    it("should list agents with default pagination", async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { agents: [mockAgent, mockAgentMinimal] }
      });

      const result = await elevenlabs_list_agents.handler({
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("Agents");
      expect(result.content[0].text).toContain("Test Support Agent");
      expect(result.content[0].text).toContain("Minimal Agent");
    });

    it("should list agents with custom pagination", async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { agents: [mockAgent] }
      });

      await elevenlabs_list_agents.handler({
        limit: 10,
        offset: 5,
        response_format: ResponseFormat.MARKDOWN
      });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { limit: 10, offset: 5 }
        })
      );
    });

    it("should return JSON format", async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { agents: [mockAgent] }
      });

      const result = await elevenlabs_list_agents.handler({
        limit: 20,
        offset: 0,
        response_format: ResponseFormat.JSON
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.items).toHaveLength(1);
      expect(parsed.total).toBe(1);
    });

    it("should handle empty agent list", async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { agents: [] }
      });

      const result = await elevenlabs_list_agents.handler({
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("No agents found");
    });

    it("should indicate when more agents are available", async () => {
      // Return exactly 20 agents to indicate there may be more
      const manyAgents = Array(20).fill(mockAgent);
      mockedAxios.mockResolvedValueOnce({
        data: { agents: manyAgents }
      });

      const result = await elevenlabs_list_agents.handler({
        limit: 20,
        offset: 0,
        response_format: ResponseFormat.JSON
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.has_more).toBe(true);
      expect(parsed.next_offset).toBe(20);
    });
  });
});
