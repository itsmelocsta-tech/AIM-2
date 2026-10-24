import React from 'react';
import { createRoot } from 'react-dom/client';
import { OpportunityScannerModule } from '../../src/components/modules/OpportunityScannerModule';
import { DEFAULT_PERSONAL_CONTEXT } from '../../src/services/aimContextService';
import '../../src/index.css';

const context = { ...DEFAULT_PERSONAL_CONTEXT, opportunityFocus: {
  category: 'jobs', description: 'Fictional scanner regression review', location: 'Example City',
} };
createRoot(document.getElementById('root')).render(<main className="min-h-screen bg-slate-950 p-3 text-white">
  <p>Fictional opportunity scan fixture; responses are controlled by Playwright.</p>
  <OpportunityScannerModule context={context} onSaveContext={async () => {}} onToast={() => {}} />
</main>);
