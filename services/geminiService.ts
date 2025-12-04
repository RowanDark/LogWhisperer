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

// Robustly attempts to repair truncated JSON strings
const repairTruncatedJSON = (jsonString: string): string => {
  let repaired = jsonString.trim();

  // 0. Initial Cleanup: Remove Markdown code block syntax if present
  if (repaired.startsWith("```")) {
    repaired = repaired.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "");
  }
  repaired = repaired.trim();
  
  if (!repaired) return "{}";

  // 1. Scan structure to track state
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];
    
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
    } else {
      if (char === '"') {
        inString = true;
      } else if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}' || char === ']') {
        const last = stack[stack.length - 1];
        if ((char === '}' && last === '{') || (char === ']' && last === '[')) {
          stack.pop();
        }
      }
    }
  }

  // 2. Close open string if cut off
  if (inString) {
    repaired += '"';
  }

  // 3. Handle trailing syntax errors caused by truncation
  // Remove trailing comma (invalid in JSON)
  repaired = repaired.replace(/,\s*$/, "");
  
  // Handle trailing colon (key without value): append null
  if (/\:\s*$/.test(repaired)) {
    repaired += " null";
  }

  // 4. Close remaining open structures (arrays/objects)
  while (stack.length > 0) {
    const last = stack.pop();
    if (last === '{') repaired += '}';
    if (last === '[') repaired += ']';
  }

  return repaired;
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
        temperature: 0.2, 
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        maxOutputTokens: 8192,
      },
    });

    let text = response.text || "";
    
    // First pass clean up
    if (text.startsWith("```")) {
      text = text.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "");
    }

    try {
      return JSON.parse(text) as AnalysisResult;
    } catch (parseError) {
      console.warn("JSON Parse failed, attempting repair. Raw text length:", text.length);
      
      try {
        const repairedText = repairTruncatedJSON(text);
        return JSON.parse(repairedText) as AnalysisResult;
      } catch (repairError) {
        console.error("Failed to repair JSON:", repairError);
        // Return a partial error result instead of crashing
        return {
          threatScore: 0,
          markdownReport: "### Analysis Error\n\nThe AI response was truncated and could not be fully recovered. Partial data may be missing. Please try reducing the input file size.",
          timeline: [],
          mitreMapping: []
        };
      }
    }
    
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze data. Please check your API key and network connection.");
  }
};