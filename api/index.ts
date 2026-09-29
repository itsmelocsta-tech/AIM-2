import server from './server.cjs';

// The Vite frontend stays static; every /api/* request reaches this Function.
export default server.app;
