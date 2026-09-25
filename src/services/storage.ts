import {
  UserProfile,
  MemoryItem,
  Goal,
  DealPipelineItem,
  MonetizationOffer,
  DailyPlan,
  WellnessLog,
  ChatMessage,
  AIM_CATEGORIES,
  LifeUpdate,
} from '../types';

export const STORAGE_KEYS = {
  PROFILE: 'aim_user_profile',
  MEMORIES: 'aim_memories',
  GOALS: 'aim_goals',
  DEALS: 'aim_deals',
  OFFERS: 'aim_monetization_offers',
  DAILY_PLANS: 'aim_daily_plans',
  WELLNESS: 'aim_wellness_logs',
  CHAT: 'aim_chat_messages',
  ACTIVE_TAB: 'aim_active_tab',
  CALIBRATION: 'aim_calibration_state',
  LIFE_UPDATES: 'aim_life_updates',
  COACH_CONVERSATIONS: 'aim_coach_conversations_v1',
  SCHEDULE_ITEMS: 'aim_canonical_schedule_items',
  DRIVE_SYNC_FILES: 'aim_drive_synced_files',
  DRIVE_LAST_SYNC: 'aim_last_drive_sync',
  DRIVE_TOKEN: 'aim_google_drive_access_token',
  DRIVE_USER: 'aim_google_drive_user_email',
  VOICE_PREFS: 'aim_voice_preferences',
  CENTRAL_VOICE: 'aim_central_voice_config',
  GREETING_SESSION: 'aim_greeting_session_state',
  WEATHER_CACHE: 'aim_weather_cache',
  USER_LOCATION: 'aim_user_location',
};

export const DEFAULT_PROFILE: UserProfile = {
  name: '',
  email: '',
  desiredIdentity: '',
  coreMission: '',
  currentMonthlyIncome: 0,
  targetMonthlyIncome: 0,
  primaryObstacle: '',
  topSkills: [],
  coreValues: [],
  ninetyDayTrajectory: '',
  onboardingCompleted: false,
};

export const DEFAULT_MEMORIES: MemoryItem[] = [];

export const DEFAULT_GOALS: Goal[] = [];

export const DEFAULT_DEALS: DealPipelineItem[] = [];

export const DEFAULT_OFFERS: MonetizationOffer[] = [];

export const getTodayDateStr = () => new Date().toISOString().split('T')[0];

export const DEFAULT_DAILY_PLAN: DailyPlan = {
  date: getTodayDateStr(),
  theme: 'Clarity & Intentional Action',
  energyLevel: 8,
  availableHours: 6,
  priorityTasks: [],
  timeBlocks: [],
  mindsetReminder: 'Take one meaningful step at a time toward the person you want to become.',
  notes: '',
};

export const DEFAULT_WELLNESS: WellnessLog[] = [];

export const DEFAULT_CHAT: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'aim',
    content: `Hello. I am **AIM** (Artificial Intelligence for Manifestation) — your AI-powered personal life operating system.

I don't just remember what you said; I remember who you are trying to become.

To get started, **tell me about yourself. Don't hold back. I want the good, the bad, and the ugly.**`,
    timestamp: new Date().toISOString(),
    category: 'Journal',
  },
];

// Safe local storage abstraction that works in browser and test/SSR environments
const safeStorage = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
  removeItem(key: string): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

// Helper storage wrapper
export const storageService = {
  getProfile(): UserProfile {
    try {
      const data = safeStorage.getItem(STORAGE_KEYS.PROFILE);
      return data ? JSON.parse(data) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  saveProfile(profile: UserProfile): void {
    safeStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },

  getCalibration(userId?: string): { currentState: string; desiredState: string; result?: any } | null {
    if (!userId) return null;
    try {
      const data = safeStorage.getItem(`${STORAGE_KEYS.CALIBRATION}_${userId}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveCalibration(data: { currentState: string; desiredState: string; result?: any } | null, userId?: string): void {
    if (!userId) return;
    const key = `${STORAGE_KEYS.CALIBRATION}_${userId}`;
    if (!data) {
      safeStorage.removeItem(key);
    } else {
      safeStorage.setItem(key, JSON.stringify(data));
    }
  },

  getMemories(): MemoryItem[] {
    try {
      const data = safeStorage.getItem(STORAGE_KEYS.MEMORIES);
      return data ? JSON.parse(data) : DEFAULT_MEMORIES;
    } catch {
      return DEFAULT_MEMORIES;
    }
  },

  saveMemories(memories: MemoryItem[]): void {
    safeStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
  },

  getGoals(): Goal[] {
    try {
      const data = safeStorage.getItem(STORAGE_KEYS.GOALS);
      return data ? JSON.parse(data) : DEFAULT_GOALS;
    } catch {
      return DEFAULT_GOALS;
    }
  },

  saveGoals(goals: Goal[]): void {
    safeStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  },

  getDeals(): DealPipelineItem[] {
    try {
      const data = safeStorage.getItem(STORAGE_KEYS.DEALS);
      return data ? JSON.parse(data) : DEFAULT_DEALS;
    } catch {
      return DEFAULT_DEALS;
    }
  },

  saveDeals(deals: DealPipelineItem[]): void {
    safeStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(deals));
  },

  getOffers(): MonetizationOffer[] {
    try {
      const data = safeStorage.getItem(STORAGE_KEYS.OFFERS);
      return data ? JSON.parse(data) : DEFAULT_OFFERS;
    } catch {
      return DEFAULT_OFFERS;
    }
  },

  saveOffers(offers: MonetizationOffer[]): void {
    safeStorage.setItem(STORAGE_KEYS.OFFERS, JSON.stringify(offers));
  },

  getDailyPlan(dateStr: string = getTodayDateStr()): DailyPlan {
    try {
      const data = safeStorage.getItem(`${STORAGE_KEYS.DAILY_PLANS}_${dateStr}`);
      return data ? JSON.parse(data) : { ...DEFAULT_DAILY_PLAN, date: dateStr };
    } catch {
      return { ...DEFAULT_DAILY_PLAN, date: dateStr };
    }
  },

  saveDailyPlan(plan: DailyPlan): void {
    safeStorage.setItem(`${STORAGE_KEYS.DAILY_PLANS}_${plan.date}`, JSON.stringify(plan));
  },

  getWellnessLogs(): WellnessLog[] {
    try {
      const data = safeStorage.getItem(STORAGE_KEYS.WELLNESS);
      return data ? JSON.parse(data) : DEFAULT_WELLNESS;
    } catch {
      return DEFAULT_WELLNESS;
    }
  },

  saveWellnessLogs(logs: WellnessLog[]): void {
    safeStorage.setItem(STORAGE_KEYS.WELLNESS, JSON.stringify(logs));
  },

  getChatMessages(): ChatMessage[] {
    try {
      const data = safeStorage.getItem(STORAGE_KEYS.CHAT);
      return data ? JSON.parse(data) : DEFAULT_CHAT;
    } catch {
      return DEFAULT_CHAT;
    }
  },

  saveChatMessages(messages: ChatMessage[]): void {
    safeStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(messages));
  },

  getLifeUpdates(): LifeUpdate[] {
    try {
      const data = safeStorage.getItem(STORAGE_KEYS.LIFE_UPDATES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveLifeUpdates(updates: LifeUpdate[]): void {
    safeStorage.setItem(STORAGE_KEYS.LIFE_UPDATES, JSON.stringify(updates));
  },

  /**
   * Completely clears all saved user information, history, and state across storage
   * Restores pristine new-user initial state
   */
  clearAllData(): void {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        // Remove all AIM-specific keys
        Object.values(STORAGE_KEYS).forEach((key) => {
          safeStorage.removeItem(key);
        });

        // Also clean any date-keyed daily plans
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('aim_') || k.startsWith('coach_'))) {
            safeStorage.removeItem(k);
          }
        }

        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.clear();
        }
      }
    } catch (e) {
      console.warn('[storageService] Failed to clear all data:', e);
    }
  },
};
