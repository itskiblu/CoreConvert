
import { GoogleGenAI } from "@google/genai";
import { ConversionType } from '../types';

/**
 * Handles AI-powered semantic conversions using Google Gemini.
 */
export async function convertWithAI(file: File, type: ConversionType): Promise<{ url: string; name: string; blob: Blob }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const baseName = file.name.split('.').slice(0, -1).join('.');

  let prompt = "";
  let systemInstruction = "You are a professional file conversion and content analysis expert. Provide concise, high-quality output.";
  let modelName = 'gemini-3-flash-preview';

  switch (type) {
    case 'AI_SUMMARIZE':
      const text = await file.text();
      prompt = `Summarize the following content in a clear, professional way. Use markdown formatting for readability:\n\n${text}`;
      break;
    case 'AI_TRANSLATE_EN':
      const content = await file.text();
      prompt = `Translate the following content to English, preserving any structure (like JSON/CSV) if applicable:\n\n${content}`;
      break;
    case 'AI_DATA_TO_CODE':
      const json = await file.text();
      prompt = `Convert this JSON data into a clean TypeScript interface and associated type definitions:\n\n${json}`;
      break;
    case 'AI_DESCRIBE_IMAGE':
      return await describeImage(file, ai);
    case 'AI_TRANSCRIPT':
      return await transcribeAudio(file, ai);
    default:
      throw new Error(`AI Conversion type ${type} not supported.`);
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { systemInstruction }
  });

  const outputText = response.text || "No response generated.";
  const extension = type === 'AI_DATA_TO_CODE' ? 'ts' : 'md';
  const blob = new Blob([outputText], { type: 'text/markdown' });
  
  return {
    url: URL.createObjectURL(blob),
    name: `${baseName}_ai.${extension}`,
    blob
  };
}

async function describeImage(file: File, ai: GoogleGenAI): Promise<{ url: string; name: string; blob: Blob }> {
  const base64 = await fileToBase64(file);
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { text: "Describe this image in detail for accessibility and archival purposes." },
        { inlineData: { data: base64.split(',')[1], mimeType: file.type } }
      ]
    }
  });

  const blob = new Blob([response.text || ""], { type: 'text/markdown' });
  return {
    url: URL.createObjectURL(blob),
    name: `${file.name.split('.')[0]}_description.md`,
    blob
  };
}

async function transcribeAudio(file: File, ai: GoogleGenAI): Promise<{ url: string; name: string; blob: Blob }> {
  const base64 = await fileToBase64(file);
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    contents: {
      parts: [
        { text: "Transcribe this audio file accurately. Include timestamps if possible." },
        { inlineData: { data: base64.split(',')[1], mimeType: 'audio/mp3' } } // Assuming standard audio
      ]
    }
  });

  const blob = new Blob([response.text || ""], { type: 'text/markdown' });
  return {
    url: URL.createObjectURL(blob),
    name: `${file.name.split('.')[0]}_transcript.md`,
    blob
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
