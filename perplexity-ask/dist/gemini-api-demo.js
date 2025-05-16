var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
import { GoogleGenAI, Type } from '@google/genai';
import * as dotenv from 'dotenv';
// Load environment variables
dotenv.config();
function runGeminiDemos() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        // Check if API key is available
        if (!process.env.GEMINI_API_KEY) {
            console.error("Error: GEMINI_API_KEY environment variable is required");
            process.exit(1);
        }
        const apiKey = process.env.GEMINI_API_KEY;
        // Initialize the Google Gemini client
        const ai = new GoogleGenAI({ apiKey });
        console.log("=".repeat(80));
        console.log("GEMINI API CAPABILITIES DEMO");
        console.log("=".repeat(80));
        try {
            // Demo 1: Basic text generation
            console.log("\n1. BASIC TEXT GENERATION");
            console.log("-".repeat(50));
            const basicResponse = yield ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: "How does AI work?",
            });
            console.log("Response:");
            console.log(basicResponse.text);
            // Demo 2: Using system instructions
            console.log("\n2. SYSTEM INSTRUCTIONS");
            console.log("-".repeat(50));
            const systemInstructionResponse = yield ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: "Hello there",
                config: {
                    systemInstruction: "You are a cat. Your name is Neko.",
                },
            });
            console.log("Response with cat persona:");
            console.log(systemInstructionResponse.text);
            // Demo 3: Controlling generation parameters
            console.log("\n3. CONTROLLING GENERATION PARAMETERS");
            console.log("-".repeat(50));
            const parameterControlResponse = yield ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: "Explain how AI works",
                config: {
                    maxOutputTokens: 500,
                    temperature: 0.1,
                },
            });
            console.log("Response with controlled parameters:");
            console.log(parameterControlResponse.text);
            // Demo 4: Streaming responses
            console.log("\n4. STREAMING RESPONSES");
            console.log("-".repeat(50));
            console.log("Streaming response (first 3 chunks only):");
            const streamResponse = yield ai.models.generateContentStream({
                model: "gemini-2.0-flash",
                contents: "Tell me a short story about a robot",
            });
            let chunkCount = 0;
            try {
                for (var _d = true, streamResponse_1 = __asyncValues(streamResponse), streamResponse_1_1; streamResponse_1_1 = yield streamResponse_1.next(), _a = streamResponse_1_1.done, !_a; _d = true) {
                    _c = streamResponse_1_1.value;
                    _d = false;
                    const chunk = _c;
                    console.log(`Chunk ${chunkCount + 1}: ${chunk.text}`);
                    chunkCount++;
                    if (chunkCount >= 3)
                        break; // Limit to 3 chunks for demo
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = streamResponse_1.return)) yield _b.call(streamResponse_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            // Demo 5: Chat conversations
            console.log("\n5. CHAT CONVERSATIONS");
            console.log("-".repeat(50));
            const chat = ai.chats.create({
                model: "gemini-2.0-flash",
                history: [
                    {
                        role: "user",
                        parts: [{ text: "Hello" }],
                    },
                    {
                        role: "model",
                        parts: [{ text: "Great to meet you. What would you like to know?" }],
                    },
                ],
            });
            console.log("Chat history loaded with greeting");
            const chatResponse1 = yield chat.sendMessage({
                message: "I have 2 dogs in my house.",
            });
            console.log("\nUser: I have 2 dogs in my house.");
            console.log("Model response:");
            console.log(chatResponse1.text);
            const chatResponse2 = yield chat.sendMessage({
                message: "How many paws are in my house?",
            });
            console.log("\nUser: How many paws are in my house?");
            console.log("Model response:");
            console.log(chatResponse2.text);
            // Demo 6: Function calling (from your existing implementation)
            console.log("\n6. FUNCTION CALLING");
            console.log("-".repeat(50));
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
            const functionResponse = yield ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: 'Schedule a meeting with Bob and Alice for 03/27/2025 at 10:00 AM about the Q3 planning.',
                config: {
                    tools: [{
                            functionDeclarations: [scheduleMeetingFunctionDeclaration]
                        }],
                },
            });
            console.log("Function calling response:");
            if (functionResponse.functionCalls && functionResponse.functionCalls.length > 0) {
                const functionCall = functionResponse.functionCalls[0];
                console.log(`Function to call: ${functionCall.name}`);
                console.log(`Arguments: ${JSON.stringify(functionCall.args, null, 2)}`);
            }
            else {
                console.log("No function call found in the response.");
                console.log(functionResponse.text);
            }
            // Demo 7: Code execution (already implemented in your project)
            console.log("\n7. CODE EXECUTION");
            console.log("-".repeat(50));
            console.log("See your gemini-code-execution.ts implementation for details");
            // Summarize available features
            console.log("\n=".repeat(80));
            console.log("GEMINI API FEATURES SUMMARY");
            console.log("=".repeat(80));
            console.log("✅ Basic text generation");
            console.log("✅ System instructions");
            console.log("✅ Parameter control (temperature, max tokens)");
            console.log("✅ Streaming responses");
            console.log("✅ Chat conversations");
            console.log("✅ Function calling");
            console.log("✅ Code execution (gemini-code-execution.ts)");
            console.log("❌ Image processing (not implemented in this demo)");
            console.log("❌ Google Search Retrieval (requires setup with additional APIs)");
        }
        catch (error) {
            console.error("Error during demo execution:", error);
        }
    });
}
// Run the demos
runGeminiDemos().catch(console.error);
