import OpenAI from 'openai';
import { AIProvider, AIPrompt, AIRequestOptions, AIResponse, AIError } from '../../types/ai-models';

export class OpenAIClient {
  private client: OpenAI | null = null;

  getProvider(): AIProvider {
    return AIProvider.OPENAI;
  }

  getSupportedModels(): string[] {
    return ['gpt-4', 'gpt-3.5-turbo'];
  }

  async testConnection(apiKey?: string): Promise<boolean> {
    if (!apiKey) {
      return false;
    }

    try {
      const testClient = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });

      const response = await testClient.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
      });

      return !!response.choices?.[0]?.message?.content;
    } catch (error) {
      console.warn('OpenAI connection test failed:', error);
      return false;
    }
  }

  async generateText(
    prompts: AIPrompt[],
    options: AIRequestOptions = {}
  ): Promise<AIResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new AIError(
        AIProvider.OPENAI,
        'NO_API_KEY',
        'OpenAI API key is not configured',
        'auth',
        false
      );
    }

    if (!this.client) {
      this.client = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });
    }

    try {
      const messages = prompts.map(prompt => ({
        role: prompt.role as 'system' | 'user' | 'assistant',
        content: prompt.content
      }));

      // Note: Streaming not implemented yet, will always use non-streaming
      const completion = await this.client.chat.completions.create({
        model: options.model || 'gpt-3.5-turbo',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        top_p: options.topP,
        frequency_penalty: options.frequencyPenalty,
        presence_penalty: options.presencePenalty,
        stop: options.stopSequences,
        stream: false, // Always false for now
      });

      const choice = completion.choices[0];
      if (!choice?.message?.content) {
        throw new AIError(
          AIProvider.OPENAI,
          'NO_RESPONSE',
          'No content in OpenAI response',
          'server',
          true
        );
      }

      const usage = completion.usage;
      if (!usage) {
        throw new AIError(
          AIProvider.OPENAI,
          'NO_USAGE',
          'No usage information in OpenAI response',
          'server',
          true
        );
      }

      return {
        provider: AIProvider.OPENAI,
        model: completion.model,
        content: choice.message.content,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
        finishReason: choice.finish_reason || 'stop',
      };
    } catch (error: any) {
      if (error instanceof AIError) {
        throw error;
      }

      const errorCode = error?.error?.code || error?.code || 'UNKNOWN_ERROR';
      const errorMessage = error?.error?.message || error?.message || 'Unknown OpenAI API error';

      if (errorCode === 'invalid_api_key') {
        throw new AIError(
          AIProvider.OPENAI,
          errorCode,
          'Invalid OpenAI API key',
          'auth',
          false
        );
      }

      if (errorCode === 'insufficient_quota') {
        throw new AIError(
          AIProvider.OPENAI,
          errorCode,
          'OpenAI API quota exceeded',
          'unknown',
          true
        );
      }

      if (errorCode === 'rate_limit_exceeded') {
        const retryAfter = error?.error?.headers?.['retry-after'] ?
          parseInt(error.error.headers['retry-after']) : undefined;

        throw new AIError(
          AIProvider.OPENAI,
          errorCode,
          'OpenAI API rate limit exceeded',
          'rate_limit',
          true,
          retryAfter
        );
      }

      throw new AIError(
        AIProvider.OPENAI,
        errorCode,
        `OpenAI API error: ${errorMessage}`,
        'server',
        true
      );
    }
  }
}
