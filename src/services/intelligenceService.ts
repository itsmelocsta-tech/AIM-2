import { authenticatedFetch } from './authenticatedFetch';
import { UserProfile, CoachId, ScheduleItem } from '../types';

export interface CompactOrbContext {
  coachId: CoachId;
  primaryAttentionFocus: string;
  immediateActionForNow: string;
  primaryWisdomShift: string;
  recommendedReflectionQuestion?: string;
  evidenceConfidence: string;
  burnoutRiskLevel: 'low' | 'moderate' | 'high' | 'critical';
  recommendedMicroAction: string;
  relevantDomains: string[];
  retrievedAt: string;
}

export interface LifePriorityAssessmentResult {
  primaryAttentionFocus: string;
  secondaryAttentionFocus?: string;
  immediateActionForNow: string;
  topRankedPriorities: Array<{
    id: string;
    title: string;
    category: string;
    score: number;
    reasoning: string;
    recommendedAction: string;
    isImmediateBottleneck: boolean;
  }>;
  bottlenecksIdentified: Array<{
    category: string;
    obstacleDescription: string;
    clearingAction: string;
    urgency: 'critical' | 'high' | 'moderate';
  }>;
  pruningRecommendations: Array<{
    activityToPause: string;
    reason: string;
  }>;
}

export interface WisdomSynthesisResultClient {
  relevantDomains: string[];
  evidenceConfidence: string;
  guidanceSynthesis: {
    primaryShift: string;
    actionableHabit: string;
    recommendedReflectionQuestion: string;
    pitfallToAvoid: string;
  };
  biologicalFactors: string[];
  psychologicalFactors: string[];
}

export interface MomentumAnalysisResult {
  momentumScore: number;
  burnoutRiskLevel: 'low' | 'moderate' | 'high' | 'critical';
  recommendedMicroAction: string;
  actionableAdjustment: string;
  chronicResistanceCategories: string[];
}

class IntelligenceService {
  private cache: Map<string, { data: CompactOrbContext; timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

  /**
   * Evaluate user's life priorities across 20 dimensions.
   */
  async evaluatePriorities(userProfile?: UserProfile, contextExtra?: any): Promise<LifePriorityAssessmentResult> {
    try {
      const payload = {
        finances: {
          currentMonthlyIncome: userProfile?.currentMonthlyIncome,
          targetMonthlyIncome: userProfile?.targetMonthlyIncome,
          financialStrainLevel:
            userProfile?.targetMonthlyIncome &&
            userProfile?.currentMonthlyIncome &&
            userProfile.targetMonthlyIncome - userProfile.currentMonthlyIncome > 3000
              ? 'moderate'
              : 'low',
        },
        physicalWellbeing: {
          energyLevel: contextExtra?.energyLevel ?? 7,
          stressLevel: contextExtra?.stressLevel ?? 4,
        },
        confirmedProfileFacts: {
          desiredIdentity: userProfile?.desiredIdentity,
          coreMission: userProfile?.coreMission,
          primaryObstacle: userProfile?.primaryObstacle,
          topSkills: userProfile?.topSkills,
          coreValues: userProfile?.coreValues,
        },
        activeScheduleItems: contextExtra?.currentSchedule || [],
      };

      const res = await authenticatedFetch('/api/aim/intelligence/priority-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Failed to fetch priority assessment, using client fallback:', err);
      return {
        primaryAttentionFocus: userProfile?.desiredIdentity
          ? `A step toward ${userProfile.desiredIdentity}`
          : 'One useful step today',
        immediateActionForNow: userProfile?.primaryObstacle
          ? `Work on what’s getting in your way: ${userProfile.primaryObstacle}`
          : 'Execute next scheduled priority task with focused attention',
        topRankedPriorities: [
          {
            id: 'priority-1',
            title: 'Work on your main task',
            category: 'BUSINESS',
            score: 92,
            reasoning: 'This helps you work toward your goal.',
            recommendedAction: 'Set aside 90 minutes for your main task.',
            isImmediateBottleneck: true,
          },
          {
            id: 'priority-2',
            title: 'Physical & Somatic Vitality',
            category: 'HEALTH',
            score: 85,
            reasoning: 'Food and water help you keep your energy up.',
            recommendedAction: 'Hydrate, move outdoors, and maintain sleep discipline.',
            isImmediateBottleneck: false,
          },
        ],
        bottlenecksIdentified: [],
        pruningRecommendations: [],
      };
    }
  }

  /**
   * Synthesize ancient & modern wisdom across 10 disciplines.
   */
  async synthesizeWisdom(params: {
    userSituation: string;
    coachId?: CoachId;
    userProfile?: UserProfile;
    energyLevel?: number;
  }): Promise<WisdomSynthesisResultClient> {
    try {
      const payload = {
        userSituation: params.userSituation,
        desiredIdentity: params.userProfile?.desiredIdentity,
        coreMission: params.userProfile?.coreMission,
        currentObstacle: params.userProfile?.primaryObstacle,
        requestingOrb: params.coachId || 'guidance',
        userEnergyLevel: params.energyLevel ?? 7,
      };

      const res = await authenticatedFetch('/api/aim/intelligence/wisdom-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Failed to fetch wisdom synthesis, using client fallback:', err);
      return {
        relevantDomains: ['psychology_behavior', 'human_biology', 'biblical_hebrew'],
        evidenceConfidence: 'ESTABLISHED',
        guidanceSynthesis: {
          primaryShift: 'Choose one thing you can do next.',
          actionableHabit: 'Try one small step for two minutes.',
          recommendedReflectionQuestion: 'What would the person I am becoming do right now in this exact moment?',
          pitfallToAvoid: 'Waiting until you feel ready to start.',
        },
        biologicalFactors: ['Circadian rhythm pacing', 'Dopamine regulation through micro-wins'],
        psychologicalFactors: ['Building confidence one step at a time', 'Making it easier to get started'],
      };
    }
  }

  /**
   * Retrieve a compact, high-density context snapshot tailored for any active Orb.
   */
  async getCompactOrbContext(params: {
    coachId: CoachId;
    userProfile?: UserProfile;
    currentSchedule?: ScheduleItem[];
    userMessage?: string;
    forceRefresh?: boolean;
  }): Promise<CompactOrbContext> {
    const cacheKey = `${params.coachId}_${params.userProfile?.id || 'default'}`;
    const now = Date.now();

    if (!params.forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (now - cached.timestamp < this.CACHE_TTL_MS) {
        return cached.data;
      }
    }

    try {
      const [priorityAssessment, wisdomSynthesis] = await Promise.all([
        this.evaluatePriorities(params.userProfile, {
          currentSchedule: params.currentSchedule,
        }),
        this.synthesizeWisdom({
          userSituation: params.userMessage || `Calibrating active session for ${params.coachId} orb`,
          coachId: params.coachId,
          userProfile: params.userProfile,
        }),
      ]);

      const compact: CompactOrbContext = {
        coachId: params.coachId,
        primaryAttentionFocus: priorityAssessment.primaryAttentionFocus,
        immediateActionForNow: priorityAssessment.immediateActionForNow,
        primaryWisdomShift: wisdomSynthesis.guidanceSynthesis.primaryShift,
        recommendedReflectionQuestion: wisdomSynthesis.guidanceSynthesis.recommendedReflectionQuestion,
        evidenceConfidence: wisdomSynthesis.evidenceConfidence,
        burnoutRiskLevel: 'low',
        recommendedMicroAction: wisdomSynthesis.guidanceSynthesis.actionableHabit || 'Try one step for two minutes',
        relevantDomains: wisdomSynthesis.relevantDomains,
        retrievedAt: new Date().toISOString(),
      };

      this.cache.set(cacheKey, { data: compact, timestamp: now });
      return compact;
    } catch (err) {
      console.warn('Error constructing compact orb context:', err);
      const fallback: CompactOrbContext = {
        coachId: params.coachId,
        primaryAttentionFocus: params.userProfile?.desiredIdentity
          ? `Working toward ${params.userProfile.desiredIdentity}`
          : 'One useful step today',
        immediateActionForNow: 'Execute immediate highest priority task',
        primaryWisdomShift: 'Small steps can add up.',
        recommendedReflectionQuestion: 'What is one useful thing I can do now?',
        evidenceConfidence: 'ESTABLISHED',
        burnoutRiskLevel: 'low',
        recommendedMicroAction: 'Start with two minutes',
        relevantDomains: ['psychology_behavior', 'human_biology'],
        retrievedAt: new Date().toISOString(),
      };
      return fallback;
    }
  }

  /**
   * Clear context cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export const intelligenceService = new IntelligenceService();
