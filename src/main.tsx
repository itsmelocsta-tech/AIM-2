import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import './index.css';
import { AccountDeletionPage } from './components/auth/AccountDeletionPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      {window.location.pathname === '/delete-account' ? <AccountDeletionPage /> : <App />}
    </AuthProvider>
  </StrictMode>,
);
