import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getFarmingAdvice(message: string, history: ChatMessage[]) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: "You are AgriTech AI, a helpful farming assistant. Provide clean, simple, and very concise answers. Use bullet points for steps. Avoid long paragraphs. Use easy-to-understand language for rural farmers. Focus on practical, actionable advice.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API error:", error);
    return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
  }
}

export async function getCropRecommendations(location: string, weather: string, soil: string) {
  try {
    const prompt = `Based on the following conditions, recommend 3 best crops for a farm:
    Location: ${location}
    Weather: ${weather}
    Soil Type: ${soil}
    
    Return the response as a JSON array of objects with 'name', 'description', and 'yieldPotential' (High, Medium, or Low). Keep descriptions very short (max 10 words).`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Crop recommendation error:", error);
    return [
      { name: "Pearl Millet", description: "Best for dry regions and sandy soil.", yieldPotential: "High" },
      { name: "Mung Bean", description: "Short duration crop, needs less water.", yieldPotential: "High" },
      { name: "Groundnut", description: "Good for sandy loam soil.", yieldPotential: "High" }
    ];
  }
}
