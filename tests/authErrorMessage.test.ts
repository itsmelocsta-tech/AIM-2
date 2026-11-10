import { describe, it, expect } from 'vitest';
import { authErrorMessage } from '../src/services/authErrorMessage';

describe('authentication recovery guidance', () => {
  it('routes an existing-email signup toward sign-in', () => {
    expect(authErrorMessage({ code: 'auth/email-already-in-use' }, 'Try again.')).toBe('This email already has an AIM account. Choose Sign In to continue.');
  });
  it('does not disclose whether a failed sign-in email exists', () => {
    expect(authErrorMessage({ code: 'auth/user-not-found' }, '')).toBe(authErrorMessage({ code: 'auth/wrong-password' }, ''));
  });
  it('gives distinct recovery for connectivity, popups and unsupported addresses', () => {
    expect(authErrorMessage({ code: 'auth/network-request-failed' }, '')).toContain('internet connection');
    expect(authErrorMessage({ code: 'auth/popup-blocked' }, '')).toContain('Allow pop-ups');
    expect(authErrorMessage({ code: 'auth/unauthorized-domain' }, '')).toContain('email instead');
  });
  it('never displays an unknown provider message containing private diagnostics', () => {
    for (const error of [null, 'private diagnostics', { code: 'unknown', message: 'secret endpoint and account details' }]) {
      expect(authErrorMessage(error, 'Please try again.')).toBe('Please try again.');
    }
  });
});
