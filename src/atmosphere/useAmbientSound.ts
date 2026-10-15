import { useCallback, useEffect, useRef, useState } from 'react';
import type { Settings } from './settings';
import { createAmbientGraph } from './audioEngine';
import { toneFrequency, volumeGain } from './audioDSP';

type Session = { context: AudioContext; graph: ReturnType<typeof createAmbientGraph> };
export function useAmbientSound(settings: Settings, visible: boolean) {
  const audio = useRef<Session | null>(null);
  const latest = useRef(settings); latest.current = settings;
  const retiring = useRef(new Map<Session, ReturnType<typeof setTimeout>>());
  const generation = useRef(0);
  const mounted = useRef(true);
  const [playing, setPlaying] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const close = useCallback((session: Session) => {
    const timer = retiring.current.get(session); if (timer) clearTimeout(timer);
    retiring.current.delete(session); session.graph.dispose();
    if (session.context.state !== 'closed') void session.context.close().catch(() => {});
  }, []);
  const stop = useCallback((immediate = false) => {
    generation.current++;
    const active = audio.current; audio.current = null;
    if (active) {
      if (immediate || active.context.state !== 'running') close(active);
      else {
        const now = active.context.currentTime, gain = active.graph.output.gain;
        gain.cancelAndHoldAtTime(now); gain.linearRampToValueAtTime(0, now + .12);
        retiring.current.set(active, setTimeout(() => close(active), 160));
      }
    }
    if (immediate) for (const retired of [...retiring.current.keys()]) close(retired);
    if (mounted.current) { setPlaying(false); setStarting(false); }
  }, [close]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; stop(true); }; }, [stop]);
  useEffect(() => { if (!visible) stop(true); }, [visible, stop]);
  useEffect(() => { const hide = () => { if (document.hidden) stop(true); }; document.addEventListener('visibilitychange', hide); return () => document.removeEventListener('visibilitychange', hide); }, [stop]);
  useEffect(() => {
    if (audio.current) {
      const { context, graph } = audio.current, now = context.currentTime;
      graph.output.gain.cancelAndHoldAtTime(now);
      graph.output.gain.setTargetAtTime(volumeGain(settings.volume), now, .12);
    }
  }, [settings.volume]);
  useEffect(() => { if (audio.current) audio.current.graph.filter.frequency.setTargetAtTime(toneFrequency(settings.tone), audio.current.context.currentTime, .15); }, [settings.tone]);
  useEffect(() => { stop(); }, [settings.sound, stop]);
  const start = async () => {
    stop(); for (const retired of [...retiring.current.keys()]) close(retired);
    setError(''); setStarting(true);
    const token = generation.current;
    let context: AudioContext | undefined;
    try {
      if (!window.AudioContext) throw new Error('unsupported');
      context = new AudioContext();
      const graph = createAmbientGraph(context, settings);
      const session = { context, graph }; audio.current = session;
      await context.resume();
      if (!mounted.current || token !== generation.current || document.hidden || !visible) { close(session); return; }
      if (context.state !== 'running') throw new Error('blocked');
      const now = context.currentTime;
      graph.output.gain.setValueAtTime(0, now);
      graph.filter.frequency.setValueAtTime(toneFrequency(latest.current.tone), now);
      graph.output.gain.linearRampToValueAtTime(volumeGain(latest.current.volume), now + .45);
      setPlaying(true); setStarting(false);
    } catch {
      if (token === generation.current) {
        stop(true);
        if (context && context.state !== 'closed') void context.close().catch(() => {});
        if (mounted.current) setError('Sound could not start in this browser. You can keep using the visuals.');
      } else if (context && context.state !== 'closed') void context.close().catch(() => {});
    }
  };
  return { playing, starting, error, start, stop };
}
