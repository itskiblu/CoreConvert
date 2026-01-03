import { GoogleGenAI } from "@google/genai";

export async function analyzeFileContent(file: File): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  if (!process.env.API_KEY) {
    return "API Key not configured for AI features.";
  }

  try {
    const isImage = file.type.startsWith('image/');
    const isText = file.type.startsWith('text/') || file.name.endsWith('.json') || file.name.endsWith('.csv') || file.name.endsWith('.md');
    
    let contents: any;

    if (isImage) {
      const base64 = await fileToBase64(file);
      contents = {
        parts: [
          { text: "Analyze this image and provide a 2-sentence summary of what it contains, then suggest 2 professional uses for it." },
          { inlineData: { mimeType: file.type, data: base64.split(',')[1] } }
        ]
      };
    } else if (isText) {
      const text = await file.text();
      const truncatedText = text.slice(0, 5000); // Limit to first 5000 chars for speed
      contents = `Analyze the following file content (truncated if too long). Provide a summary in 2 sentences and suggest 3 possible file format improvements for data analysis:\n\n${truncatedText}`;
    } else {
      contents = `Analyze this file metadata: Name: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}. Provide a brief professional description of what this file likely is and one tip for managing it.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents
    });

    return response.text || "No AI insights available.";
  } catch (error) {
    console.error("Gemini Analysis failed:", error);
    return "Failed to get AI insights. " + (error as Error).message;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}