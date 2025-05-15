var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { GoogleGenAI } from '@google/genai';
// Define the Gemini tool
export const GEMINI_FUNCTION_TOOL = {
    name: "gemini_function",
    description: "Uses Google Gemini to extract structured data from text using function calling. " +
        "Especially useful for parsing dates, scheduling information, and other structured data from natural language.",
    inputSchema: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "The natural language query to extract structured data from",
            },
            functionName: {
                type: "string",
                description: "Name of the function to call",
            },
            functionDescription: {
                type: "string",
                description: "Description of what the function does",
            },
            parameters: {
                type: "object",
                description: "Parameters schema for the function",
            }
        },
        required: ["query", "functionName", "functionDescription", "parameters"],
    },
};
// Gemini function handling implementation
export function handleGeminiFunction(args) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY environment variable is required");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        // Create function declaration from the args
        const functionDeclaration = {
            name: args.functionName,
            description: args.functionDescription,
            parameters: args.parameters
        };
        try {
            // Send request with function declarations
            const response = yield ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: args.query,
                config: {
                    tools: [{
                            functionDeclarations: [functionDeclaration]
                        }],
                },
            });
            // Format the output
            let result = "";
            if (response.functionCalls && response.functionCalls.length > 0) {
                const functionCall = response.functionCalls[0];
                result = `Function: ${functionCall.name}\nArguments: ${JSON.stringify(functionCall.args, null, 2)}`;
            }
            else {
                result = "No structured data extracted. Text response: " + response.text;
            }
            return result;
        }
        catch (error) {
            throw new Error(`Gemini API error: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}
