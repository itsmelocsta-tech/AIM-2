import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import './index.css';
import { DashboardPreview } from './components/modules/AimDashboardModule';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {window.location.pathname === '/dashboard-preview' ? <DashboardPreview /> : <AuthProvider>
      <App />
    </AuthProvider>}
  </StrictMode>,
);
