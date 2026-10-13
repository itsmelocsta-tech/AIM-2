import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import './index.css';
import { AccountDeletionPage } from './components/auth/AccountDeletionPage';
import { PrivacyPolicyPage, TermsOfUsePage } from './components/legal/LegalPages';

const path = window.location.pathname.replace(/\/$/, '') || '/';
const publicPage = path === '/privacy'
  ? <PrivacyPolicyPage />
  : path === '/terms'
    ? <TermsOfUsePage />
    : null;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {publicPage || (
      <AuthProvider>
        {path === '/delete-account' ? <AccountDeletionPage /> : <App />}
      </AuthProvider>
    )}
  </StrictMode>,
);
