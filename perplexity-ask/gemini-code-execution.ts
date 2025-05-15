
import { GoogleGenAI } from '@google/genai';
import { Tool } from "@modelcontextprotocol/sdk/types.js";

// Define the Gemini Code Execution tool
export const GEMINI_CODE_EXECUTION_TOOL: Tool = {
  name: "gemini_code_execution",
  description:
    "Uses Google Gemini to generate and execute code based on a prompt. " +
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
export async function handleGeminiCodeExecution(args: any): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  try {
    // Send request with code execution enabled
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [args.prompt],
      config: {
        tools: [{ codeExecution: {} }],
      },
    });
    
    // Process and format the output
    let result = "# Gemini Code Execution Result\n\n";
    
    const parts = response?.candidates?.[0]?.content?.parts || [];
    
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
  } catch (error) {
    throw new Error(`Gemini API error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
