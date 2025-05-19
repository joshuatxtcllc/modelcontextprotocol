
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import OpenAI from "openai";

// Define the OpenAI tool
export const OPENAI_CHAT_TOOL: Tool = {
  name: "openai_chat",
  description:
    "Uses OpenAI's API to generate responses with various models. " +
    "Supports GPT-4 and other OpenAI models with system instructions support.",
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
              description: "Role of the message (e.g., system, user, assistant)",
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
        description: "The OpenAI model to use (e.g., gpt-4, gpt-3.5-turbo)",
        default: "gpt-4"
      }
    },
    required: ["messages"],
  },
};

// OpenAI chat handling implementation
export async function handleOpenAIChat(args: any): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  try {
    const response = await openai.chat.completions.create({
      model: args.model || "gpt-4",
      messages: args.messages,
    });
    
    // Return the assistant's response
    return response.choices[0].message.content || "No response generated";
  } catch (error) {
    throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
