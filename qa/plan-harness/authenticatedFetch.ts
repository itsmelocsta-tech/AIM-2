// Isolated fictional browser harness only; production authentication is unchanged.
export class AuthenticationError extends Error {}
export const authenticatedFetch = (path: string, init: RequestInit) => fetch(path, init);
