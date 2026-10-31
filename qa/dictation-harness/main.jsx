import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GlobalQuickInput } from '../../src/components/common/GlobalQuickInput';
import { VoiceInput, VoiceTextarea } from '../../src/components/common/VoiceTextField';
import '../../src/index.css';
function Harness() {
  const [open, setOpen] = useState(true), [saved, setSaved] = useState([]);
  const [first, setFirst] = useState(''), [second, setSecond] = useState(''), [number, setNumber] = useState('');
  return <main className="p-4 max-w-lg mx-auto">
    <button onClick={() => setOpen(true)}>Open Quick Capture</button>
    <output aria-label="Saved captures">{JSON.stringify(saved)}</output>
    <GlobalQuickInput isOpen={open} onClose={() => setOpen(false)} onSaveMemory={x => setSaved(s => [...s, x.content])} onSaveTask={x => setSaved(s => [...s, x.task])} onToast={() => {}} />
    {!open && <form onSubmit={e => e.preventDefault()} className="space-y-4">
      <label>First field<VoiceInput aria-label="First field" value={first} onChange={e => setFirst(e.target.value)} className="p-3 bg-slate-900 text-white" /></label>
      <label>Second field<VoiceTextarea aria-label="Second field" maxLength={30} value={second} onChange={e => setSecond(e.target.value)} className="p-3 bg-slate-900 text-white" /></label>
      <label>Number<VoiceInput type="number" aria-label="Number" value={number} onChange={e => setNumber(e.target.value)} className="p-3 bg-slate-900 text-white" /></label>
      <VoiceInput aria-label="Read only" value="Fixed" readOnly />
    </form>}
  </main>;
}
createRoot(document.getElementById('root')).render(<Harness/>);
