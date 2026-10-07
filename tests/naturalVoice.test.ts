import { describe, it, expect, vi } from 'vitest';
import { AIMVoiceService } from '../server/voice/AIMVoiceService';
import { VOICE_PROFILES } from '../src/services/voiceProfiles';

const service = AIMVoiceService.getInstance();
const audio = { candidates: [{ content: { parts: [{ inlineData: { data: Buffer.alloc(100).toString('base64'), mimeType: 'audio/L16;codec=pcm;rate=22050' } }] } }] };
function client(generateContent: any) { return { models: { generateContent } } as any; }

describe('natural speech generation', () => {
  it('keeps every voice preview and server identity consistent', () => {
    for (const profile of Object.values(VOICE_PROFILES)) {
      const mapping = service.getGeminiVoiceMapping(profile.genderPresentation, profile.accentStyle);
      expect(mapping.voiceName).toBe(profile.geminiVoiceName);
      expect(mapping.stylePrompt).toContain('Keep the regional accent subtle');
    }
  });
  it('tries the second neural model after unavailable audio and wraps PCM at its real sample rate', async () => {
    const generate = vi.fn().mockRejectedValueOnce({ status: 503 }).mockResolvedValueOnce(audio);
    const result = await service.synthesizeSpeech(client(generate), { text: 'Let us find a comfortable pace for this test.', gender: 'feminine', accentStyle: 'southern' });
    expect(generate.mock.calls.map(([request]) => request.model)).toEqual(['gemini-3.1-flash-tts-preview', 'gemini-2.5-flash-preview-tts']);
    expect(result.provider).toBe('gemini-tts');
    expect(result.voiceNameUsed).toBe('Zephyr');
    expect(Buffer.from(result.audioBase64, 'base64').readUInt32LE(24)).toBe(22050);
  });
  it('reports failure instead of returning pretend success or a device voice', async () => {
    const generate = vi.fn().mockResolvedValue({ candidates: [] });
    await expect(service.synthesizeSpeech(client(generate), { text: 'No audio test.' })).rejects.toThrow('no audio');
    expect(generate).toHaveBeenCalledTimes(2);
  });
  it('does not retry invalid credentials across models', async () => {
    const generate = vi.fn().mockRejectedValue({ status: 403 });
    await expect(service.synthesizeSpeech(client(generate), { text: 'Credential failure test.' })).rejects.toEqual({ status: 403 });
    expect(generate).toHaveBeenCalledOnce();
  });
  it('does not reuse audio for different endings or fine-tuning, and preserves cached identity', async () => {
    const generate = vi.fn().mockResolvedValue(audio);
    const ai = client(generate);
    const prefix = 'This is the same beginning. '.repeat(6);
    const first = { text: prefix + 'Choose illustration.', speakingRate: 1 };
    const result = await service.synthesizeSpeech(ai, first);
    await service.synthesizeSpeech(ai, { ...first, text: prefix + 'Choose driving.' });
    await service.synthesizeSpeech(ai, { ...first, speakingRate: 0.8 });
    expect(generate).toHaveBeenCalledTimes(3);
    const cached = await service.synthesizeSpeech(ai, first);
    expect(cached.cached).toBe(true);
    expect(cached.voiceNameUsed).toBe(result.voiceNameUsed);
    expect(generate).toHaveBeenCalledTimes(3);
  });
});
