import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a detailed description of an image using Gemini.
 */
export async function generateImageDescription(file: File): Promise<string> {
  const base64 = await fileToBase64(file);
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: file.type, data: base64 } },
        { text: "Describe this image in detail. Provide a comprehensive caption." }
      ]
    }
  });
  return response.text || "No description generated.";
}

/**
 * Generates a summary of text content using Gemini.
 */
export async function generateTextSummary(text: string): Promise<string> {
  // Use 3-flash-preview for fast text tasks.
  // We limit context roughly to ensure we don't accidentally send massive books that might timeout the simple UI.
  const safeText = text.slice(0, 50000); 
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Summarize the following text efficiently. Provide key points and a brief overview:\n\n${safeText}`
  });
  return response.text || "No summary generated.";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove Data URI prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}