import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import './index.css';
import { DashboardPreview } from './components/modules/AimDashboardModule';
import { PrivacyPolicyPage, TermsOfUsePage } from './components/legal/LegalPages';
import { AccountDeletionPage } from './components/auth/AccountDeletionPage';
import { AiConsentGate } from './components/legal/AiConsentGate';

const path = window.location.pathname.replace(/\/$/, '') || '/';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {path === '/privacy' ? <PrivacyPolicyPage /> : path === '/terms' ? <TermsOfUsePage /> : ['/dashboard-preview', '/atmosphere-preview'].includes(path) ? <DashboardPreview atmosphere={path === '/atmosphere-preview'} /> : <AuthProvider>
      {path === '/delete-account' ? <AccountDeletionPage /> : <AiConsentGate><App /></AiConsentGate>}
    </AuthProvider>}
  </StrictMode>,
);
