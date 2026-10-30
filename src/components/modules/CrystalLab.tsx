import { VoiceInput } from '../common/VoiceTextField';
import React, { useEffect, useRef, useState } from 'react';
import { Download, Play, RotateCcw, Waves, ArrowUpRight } from 'lucide-react';
import { DEFAULT_CRYSTAL_SETTINGS, type CrystalComparison, type CrystalSettings } from '../../types/optics';
import { requestCrystalComparison } from '../../services/crystalApi';

const numericFields = [
  ['nA', 'Material A · refractive index', 1, 3.5, 0.01],
  ['nB', 'Material B · refractive index', 1, 3.5, 0.01],
  ['dA', 'A thickness (nm)', 5, 1000, 1],
  ['dB', 'B thickness (nm)', 5, 1000, 1],
  ['layerCount', 'Layer count', 2, 40, 1],
  ['angle', 'Incident angle (°)', 0, 75, 1],
  ['defectNm', 'Air cavity (nm; 0 = off)', 0, 1000, 1],
] as const;

function SpectrumChart({ data, mode, wavelength }: { data: CrystalComparison; mode: 'reflection' | 'transmission'; wavelength: number }) {
  const path = (values: number[]) => values.map((v, i) => `${i ? 'L' : 'M'}${58 + i * 552 / 200},${248 - v * 210}`).join(' ');
  const base = mode === 'reflection' ? data.baseline : data.baseline.map(r => 1 - r);
  return <svg viewBox="0 0 640 300" role="img" aria-label={`${mode === 'reflection' ? 'Reflection' : 'Transmission'} versus wavelength, Fibonacci and ${data.control.label}`} className="crystal-spectrum">
    <desc>Calculated from the current submitted settings. Wavelength runs from 380 to 780 nanometers; the vertical scale is 0 to 100 percent. Use the wavelength slider for exact values.</desc>
    {[0, 25, 50, 75, 100].map(tick => <g key={tick}>
      <line x1="58" x2="610" y1={248 - tick * 2.1} y2={248 - tick * 2.1} stroke="#303348" strokeDasharray="3 6" />
      <text x="44" y={254 - tick * 2.1} textAnchor="end" fill="#acb2c7" fontSize="16">{tick}%</text>
    </g>)}
    {[380, 480, 580, 680, 780].map(tick => <text key={tick} x={58 + (tick - 380) * 552 / 400} y="278" textAnchor="middle" fill="#acb2c7" fontSize="16">{tick}</text>)}
    <path d={path(base)} fill="none" stroke="#96a0b7" strokeDasharray="5 6" strokeWidth="2" />
    <path data-testid="fibonacci-curve" d={path(data.fibonacci[mode])} fill="none" stroke="#b898ff" strokeWidth="3" />
    <path data-testid="control-curve" d={path(data.control[mode])} fill="none" stroke="#5ee3cf" strokeWidth="3" />
    <line x1={58 + (wavelength - 380) * 552 / 400} x2={58 + (wavelength - 380) * 552 / 400} y1="38" y2="248" stroke="#e0d6ff" strokeOpacity=".5" />
  </svg>;
}

export function CrystalLab() {
  const [settings, setSettings] = useState<CrystalSettings>({ ...DEFAULT_CRYSTAL_SETTINGS });
  const [data, setData] = useState<CrystalComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'reflection' | 'transmission'>('reflection');
  const [wavelength, setWavelength] = useState(550);
  const request = useRef<AbortController | null>(null);
  async function run(value: CrystalSettings) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true); setError(''); setData(null);
    try {
      const result = await requestCrystalComparison(value, controller.signal);
      if (!controller.signal.aborted) setData(result);
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Please try again.');
    } finally { if (!controller.signal.aborted) setLoading(false); }
  }
  useEffect(() => { void run({ ...DEFAULT_CRYSTAL_SETTINGS }); return () => request.current?.abort(); }, []);
  function change<K extends keyof CrystalSettings>(key: K, value: CrystalSettings[K]) {
    setSettings(previous => ({ ...previous, [key]: value })); setData(null); setError('');
  }
  function reset() {
    const defaults = { ...DEFAULT_CRYSTAL_SETTINGS };
    setSettings(defaults); setMode('reflection'); setWavelength(550); void run(defaults);
  }
  function download() {
    if (!data) return;
    const rows = ['wavelength_nm,fibonacci_R,fibonacci_T,control_R,control_T,bare_glass_R', ...data.wavelengths.map((w, i) => [w, data.fibonacci.reflection[i], data.fibonacci.transmission[i], data.control.reflection[i], data.control.transmission[i], data.baseline[i]].join(','))];
    const metadata = `# settings=${JSON.stringify(data.settings)}\n# fibonacci=${data.fibonacci.sequence};control=${data.control.sequence}\n`;
    const url = URL.createObjectURL(new Blob([metadata + rows.join('\n')], { type: 'text/csv' }));
    const link = document.createElement('a'); link.href = url; link.download = 'aim-layer-order-spectrum.csv'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const index = (wavelength - 380) / 2;
  return <section className="crystal-lab" aria-labelledby="crystal-lab-heading">
    <div className="crystal-section-heading"><div><p className="crystal-eyebrow"><Waves size={14} /> CRYSTAL LAB</p><h2 id="crystal-lab-heading">Compare layer order.</h2><p>Change the materials. Rearrange the layers. See what the light does.</p></div><span className="crystal-badge">Optical simulation</span></div>
    <div className="crystal-workbench">
      <form className="crystal-panel crystal-controls" onSubmit={event => { event.preventDefault(); void run(settings); }}>
        <div className="crystal-panel-heading"><h3>Your experiment</h3><button type="button" className="crystal-icon-button" onClick={reset} disabled={loading} aria-label="Reset experiment"><RotateCcw size={16} /></button></div>
        <fieldset disabled={loading}>
          <label className="crystal-wide">Material preset<select aria-label="Material preset" value="custom" onChange={e => {
            const next = e.target.value === 'glass' ? { ...DEFAULT_CRYSTAL_SETTINGS } : { ...DEFAULT_CRYSTAL_SETTINGS, nA: 2.35, nB: 1.45, dA: 85, dB: 135 };
            setSettings(next); setData(null); setError('');
          }}><option value="custom" disabled>Choose a preset or edit below</option><option value="glass">Glass / air</option><option value="contrast">High / low index dielectric</option></select></label>
          <div className="crystal-input-grid">{numericFields.map(([key, label, min, max, step]) => <label key={key}>{label}<VoiceInput required type="number" min={min} max={max} step={step} value={Number.isFinite(settings[key]) ? settings[key] : ''} onChange={e => change(key, e.target.value === '' ? NaN : Number(e.target.value))} /></label>)}</div>
          <label>Polarization<select value={settings.polarization} onChange={e => change('polarization', e.target.value as 's' | 'p')}><option value="s">s · perpendicular</option><option value="p">p · parallel</option></select></label>
          <label>Compare Fibonacci with<select value={settings.control} onChange={e => change('control', e.target.value as 'matched' | 'periodic')}><option value="matched">Same-count reordered control</option><option value="periodic">Periodic AB</option></select></label>
          <p className="crystal-help">{settings.control === 'matched' ? 'Same material amounts and total thickness. Only layer order changes.' : 'Periodic AB can have different material amounts. Compare the counts alongside the curves.'} A cavity adds the same central air layer to both stacks.</p>
          <button className="crystal-primary" type="submit"><Play size={15} />{loading ? 'Calculating…' : 'Run comparison'}<ArrowUpRight size={16} /></button>
        </fieldset>
      </form>
      <div className="crystal-results">
        <div className="crystal-panel crystal-chart-panel" aria-busy={loading}>
          <div className="crystal-panel-heading"><div><p className="crystal-eyebrow">380–780 nm</p><h3>Light, mapped.</h3></div><div className="crystal-segment" aria-label="Spectrum quantity"><button type="button" aria-pressed={mode === 'reflection'} onClick={() => setMode('reflection')}>Reflection</button><button type="button" aria-pressed={mode === 'transmission'} onClick={() => setMode('transmission')}>Transmission</button></div></div>
          {loading ? <div className="crystal-empty" role="status">Calculating your spectrum…</div> : error ? <div className="crystal-empty" role="alert"><p>{error}</p><button className="crystal-secondary" onClick={() => void run(settings)}>Try again</button></div> : data ? <>
            <div className="crystal-legend"><span className="fib">Fibonacci</span><span className="control">{data.control.label}</span><span className="baseline">Bare glass</span></div>
            <SpectrumChart data={data} mode={mode} wavelength={wavelength} />
            <p className="crystal-axis-caption">Wavelength (nanometers)</p>
            <label className="crystal-wave-inspector">Inspect wavelength <strong>{wavelength} nm</strong><input type="range" min="380" max="780" step="2" value={wavelength} onChange={e => setWavelength(Number(e.target.value))} aria-label="Inspect wavelength" /></label>
            <div className="crystal-readings" aria-live="polite"><div><span>Fibonacci</span><strong>{(data.fibonacci[mode][index] * 100).toFixed(2)}%</strong></div><div><span>{data.control.label}</span><strong>{(data.control[mode][index] * 100).toFixed(2)}%</strong></div><div><span>Bare glass</span><strong>{((mode === 'reflection' ? data.baseline[index] : 1 - data.baseline[index]) * 100).toFixed(2)}%</strong></div></div>
          </> : <div className="crystal-empty" role="status">Settings changed. Run comparison to calculate the new spectrum.</div>}
        </div>
        {data && <div className="crystal-panel crystal-stack-panel">
          <div className="crystal-panel-heading"><h3>The order makes the difference.</h3><button type="button" className="crystal-secondary" onClick={download}><Download size={15} />Export CSV</button></div>
          {[data.fibonacci, data.control].map(curve => <div className="crystal-stack" key={curve.label}><div><strong>{curve.label}</strong><span>{curve.countA} A / {curve.countB} B · {curve.thicknessNm.toFixed(0)} nm</span></div><div className="crystal-layers" aria-label={`${curve.label} layer order ${curve.sequence}`}>{[...curve.sequence].map((symbol, i) => <span key={i} className={`layer-${symbol}`} title={`Layer ${i + 1}: ${symbol}`} style={{ flex: symbol === 'A' ? data.settings.dA : symbol === 'B' ? data.settings.dB : data.settings.defectNm }}>{symbol}</span>)}</div></div>)}
          <p className="crystal-help" data-testid="energy-check">Lossless energy check · max |R + T − 1| = {data.energyError.toExponential(1)}</p>
        </div>}
        <p className="crystal-model-note">Ideal, nonabsorbing layers with constant refractive indices. Incident medium: air. Substrate: glass (n = 1.52). Calculated spectra describe this model; they do not establish mood or health effects.</p>
      </div>
    </div>
  </section>;
}
