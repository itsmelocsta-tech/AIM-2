declare global {
  interface Window { AIMSpeech?: { postMessage: (message: string) => void; onmessage: ((event: MessageEvent) => void) | null }; }
}

/** Adapt Android's final transcript to the browser recognition interface. */
export function nativeDictation() {
  const bridge = typeof window !== 'undefined' ? window.AIMSpeech : undefined;
  if (!bridge) return null;
  let timer: ReturnType<typeof setTimeout>;
  let id = '';
  const recognition = {
    onstart: () => {}, onend: () => {}, onerror: (_event: { error: string }) => {}, onresult: (_event: any) => {},
    start() {
      if (id) throw new Error('Dictation is already running.');
      id = crypto.randomUUID();
      const finish = () => { clearTimeout(timer); id = ''; bridge.onmessage = null; recognition.onend(); };
      bridge.onmessage = event => {
        try {
          const response = JSON.parse(event.data);
          if (response.id !== id) return;
          if (response.error) recognition.onerror({ error: 'unavailable' });
          else if (response.text) recognition.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: response.text }], { isFinal: true })] });
          finish();
        } catch { recognition.onerror({ error: 'unavailable' }); finish(); }
      };
      timer = setTimeout(() => { bridge.postMessage(JSON.stringify({ action: 'stop', id })); recognition.onerror({ error: 'timeout' }); finish(); }, 90000);
      try { bridge.postMessage(JSON.stringify({ action: 'start', id })); recognition.onstart(); }
      catch (error) { finish(); throw error; }
    },
    stop() { if (id) bridge.postMessage(JSON.stringify({ action: 'stop', id })); },
  };
  return recognition;
}
