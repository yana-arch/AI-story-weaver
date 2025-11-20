import { GoogleGenAI } from '@google/genai';
import { AIProvider, AIPrompt, AIRequestOptions, AIResponse, AIError } from '../../types/ai-models';

export class GoogleGeminiClient {
  private client: GoogleGenAI | null = null;

  getProvider(): AIProvider {
    return AIProvider.GOOGLE;
  }

  getSupportedModels(): string[] {
    return ['gemini-pro', 'gemini-flash'];
  }

  async testConnection(apiKey?: string): Promise<boolean> {
    const effectiveApiKey = apiKey || process.env.API_KEY;
    if (!effectiveApiKey) {
      return false;
    }

    try {
      const testClient = new GoogleGenAI({ apiKey: effectiveApiKey });
      const response = await testClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Say "OK"',
      });
      const text = response.text;
      return !!(text && text.includes('OK'));
    } catch (error) {
      console.warn('Gemini connection test failed:', error);
      return false;
    }
  }

  async generateText(prompts: AIPrompt[], options: AIRequestOptions = {}): Promise<AIResponse> {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new AIError(
        AIProvider.GOOGLE,
        'NO_API_KEY',
        'Google Gemini API key is not configured (API_KEY environment variable)',
        'auth',
        false
      );
    }

    if (!this.client) {
      this.client = new GoogleGenAI({ apiKey });
    }

    try {
      // Convert prompts to Gemini format
      let systemInstruction = '';
      const contents: string[] = [];

      for (const prompt of prompts) {
        if (prompt.role === 'system') {
          systemInstruction = prompt.content;
        } else {
          contents.push(`${prompt.role === 'assistant' ? 'Assistant' : 'User'}: ${prompt.content}`);
        }
      }

      const fullPrompt = contents.join('\n\n');
      const effectiveModel = options.model || 'gemini-2.5-flash';

      let config: any = {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens,
        topP: options.topP,
      };

      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      const response = await this.client.models.generateContent({
        model: effectiveModel,
        contents: fullPrompt,
        config,
      });

      const text = response.text;
      if (!text) {
        throw new AIError(
          AIProvider.GOOGLE,
          'NO_RESPONSE',
          'No text content in Gemini response',
          'server',
          true
        );
      }

      return {
        provider: AIProvider.GOOGLE,
        model: effectiveModel,
        content: text,
        usage: {
          // Note: Google Gemini API usage information is not available in the basic response
          promptTokens: 0, // TODO: Implement proper token counting
          completionTokens: 0,
          totalTokens: 0,
        },
        finishReason: response.candidates?.[0]?.finishReason || 'stop',
      };
    } catch (error: any) {
      if (error instanceof AIError) {
        throw error;
      }

      const errorMessage = error?.message || 'Unknown Google Gemini API error';

      if (errorMessage.includes('API_KEY_INVALID')) {
        throw new AIError(
          AIProvider.GOOGLE,
          'INVALID_API_KEY',
          'Invalid Google Gemini API key',
          'auth',
          false
        );
      }

      if (errorMessage.includes('RATE_LIMIT')) {
        throw new AIError(
          AIProvider.GOOGLE,
          'RATE_LIMIT_EXCEEDED',
          'Google Gemini API rate limit exceeded',
          'rate_limit',
          true
        );
      }

      if (errorMessage.includes('QUOTA_EXCEEDED')) {
        throw new AIError(
          AIProvider.GOOGLE,
          'QUOTA_EXCEEDED',
          'Google Gemini API quota exceeded',
          'unknown',
          false
        );
      }

      throw new AIError(
        AIProvider.GOOGLE,
        'API_ERROR',
        `Google Gemini API error: ${errorMessage}`,
        'server',
        true
      );
    }
  }
}
