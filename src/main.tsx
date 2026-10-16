import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import './index.css';
import { DashboardPreview } from './components/modules/AimDashboardModule';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {['/dashboard-preview', '/atmosphere-preview'].includes(window.location.pathname) ? <DashboardPreview atmosphere={window.location.pathname === '/atmosphere-preview'} /> : <AuthProvider>
      <App />
    </AuthProvider>}
  </StrictMode>,
);
