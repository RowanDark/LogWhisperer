import { GoogleGenAI, GenerateContentResponse, Schema, Type } from "@google/genai";
import { GeminiModel, AnalysisResult } from "../types";

// Initialize Gemini Client
// API Key must be set in the environment variable API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    threatScore: {
      type: Type.INTEGER,
      description: "A threat score between 0 and 100 based on severity.",
    },
    markdownReport: {
      type: Type.STRING,
      description: "The detailed executive summary and technical analysis in Markdown format.",
    },
    timeline: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timestamp: { type: Type.STRING, description: "Relative or absolute timestamp of the event." },
          description: { type: Type.STRING, description: "Brief description of the event." },
          severity: { 
            type: Type.STRING, 
            enum: ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"],
            description: "Severity level of the event."
          }
        },
        required: ["timestamp", "description", "severity"],
      },
      description: "Chronological list of key security events identified in the logs.",
    },
    mitreMapping: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          tactic: { type: Type.STRING, description: "The MITRE Tactic (e.g., Initial Access)." },
          id: { type: Type.STRING, description: "The MITRE Technique ID (e.g., T1190)." },
          name: { type: Type.STRING, description: "The MITRE Technique Name." },
        },
        required: ["tactic", "id", "name"],
      },
      description: "List of mapped MITRE ATT&CK techniques.",
    },
  },
  required: ["threatScore", "markdownReport", "timeline", "mitreMapping"],
};

export const analyzeLogData = async (
  logData: string,
  model: GeminiModel,
  systemInstruction: string
): Promise<AnalysisResult> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: `Analyze the following security data snippet:\n\n${logData}`,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Low temperature for more analytical/factual responses
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
    }
    
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze data. Please check your API key and network connection.");
  }
};