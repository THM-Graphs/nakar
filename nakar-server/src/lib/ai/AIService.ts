import { BadGatewayException, Injectable } from '@nestjs/common';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel, ModelMessage } from 'ai';
import { generateText } from 'ai';
import z from 'zod';

interface LlmConfig {
  LLM_PROVIDER: 'lmstudio' | 'openai' | 'anthropic';
  LLM_BASE_URL?: string;
  LLM_MODEL?: string;
  LLM_API_KEY?: string;
}

@Injectable()
export class AIService {
  public async runPrompt(options: {
    instructions: string;
    messages: ModelMessage[];
  }): Promise<string> {
    const timeoutMs: number = z.coerce
      .number()
      .int()
      .positive()
      .default(300000)
      .parse(process.env['LLM_TIMEOUT_MS']);
    const signal: AbortSignal = AbortSignal.timeout(timeoutMs);
    try {
      const model: Exclude<LanguageModel, string> = await this._getModel();
      const result: Awaited<ReturnType<typeof generateText>> =
        await generateText({
          model,
          ...options,
          providerOptions: { lmstudio: { reasoningEffort: 'none' } },
          maxRetries: 0,
          abortSignal: signal,
        });
      if (result.finishReason === 'length') {
        throw new BadGatewayException(
          'The model output limit was reached before the final answer was complete. Reasoning counts toward this limit. Increase the output limit in LM Studio or simplify the request.',
        );
      }
      if (result.text.trim().length === 0) {
        throw new BadGatewayException(
          'The model returned no final answer. Reasoning may have consumed the output budget. Increase the model output limit in LM Studio.',
        );
      }
      return result.text;
    } catch (error: unknown) {
      if (error instanceof BadGatewayException) {
        throw error;
      }
      if (signal.aborted) {
        throw new BadGatewayException(
          `AI generation timed out after ${Math.round(timeoutMs / 1000).toString()} seconds. Reasoning can take longer; increase LLM_TIMEOUT_MS or simplify the request.`,
          { cause: error },
        );
      }
      throw new BadGatewayException(
        `AI generation failed: ${error instanceof Error ? error.message : 'Unknown provider error'}`,
        { cause: error },
      );
    }
  }

  private async _getModel(): Promise<Exclude<LanguageModel, string>> {
    const config: LlmConfig = z
      .object({
        LLM_PROVIDER: z
          .enum(['lmstudio', 'openai', 'anthropic'])
          .default('lmstudio'),
        LLM_BASE_URL: z.url().optional(),
        LLM_MODEL: z.string().trim().min(1).optional(),
        LLM_API_KEY: z.string().min(1).optional(),
      })
      .parse(process.env);
    if (config.LLM_PROVIDER === 'openai') {
      if (config.LLM_MODEL == null) {
        throw new Error('LLM_MODEL is required for OpenAI.');
      }
      return createOpenAI({
        apiKey: config.LLM_API_KEY ?? process.env['OPENAI_API_KEY'],
        baseURL: config.LLM_BASE_URL,
      })(config.LLM_MODEL);
    }
    if (config.LLM_PROVIDER === 'anthropic') {
      if (config.LLM_MODEL == null) {
        throw new Error('LLM_MODEL is required for Anthropic.');
      }
      return createAnthropic({
        apiKey: config.LLM_API_KEY ?? process.env['ANTHROPIC_API_KEY'],
        baseURL: config.LLM_BASE_URL,
      })(config.LLM_MODEL);
    }

    const baseUrl: string = (
      config.LLM_BASE_URL ?? 'http://127.0.0.1:1234/v1'
    ).replace(/\/+$/u, '');
    let modelId: string | undefined = config.LLM_MODEL;
    if (modelId == null) {
      const response: Response = await fetch(`${baseUrl}/models`, {
        signal: AbortSignal.timeout(10000),
        headers:
          config.LLM_API_KEY == null
            ? {}
            : { Authorization: `Bearer ${config.LLM_API_KEY}` },
      });
      if (!response.ok) {
        throw new Error('Could not load LM Studio models.');
      }
      const models: { data: { id: string }[] } = z
        .object({ data: z.array(z.object({ id: z.string().min(1) })) })
        .parse(await response.json());
      modelId = models.data.at(0)?.id;
      if (modelId == null) {
        throw new Error('No model available in LM Studio.');
      }
    }
    return createOpenAICompatible({
      name: 'lmstudio',
      baseURL: baseUrl,
      apiKey: config.LLM_API_KEY,
    }).chatModel(modelId);
  }
}
