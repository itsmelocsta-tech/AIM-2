import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const forbidden = [];
function inspect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) inspect(path);
    else if (/^(server\.(mjs|js)(\.map)?|\.env.*)$/.test(entry.name)) forbidden.push(path);
  }
}
inspect('dist');
if (forbidden.length) throw new Error('Server code or environment files found in public build output.');
if (!existsSync('.server/server.mjs')) throw new Error('Private API bundle is missing.');
console.log('Public output contains no server bundle or server source map.');
