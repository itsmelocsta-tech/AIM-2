import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
const generation = vi.hoisted(() => ({ run: vi.fn() }));
vi.mock('../server/generateWithFallback', () => ({ generateWithFallback: generation.run }));
vi.mock('firebase-admin/app', () => ({ getApps: () => [{}], initializeApp: vi.fn() }));
vi.mock('firebase-admin/auth', () => ({ getAuth: () => ({ verifyIdToken: async () => ({ uid: 'fictional-planning' }) }) }));
vi.mock('firebase-admin/firestore', () => ({ getFirestore: () => ({ doc: () => ({ get: async () => ({ data: () => ({ plan: 'premium', status: 'active' }) }) }) }) }));
let server: Server;
let base: string;
beforeEach(async () => {
  vi.resetModules(); generation.run.mockReset(); vi.stubEnv('GEMINI_API_KEY', 'fictional-not-a-key');
  const { app } = await import('../server'); server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
afterEach(async () => { vi.unstubAllEnvs(); await new Promise<void>(resolve => server.close(() => resolve())); });
const request = (body: unknown, path = 'plan') => fetch(`${base}/api/aim/${path}`, {
  method: 'POST', headers: { Authorization: 'Bearer fictional', 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
const input = { type: 'morning', energyLevel: 2, availableHours: 0.25, goals: ['Write one paragraph'] };
const output = () => ({ theme: 'One paragraph', topThreePriorityTasks: [{ task: 'Write a paragraph', description: 'Open the draft. Write and save one paragraph.', timeEstimate: '15m' }], timeBlocks: [{ time: '10:00 - 10:15', title: 'Draft', details: 'Write and save one paragraph.' }] });
it('honors a zero-time morning without using AI or deleting existing tasks', async () => {
  const response = await request({ ...input, availableHours: 0 });
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ topThreePriorityTasks: [], timeBlocks: [] });
  expect(generation.run).not.toHaveBeenCalled();
});
it('rejects invalid requests before model use', async () => {
  for (const changes of [{ availableHours: -1 }, { availableHours: '2' }, { goals: 'write' }, { type: 'unknown' }]) {
    expect((await request({ ...input, ...changes })).status).toBe(400);
  }
  expect(generation.run).not.toHaveBeenCalled();
});
it('accepts a usable short plan and supplies actual capacity and resource constraints to the model', async () => {
  generation.run.mockResolvedValue({ text: JSON.stringify(output()) });
  const response = await request(input); expect(response.status).toBe(200);
  expect((await response.json()).topThreePriorityTasks).toHaveLength(1);
  const prompt = generation.run.mock.calls[0][1].contents;
  expect(prompt).toContain('0.25'); expect(prompt).toContain('Energy level: 2/10');
  expect(prompt).toContain('Do not introduce paid tools, a car');
});
it('rejects overloaded or overlapping AI output instead of presenting a successful plan', async () => {
  const overloaded = output(); overloaded.topThreePriorityTasks[0].timeEstimate = '2h';
  const overlap = output(); overlap.timeBlocks.push({ ...overlap.timeBlocks[0], time: '10:10 - 10:15' });
  for (const result of [overloaded, overlap]) {
    generation.run.mockResolvedValue({ text: JSON.stringify(result) });
    const response = await request(input); expect(response.status).toBe(503);
    expect(await response.json()).not.toHaveProperty('topThreePriorityTasks');
  }
});
it('does not return a malformed offer as success', async () => {
  generation.run.mockResolvedValue({ text: '{}' });
  const response = await request({ skills: 'Writing', targetNiche: 'Local businesses' }, 'monetize');
  expect(response.status).toBe(503); expect(await response.json()).not.toHaveProperty('pricingTiers');
});
