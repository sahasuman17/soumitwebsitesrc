import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

export function getAi() {
  // Check if we already initialized
  if (genAI) return genAI;

  // Try to get the key from Vercel/Vite
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    // We log an error instead of THROWING one. 
    // This prevents the Black Screen crash.
    console.error("Gemini API Key is missing. Check Vercel Env Vars.");
    return null; 
  }

  try {
    genAI = new GoogleGenAI({ apiKey });
    return genAI;
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI:", err);
    return null;
  }
}

export const MODELS = {
    FLASH: "gemini-2.5-flash",
    PRO: "gemini-2.5-pro",
    LITE: "gemini-2.0-flash-lite"
};
