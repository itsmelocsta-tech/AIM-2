import { afterAll, beforeEach, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
const auth = vi.hoisted(() => ({ verify: vi.fn() }));
vi.mock('firebase-admin/app', () => ({ getApps: () => [{}], initializeApp: vi.fn() }));
vi.mock('firebase-admin/auth', () => ({ getAuth: () => ({ verifyIdToken: auth.verify }) }));
vi.mock('firebase-admin/firestore', () => ({ getFirestore: () => ({ doc: () => ({ get: async () => ({ data: () => ({ plan: 'premium', status: 'active' }) }) }) }) }));
beforeEach(() => { vi.resetModules(); vi.stubEnv('GEMINI_API_KEY',''); auth.verify.mockResolvedValue({uid:'test-user'}); });
afterAll(() => vi.unstubAllEnvs());
it('never disguises unavailable Gemini chat or plan generation as success', async () => {
 const { app } = await import('../server');
 const server: Server = app.listen(0,'127.0.0.1');
 await new Promise<void>(resolve => server.once('listening',resolve));
 const address = server.address() as {port:number};
 try {
   for (const [path,body] of [['chat',{message:'Help me plan tomorrow',userProfile:{}}],['plan',{type:'morning',goals:['Prepare for interview'],energyLevel:7,availableHours:4}] ] as const) {
     const response = await fetch('http://127.0.0.1:'+address.port+'/api/aim/'+path,{method:'POST',headers:{Authorization:'Bearer test-token','Content-Type':'application/json'},body:JSON.stringify(body)});
     expect(response.status).toBe(503);
     expect((await response.json()).code).toBe('AI_UNAVAILABLE');
   }
 } finally { await new Promise<void>((resolve,reject)=>server.close(err=>err?reject(err):resolve())); }
});
