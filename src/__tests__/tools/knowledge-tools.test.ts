/**
 * Tests for knowledge base management tools
 *
 * Tests adding documents and URLs to agent knowledge bases.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { elevenlabs_add_knowledge_base } from "../../tools/knowledge-tools.js";
import { ResponseFormat } from "../../types.js";

// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios);

describe("Knowledge Tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ELEVENLABS_API_KEY = "test_api_key_12345";
  });

  describe("elevenlabs_add_knowledge_base", () => {
    it("should have correct tool metadata", () => {
      expect(elevenlabs_add_knowledge_base.name).toBe("elevenlabs_add_knowledge_base");
      expect(elevenlabs_add_knowledge_base.description).toContain("knowledge base");
      expect(elevenlabs_add_knowledge_base.annotations?.readOnlyHint).toBe(false);
      expect(elevenlabs_add_knowledge_base.annotations?.destructiveHint).toBe(false);
    });

    it("should add text document to knowledge base", async () => {
      mockedAxios.mockResolvedValueOnce({ data: { success: true } });

      const result = await elevenlabs_add_knowledge_base.handler({
        agent_id: "ag_test123",
        documents: [
          {
            type: "text",
            content: "This is a FAQ document with answers to common questions."
          }
        ],
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("Successfully added 1 document");
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          url: expect.stringContaining("/convai/agents/ag_test123/knowledge-base"),
          data: expect.objectContaining({
            documents: expect.arrayContaining([
              expect.objectContaining({
                type: "text",
                content: expect.stringContaining("FAQ document")
              })
            ])
          })
        })
      );
    });

    it("should add URL document to knowledge base", async () => {
      mockedAxios.mockResolvedValueOnce({ data: { success: true } });

      const result = await elevenlabs_add_knowledge_base.handler({
        agent_id: "ag_test123",
        documents: [
          {
            type: "url",
            content: "https://example.com/documentation"
          }
        ],
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("Successfully added 1 document");
    });

    it("should add multiple documents at once", async () => {
      mockedAxios.mockResolvedValueOnce({ data: { success: true } });

      const result = await elevenlabs_add_knowledge_base.handler({
        agent_id: "ag_test123",
        documents: [
          {
            type: "text",
            content: "First document content here."
          },
          {
            type: "url",
            content: "https://example.com/doc1"
          },
          {
            type: "text",
            content: "Third document content.",
            metadata: { category: "faq", version: "1.0" }
          }
        ],
        response_format: ResponseFormat.MARKDOWN
      });

      expect(result.content[0].text).toContain("Successfully added 3 document");
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            documents: expect.arrayContaining([
              expect.objectContaining({ type: "text" }),
              expect.objectContaining({ type: "url" }),
              expect.objectContaining({
                type: "text",
                metadata: { category: "faq", version: "1.0" }
              })
            ])
          })
        })
      );
    });

    it("should return JSON format", async () => {
      mockedAxios.mockResolvedValueOnce({ data: { success: true } });

      const result = await elevenlabs_add_knowledge_base.handler({
        agent_id: "ag_test123",
        documents: [
          {
            type: "text",
            content: "Document content here."
          }
        ],
        response_format: ResponseFormat.JSON
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.documents_added).toBe(1);
    });

    it("should validate empty documents array", async () => {
      await expect(
        elevenlabs_add_knowledge_base.handler({
          agent_id: "ag_test123",
          documents: [],
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow();
    });

    it("should validate document type", async () => {
      await expect(
        elevenlabs_add_knowledge_base.handler({
          agent_id: "ag_test123",
          documents: [
            {
              type: "invalid_type" as "text",
              content: "Some content"
            }
          ],
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow();
    });

    it("should validate empty document content", async () => {
      await expect(
        elevenlabs_add_knowledge_base.handler({
          agent_id: "ag_test123",
          documents: [
            {
              type: "text",
              content: ""
            }
          ],
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow();
    });

    it("should handle API error for non-existent agent", async () => {
      const error = {
        response: { status: 404, data: { detail: "Agent not found" } },
        isAxiosError: true
      };
      mockedAxios.mockRejectedValueOnce(error);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      await expect(
        elevenlabs_add_knowledge_base.handler({
          agent_id: "ag_nonexistent",
          documents: [
            {
              type: "text",
              content: "Some document content here."
            }
          ],
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow("not found");
    });

    it("should include metadata when provided", async () => {
      mockedAxios.mockResolvedValueOnce({ data: { success: true } });

      await elevenlabs_add_knowledge_base.handler({
        agent_id: "ag_test123",
        documents: [
          {
            type: "text",
            content: "Document with metadata.",
            metadata: {
              source: "internal",
              department: "support",
              last_updated: "2025-01-15"
            }
          }
        ],
        response_format: ResponseFormat.MARKDOWN
      });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            documents: expect.arrayContaining([
              expect.objectContaining({
                metadata: {
                  source: "internal",
                  department: "support",
                  last_updated: "2025-01-15"
                }
              })
            ])
          })
        })
      );
    });

    it("should handle maximum documents limit", async () => {
      const tooManyDocs = Array(101).fill({
        type: "text",
        content: "Document content."
      });

      await expect(
        elevenlabs_add_knowledge_base.handler({
          agent_id: "ag_test123",
          documents: tooManyDocs,
          response_format: ResponseFormat.MARKDOWN
        })
      ).rejects.toThrow();
    });
  });
});
