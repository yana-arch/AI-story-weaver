import {
  AIProvider,
  AIModelCapability,
  AIModelConfig,
  AIPrompt,
  AIRequestOptions,
  AIResponse,
  AIError,
  getModelConfig,
  getAvailableModelsByCapability,
  estimateTokenCount,
  calculateEstimatedCost,
} from '../types/ai-models';

// Import client adapters for each provider
import { GoogleGeminiClient } from './clients/GoogleGeminiClient';
import { OpenAIClient } from './clients/OpenAIClient';
import { AnthropicClaudeClient } from './clients/AnthropicClaudeClient';

interface AIClient {
  generateText(
    prompts: AIPrompt[],
    options?: AIRequestOptions
  ): Promise<AIResponse>;
  getProvider(): AIProvider;
  getSupportedModels(): string[];
  testConnection(apiKey?: string): Promise<boolean>;
}

class AIService {
  private clients: Map<AIProvider, AIClient> = new Map();
  private errorHandler: (error: Error | string, options?: any) => string;

  constructor(errorHandler: (error: Error | string, options?: any) => string) {
    this.errorHandler = errorHandler;

    // Initialize clients for each provider
    this.clients.set(AIProvider.GOOGLE, new GoogleGeminiClient());
    this.clients.set(AIProvider.OPENAI, new OpenAIClient());
    this.clients.set(AIProvider.ANTHROPIC, new AnthropicClaudeClient());
  }

  async generateText(
    modelId: string,
    prompts: AIPrompt[],
    options: AIRequestOptions = {},
    fallbackModels?: string[]
  ): Promise<AIResponse> {
    const primaryConfig = getModelConfig(modelId);
    if (!primaryConfig) {
      throw new AIError(AIProvider.GOOGLE, 'INVALID_MODEL', `Model ${modelId} not supported`, 'unknown', false);
    }

    const client = this.clients.get(primaryConfig.provider);
    if (!client) {
      throw new AIError(AIProvider.GOOGLE, 'NO_CLIENT', `No client available for provider ${primaryConfig.provider}`, 'unknown', false);
    }

    try {
      return await client.generateText(prompts, options);
    } catch (error) {
      // Handle primary model failure and attempt fallbacks
      if (fallbackModels && fallbackModels.length > 0) {
        return this.tryFallbackGeneration(fallbackModels, prompts, options);
      }
      throw error;
    }
  }

  private async tryFallbackGeneration(
    fallbackModels: string[],
    prompts: AIPrompt[],
    options: AIRequestOptions
  ): Promise<AIResponse> {
    for (const fallbackModel of fallbackModels) {
      try {
        const result = await this.generateText(fallbackModel, prompts, options);
        // Log successful fallback
        console.log(`Successfully used fallback model: ${fallbackModel}`);
        return result;
      } catch (error) {
        console.warn(`Fallback model ${fallbackModel} failed:`, error);
        continue;
      }
    }

    // All fallbacks failed
    const error = new AIError(
      AIProvider.GOOGLE,
      'ALL_MODELS_FAILED',
      'All models including fallbacks failed to generate response',
      'server',
      true
    );
    this.errorHandler(error, { context: 'AI Generation', recoverable: true });
    throw error;
  }

  async testModel(modelId: string, apiKey?: string): Promise<boolean> {
    const config = getModelConfig(modelId);
    if (!config) return false;

    const client = this.clients.get(config.provider);
    if (!client) return false;

    try {
      return await client.testConnection(apiKey);
    } catch (error) {
      return false;
    }
  }

  getAvailableModels(): AIModelConfig[] {
    const allModels: AIModelConfig[] = [];
    Object.values(AIProvider).forEach(provider => {
      if (this.clients.has(provider as AIProvider)) {
        const client = this.clients.get(provider as AIProvider)!;
        const models = client.getSupportedModels();
        models.forEach(modelId => {
          const config = getModelConfig(modelId);
          if (config) allModels.push(config);
        });
      }
    });
    return allModels;
  }

  getModelsByCapability(capability: AIModelCapability): AIModelConfig[] {
    return getAvailableModelsByCapability(capability);
  }

  estimateUsage(prompts: AIPrompt[], modelId: string): { tokens: number; cost: number } {
    const totalText = prompts.map(p => p.content).join(' ');
    const tokens = estimateTokenCount(totalText);

    // Estimate output tokens (roughly 1/4 of input for story continuation)
    const estimatedOutputTokens = Math.max(100, tokens / 4);

    const cost = calculateEstimatedCost(modelId, tokens, estimatedOutputTokens);

    return { tokens: tokens + estimatedOutputTokens, cost };
  }

  buildPromptsForStoryGeneration(
    storyContext: string,
    userPrompt: string,
    characterProfiles: Array<{ name: string; personality: string; background: string; }>,
    systemPrompt?: string
  ): AIPrompt[] {
    const prompts: AIPrompt[] = [];

    if (systemPrompt) {
      prompts.push({
        role: 'system',
        content: systemPrompt,
      });
    } else {
      prompts.push({
        role: 'system',
        content: 'You are a creative story writer. Generate engaging, coherent story continuations.',
      });
    }

    if (characterProfiles.length > 0) {
      const characterInfo = characterProfiles.map(char =>
        `Character: ${char.name}\nPersonality: ${char.personality}\nBackground: ${char.background}`
      ).join('\n\n');

      prompts.push({
        role: 'system',
        content: `Additional character information:\n\n${characterInfo}`,
      });
    }

    prompts.push({
      role: 'user',
      content: `${storyContext}\n\nContinue the story with: ${userPrompt}`,
    });

    return prompts;
  }

  buildPromptsForCharacterAnalysis(
    storyContent: string,
    systemPrompt?: string
  ): AIPrompt[] {
    const prompts: AIPrompt[] = [];

    if (systemPrompt) {
      prompts.push({
        role: 'system',
        content: systemPrompt,
      });
    } else {
      prompts.push({
        role: 'system',
        content: 'Analyze the characters in the given story and provide detailed character profiles.',
      });
    }

    prompts.push({
      role: 'user',
      content: `Analyze the following story and extract detailed character profiles. For each character, provide name, appearance, personality, background, goals, relationships, and flaws:\n\n${storyContent}`,
    });

    return prompts;
  }
}

// Singleton instance
let aiServiceInstance: AIService | null = null;

export function getAIService(errorHandler?: (error: Error | string, options?: any) => string): AIService {
  if (!aiServiceInstance) {
    if (!errorHandler) {
      throw new Error('AIService requires an error handler for first initialization');
    }
    aiServiceInstance = new AIService(errorHandler);
  }
  return aiServiceInstance;
}

export { AIService };
export type { AIClient };
