import OpenAI from 'openai';
import { AIProvider, AIPrompt, AIRequestOptions, AIResponse, AIError } from '../../types/ai-models';

export class OpenAIClient {
  private client: OpenAI | null = null;

  getProvider(): AIProvider {
    return AIProvider.OPENAI;
  }

  getSupportedModels(): string[] {
    return ['gpt-4', 'gpt-3.5-turbo', 'dall-e-3'];
  }

  async testConnection(apiKey?: string): Promise<boolean> {
    if (!apiKey) {
      return false;
    }

    try {
      const testClient = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
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

  async generateText(prompts: AIPrompt[], options: AIRequestOptions = {}): Promise<AIResponse> {
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
        dangerouslyAllowBrowser: true,
      });
    }

    try {
      const messages = prompts.map((prompt) => ({
        role: prompt.role as 'system' | 'user' | 'assistant',
        content: prompt.content,
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
        throw new AIError(AIProvider.OPENAI, errorCode, 'Invalid OpenAI API key', 'auth', false);
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
        const retryAfter = error?.error?.headers?.['retry-after']
          ? parseInt(error.error.headers['retry-after'])
          : undefined;

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

            

              async generateImage(prompt: string, modelId: string = 'dall-e-3'): Promise<AIResponse> {

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

                    dangerouslyAllowBrowser: true,

                  });

                }

            

                try {

                  const response = await this.client.images.generate({

                    model: modelId,

                    prompt: prompt,

                    n: 1, // Number of images to generate

                    size: '1024x1024', // Image size

                    response_format: 'url', // or 'b64_json'

                  });

            

                  const imageUrls = response.data.map(item => item.url).filter(Boolean) as string[];

            

                  if (!imageUrls || imageUrls.length === 0) {

                    throw new AIError(

                      AIProvider.OPENAI,

                      'NO_IMAGE_URL',

                      'No image URL returned from DALL-E API',

                      'server',

                      true

                    );

                  }

            

                  return {

                    provider: AIProvider.OPENAI,

                    model: modelId,

                    content: 'Image generated successfully', // Placeholder content

                    usage: {

                      promptTokens: 0, // DALL-E doesn't provide token usage in this way

                      completionTokens: 0,

                      totalTokens: 0,

                    },

                    finishReason: 'success',

                    imageUrls: imageUrls,

                  };

                } catch (error: any) {

                  if (error instanceof AIError) {

                    throw error;

                  }

            

                  const errorCode = error?.error?.code || error?.code || 'UNKNOWN_ERROR';

                  const errorMessage = error?.error?.message || error?.message || 'Unknown DALL-E API error';

            

                  if (errorCode === 'invalid_api_key') {

                    throw new AIError(AIProvider.OPENAI, errorCode, 'Invalid OpenAI API key', 'auth', false);

                  }

            

                  throw new AIError(

                    AIProvider.OPENAI,

                    errorCode,

                    `DALL-E API error: ${errorMessage}`,

                    'server',

                    true

                  );

                }

              }

            }

            

      
