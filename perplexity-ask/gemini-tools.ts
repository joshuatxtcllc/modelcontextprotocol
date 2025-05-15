
import { GoogleGenAI, Type } from '@google/genai';
import { Tool } from "@modelcontextprotocol/sdk/types.js";

// Define the Gemini tool
export const GEMINI_FUNCTION_TOOL: Tool = {
  name: "gemini_function",
  description:
    "Uses Google Gemini to extract structured data from text using function calling. " +
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
export async function handleGeminiFunction(args: any): Promise<string> {
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
    const response = await ai.models.generateContent({
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
    } else {
      result = "No structured data extracted. Text response: " + response.text;
    }
    
    return result;
  } catch (error) {
    throw new Error(`Gemini API error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
