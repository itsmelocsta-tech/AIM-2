import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import server from '../api/server.cjs';

assert.equal(typeof server.app, 'function', 'Vercel bundle must export the Express application');
await assert.rejects(access(new URL('../dist/server.cjs', import.meta.url)), 'Server bundle must stay outside public output');
const listener = server.app.listen(0, '127.0.0.1');
await new Promise(resolve => listener.once('listening', resolve));
try {
  const base = `http://127.0.0.1:${listener.address().port}`;
  assert.equal((await fetch(`${base}/api/health`)).status, 200);
  for (const route of ['config', 'status']) {
    assert.equal((await fetch(`${base}/api/aim/billing/${route}`)).status, 401);
  }
  assert.equal((await fetch(`${base}/api/aim/billing/verify`, { method: 'POST' })).status, 401);
  console.log('Packaged Vercel API: health 200; unsigned billing routes 401.');
} finally {
  await new Promise((resolve, reject) => listener.close(error => error ? reject(error) : resolve()));
}
