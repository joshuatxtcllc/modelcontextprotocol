var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { GoogleGenAI, Type } from '@google/genai';
import * as dotenv from 'dotenv';
// Load environment variables
dotenv.config();
function runFunctionCallingDemo() {
    return __awaiter(this, void 0, void 0, function* () {
        // Check if API key is available
        if (!process.env.GEMINI_API_KEY) {
            console.error("Error: GEMINI_API_KEY environment variable is required");
            process.exit(1);
        }
        // Configure the client
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        // Define the function declaration for the model
        const scheduleMeetingFunctionDeclaration = {
            name: 'schedule_meeting',
            description: 'Schedules a meeting with specified attendees at a given time and date.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    attendees: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'List of people attending the meeting.',
                    },
                    date: {
                        type: Type.STRING,
                        description: 'Date of the meeting (e.g., "2024-07-29")',
                    },
                    time: {
                        type: Type.STRING,
                        description: 'Time of the meeting (e.g., "15:00")',
                    },
                    topic: {
                        type: Type.STRING,
                        description: 'The subject or topic of the meeting.',
                    },
                },
                required: ['attendees', 'date', 'time', 'topic'],
            },
        };
        try {
            console.log("Sending request to Gemini API...");
            // Send request with function declarations
            const response = yield ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: 'Schedule a meeting with Bob and Alice for 03/27/2025 at 10:00 AM about the Q3 planning.',
                config: {
                    tools: [{
                            functionDeclarations: [scheduleMeetingFunctionDeclaration]
                        }],
                },
            });
            // Check for function calls in the response
            if (response.functionCalls && response.functionCalls.length > 0) {
                const functionCall = response.functionCalls[0]; // Assuming one function call
                console.log(`\nFunction to call: ${functionCall.name}`);
                console.log(`Arguments: ${JSON.stringify(functionCall.args, null, 2)}`);
                // In a real app, you would call your actual function here:
                // const result = await scheduleMeeting(functionCall.args);
            }
            else {
                console.log("\nNo function call found in the response.");
                console.log(response.text);
            }
        }
        catch (error) {
            console.error("Error during API call:", error);
        }
    });
}
// Run the demo
runFunctionCallingDemo().catch(console.error);
