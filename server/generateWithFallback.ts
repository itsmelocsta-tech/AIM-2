import { GoogleGenAI } from '@google/genai';
import { PLAIN_LANGUAGE_INSTRUCTION } from './plainLanguage';

const SAFE_USE = 'Do not generate content that exploits children, facilitates fraud or deception, threatens or harasses people, or encourages self-harm or dangerous acts. Do not diagnose or prescribe treatment. Offer safe, practical alternatives and recommend qualified help when appropriate.';

/** Bound the entire fallback chain. Never switch models to evade a safety block. */
export async function generateWithFallback(ai: Pick<GoogleGenAI, 'models'>, params: {
  contents: any; config?: any; preferredModel?: string;
}): Promise<any> {
  const primary = params.preferredModel || process.env.GEMINI_MODEL || 'gemini-3.7-flash';
  const models = [...new Set([primary, 'gemini-2.5-flash', 'gemini-3.1-flash-lite'])];
  const deadline = Date.now() + 55000;
  for (const model of models) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    try {
      const timeout = Math.min(20000, remaining);
      const request = ai.models.generateContent({
        model, contents: params.contents,
        config: {
          ...params.config,
          systemInstruction: [params.config?.systemInstruction, PLAIN_LANGUAGE_INSTRUCTION, SAFE_USE].filter(Boolean).join('\n\n'),
          httpOptions: { ...params.config?.httpOptions, timeout }, abortSignal: controller.signal,
        },
      });
      const response = await Promise.race([request, new Promise<never>((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(new Error('AI_TIMEOUT')); }, timeout);
      })]);
      if (response.promptFeedback?.blockReason || response.candidates?.some(candidate => ['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST'].includes(String(candidate.finishReason)))) {
        throw new Error('AI_CONTENT_BLOCKED');
      }
      if (response.text?.trim()) return response;
    } catch (error) {
      if (error instanceof Error && error.message === 'AI_CONTENT_BLOCKED') throw error;
      // Do not log provider errors: they can contain prompts or credential-bearing requests.
      console.info(`[GenAI] ${model} did not complete; checking the next configured model.`);
    } finally { clearTimeout(timer!); }
  }
  throw new Error('AI is temporarily unavailable. Please retry.');
}
