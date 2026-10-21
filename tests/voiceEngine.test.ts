import { beforeEach, afterEach, it, expect, vi } from 'vitest';
const request = vi.hoisted(() => vi.fn());
vi.mock('../src/services/authenticatedFetch', () => ({ authenticatedFetch: request }));
import { VoiceEngine } from '../src/services/voiceService';
let deviceSpeak: ReturnType<typeof vi.fn>;
let audioPlay: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.clearAllMocks();
  deviceSpeak = vi.fn(); audioPlay = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('window', { speechSynthesis: { cancel: vi.fn(), speak: deviceSpeak } });
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn() });
  vi.stubGlobal('Audio', class { onplay: any; paused = false; currentTime = 0; play = audioPlay; pause() {} removeAttribute() {} });
});
afterEach(() => vi.unstubAllGlobals());
it.each(['http-error', 'legacy-fallback', 'network-error'])('shows retry rather than robotic speech on %s', async (failure) => {
  if (failure === 'network-error') request.mockRejectedValue(new Error('offline'));
  else request.mockResolvedValue(new Response(JSON.stringify({ provider: 'fallback', spokenText: 'Hello.' }), { status: failure === 'http-error' ? 503 : 200 }));
  const engine = new VoiceEngine(); const onError = vi.fn(); const notification = vi.fn();
  engine.setErrorNotificationListener(notification);
  await engine.speak('Hello from a test.', { onError });
  expect(deviceSpeak).not.toHaveBeenCalled();
  expect(audioPlay).not.toHaveBeenCalled();
  expect(onError).toHaveBeenCalledOnce();
  expect(notification).toHaveBeenCalledWith(expect.stringContaining('Please try again'), true);
});
it('does not play audio after the user stops while generation is pending', async () => {
  let resolve: (r: Response) => void = () => {};
  request.mockReturnValue(new Promise<Response>(r => { resolve = r; }));
  const engine = new VoiceEngine(); const onError = vi.fn();
  const pending = engine.speak('Canceled test speech.', { onError });
  engine.stopSpeaking();
  resolve(new Response(JSON.stringify({ provider: 'gemini-tts', audioBase64: 'AAAA', mimeType: 'audio/wav' })));
  await pending;
  expect(audioPlay).not.toHaveBeenCalled();
  expect(onError).not.toHaveBeenCalled();
});
it('plays natural audio and keeps replay URLs valid', async () => {
  request.mockResolvedValue(new Response(JSON.stringify({ provider: 'gemini-tts', audioBase64: 'AAAA', mimeType: 'audio/wav' })));
  const engine = new VoiceEngine(); const revoke = vi.spyOn(URL, 'revokeObjectURL');
  await engine.speak('Cache test one.');
  request.mockResolvedValue(new Response(JSON.stringify({ provider: 'gemini-tts', audioBase64: 'AAAA', mimeType: 'audio/wav' })));
  await engine.speak('Cache test two.');
  await engine.speak('Cache test one.');
  expect(request).toHaveBeenCalledTimes(2);
  expect(audioPlay).toHaveBeenCalledTimes(3);
  expect(revoke).not.toHaveBeenCalled();
  revoke.mockRestore();
});
it('starts with the calm neutral voice even when stored preferences are corrupt', () => {
  expect(new VoiceEngine().getPreferences()).toMatchObject({ voiceProfileId: 'feminine_general_american', voiceName: 'Achernar', accentStyle: 'general_american', rate: 0.94 });
  vi.stubGlobal('localStorage', { getItem: () => '{invalid', setItem: vi.fn() });
  expect(new VoiceEngine().getPreferences().voiceProfileId).toBe('feminine_general_american');
});
it.each(['masculine', 'feminine'] as const)('moves a saved %s Texas voice to neutral without losing fine tuning or mute', (gender) => {
  vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ gender, accentStyle: 'texan', voiceProfileId: `${gender}_texan`, voiceName: 'Old voice', rate: 0.86, pitch: 1.05, isMuted: true }), setItem: vi.fn() });
  const engine = new VoiceEngine();
  expect(engine.getPreferences()).toMatchObject({ gender, accentStyle: 'general_american', voiceProfileId: `${gender}_general_american`, rate: 0.86, pitch: 1.05, isMuted: true });
  expect(engine.getCentralConfig().label).toBe('Calm & welcoming');
  engine.setSelection(gender, 'texas');
  expect(engine.getActiveProfile().accentStyle).toBe('general_american');
});
