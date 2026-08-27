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

const STORAGE_KEYS = {
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
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'User',
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

const DEFAULT_MEMORIES: MemoryItem[] = [];

const DEFAULT_GOALS: Goal[] = [];

const DEFAULT_DEALS: DealPipelineItem[] = [];

const DEFAULT_OFFERS: MonetizationOffer[] = [];

const todayStr = new Date().toISOString().split('T')[0];

const DEFAULT_DAILY_PLAN: DailyPlan = {
  date: todayStr,
  theme: 'Clarity & Intentional Action',
  energyLevel: 8,
  availableHours: 6,
  priorityTasks: [],
  timeBlocks: [],
  mindsetReminder: 'Take one meaningful step at a time toward the person you want to become.',
  notes: '',
};

const DEFAULT_WELLNESS: WellnessLog[] = [];

const DEFAULT_CHAT: ChatMessage[] = [
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

// Helper storage wrapper
export const storageService = {
  getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return data ? JSON.parse(data) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  saveProfile(profile: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },

  getCalibration(): { currentState: string; desiredState: string; result?: any } | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CALIBRATION);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveCalibration(data: { currentState: string; desiredState: string; result?: any } | null): void {
    if (!data) {
      localStorage.removeItem(STORAGE_KEYS.CALIBRATION);
    } else {
      localStorage.setItem(STORAGE_KEYS.CALIBRATION, JSON.stringify(data));
    }
  },

  getMemories(): MemoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEMORIES);
      return data ? JSON.parse(data) : DEFAULT_MEMORIES;
    } catch {
      return DEFAULT_MEMORIES;
    }
  },

  saveMemories(memories: MemoryItem[]): void {
    localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
  },

  getGoals(): Goal[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GOALS);
      return data ? JSON.parse(data) : DEFAULT_GOALS;
    } catch {
      return DEFAULT_GOALS;
    }
  },

  saveGoals(goals: Goal[]): void {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  },

  getDeals(): DealPipelineItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DEALS);
      return data ? JSON.parse(data) : DEFAULT_DEALS;
    } catch {
      return DEFAULT_DEALS;
    }
  },

  saveDeals(deals: DealPipelineItem[]): void {
    localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(deals));
  },

  getOffers(): MonetizationOffer[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.OFFERS);
      return data ? JSON.parse(data) : DEFAULT_OFFERS;
    } catch {
      return DEFAULT_OFFERS;
    }
  },

  saveOffers(offers: MonetizationOffer[]): void {
    localStorage.setItem(STORAGE_KEYS.OFFERS, JSON.stringify(offers));
  },

  getDailyPlan(dateStr: string = todayStr): DailyPlan {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.DAILY_PLANS}_${dateStr}`);
      return data ? JSON.parse(data) : { ...DEFAULT_DAILY_PLAN, date: dateStr };
    } catch {
      return { ...DEFAULT_DAILY_PLAN, date: dateStr };
    }
  },

  saveDailyPlan(plan: DailyPlan): void {
    localStorage.setItem(`${STORAGE_KEYS.DAILY_PLANS}_${plan.date}`, JSON.stringify(plan));
  },

  getWellnessLogs(): WellnessLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WELLNESS);
      return data ? JSON.parse(data) : DEFAULT_WELLNESS;
    } catch {
      return DEFAULT_WELLNESS;
    }
  },

  saveWellnessLogs(logs: WellnessLog[]): void {
    localStorage.setItem(STORAGE_KEYS.WELLNESS, JSON.stringify(logs));
  },

  getChatMessages(): ChatMessage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT);
      return data ? JSON.parse(data) : DEFAULT_CHAT;
    } catch {
      return DEFAULT_CHAT;
    }
  },

  saveChatMessages(messages: ChatMessage[]): void {
    localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(messages));
  },

  getLifeUpdates(): LifeUpdate[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LIFE_UPDATES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveLifeUpdates(updates: LifeUpdate[]): void {
    localStorage.setItem(STORAGE_KEYS.LIFE_UPDATES, JSON.stringify(updates));
  },
};
