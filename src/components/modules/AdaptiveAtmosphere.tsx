import React, { useEffect, useId, useMemo, useState } from 'react';
import { BookOpen, Pause, Play, RotateCcw, Sparkles, Volume2 } from 'lucide-react';
import { branchPaths, decodePreferences, intents, preferenceKey, presets, sanitizeSettings, soften, suggestIntent, type Intent, type Settings } from '../../atmosphere/settings';
import { research } from '../../atmosphere/research';
import { useAmbientSound } from '../../atmosphere/useAmbientSound';
import './adaptive-atmosphere.css';

const palettes = { amethyst: '#b9a2ff', lagoon: '#73d5d0', forest: '#91c5a6', ember: '#eab68c' };
const labels: Record<Intent, string> = { settle: 'Settle', focus: 'Focus', restore: 'Restore', energize: 'Energize' };
export function AdaptiveAtmosphere({ ownerId, visible }: { ownerId: string; visible: boolean; key?: string }) {
  const key = preferenceKey(ownerId);
  const [preferences, setPreferences] = useState(() => { try { return decodePreferences(localStorage.getItem(key)); } catch { return decodePreferences(null); } });
  const [intent, setIntent] = useState<Intent>(preferences.intent);
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('Choose a starting point, then make it yours.');
  const [storageError, setStorageError] = useState('');
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [paused, setPaused] = useState(false);
  const settings = preferences.current;
  const sound = useAmbientSound(settings, visible);
  const gradientId = useId();
  const paths = useMemo(() => branchPaths(settings.density), [settings.density]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)'); const change = () => setReduced(media.matches);
    media.addEventListener('change', change);
    // Catch preference changes between initial render and effect subscription.
    change();
    return () => media.removeEventListener('change', change);
  }, []);
  const persist = (next: typeof preferences) => {
    setPreferences(next);
    try { localStorage.setItem(key, JSON.stringify(next)); setStorageError(''); return true; }
    catch { setStorageError('Settings work for this visit. This browser could not save them.'); return false; }
  };
  const update = (patch: Partial<Settings>) => persist({ ...preferences, current: sanitizeSettings({ ...settings, ...patch }) });
  const apply = (nextIntent: Intent) => {
    setIntent(nextIntent);
    const learned = preferences.learned[nextIntent];
    persist({ ...preferences, intent: nextIntent, current: { ...(learned || presets[nextIntent]) } });
    setMessage(learned ? `Using your saved ${labels[nextIntent].toLowerCase()} preferences.` : `${labels[nextIntent]} is a design starting point. Adjust it to fit you.`);
  };
  const forget = () => {
    sound.stop(); setDescription(''); setPaused(false); setIntent('focus');
    setPreferences(decodePreferences(null));
    try { localStorage.removeItem(key); setStorageError(''); setMessage('Preferences forgotten. Sound is off.'); }
    catch { setStorageError('This browser could not remove stored preferences. Clear site data in your browser settings.'); }
  };
  const moving = !reduced && !paused && settings.motion > 0;
  return <section className="atmosphere-workspace" hidden={!visible} aria-label="Adaptive Atmosphere">
    <header className="atmosphere-heading"><div><p className="crystal-eyebrow">A SPACE FOR YOUR NEXT MOVE</p><h2>Adaptive Atmosphere</h2><p>Find a setting that feels right for what you want to do.</p></div><span className="atmosphere-badge"><Sparkles size={15} />Preference driven · experimental</span></header>
    <div className="atmosphere-layout">
      <div className="atmosphere-scene-column">
        <div className="atmosphere-scene" data-testid="atmosphere-scene" data-motion={moving ? 'moving' : 'still'} data-palette={settings.palette} style={{ '--scene-color': palettes[settings.palette], '--scene-opacity': settings.intensity / 100, '--scene-duration': `${160 - settings.motion * 2}s` } as React.CSSProperties}>
          <div className="atmosphere-scene-halo" />
          <svg viewBox="0 0 400 400" aria-hidden="true" className="atmosphere-geometry"><defs><radialGradient id={gradientId}><stop offset="0" stopColor="currentColor" stopOpacity="0.08" /><stop offset="1" stopColor="currentColor" stopOpacity="0.65" /></radialGradient></defs><g className="atmosphere-motion" fill="none" stroke="currentColor" strokeWidth="0.8">
            {settings.shape === 'branches' && paths.map((d, i) => <path key={i} d={d} />)}
            {settings.shape === 'rings' && Array.from({ length: settings.density * 3 }, (_, i) => <circle key={i} cx="200" cy="200" r={24 + i * 11} />)}
            {settings.shape === 'petals' && Array.from({ length: settings.density * 4 }, (_, i) => <ellipse key={i} cx="200" cy="146" rx="40" ry="88" transform={`rotate(${i * 360 / (settings.density * 4)} 200 200)`} fill={`url(#${gradientId})`} />)}
          </g></svg>
          <div className="atmosphere-scene-caption"><span>YOUR ATMOSPHERE</span><strong>{labels[intent]}</strong><p>{settings.palette} · {settings.shape} · density {settings.density}</p></div>
          <button type="button" className="atmosphere-pause" disabled={reduced || settings.motion === 0} aria-pressed={paused} onClick={() => setPaused(!paused)}>{moving ? <Pause size={15} /> : <Play size={15} />}{reduced ? 'Reduced motion active' : settings.motion === 0 ? 'Motion off' : paused ? 'Resume motion' : 'Pause motion'}</button>
        </div>
        <div className="atmosphere-feedback"><p>How does this setting feel?</p><div><button type="button" className="crystal-primary" onClick={() => { const saved = persist({ ...preferences, learned: { ...preferences.learned, [intent]: { ...settings } } }); setMessage(saved ? `Saved your ${labels[intent].toLowerCase()} starting point on this device.` : 'Preference applied for this visit. Saving is unavailable.'); }}>This works for me</button><button type="button" className="crystal-secondary" onClick={() => { persist({ ...preferences, current: soften(settings) }); setMessage('Made the scene quieter. Save it if this feels better.'); }}>Too much</button></div><p className="atmosphere-muted">Your feedback reflects your experience. AIM does not measure your mood or biology.</p></div>
      </div>
      <div className="atmosphere-controls">
        <form onSubmit={event => { event.preventDefault(); apply(suggestIntent(description)); }}><label htmlFor="atmosphere-request">What do you need right now?</label><textarea id="atmosphere-request" maxLength={600} rows={3} value={description} onChange={event => setDescription(event.target.value)} placeholder="I feel overwhelmed and want a quieter space to write…" /><button type="submit" className="crystal-primary" disabled={!description.trim()}><Sparkles size={15} />Shape my atmosphere</button><p className="atmosphere-muted">A simple keyword match suggests a starting point. Your description stays on this device and is never saved.</p></form>
        <div className="atmosphere-intents" aria-label="Starting points">{intents.map(item => <button type="button" key={item} aria-pressed={intent === item} onClick={() => apply(item)}>{labels[item]}</button>)}</div>
        <div className="atmosphere-setting-grid"><label>Palette<select aria-label="Palette" value={settings.palette} onChange={e => update({ palette: e.target.value as Settings['palette'] })}>{Object.keys(palettes).map(palette => <option key={palette} value={palette}>{palette[0].toUpperCase() + palette.slice(1)}</option>)}</select></label><label>Geometry<select aria-label="Geometry" value={settings.shape} onChange={e => update({ shape: e.target.value as Settings['shape'] })}><option value="branches">Branching fractal</option><option value="rings">Concentric rings</option><option value="petals">Radial petals</option></select></label></div>
        {([{ key: 'intensity', label: 'Visual intensity', min: 5, max: 75 }, { key: 'density', label: 'Pattern density', min: 1, max: 5 }, { key: 'motion', label: 'Motion', min: 0, max: 50 }] as const).map(control => <div className="atmosphere-slider" key={control.key}><span><label htmlFor={`atmosphere-${control.key}`}>{control.label}</label><output>{settings[control.key]}{control.key === 'density' ? ' / 5' : '%'}</output></span><input id={`atmosphere-${control.key}`} type="range" min={control.min} max={control.max} value={settings[control.key]} onChange={e => update({ [control.key]: Number(e.target.value) })} /></div>)}
        <div className="atmosphere-audio"><div className="atmosphere-setting-grid"><label>Optional sound<select aria-label="Optional sound" value={settings.sound} onChange={e => update({ sound: e.target.value as Settings['sound'] })}><option value="rain">Soft rain texture</option><option value="drone">Warm drone</option></select></label><button type="button" className="crystal-secondary" aria-pressed={sound.playing} onClick={() => sound.playing ? sound.stop() : void sound.start()}><Volume2 size={16} />{sound.playing ? 'Stop sound' : 'Start sound'}</button></div><div className="atmosphere-slider"><span><label htmlFor="atmosphere-volume">Sound volume</label><output>{settings.volume}%</output></span><input id="atmosphere-volume" type="range" min="0" max="50" value={settings.volume} onChange={e => update({ volume: Number(e.target.value) })} /></div><p className="atmosphere-muted">Sound starts only when you choose it. Stops when you hide this view or tab. No therapeutic frequency claims.</p>{sound.error && <p role="alert">{sound.error}</p>}</div>
        <p className="atmosphere-status" role="status">{message}</p>{storageError && <p role="alert">{storageError}</p>}
        <button type="button" className="atmosphere-forget" onClick={forget}><RotateCcw size={14} />Forget my atmosphere preferences</button>
        <p className="atmosphere-muted">Chosen settings are stored for this account on this device. Public preview preferences are separate.</p>
      </div>
    </div>
    <details className="atmosphere-research"><summary><BookOpen size={19} /><span>The research behind the questions<small>Color · shapes · numbers · patterns · light</small></span><span className="atmosphere-research-open">Read studies</span></summary><div className="atmosphere-research-intro"><h3>What changes in the brain and body?</h3><p>Researchers have measured emotional ratings, skin conductance, muscle activity, EEG, fMRI and circadian responses under specific conditions. These studies inform questions we can test. They do not validate AIM’s presets or establish health benefits.</p></div><div className="atmosphere-studies">{research.map(study => <article key={study.topic}><p className="crystal-eyebrow">{study.topic}</p><h4>{study.citation}</h4><p>{study.finding}</p><p><strong>Limit:</strong> {study.limit}</p><p><strong>In AIM:</strong> {study.application}</p><a href={study.url} target="_blank" rel="noopener noreferrer">Read primary study<span className="sr-only">: {study.title}</span> ↗</a></article>)}</div><p className="atmosphere-research-footer">Next experiment: compare two settings for the same task, vary one control at a time, and record comfort and focus before and after. Self-reports can guide your preferences; they cannot establish biological mechanisms.</p></details>
  </section>;
}
