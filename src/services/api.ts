import { authenticatedFetch, AuthenticationError } from './authenticatedFetch';
import { UserProfile, DailyPlan, MonetizationOffer, CoachId, CoachResponse, ScheduleItem, Goal, MemoryItem, WellnessLog, LifeUpdate } from '../types';
import { intelligenceService, CompactOrbContext, LifePriorityAssessmentResult, WisdomSynthesisResultClient } from './intelligenceService';
export const api = {
  async interactWithCoach(params: {
    coachId: CoachId;
    message: string;
    conversationHistory?: { role: 'user' | 'model'; content: string }[];
    userProfile?: UserProfile;
    goals?: Goal[];
    memories?: MemoryItem[];
    dailyPlan?: DailyPlan;
    wellnessLogs?: WellnessLog[];
    lifeUpdates?: LifeUpdate[];
    currentSchedule?: ScheduleItem[];
    currentTime?: string;
    timeZone?: string;
    energyLevel?: number;
    stressLevel?: number;
    compactContext?: CompactOrbContext;
  }): Promise<CoachResponse> {
    try {
      const response = await authenticatedFetch('/api/aim/coach/interact', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async getPriorityAssessment(userProfile?: UserProfile, contextExtra?: any): Promise<LifePriorityAssessmentResult> {
    return intelligenceService.evaluatePriorities(userProfile, contextExtra);
  },

  async getWisdomSynthesis(params: {
    userSituation: string;
    coachId?: CoachId;
    userProfile?: UserProfile;
    energyLevel?: number;
  }): Promise<WisdomSynthesisResultClient> {
    return intelligenceService.synthesizeWisdom(params);
  },

  async getCompactOrbContext(params: {
    coachId: CoachId;
    userProfile?: UserProfile;
    currentSchedule?: ScheduleItem[];
    userMessage?: string;
    forceRefresh?: boolean;
  }): Promise<CompactOrbContext> {
    return intelligenceService.getCompactOrbContext(params);
  },

  async chatWithAIM(params: {
    message: string;
    history: { role: 'user' | 'aim'; content: string }[];
    userProfile: UserProfile;
    goals?: Goal[];
    memories?: MemoryItem[];
    dailyPlan?: DailyPlan;
    wellnessLogs?: WellnessLog[];
    lifeUpdates?: LifeUpdate[];
    currentSchedule?: ScheduleItem[];
    contextCategory?: string;
  }): Promise<{ reply: string; extractedCategory?: string }> {
    try {
      const response = await authenticatedFetch('/api/aim/chat', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async generateMonetizationOffer(params: {
    skills: string;
    targetNiche: string;
    pricePoint: string;
    offerType: string;
    userProfile?: UserProfile;
  }): Promise<Partial<MonetizationOffer>> {
    try {
      const response = await authenticatedFetch('/api/aim/monetize', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async generateDailyPlan(params: {
    type: 'morning' | 'evening';
    energyLevel: number;
    availableHours: number;
    goals: string[];
    dayNotes?: string;
  }): Promise<any> {
    try {
      const response = await authenticatedFetch('/api/aim/plan', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof AuthenticationError) throw error;
      console.warn('API generateDailyPlan fallback engaged:', error);
      return { source: 'fallback' };
    }
  },

  async generateCreativeAsset(params: {
    taskType: string;
    clientName: string;
    projectScope: string;
    budget: string;
    industry: string;
  }): Promise<{
    title: string;
    executiveSummary: string;
    deliverablesList: string[];
    timeline: string;
    investmentTerms: string;
    fullMarkdownDocument: string;
  }> {
    try {
      const response = await authenticatedFetch('/api/aim/creative', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async crossReferencePathways(params: {
    currentState: string;
    changesWanted: string;
    desiredState: string;
    userProfile?: UserProfile;
  }): Promise<import('../types').CrossReferenceResult> {
    try {
      const response = await authenticatedFetch('/api/aim/cross-reference', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API crossReferencePathways error:', error);
      throw error;
    }
  },

  async analyzeLifeUpdate(params: {
    content: string;
    currentGoals: import('../types').Goal[];
    currentDailyPlan: import('../types').DailyPlan;
    userProfile?: import('../types').UserProfile;
    wellnessLogs?: import('../types').WellnessLog[];
    recentUpdates?: import('../types').LifeUpdate[];
  }): Promise<import('../types').LifeUpdateAnalysisResult> {
    try {
      const response = await authenticatedFetch('/api/aim/life-update-analyze', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API analyzeLifeUpdate error:', error);
      throw error;
    }
  },
};
