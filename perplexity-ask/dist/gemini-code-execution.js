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
// Define the Gemini Code Execution tool
export const GEMINI_CODE_EXECUTION_TOOL = {
    name: "gemini_code_execution",
    description: "Uses Google Gemini to generate and execute code based on a prompt. " +
        "Returns both the generated code and its execution output.",
    inputSchema: {
        type: "object",
        properties: {
            prompt: {
                type: "string",
                description: "The natural language prompt describing what code to generate and execute",
            }
        },
        required: ["prompt"],
    },
};
// Gemini code execution implementation
export function handleGeminiCodeExecution(args) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY environment variable is required");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        try {
            // Send request with code execution enabled
            const response = yield ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [args.prompt],
                config: {
                    tools: [{ codeExecution: {} }],
                },
            });
            // Process and format the output
            let result = "# Gemini Code Execution Result\n\n";
            const parts = ((_c = (_b = (_a = response === null || response === void 0 ? void 0 : response.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) || [];
            // Collect different parts of the response
            for (const part of parts) {
                if (part.text) {
                    result += "## Explanation\n\n```\n" + part.text + "\n```\n\n";
                }
                if (part.executableCode && part.executableCode.code) {
                    result += "## Generated Code\n\n```\n" + part.executableCode.code + "\n```\n\n";
                }
                if (part.codeExecutionResult && part.codeExecutionResult.output) {
                    result += "## Execution Output\n\n```\n" + part.codeExecutionResult.output + "\n```\n\n";
                }
            }
            return result;
        }
        catch (error) {
            throw new Error(`Gemini API error: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}
