import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import server from '../api/server.cjs';

assert.equal(typeof server.app, 'function', 'Vercel bundle must export the Express application');
for (const path of ['server.cjs', 'server.cjs.map']) {
  await assert.rejects(access(new URL(`../dist/${path}`, import.meta.url)), 'Server bundle must stay outside public output');
}
const listener = server.app.listen(0, '127.0.0.1');
await new Promise(resolve => listener.once('listening', resolve));
try {
  const base = `http://127.0.0.1:${listener.address().port}`;
  const health = await fetch(`${base}/api/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, 'ok');
  assert.equal((await fetch(`${base}/api/aim/jobs/scan`, { method: 'POST' })).status, 401);
  assert.equal((await fetch(`${base}/api/aim/voice/format-spoken`, { method: 'POST' })).status, 401);
  console.log('Packaged Vercel API: health 200; unsigned job scan and voice routes 401.');
} finally {
  await new Promise((resolve, reject) => listener.close(error => error ? reject(error) : resolve()));
}
