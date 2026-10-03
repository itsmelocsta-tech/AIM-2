import type { Page } from '@playwright/test';

// Browser-only transport doubles. Production code and configuration never import these.
export async function mockServices(page: Page) {
  await page.route('**/src/services/firebaseClient.ts', route => route.fulfill({ contentType: 'text/javascript', body: `
    let listener;
    const user = () => localStorage.getItem('test:session') ? { uid: 'browser-user', email: 'calm@example.test', displayName: 'Taylor', isAnonymous: false } : null;
    export const auth = {}; export const db = {}; export const googleProvider = {};
    export function onAuthStateChanged(_, cb) { listener = cb; cb(user()); return () => { listener = null; }; }
    async function login() { localStorage.setItem('test:session', 'yes'); listener?.(user()); return {user: user(), error:null}; }
    export const signInWithGoogle = login, signInWithEmail = login, signUpWithEmail = login, signInAsGuest = login;
    export async function logOut() { localStorage.removeItem('test:session'); listener?.(null); return {error:null}; }
    export async function getIdToken() { return user() ? 'browser-test-token' : null; }
  ` }));
  await page.route('**/src/services/repositories/firestoreRepository.ts', route => route.fulfill({ contentType: 'text/javascript', body: `
    const read = () => JSON.parse(localStorage.getItem('test:remote') || '{}');
    const save = data => localStorage.setItem('test:remote', JSON.stringify({...read(), ...data}));
    export const firestoreRepository = new Proxy({
      getUserProfile: async () => read().profile || null,
      saveUserProfile: async (_, profile) => { if(localStorage.getItem('test:save-fails')) throw Error('offline'); save({profile}); },
      getUserDailyPlan: async () => read().plan || null,
      getUserGoals: async () => read().goals || [],
      getUserMemories: async () => read().memory ? [read().memory] : [],
      saveConfirmedOnboarding: async (_, data) => save(data),
    }, { get: (target, key) => target[key] || (async () => null) });
  ` }));
  await page.route('**/api/aim/**', route => route.fulfill({ status: 503, json: { error: 'Analysis unavailable in browser test' } }));
  await page.route('**/*googleapis.com/**', route => route.abort());
}
export const analysis = {
  recommendedOptionId: 'test-path',
  analysis: { coreGapSummary: 'A steadier work routine', empoweringInsight: 'Start with your application.', hiddenStrengths: [], primaryBottlenecks: [] },
  synthesizedProfile: { desiredIdentity: 'A certified technician', coreMission: 'Find steady work', topSkills: [], coreValues: [] },
  pathways: [{ id: 'test-path', title: 'Start with training', tagline: 'One application', whyItFits: 'Fits your stated goal', actionPlan48h: ['Call the training center'], obstaclesNeutralized: [], projected30DayOutcome: 'Build a routine' }],
  suggestedInitialGoals: [],
  suggestedTodayTasks: [{ task: 'Call the training center', category: 'Career', timeEstimate: '15m', impact: 'High' }],
};
export async function signUp(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started', exact: true }).click();
  await page.getByRole('button', { name: 'Create Account', exact: true }).click();
  await page.locator('input[type=email]').fill('calm@example.test');
  await page.locator('input[type=password]').fill('test-only-password');
  await page.getByRole('button', { name: 'Create Isolated Account' }).click();
}
export async function answerQuestions(page: Page) {
  await page.locator('#aim-current-state-textarea').fill('I am looking for steady work.');
  await page.locator('#aim-onboarding-step-1 button[type=submit]').click();
  await page.locator('#aim-changes-wanted-textarea').fill('I want a better work routine.');
  await page.locator('#aim-onboarding-step-2 button[type=submit]').click();
  await page.locator('#aim-desired-state-textarea').fill('I want to become a certified technician.');
  await page.locator('#aim-onboarding-step-3 button[type=submit]').click();
}
