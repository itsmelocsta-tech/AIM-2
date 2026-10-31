import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SoundscapeEngine, loadSoundscape, saveSoundscape, SoundscapePreferences } from '../../services/fractalSoundscape';

export function FractalSoundscapes() {
  const [prefs, setPrefs] = useState<SoundscapePreferences>(loadSoundscape);
  const [status, setStatus] = useState<'idle' | 'starting' | 'playing'>('idle');
  const [error, setError] = useState('');
  const engine = useRef<SoundscapeEngine | null>(null);
  const requestId = useRef(0);
  const stop = useCallback(() => {
    requestId.current++;
    engine.current?.stop();
    setStatus('idle');
  }, []);

  useEffect(() => { saveSoundscape(prefs); }, [prefs]);
  useEffect(() => {
    const onHidden = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', stop);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('pagehide', stop);
      requestId.current++;
      engine.current?.stop();
    };
  }, [stop]);

  const update = (next: SoundscapePreferences) => {
    // Changing controls must also cancel a pending browser resume.
    if (next.mode !== prefs.mode || next.minutes !== prefs.minutes || status === 'starting') stop();
    else if (status === 'playing' && next.volume !== prefs.volume) engine.current?.setVolume(next.volume);
    setPrefs(next);
  };
  const toggle = async () => {
    if (status !== 'idle') { stop(); return; }
    if (prefs.mode === 'silence' || document.hidden) return;
    setError('');
    setStatus('starting');
    const token = ++requestId.current;
    const audio = new SoundscapeEngine();
    engine.current?.stop(); engine.current = audio;
    try {
      const started = await audio.start(prefs, () => { if (token === requestId.current) setStatus('idle'); });
      if (token === requestId.current) setStatus(started ? 'playing' : 'idle');
      else audio.stop();
    } catch {
      if (token === requestId.current) {
        setError('Audio could not start. Check your browser audio permissions.');
        setStatus('idle');
      }
    }
  };

  return <section aria-label="Soundscapes" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 text-white">
    <h2 className="font-bold text-sm">Soundscapes</h2>
    <p className="text-xs text-slate-300">Optional ambient audio, generated on your device. Settings stay on this device. Audio stops when you leave Settings or hide AIM.</p>
    <label className="block text-xs">Sound mode
      <select aria-label="Sound mode" className="block w-full mt-1 bg-slate-950 rounded-lg p-2" value={prefs.mode} onChange={e => update({ ...prefs, mode: e.target.value as SoundscapePreferences['mode'] })}>
        <option value="fractal">Dynamic</option><option value="ambient">Ambient</option><option value="silence">Silence</option>
      </select>
    </label>
    <label className="block text-xs">Volume: {prefs.volume}%
      <input aria-label="Soundscape volume" className="block w-full" type="range" min="0" max="100" value={prefs.volume} onChange={e => update({ ...prefs, volume: Number(e.target.value) })} />
    </label>
    <label className="block text-xs">Session length
      <select aria-label="Session length" className="block w-full mt-1 bg-slate-950 rounded-lg p-2" value={prefs.minutes} onChange={e => update({ ...prefs, minutes: Number(e.target.value) })}>
        <option value="10">10 minutes</option><option value="25">25 minutes</option><option value="45">45 minutes</option>
      </select>
    </label>
    <button type="button" disabled={prefs.mode === 'silence'} onClick={toggle} className="bg-indigo-600 disabled:opacity-50 rounded-lg px-4 py-2 min-h-11 text-sm">
      {status === 'playing' ? 'Stop soundscape' : status === 'starting' ? 'Cancel starting soundscape' : 'Play soundscape'}
    </button>
    <p role="status" className="text-xs text-slate-300">{status === 'playing' ? 'Soundscape is playing.' : status === 'starting' ? 'Starting soundscape…' : 'Soundscape is off.'}</p>
    {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}
  </section>;
}
