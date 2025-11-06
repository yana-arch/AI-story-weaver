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
import type { GenerationConfig } from '../types';

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

  buildPromptsForAutoFillSettings(
    userInstructions: string,
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
        content: 'You are an expert story writing assistant. Based on user instructions, suggest optimal settings for AI story generation including scenario, character dynamics, pacing, narrative structure, and other parameters.',
      });
    }

    prompts.push({
      role: 'user',
      content: `Based on these user instructions: "${userInstructions}"

Please suggest the optimal settings for AI story generation. You must return ONLY a valid JSON object with exactly these fields:

{
  "scenario": "Choose from: Lần đầu, Từ ghét thành yêu, Bạn bè thân thiết, Gương vỡ lại lành, Bạo dạn & Khám phá, or suggest a custom one",
  "dynamics": "Choose from: Nhân vật A chủ động B bị động/ngượng ngùng, Cả hai cùng chủ động và mãnh liệt, Tập trung vào nội tâm và cảm xúc của nhân vật A, Tập trung vào nội tâm và cảm xúc của nhân vật B, or suggest custom",
  "pacing": "Choose from: Chậm: Tập trung xây dựng không khí miêu tả chi tiết., Trung bình: Cân bằng giữa hành động và cảm xúc., Nhanh: Đi thẳng vào hành động chính tạo cảm giác dồn dập., or suggest custom",
  "narrativeStructure": "Choose from: Tự do (Không có cấu trúc), Cấu trúc 3 hồi, Hành trình của người hùng, or suggest custom",
  "focusKeywords": "Comma-separated list of 2-4 keywords to emphasize",
  "avoidKeywords": "Comma-separated list of keywords to avoid, or empty string",
  "adultContentOptions": ["Array of relevant options from: Xây dựng lãng mạn & Cảm xúc, Miêu tả Gợi cảm & Tinh tế, Hành động Tường tận & Trực tiếp, Đối thoại Táo bạo & Thân mật, Yếu tố Thống trị & Phục tùng, or empty array"]
}

IMPORTANT: Return ONLY the JSON object. No markdown, no explanations, no additional text. Start with { and end with }.`,
    });

    return prompts;
  }

  async generateAutoFillSettings(
    userInstructions: string,
    modelId: string,
    fallbackModels?: string[]
  ): Promise<Partial<GenerationConfig>> {
    if (!userInstructions.trim()) {
      throw new Error('User instructions are required for auto-fill settings');
    }

    const prompts = this.buildPromptsForAutoFillSettings(userInstructions);
    let response: AIResponse | undefined;

    try {
      response = await this.generateText(modelId, prompts, {}, fallbackModels);

      // Clean and parse the JSON response
      let content = response.content.trim();

      // Remove any markdown formatting
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[0];
      }

      console.log('AI Response content:', content); // Debug log

      const parsedSettings = JSON.parse(content);

      // Validate and clean the response
      const validatedSettings: Partial<GenerationConfig> = {};

      if (parsedSettings.scenario && typeof parsedSettings.scenario === 'string') {
        validatedSettings.scenario = parsedSettings.scenario;
      }

      if (parsedSettings.dynamics && typeof parsedSettings.dynamics === 'string') {
        validatedSettings.dynamics = parsedSettings.dynamics;
      }

      if (parsedSettings.pacing && typeof parsedSettings.pacing === 'string') {
        validatedSettings.pacing = parsedSettings.pacing;
      }

      if (parsedSettings.narrativeStructure && typeof parsedSettings.narrativeStructure === 'string') {
        validatedSettings.narrativeStructure = parsedSettings.narrativeStructure;
      }

      if (parsedSettings.focusKeywords) {
        if (Array.isArray(parsedSettings.focusKeywords)) {
          validatedSettings.focusKeywords = parsedSettings.focusKeywords.join(', ');
        } else if (typeof parsedSettings.focusKeywords === 'string') {
          validatedSettings.focusKeywords = parsedSettings.focusKeywords;
        }
      }

      if (parsedSettings.avoidKeywords) {
        if (Array.isArray(parsedSettings.avoidKeywords)) {
          validatedSettings.avoidKeywords = parsedSettings.avoidKeywords.join(', ');
        } else if (typeof parsedSettings.avoidKeywords === 'string') {
          validatedSettings.avoidKeywords = parsedSettings.avoidKeywords;
        }
      }

      if (Array.isArray(parsedSettings.adultContentOptions)) {
        validatedSettings.adultContentOptions = parsedSettings.adultContentOptions.filter(
          (option: any) => typeof option === 'string' && option.trim().length > 0
        );
      }

      return validatedSettings;
    } catch (error) {
      console.error('Failed to generate auto-fill settings:', error);
      console.error('Raw AI response:', response?.content);
      throw new Error('Unable to generate settings from instructions. Please try again or fill them manually.');
    }
  }

  buildPromptsForAutoGeneratePrompts(
    userInstructions: string,
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
        content: 'You are an expert creative writing assistant. Based on user instructions, generate custom prompts that will help AI write better stories. Each prompt should be specific, actionable, and focused on improving story quality.',
      });
    }

    prompts.push({
      role: 'user',
      content: `Based on these user instructions: "${userInstructions}"

Please generate 2-3 custom prompts that would help AI write better stories matching these requirements. Each prompt should be:

1. Specific and actionable
2. Focused on improving story quality
3. Relevant to the user's requirements
4. Written in Vietnamese

Return ONLY a valid JSON array of prompt objects with this exact format:

[
  {
    "title": "Short descriptive title in Vietnamese",
    "content": "The full prompt content in Vietnamese"
  },
  {
    "title": "Another title",
    "content": "Another prompt content"
  }
]

IMPORTANT: Return ONLY the JSON array. No markdown, no explanations, no additional text. Start with [ and end with ].`,
    });

    return prompts;
  }

  async generateAutoPrompts(
    userInstructions: string,
    modelId: string,
    fallbackModels?: string[]
  ): Promise<{ title: string; content: string }[]> {
    if (!userInstructions.trim()) {
      throw new Error('User instructions are required for auto-generating prompts');
    }

    const prompts = this.buildPromptsForAutoGeneratePrompts(userInstructions);
    let response: AIResponse | undefined;

    try {
      response = await this.generateText(modelId, prompts, {}, fallbackModels);

      // Clean and parse the JSON response
      let content = response.content.trim();

      // Remove any markdown formatting
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Try to find JSON array in the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        content = jsonMatch[0];
      }

      console.log('AI Prompts Response content:', content); // Debug log

      const parsedPrompts = JSON.parse(content);

      // Validate and clean the response
      if (!Array.isArray(parsedPrompts)) {
        throw new Error('Response is not an array');
      }

      const validatedPrompts = parsedPrompts
        .filter((prompt: any) =>
          prompt &&
          typeof prompt === 'object' &&
          typeof prompt.title === 'string' &&
          typeof prompt.content === 'string' &&
          prompt.title.trim().length > 0 &&
          prompt.content.trim().length > 0
        )
        .map((prompt: any) => ({
          title: prompt.title.trim(),
          content: prompt.content.trim(),
        }))
        .slice(0, 3); // Limit to 3 prompts max

      return validatedPrompts;
    } catch (error) {
      console.error('Failed to generate auto prompts:', error);
      console.error('Raw AI response:', response?.content);
      throw new Error('Unable to generate prompts from instructions. Please try again or create them manually.');
    }
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
