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
      if (error instanceof AuthenticationError) throw error;
      console.error('API interactWithCoach error:', error);
      return {
        coachId: params.coachId,
        displayText: `I'm here with you. Let's calibrate your daily momentum and focus on the immediate next win right now.`,
        spokenText: `I'm here with you. Let's focus on the immediate next step right now.`,
        intent: 'conversation',
        confidence: 0.85,
        followUpQuestion: 'What is the single most important action in front of you right now?',
        recommendedActions: [
          {
            label: 'View Schedule',
            reason: 'Check your upcoming daily priorities',
            actionType: 'open_route',
            target: '/home',
          },
        ],
      };
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
      if (error instanceof AuthenticationError) throw error;
      console.error('API chatWithAIM error:', error);
      return {
        reply: `AIM thinking partner note: ${params.message}. Let's break this down into clear action steps and momentum for today.`,
      };
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
      if (error instanceof AuthenticationError) throw error;
      console.error('API generateMonetizationOffer error:', error);
      return {
        title: 'Rapid High-Leverage Growth Sprint',
        hook: `I will personally audit your highest-friction ${params.targetNiche} bottleneck and deliver a turnkey, conversion-ready asset within 48 hours.`,
        deliverables: [
          'Full diagnostic audit of current acquisition or delivery bottleneck',
          'Custom step-by-step optimization blueprint',
          'Direct implementation and deliverable handoff',
        ],
        pricingTiers: [
          { name: 'Starter Sprint', price: params.pricePoint || '$750', description: 'Audit + tactical roadmap' },
          { name: 'Full Delivery', price: '$2,500', description: 'Turnkey asset creation and 48h delivery' },
          { name: 'Monthly Advisory', price: '$4,500/mo', description: 'Weekly sprints and continuous access' },
        ],
        coldOutreachScript: `Hey [Name]! Loved your work on [Project]. Noticed one quick area on your funnel where you might be leaking conversions. I put together a quick 3-point breakdown showing how to capture an extra 15-20% margin—mind if I send the 2-min loom over?`,
        followUpScript: `Hey [Name], following up on this! Even if you have this covered with your team, happy to send the breakdown PDF over if useful for your team review.`,
        qualificationQuestions: [
          'What is the single largest bottleneck holding back your next $20k in revenue?',
          'If this bottleneck was completely eliminated by Friday, what would that mean for your revenue?',
        ],
        todayActionChecklist: [
          'Identify 15 target prospects matching ICP criteria',
          'Send personalized outreach hook before noon',
          'Follow up with 3 open leads with a fast-action incentive today',
        ],
        urgencyStrategy: 'Offer a $250 fast-action deposit incentive for agreements confirmed today.',
      };
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
      if (error instanceof AuthenticationError) throw error;
      console.error('API generateCreativeAsset error:', error);
      return {
        title: `Growth Strategy & Proposal for ${params.clientName}`,
        executiveSummary: 'This engagement delivers a rapid-execution roadmap and direct asset delivery designed to solve core operational bottlenecks.',
        deliverablesList: ['Diagnostic Audit', 'High-Impact Asset Delivery', 'Launch Support'],
        timeline: '7-10 Business Days',
        investmentTerms: `Total Investment: ${params.budget}. 50% upon kickoff, 50% upon final delivery.`,
        fullMarkdownDocument: `# High-Impact Growth Proposal\n\n**Prepared for:** ${params.clientName}\n**Date:** ${new Date().toLocaleDateString()}\n**Investment:** ${params.budget}\n\n## Objective\nTo optimize and deliver turnkey revenue assets for ${params.industry}.\n\n## Terms\n- 50% deposit required prior to kickoff.\n\n*Generated by AIM Life OS.*`,
      };
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
