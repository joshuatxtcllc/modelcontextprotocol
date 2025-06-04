import { Tool } from "@modelcontextprotocol/sdk/types.js";
import Anthropic from "@anthropic-ai/sdk";

// Define the Claude tool
export const CLAUDE_CHAT_TOOL: Tool = {
  name: "claude_chat",
  description:
    "Uses Anthropic's Claude API to generate responses. " +
    "Claude excels at thoughtful, nuanced conversations with excellent reasoning.",
  inputSchema: {
    type: "object",
    properties: {
      messages: {
        type: "array",
        items: {
          type: "object",
          properties: {
            role: {
              type: "string",
              description: "Role of the message (e.g., user, assistant)",
            },
            content: {
              type: "string",
              description: "The content of the message",
            },
          },
          required: ["role", "content"],
        },
        description: "Array of conversation messages",
      },
      model: {
        type: "string",
        description: "The Claude model to use (e.g., claude-3-opus-20240229, claude-3-sonnet-20240229)",
        default: "claude-3-opus-20240229"
      },
      max_tokens: {
        type: "number",
        description: "Maximum number of tokens to generate",
        default: 4000
      }
    },
    required: ["messages"],
  },
};

// Claude chat handling implementation
export async function handleClaudeChat(args: any): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    // Convert messages format if needed (map system messages)
    const messages = args.messages.map((msg: any) => {
      if (msg.role === "system") {
        return { role: "user", content: msg.content };
      }
      return msg;
    });

    const response = await anthropic.messages.create({
      model: args.model || "claude-3-opus-20240229",
      max_tokens: args.max_tokens || 4000,
      messages: args.messages,
      system: args.system,
    });

    // Return Claude's response
    return response.content[0].text;
  } catch (error) {
    throw new Error(`Claude API error: ${error instanceof Error ? error.message : String(error)}`);
  }
}