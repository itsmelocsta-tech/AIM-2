import server from './server.cjs';

// Load the bundled CommonJS API explicitly: Node must not resolve ../server as a directory.
export default server.app;
