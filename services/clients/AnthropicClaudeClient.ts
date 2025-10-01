import { AIProvider, AIPrompt, AIRequestOptions, AIResponse, AIError } from '../../types/ai-models';

export class AnthropicClaudeClient {
  getProvider(): AIProvider {
    return AIProvider.ANTHROPIC;
  }

  getSupportedModels(): string[] {
    return ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'];
  }

  async testConnection(apiKey?: string): Promise<boolean> {
    // TODO: Implement Anthropic API testing
    return !!apiKey;
  }

  async generateText(
    prompts: AIPrompt[],
    options: AIRequestOptions = {}
  ): Promise<AIResponse> {
    // TODO: Implement Anthropic Claude API integration
    throw new AIError(
      AIProvider.ANTHROPIC,
      'NOT_IMPLEMENTED',
      'Anthropic Claude integration is not yet implemented',
      'unknown',
      false
    );
  }
}
