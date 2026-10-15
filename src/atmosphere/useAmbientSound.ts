import { useCallback, useEffect, useRef, useState } from 'react';
import type { Settings } from './settings';

export function useAmbientSound(settings: Settings, visible: boolean) {
  const audio = useRef<{ context: AudioContext; gain: GainNode } | null>(null);
  const generation = useRef(0);
  const mounted = useRef(true);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const stop = useCallback(() => {
    generation.current++;
    const active = audio.current; audio.current = null;
    if (active) void active.context.close().catch(() => {});
    if (mounted.current) setPlaying(false);
  }, []);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; stop(); }; }, [stop]);
  useEffect(() => { if (!visible) stop(); }, [visible, stop]);
  useEffect(() => { const hide = () => { if (document.hidden) stop(); }; document.addEventListener('visibilitychange', hide); return () => document.removeEventListener('visibilitychange', hide); }, [stop]);
  useEffect(() => { if (audio.current) audio.current.gain.gain.setTargetAtTime(settings.volume / 1000, audio.current.context.currentTime, 0.15); }, [settings.volume]);
  useEffect(() => { stop(); }, [settings.sound, stop]);
  const start = async () => {
    stop(); setError('');
    const token = generation.current;
    let context: AudioContext | undefined;
    try {
      if (!window.AudioContext) throw new Error('unsupported');
      context = new AudioContext();
      const gain = context.createGain(); gain.gain.value = settings.volume / 1000;
      gain.connect(context.destination); audio.current = { context, gain };
      if (settings.sound === 'rain') {
        const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
        const channel = buffer.getChannelData(0);
        for (let i = 0; i < channel.length; i++) channel[i] = Math.random() * 2 - 1;
        const source = context.createBufferSource(); source.buffer = buffer; source.loop = true;
        const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 700;
        source.connect(filter); filter.connect(gain); source.start();
      } else {
        for (const frequency of [110, 164.81]) { const source = context.createOscillator(); source.type = 'sine'; source.frequency.value = frequency; source.connect(gain); source.start(); }
      }
      await context.resume();
      if (!mounted.current || token !== generation.current || document.hidden) { await context.close().catch(() => {}); return; }
      if (context.state !== 'running') throw new Error('blocked');
      setPlaying(true);
    } catch {
      if (token === generation.current) { stop(); if (mounted.current) setError('Sound could not start in this browser. You can keep using the visuals.'); }
      else if (context && context.state !== 'closed') void context.close().catch(() => {});
    }
  };
  return { playing, error, start, stop };
}
