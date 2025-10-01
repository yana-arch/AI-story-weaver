import { AIProvider, AIPrompt, AIRequestOptions, AIResponse, AIError } from '../../types/ai-models';

export class OpenAIClient {
  getProvider(): AIProvider {
    return AIProvider.OPENAI;
  }

  getSupportedModels(): string[] {
    return ['gpt-4', 'gpt-3.5-turbo'];
  }

  async testConnection(apiKey?: string): Promise<boolean> {
    // TODO: Implement OpenAI API testing
    return !!apiKey;
  }

  async generateText(
    prompts: AIPrompt[],
    options: AIRequestOptions = {}
  ): Promise<AIResponse> {
    // TODO: Implement OpenAI API integration
    throw new AIError(
      AIProvider.OPENAI,
      'NOT_IMPLEMENTED',
      'OpenAI integration is not yet implemented',
      'unknown',
      false
    );
  }
}
