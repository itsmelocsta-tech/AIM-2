import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { VoiceSettingsModal } from '../../src/components/coach/VoiceSettingsModal';
import '../../src/index.css';
function Harness() {
  const [open, setOpen] = useState(true);
  return <><button onClick={() => setOpen(true)}>Voice settings</button><VoiceSettingsModal isOpen={open} onClose={() => setOpen(false)} onToast={() => {}} /></>;
}
createRoot(document.getElementById('root')).render(<Harness/>);
