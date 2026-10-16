import { DEFAULT_PROFILE, DEFAULT_DAILY_PLAN } from '../../src/services/storage';
import { DEFAULT_PERSONAL_CONTEXT } from '../../src/services/aimContextService';
const user = { uid: 'fictional-wellness-user', email: 'fictional@example.invalid', isAnonymous: false };
export const useAuth = () => ({ user, loading: false, getIdToken: async () => null });
export const fetchEntitlement = async () => ({ plan: 'basic', status: 'free' });
const initialLogs = [{ id: 'fictional-log', date: '2026-10-01', sleepHours: 8, sleepQuality: 7, movementMinutes: 30, movementType: 'Walking', nutritionRating: 7, stressLevel: 2, focusHours: 3, timeInNatureMinutes: 20, notes: 'Fictional saved wellness note' }];
export const firestoreRepository = {
  getUserProfile: async () => ({ ...DEFAULT_PROFILE, ...user, id: user.uid, onboardingCompleted: true, firstRunGuideStep: 'done' }),
  getUserContext: async () => DEFAULT_PERSONAL_CONTEXT,
  getUserProjects: async () => [], getUserGoals: async () => [], getUserMemories: async () => [], getUserLifeUpdates: async () => [],
  getUserDailyPlan: async () => null,
  getUserWellness: async () => JSON.parse(localStorage.getItem('fictional-wellness') || JSON.stringify(initialLogs)),
  saveUserWellness: async (_uid: string, logs: unknown[]) => { localStorage.setItem('fictional-wellness', JSON.stringify(logs)); },
};
