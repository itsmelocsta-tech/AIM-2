import React, { useEffect, useRef, useState } from 'react';
import { SoundscapeEngine, loadSoundscape, saveSoundscape, SoundscapePreferences } from '../../services/fractalSoundscape';
export function FractalSoundscapes() {
  const [prefs, setPrefs] = useState<SoundscapePreferences>(loadSoundscape);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const engine = useRef<SoundscapeEngine | null>(null);
  useEffect(() => { saveSoundscape(prefs); }, [prefs]);
  useEffect(() => () => { engine.current?.stop(); }, []);
  const update = (next: SoundscapePreferences) => {
    if (playing && (next.mode !== prefs.mode || next.minutes !== prefs.minutes)) {
      engine.current?.stop(); setPlaying(false);
    } else if (playing && next.volume !== prefs.volume) engine.current?.setVolume(next.volume);
    setPrefs(next);
  };
  const toggle = async () => {
    if (playing) { engine.current?.stop(); setPlaying(false); return; }
    if (prefs.mode === 'silence') return;
    setError('');
    const audio = new SoundscapeEngine(); engine.current = audio;
    try { await audio.start(prefs, () => setPlaying(false)); setPlaying(true); }
    catch { setError('Audio could not start. Check your browser audio permissions.'); setPlaying(false); }
  };
  return <section aria-label="Fractal Soundscapes" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 text-white">
    <h2 className="font-bold text-sm">Fractal Soundscapes</h2>
    <p className="text-xs text-slate-400">Optional generated ambient audio. No claims of medical or cognitive benefits.</p>
    <label className="block text-xs">Sound mode
      <select aria-label="Sound mode" className="block w-full mt-1 bg-slate-950 rounded-lg p-2" value={prefs.mode} onChange={e => update({...prefs, mode: e.target.value as SoundscapePreferences['mode']})}>
        <option value="fractal">Fractal</option><option value="ambient">Ambient</option><option value="silence">Silence</option>
      </select>
    </label>
    <label className="block text-xs">Volume: {prefs.volume}%
      <input aria-label="Soundscape volume" className="block w-full" type="range" min="0" max="100" value={prefs.volume} onChange={e => update({...prefs,volume:Number(e.target.value)})} />
    </label>
    <label className="block text-xs">Session length
      <select aria-label="Session length" className="block w-full mt-1 bg-slate-950 rounded-lg p-2" value={prefs.minutes} onChange={e => update({...prefs,minutes:Number(e.target.value)})}>
        <option value="10">10 minutes</option><option value="25">25 minutes</option><option value="45">45 minutes</option>
      </select>
    </label>
    <button type="button" disabled={prefs.mode === 'silence'} onClick={toggle} className="bg-indigo-600 disabled:opacity-50 rounded-lg px-4 py-2 text-sm">{playing ? 'Stop soundscape' : 'Play soundscape'}</button>
    {error && <p role="alert" className="text-xs text-rose-400">{error}</p>}
  </section>;
}
