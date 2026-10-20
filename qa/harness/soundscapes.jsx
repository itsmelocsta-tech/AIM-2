import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FractalSoundscapes } from '../../src/components/modules/FractalSoundscapes';
import '../../src/index.css';
function Harness() {
  const [visible, setVisible] = useState(true);
  return <main className="max-w-xl mx-auto p-4 space-y-4">
    <button className="text-white min-h-11" onClick={() => setVisible(value => !value)}>{visible ? 'Leave Settings' : 'Open Settings'}</button>
    {visible && <FractalSoundscapes />}
  </main>;
}
createRoot(document.getElementById('root')).render(<Harness />);
