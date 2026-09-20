import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'existing-user', email: 'test@example.com' } }),
}));
import { AuthModal } from '../src/components/auth/AuthModal';
it('shows a sign-in form after rejection even when Firebase still has a user', () => {
  const html = renderToStaticMarkup(<AuthModal isOpen onClose={() => {}} reauthenticationRequired />);
  expect(html).toContain('type="password"');
  expect(html).toContain('Your session could not be verified');
  expect(html).not.toContain('Isolated Cloud Storage Enabled');
});
it('keeps the normal account panel for a healthy signed-in user', () => {
  const html = renderToStaticMarkup(<AuthModal isOpen onClose={() => {}} />);
  expect(html).toContain('Sign Out of Account');
  expect(html).not.toContain('type="password"');
});
