/** Show recovery guidance without leaking provider messages or account details. */
export function authErrorMessage(error: unknown, fallback: string): string {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'This email already has an AIM account. Choose Sign In to continue.',
    'auth/invalid-email': 'Check your email address and try again.',
    'auth/weak-password': 'Choose a password with at least six characters.',
    'auth/invalid-credential': 'Your email or password didn’t match. Check them and try again.',
    'auth/wrong-password': 'Your email or password didn’t match. Check them and try again.',
    'auth/user-not-found': 'Your email or password didn’t match. Check them and try again.',
    'auth/too-many-requests': 'There have been too many attempts. Wait a little, then try again.',
    'auth/network-request-failed': 'Check your internet connection, then try again.',
    'auth/popup-closed-by-user': 'The Google sign-in window closed. Try again when you’re ready.',
    'auth/popup-blocked': 'Allow pop-ups for AIM, then try Google sign-in again.',
    'auth/unauthorized-domain': 'Google sign-in isn’t ready on this AIM address yet. You can use email instead.',
    'auth/operation-not-allowed': 'This sign-in option isn’t available right now. Try another option.',
  };
  return messages[code] || fallback;
}
