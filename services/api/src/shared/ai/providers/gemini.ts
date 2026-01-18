/**
 * Gemini AI Provider implementation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIProvider, AIOptions } from '../types';

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  private client: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string, modelName = 'gemini-1.5-flash') {
    this.client = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }

  async generateText(prompt: string, options?: AIOptions): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 2048,
      },
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  }

  async generateJSON<T>(prompt: string, options?: AIOptions): Promise<T> {
    const jsonPrompt = `${prompt}

IMPORTANT: Your response must be valid JSON only. Do not include any markdown code blocks, explanations, or text before or after the JSON. Start directly with { or [.`;

    const model = this.client.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxTokens ?? 4096,
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(jsonPrompt);
    const response = result.response;
    const text = response.text();

    try {
      return JSON.parse(text) as T;
    } catch {
      // Try to extract JSON from the response if it contains extra text
      const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as T;
      }
      throw new Error(`Failed to parse JSON response: ${text.substring(0, 200)}`);
    }
  }
}
