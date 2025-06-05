var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Anthropic from "@anthropic-ai/sdk";
// Define the Claude tool
export const CLAUDE_CHAT_TOOL = {
    name: "claude_chat",
    description: "Uses Anthropic's Claude API to generate responses. " +
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
            },
            system: {
                type: "string",
                description: "Optional system prompt to set context for Claude"
            }
        },
        required: ["messages"],
    },
};
// Claude chat handling implementation
export function handleClaudeChat(args) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error("ANTHROPIC_API_KEY environment variable is required");
        }
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
        try {
            // Convert messages format if needed (map system messages)
            const messages = args.messages.map((msg) => {
                if (msg.role === "system") {
                    return { role: "user", content: msg.content };
                }
                return msg;
            });
            const response = yield anthropic.messages.create({
                model: args.model || "claude-3-opus-20240229",
                max_tokens: args.max_tokens || 4000,
                messages: messages,
                system: args.system,
            });
            // Return Claude's response - handle different content types
            const content = response.content[0];
            if (content.type === 'text') {
                return content.text;
            }
            else {
                return JSON.stringify(content);
            }
        }
        catch (error) {
            throw new Error(`Claude API error: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}
