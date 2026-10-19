import { afterEach, expect, it, vi } from 'vitest';
import { generateWithFallback } from '../server/generateWithFallback';
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

it('fails over when a provider rejects but retains structured configuration and safety guidance', async () => {
  const generateContent = vi.fn().mockRejectedValueOnce(new Error('503')).mockResolvedValueOnce({ text: '{"plan":"ok"}' });
  const result = await generateWithFallback({ models: { generateContent } } as any, { contents: 'Fictional goal', config: { responseMimeType: 'application/json' } });
  expect(result.text).toContain('ok');
  expect(generateContent.mock.calls[1][0].config.responseMimeType).toBe('application/json');
  expect(generateContent.mock.calls[1][0].config.httpOptions.timeout).toBeLessThanOrEqual(25000);
  expect(generateContent.mock.calls.map(([request]) => request.model)).toEqual(['gemini-3.5-flash-lite', 'gemini-3.8-flash']);
  expect(generateContent.mock.calls[1][0].config.systemInstruction).toContain('Do not generate content that exploits children');
});
it('does not try another model to bypass a safety block', async () => {
  const generateContent = vi.fn().mockResolvedValue({ promptFeedback: { blockReason: 'SAFETY' } });
  await expect(generateWithFallback({ models: { generateContent } } as any, { contents: 'Fictional input' })).rejects.toThrow('AI_CONTENT_BLOCKED');
  expect(generateContent).toHaveBeenCalledOnce();
});
it('returns within 75 seconds even when every provider request hangs', async () => {
  vi.useFakeTimers();
  const generateContent = vi.fn().mockImplementation(() => new Promise(() => {}));
  const result = generateWithFallback({ models: { generateContent } } as any, { contents: 'Fictional input' });
  const assertion = expect(result).rejects.toThrow('temporarily unavailable');
  await vi.advanceTimersByTimeAsync(75000);
  await assertion;
  expect(generateContent).toHaveBeenCalledTimes(3);
  expect(generateContent.mock.calls.every(([request]) => request.config.abortSignal.aborted)).toBe(true);
});

it('does not repeat rejected credentials or invalid requests against other models', async () => {
  for (const status of [400, 401, 403, 422]) {
    const generateContent = vi.fn().mockRejectedValue({ status });
    await expect(generateWithFallback({ models: { generateContent } } as any, { contents: 'Fictional goal' })).rejects.toThrow('could not be accepted');
    expect(generateContent).toHaveBeenCalledOnce();
  }
});

it('honors an explicit model override and moves on when that model is unavailable', async () => {
  vi.stubEnv('GEMINI_MODEL', 'owner-selected-model');
  const generateContent = vi.fn().mockRejectedValueOnce({ status: 404 }).mockResolvedValueOnce({ text: 'A real response' });
  await generateWithFallback({ models: { generateContent } } as any, { contents: 'Fictional goal' });
  expect(generateContent.mock.calls.map(([request]) => request.model)).toEqual(['owner-selected-model', 'gemini-3.8-flash']);
});
