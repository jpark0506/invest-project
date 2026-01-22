/**
 * AI Client factory
 */

import { getSecret } from '../secrets';
import { GeminiProvider } from './providers/gemini';
import type { AIProvider } from './types';

export * from './types';

let cachedProvider: AIProvider | null = null;

export async function getAIClient(): Promise<AIProvider> {
  if (cachedProvider) {
    return cachedProvider;
  }

  const provider = process.env.AI_PROVIDER || 'gemini';

  switch (provider) {
    case 'gemini': {
      // 로컬 개발: GEMINI_API_KEY 환경변수 직접 사용
      // 프로덕션: AWS Secrets Manager에서 가져오기
      let apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        const apiKeyArn = process.env.GEMINI_API_KEY_ARN;
        if (!apiKeyArn) {
          throw new Error('GEMINI_API_KEY or GEMINI_API_KEY_ARN environment variable is required');
        }
        apiKey = await getSecret(apiKeyArn);
      }

      const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash-001';
      cachedProvider = new GeminiProvider(apiKey, modelName);
      break;
    }
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }

  return cachedProvider;
}

export function clearAIClientCache(): void {
  cachedProvider = null;
}
