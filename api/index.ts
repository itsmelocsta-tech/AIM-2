import serverModule from '../dist/server.cjs';

const app = (serverModule as any).app ?? serverModule;
export default app;
