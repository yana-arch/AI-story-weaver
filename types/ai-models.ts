export enum AIProvider {
  GOOGLE = 'google',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GEMINI_FLASH = 'gemini-flash',
  GEMINI_PRO = 'gemini-pro',
  GPT_4 = 'gpt-4',
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  CLAUDE_3_OPUS = 'claude-3-opus',
  CLAUDE_3_SONNET = 'claude-3-sonnet',
  CLAUDE_3_HAIKU = 'claude-3-haiku',
}

export enum AIModelCapability {
  TEXT_GENERATION = 'text_generation',
  STORY_CONTINUATION = 'story_continuation',
  CHARACTER_ANALYSIS = 'character_analysis',
  CODE_EXECUTION = 'code_execution',
  IMAGE_GENERATION = 'image_generation',
}

export interface AIModelConfig {
  provider: AIProvider;
  modelId: string;
  name: string;
  capabilities: AIModelCapability[];
  contextWindow: number; // Token limit
  costPerToken?: number; // USD per 1K tokens
  maxRequestsPerMinute?: number;
  maxRequestsPerHour?: number;
  requiresApiKey: boolean;
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
}

export interface AIPrompt {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string; // For function calling
}

export interface AIRequestOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  functions?: AIFunctionSchema[];
  stream?: boolean;
}

export interface AIFunctionSchema {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface AIResponse {
  provider: AIProvider;
  model: string;
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  metadata?: Record<string, any>;
}

export class AIError extends Error {
  public provider: AIProvider;
  public code: string;
  public type: 'network' | 'auth' | 'rate_limit' | 'content_filter' | 'server' | 'unknown';
  public retryable: boolean;
  public retryAfter?: number;

  constructor(
    provider: AIProvider,
    code: string,
    message: string,
    type: 'network' | 'auth' | 'rate_limit' | 'content_filter' | 'server' | 'unknown',
    retryable: boolean,
    retryAfter?: number
  ) {
    super(message);
    this.name = 'AIError';
    this.provider = provider;
    this.code = code;
    this.type = type;
    this.retryable = retryable;
    this.retryAfter = retryAfter;
  }
}

export const AI_MODEL_CONFIGS: Record<AIProvider, AIModelConfig[]> = {
  [AIProvider.GOOGLE]: [
    {
      provider: AIProvider.GOOGLE,
      modelId: 'gemini-pro',
      name: 'Gemini Pro',
      capabilities: [AIModelCapability.TEXT_GENERATION, AIModelCapability.STORY_CONTINUATION, AIModelCapability.CHARACTER_ANALYSIS],
      contextWindow: 32768,
      costPerToken: 0.00025,
      maxRequestsPerMinute: 60,
      requiresApiKey: true,
      supportsStreaming: true,
      supportsFunctionCalling: false,
    },
    {
      provider: AIProvider.GOOGLE,
      modelId: 'gemini-flash',
      name: 'Gemini Flash',
      capabilities: [AIModelCapability.TEXT_GENERATION, AIModelCapability.STORY_CONTINUATION, AIModelCapability.CHARACTER_ANALYSIS],
      contextWindow: 32768,
      costPerToken: 0.000075,
      maxRequestsPerMinute: 60,
      requiresApiKey: true,
      supportsStreaming: true,
      supportsFunctionCalling: false,
    },
  ],
  [AIProvider.OPENAI]: [
    {
      provider: AIProvider.OPENAI,
      modelId: 'gpt-4',
      name: 'GPT-4',
      capabilities: [AIModelCapability.TEXT_GENERATION, AIModelCapability.STORY_CONTINUATION, AIModelCapability.CHARACTER_ANALYSIS],
      contextWindow: 8192,
      costPerToken: 0.03,
      maxRequestsPerMinute: 5000,
      requiresApiKey: true,
      supportsStreaming: true,
      supportsFunctionCalling: true,
    },
    {
      provider: AIProvider.OPENAI,
      modelId: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      capabilities: [AIModelCapability.TEXT_GENERATION, AIModelCapability.STORY_CONTINUATION, AIModelCapability.CHARACTER_ANALYSIS],
      contextWindow: 4096,
      costPerToken: 0.002,
      maxRequestsPerMinute: 200,
      requiresApiKey: true,
      supportsStreaming: true,
      supportsFunctionCalling: true,
    },
  ],
  [AIProvider.ANTHROPIC]: [
    {
      provider: AIProvider.ANTHROPIC,
      modelId: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      capabilities: [AIModelCapability.TEXT_GENERATION, AIModelCapability.STORY_CONTINUATION, AIModelCapability.CHARACTER_ANALYSIS],
      contextWindow: 200000,
      costPerToken: 0.015,
      maxRequestsPerMinute: 50,
      requiresApiKey: true,
      supportsStreaming: true,
      supportsFunctionCalling: false,
    },
    {
      provider: AIProvider.ANTHROPIC,
      modelId: 'claude-3-sonnet-20240229',
      name: 'Claude 3 Sonnet',
      capabilities: [AIModelCapability.TEXT_GENERATION, AIModelCapability.STORY_CONTINUATION, AIModelCapability.CHARACTER_ANALYSIS],
      contextWindow: 200000,
      costPerToken: 0.003,
      maxRequestsPerMinute: 50,
      requiresApiKey: true,
      supportsStreaming: true,
      supportsFunctionCalling: false,
    },
    {
      provider: AIProvider.ANTHROPIC,
      modelId: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      capabilities: [AIModelCapability.TEXT_GENERATION, AIModelCapability.STORY_CONTINUATION, AIModelCapability.CHARACTER_ANALYSIS],
      contextWindow: 200000,
      costPerToken: 0.00025,
      maxRequestsPerMinute: 50,
      requiresApiKey: true,
      supportsStreaming: true,
      supportsFunctionCalling: false,
    },
  ],
  // Legacy providers maintained for backward compatibility
  [AIProvider.GEMINI_PRO]: [],
  [AIProvider.GEMINI_FLASH]: [],
  [AIProvider.GPT_4]: [],
  [AIProvider.GPT_3_5_TURBO]: [],
  [AIProvider.CLAUDE_3_OPUS]: [],
  [AIProvider.CLAUDE_3_SONNET]: [],
  [AIProvider.CLAUDE_3_HAIKU]: [],
};

export function getModelConfig(modelId: string): AIModelConfig | null {
  for (const configs of Object.values(AI_MODEL_CONFIGS)) {
    const config = configs.find(c => c.modelId === modelId);
    if (config) return config;
  }
  return null;
}

export function getAvailableModelsByCapability(capability: AIModelCapability): AIModelConfig[] {
  const allModels: AIModelConfig[] = [];
  Object.values(AI_MODEL_CONFIGS).forEach(configs => {
    allModels.push(...configs.filter(config => config.capabilities.includes(capability)));
  });
  return allModels;
}

export function isModelCompatibleWithCapability(modelId: string, capability: AIModelCapability): boolean {
  const config = getModelConfig(modelId);
  return config ? config.capabilities.includes(capability) : false;
}

export function calculateEstimatedCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const config = getModelConfig(modelId);
  if (!config || !config.costPerToken) return 0;

  const totalTokens = inputTokens + outputTokens;
  return (totalTokens / 1000) * config.costPerToken;
}


export function estimateTokenCount(text: string): number {
  // Rough estimation: ~4 chars per token for English text
  return Math.ceil(text.length / 4);
}
