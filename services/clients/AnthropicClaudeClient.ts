import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, AIPrompt, AIRequestOptions, AIResponse, AIError } from '../../types/ai-models';

export class AnthropicClaudeClient {
  private client: Anthropic | null = null;

  getProvider(): AIProvider {
    return AIProvider.ANTHROPIC;
  }

  getSupportedModels(): string[] {
    return ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'];
  }

  async testConnection(apiKey?: string): Promise<boolean> {
    if (!apiKey) {
      return false;
    }

    try {
      const testClient = new Anthropic({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });

      const response = await testClient.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }],
      });

      return !!response.content?.length;
    } catch (error) {
      console.warn('Anthropic connection test failed:', error);
      return false;
    }
  }

  async generateText(prompts: AIPrompt[], options: AIRequestOptions = {}): Promise<AIResponse> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new AIError(
        AIProvider.ANTHROPIC,
        'NO_API_KEY',
        'Anthropic API key is not configured',
        'auth',
        false
      );
    }

    if (!this.client) {
      this.client = new Anthropic({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });
    }

    try {
      // Claude uses different message format - convert our prompts
      const messages: Anthropic.Messages.MessageParam[] = [];
      let systemPrompt = '';

      // Extract system message and convert to Claude format
      for (const prompt of prompts) {
        if (prompt.role === 'system') {
          systemPrompt = prompt.content;
        } else {
          messages.push({
            role: prompt.role as 'user' | 'assistant',
            content: prompt.content,
          });
        }
      }

      const response = await this.client.messages.create({
        model: options.model || 'claude-3-haiku-20240307',
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.7,
        top_p: options.topP,
        system: systemPrompt,
        stop_sequences: options.stopSequences,
        messages,
        stream: false, // Always false for now
      });

      if (!response.content || response.content.length === 0) {
        throw new AIError(
          AIProvider.ANTHROPIC,
          'NO_RESPONSE',
          'No content in Anthropic response',
          'server',
          true
        );
      }

      const content = response.content[0];
      const textContent = content.type === 'text' ? content.text : '';

      if (!textContent) {
        throw new AIError(
          AIProvider.ANTHROPIC,
          'NO_TEXT_CONTENT',
          'Response contains no text content',
          'server',
          true
        );
      }

      return {
        provider: AIProvider.ANTHROPIC,
        model: response.model,
        content: textContent,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        finishReason: response.stop_reason,
      };
    } catch (error: any) {
      if (error instanceof AIError) {
        throw error;
      }

      const errorType = error?.error?.type || 'unknown_error';
      const errorMessage = error?.error?.message || error?.message || 'Unknown Anthropic API error';

      if (errorType === 'authentication_error') {
        throw new AIError(
          AIProvider.ANTHROPIC,
          errorType,
          'Invalid Anthropic API key',
          'auth',
          false
        );
      }

      if (errorType === 'billing_error') {
        throw new AIError(
          AIProvider.ANTHROPIC,
          errorType,
          'Anthropic API billing error',
          'unknown',
          false
        );
      }

      if (errorType === 'rate_limit_error') {
        throw new AIError(
          AIProvider.ANTHROPIC,
          errorType,
          'Anthropic API rate limit exceeded',
          'rate_limit',
          true
        );
      }

      throw new AIError(
        AIProvider.ANTHROPIC,
        errorType,
        `Anthropic API error: ${errorMessage}`,
        'server',
        true
      );
    }
  }
}
