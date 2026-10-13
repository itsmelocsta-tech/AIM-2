import { afterEach, expect, it, vi } from 'vitest';
import { generateWithFallback } from '../server/generateWithFallback';
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

it('fails over when a provider rejects but retains structured configuration and safety guidance', async () => {
  const generateContent = vi.fn().mockRejectedValueOnce(new Error('503')).mockResolvedValueOnce({ text: '{"plan":"ok"}' });
  const result = await generateWithFallback({ models: { generateContent } } as any, { contents: 'Fictional goal', config: { responseMimeType: 'application/json' } });
  expect(result.text).toContain('ok');
  expect(generateContent.mock.calls[1][0].config.responseMimeType).toBe('application/json');
  expect(generateContent.mock.calls[1][0].config.httpOptions.timeout).toBeLessThanOrEqual(20000);
  expect(generateContent.mock.calls[1][0].config.systemInstruction).toContain('Do not generate content that exploits children');
});
it('does not try another model to bypass a safety block', async () => {
  const generateContent = vi.fn().mockResolvedValue({ promptFeedback: { blockReason: 'SAFETY' } });
  await expect(generateWithFallback({ models: { generateContent } } as any, { contents: 'Fictional input' })).rejects.toThrow('AI_CONTENT_BLOCKED');
  expect(generateContent).toHaveBeenCalledOnce();
});
it('returns within 55 seconds even when every provider request hangs', async () => {
  vi.useFakeTimers();
  const generateContent = vi.fn().mockImplementation(() => new Promise(() => {}));
  const result = generateWithFallback({ models: { generateContent } } as any, { contents: 'Fictional input' });
  const assertion = expect(result).rejects.toThrow('temporarily unavailable');
  await vi.advanceTimersByTimeAsync(55000);
  await assertion;
  expect(generateContent).toHaveBeenCalledTimes(3);
  expect(generateContent.mock.calls.every(([request]) => request.config.abortSignal.aborted)).toBe(true);
});
