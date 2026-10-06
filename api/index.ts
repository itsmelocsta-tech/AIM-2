import serverModule from '../dist/server.mjs';

const app = (serverModule as any).app ?? serverModule;
export default app;
