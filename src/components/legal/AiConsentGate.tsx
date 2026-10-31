import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AILimitedUseNotice } from './LegalPages';

export function AiConsentGate({ children }: { children: React.ReactNode }) {
  const { user, loading, logOut } = useAuth();
  const [acceptedId, setAcceptedId] = useState<string | null>(null);
  const key = user ? `aim_ai_consent_v1:${user.uid}` : '';
  let saved = false;
  try { saved = Boolean(key && localStorage.getItem(key) === 'accepted'); } catch { /* Session-only consent works without storage. */ }
  if (!loading && user && acceptedId !== user.uid && !saved) {
    return <AILimitedUseNotice onSignOut={() => { void logOut(); }} onContinue={() => {
      try { localStorage.setItem(key, 'accepted'); } catch { /* Do not block a private browsing session. */ }
      setAcceptedId(user.uid);
    }} />;
  }
  return <>{children}</>;
}
