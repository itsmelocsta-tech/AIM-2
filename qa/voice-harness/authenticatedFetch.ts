// Isolated harness only. This fixture is resolved by voice.vite.config.mjs,
// never by the production Vite config. No Firebase session or credentials.
export const authenticatedFetch = (path: string, init: RequestInit) => fetch(path, init);
// Match the production module's named API so actual onboarding can load here.
export class AuthenticationError extends Error {}
