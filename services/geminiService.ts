
import { GoogleGenAI, Type } from "@google/genai";
import { ExperimentResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });

export async function generateInsight(result: ExperimentResult): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Context: The user is participating in a visual perception experiment about "Negative Afterimages" (retinal fatigue).
        
        Trial Data:
        - Stimulus Color: ${result.colorName}
        - Stare Duration: ${result.stareDuration} seconds
        - Afterimage Persistence: ${result.persistenceDuration} seconds
        
        Provide a concise, scientific but engaging 2-sentence explanation of why they saw the specific complementary color and what their persistence time says about their visual processing in this instance. Use a tone of a curious neuroscientist.
      `,
      config: {
        temperature: 0.7,
        topP: 0.95,
      },
    });

    return response.text || "Fascinating result! This afterimage occurs because your retinal cones become temporarily desensitized to the stimulus color, leaving the complementary pathways dominant when you look at white.";
  } catch (error) {
    console.error("Gemini insight generation failed:", error);
    return "Your brain is processing the contrast by compensating for the specific wavelengths you were focused on.";
  }
}
