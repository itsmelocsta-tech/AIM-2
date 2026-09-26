import { OnboardingDraft } from '../storage';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  writeBatch,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../firebaseClient';
import {
  UserProfile,
  ScheduleItem,
  Goal,
  MemoryItem,
  WellnessLog,
  LifeUpdate,
  AIMProject,
  PersonalOperatingContext,
  DailyPlan,
} from '../../types';

export const firestoreRepository = {
  async getOnboardingDraft(userId: string): Promise<OnboardingDraft | null> {
    const snap = await getDoc(doc(db, 'users', userId, 'settings', 'onboardingDraft'));
    return snap.exists() ? snap.data() as OnboardingDraft : null;
  },

  async saveOnboardingDraft(userId: string, draft: OnboardingDraft): Promise<void> {
    if (!userId) throw new Error('Sign in to save your answers.');
    const ref = doc(db, 'users', userId, 'settings', 'onboardingDraft');
    await runTransaction(db, async (transaction) => {
      const existing = await transaction.get(ref);
      // A timed-out request may complete late. Never overwrite a newer draft.
      if (existing.exists() && (existing.data().updatedAt ?? 0) > (draft.updatedAt ?? 0)) return;
      transaction.set(ref, JSON.parse(JSON.stringify(draft)));
    });
  },

  async saveGuideStep(userId: string, step: NonNullable<UserProfile['firstRunGuideStep']>): Promise<void> {
    if (!userId) throw new Error('Sign in to save your progress.');
    await setDoc(doc(db, 'users', userId), {
      firstRunGuideStep: step, updatedAt: new Date().toISOString(),
    }, { merge: true });
  },

  // User Profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) return null;
    const ref = doc(db, 'users', userId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  },

  async saveUserProfile(userId: string, profile: UserProfile): Promise<void> {
    if (!userId) return;
    const ref = doc(db, 'users', userId);
    await setDoc(ref, { ...profile, updatedAt: new Date().toISOString() }, { merge: true });
  },

  // Personal Operating Context
  async getUserContext(userId: string): Promise<PersonalOperatingContext | null> {
    if (!userId) return null;
    const ref = doc(db, 'users', userId, 'settings', 'context');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as PersonalOperatingContext;
    }
    return null;
  },

  async saveUserContext(userId: string, context: PersonalOperatingContext): Promise<void> {
    if (!userId) return;
    const ref = doc(db, 'users', userId, 'settings', 'context');
    await setDoc(ref, context, { merge: true });
  },

  // Projects
  async getUserProjects(userId: string): Promise<AIMProject[]> {
    if (!userId) return [];
    const colRef = collection(db, 'users', userId, 'projects');
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as AIMProject);
  },

  async saveUserProject(userId: string, project: AIMProject): Promise<void> {
    if (!userId || !project.id) return;
    const ref = doc(db, 'users', userId, 'projects', project.id);
    await setDoc(ref, project, { merge: true });
  },

  async deleteUserProject(userId: string, projectId: string): Promise<void> {
    if (!userId || !projectId) return;
    const ref = doc(db, 'users', userId, 'projects', projectId);
    await deleteDoc(ref);
  },

  async saveAllUserProjects(userId: string, projects: AIMProject[]): Promise<void> {
    if (!userId) return;
    const batch = writeBatch(db);
    for (const project of projects) {
      if (project.id) {
        const ref = doc(db, 'users', userId, 'projects', project.id);
        batch.set(ref, project, { merge: true });
      }
    }
    await batch.commit();
  },

  async saveUserProjects(userId: string, projects: AIMProject[]): Promise<void> {
    return this.saveAllUserProjects(userId, projects);
  },

  // Schedule Items
  async getUserSchedules(userId: string): Promise<ScheduleItem[]> {
    if (!userId) return [];
    const colRef = collection(db, 'users', userId, 'schedules');
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as ScheduleItem);
  },

  async saveUserScheduleItem(userId: string, item: ScheduleItem): Promise<void> {
    if (!userId || !item.id) return;
    const ref = doc(db, 'users', userId, 'schedules', item.id);
    await setDoc(ref, item, { merge: true });
  },

  async deleteUserScheduleItem(userId: string, itemId: string): Promise<void> {
    if (!userId || !itemId) return;
    const ref = doc(db, 'users', userId, 'schedules', itemId);
    await deleteDoc(ref);
  },

  // Goals
  async getUserGoals(userId: string): Promise<Goal[]> {
    if (!userId) return [];
    const colRef = collection(db, 'users', userId, 'goals');
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as Goal);
  },

  async saveUserGoal(userId: string, goal: Goal): Promise<void> {
    if (!userId || !goal.id) return;
    const ref = doc(db, 'users', userId, 'goals', goal.id);
    await setDoc(ref, goal, { merge: true });
  },

  async deleteUserGoal(userId: string, goalId: string): Promise<void> {
    if (!userId || !goalId) return;
    const ref = doc(db, 'users', userId, 'goals', goalId);
    await deleteDoc(ref);
  },

  async saveUserGoals(userId: string, goals: Goal[]): Promise<void> {
    if (!userId) return;
    const batch = writeBatch(db);
    for (const goal of goals) {
      if (goal.id) {
        const ref = doc(db, 'users', userId, 'goals', goal.id);
        batch.set(ref, goal, { merge: true });
      }
    }
    await batch.commit();
  },

  // Memories
  async getUserMemories(userId: string): Promise<MemoryItem[]> {
    if (!userId) return [];
    const colRef = collection(db, 'users', userId, 'memories');
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as MemoryItem);
  },

  async saveUserMemory(userId: string, memory: MemoryItem): Promise<void> {
    if (!userId || !memory.id) return;
    const ref = doc(db, 'users', userId, 'memories', memory.id);
    await setDoc(ref, memory, { merge: true });
  },

  async deleteUserMemory(userId: string, memoryId: string): Promise<void> {
    if (!userId || !memoryId) return;
    const ref = doc(db, 'users', userId, 'memories', memoryId);
    await deleteDoc(ref);
  },

  async saveUserMemories(userId: string, memories: MemoryItem[]): Promise<void> {
    if (!userId) return;
    const batch = writeBatch(db);
    for (const mem of memories) {
      if (mem.id) {
        const ref = doc(db, 'users', userId, 'memories', mem.id);
        batch.set(ref, mem, { merge: true });
      }
    }
    await batch.commit();
  },

  // Wellness Logs
  async getUserWellness(userId: string): Promise<WellnessLog[]> {
    if (!userId) return [];
    const colRef = collection(db, 'users', userId, 'wellness');
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as WellnessLog);
  },

  async saveUserWellness(userId: string, log: WellnessLog | WellnessLog[]): Promise<void> {
    if (!userId) return;
    if (Array.isArray(log)) {
      const batch = writeBatch(db);
      for (const item of log) {
        if (item.id) {
          const ref = doc(db, 'users', userId, 'wellness', item.id);
          batch.set(ref, item, { merge: true });
        }
      }
      await batch.commit();
    } else if (log.id) {
      const ref = doc(db, 'users', userId, 'wellness', log.id);
      await setDoc(ref, log, { merge: true });
    }
  },

  // Life Updates
  async getUserLifeUpdates(userId: string): Promise<LifeUpdate[]> {
    if (!userId) return [];
    const colRef = collection(db, 'users', userId, 'life_updates');
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as LifeUpdate);
  },

  async saveUserLifeUpdate(userId: string, update: LifeUpdate): Promise<void> {
    if (!userId || !update.id) return;
    const ref = doc(db, 'users', userId, 'life_updates', update.id);
    await setDoc(ref, update, { merge: true });
  },

  async saveUserLifeUpdates(userId: string, updates: LifeUpdate[]): Promise<void> {
    if (!userId) return;
    const batch = writeBatch(db);
    for (const item of updates) {
      if (item.id) {
        const ref = doc(db, 'users', userId, 'life_updates', item.id);
        batch.set(ref, item, { merge: true });
      }
    }
    await batch.commit();
  },

  // Daily Plans
  async getUserDailyPlan(userId: string, date: string): Promise<DailyPlan | null> {
    if (!userId || !date) return null;
    const ref = doc(db, 'users', userId, 'daily_plans', date);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as DailyPlan;
    }
    return null;
  },

  async saveUserDailyPlan(userId: string, plan: DailyPlan): Promise<void> {
    if (!userId || !plan?.date) return;
    const ref = doc(db, 'users', userId, 'daily_plans', plan.date);
    await setDoc(ref, plan, { merge: true });
  },

  /** Save a confirmed reroute as one cloud operation before reporting success. */
  async saveConfirmedReroute(userId: string, data: {
    plan: DailyPlan;
    update: LifeUpdate;
    memory: MemoryItem;
    goals?: Goal[];
    profile?: UserProfile;
  }): Promise<void> {
    if (!userId || !data.plan.date || !data.update.id || !data.memory.id) {
      throw new Error('Cannot save a reroute without a user and complete plan.');
    }
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', userId, 'daily_plans', data.plan.date), data.plan, { merge: true });
    batch.set(doc(db, 'users', userId, 'life_updates', data.update.id), data.update, { merge: true });
    batch.set(doc(db, 'users', userId, 'memories', data.memory.id), data.memory, { merge: true });
    for (const goal of data.goals || []) {
      if (goal.id) batch.set(doc(db, 'users', userId, 'goals', goal.id), goal, { merge: true });
    }
    if (data.profile) {
      batch.set(doc(db, 'users', userId), { ...data.profile, updatedAt: new Date().toISOString() }, { merge: true });
    }
    await batch.commit();
  },

  /** A new account becomes onboarded only when its profile and starting plan save together. */
  async saveConfirmedOnboarding(userId: string, data: {
    profile: UserProfile;
    plan: DailyPlan;
    goals: Goal[];
    memory: MemoryItem;
  }): Promise<void> {
    if (!userId || data.profile.id !== userId || !data.plan.date || !data.memory.id ||
        !data.profile.onboardingCompleted) {
      throw new Error('Starting plan is incomplete.');
    }
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', userId), { ...data.profile, updatedAt: new Date().toISOString() }, { merge: true });
    batch.set(doc(db, 'users', userId, 'daily_plans', data.plan.date), data.plan, { merge: true });
    batch.set(doc(db, 'users', userId, 'memories', data.memory.id), data.memory, { merge: true });
    for (const goal of data.goals) {
      if (goal.id) batch.set(doc(db, 'users', userId, 'goals', goal.id), goal, { merge: true });
    }
    await batch.commit();
  },

  async saveLifeNote(userId: string, update: LifeUpdate, memory: MemoryItem): Promise<void> {
    if (!userId || !update.id || !memory.id) throw new Error('Life update is incomplete.');
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', userId, 'life_updates', update.id), update, { merge: true });
    batch.set(doc(db, 'users', userId, 'memories', memory.id), memory, { merge: true });
    await batch.commit();
  },

  // Account Export (Full Data Portability)
  async exportAllUserData(userId: string) {
    if (!userId) throw new Error('User ID is required for export');
    const [profile, context, projects, schedules, goals, memories, wellness, lifeUpdates] = await Promise.all([
      this.getUserProfile(userId),
      this.getUserContext(userId),
      this.getUserProjects(userId),
      this.getUserSchedules(userId),
      this.getUserGoals(userId),
      this.getUserMemories(userId),
      this.getUserWellness(userId),
      this.getUserLifeUpdates(userId),
    ]);

    return {
      exportTimestamp: new Date().toISOString(),
      userId,
      profile,
      context,
      projects,
      schedules,
      goals,
      memories,
      wellness,
      lifeUpdates,
    };
  },

  // Account Deletion (GDPR / Privacy Compliance)
  async deleteAllUserData(userId: string): Promise<void> {
    if (!userId) return;
    const collectionsToClear = ['projects', 'schedules', 'goals', 'memories', 'wellness', 'life_updates'];
    for (const colName of collectionsToClear) {
      const snap = await getDocs(collection(db, 'users', userId, colName));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    await deleteDoc(doc(db, 'users', userId, 'settings', 'onboardingDraft'));
    // Delete context
    await deleteDoc(doc(db, 'users', userId, 'settings', 'context')).catch(() => {});
    // Delete profile
    await deleteDoc(doc(db, 'users', userId)).catch(() => {});
  },
};
