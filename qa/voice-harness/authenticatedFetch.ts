// Isolated harness only. This fixture is resolved by voice.vite.config.mjs,
// never by the production Vite config. No Firebase session or credentials.
export const authenticatedFetch = (path: string, init: RequestInit) => fetch(path, init);
