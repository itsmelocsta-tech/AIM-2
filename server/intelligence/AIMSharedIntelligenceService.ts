/**
 * AIM Shared Intelligence Service
 * The master server-side intelligence orchestrator connecting:
 * - AIM Core Wisdom Engine (10 domains, evidence confidence)
 * - AIM Life Priority Intelligence Engine (real-time priority scoring, bottleneck detection)
 * - AIM Momentum Engine (execution analytics, burnout prevention)
 *
 * Provides private, deep contextual scaffolding for all 5 orbs, the daily planner,
 * life update rerouting, and foundational reasoning.
 */

import { AIMCoreWisdomEngine } from '../wisdom/AIMCoreWisdomEngine';
import { AIMLifePriorityEngine } from '../priority/AIMLifePriorityEngine';
import { AIMMomentumEngine } from '../momentum/AIMMomentumEngine';
import { WisdomSynthesisResult } from '../wisdom/types';
import { LifePriorityAssessment, UserLifeContext } from '../priority/types';

export interface CoachPromptAugmentation {
  systemPromptAddendum: string;
  wisdomSynthesis: WisdomSynthesisResult;
  priorityAssessment: LifePriorityAssessment;
}

export class AIMSharedIntelligenceService {
  private static instance: AIMSharedIntelligenceService;

  private wisdomEngine = AIMCoreWisdomEngine.getInstance();
  private priorityEngine = AIMLifePriorityEngine.getInstance();
  private momentumEngine = AIMMomentumEngine.getInstance();

  public static getInstance(): AIMSharedIntelligenceService {
    if (!AIMSharedIntelligenceService.instance) {
      AIMSharedIntelligenceService.instance = new AIMSharedIntelligenceService();
    }
    return AIMSharedIntelligenceService.instance;
  }

  /**
   * Build deep intelligence context tailored specifically for the requesting coach/orb.
   */
  public prepareCoachContext(params: {
    coachId: 'guidance' | 'motivation' | 'spiritual' | 'health' | 'relationships';
    userMessage: string;
    userProfile?: any;
    currentSchedule?: any[];
    energyLevel?: number;
    stressLevel?: number;
    goals?: any[];
    memories?: any[];
    dailyPlan?: any;
    wellnessLogs?: any[];
    recentLifeUpdates?: any[];
  }): CoachPromptAugmentation {
    const userLifeContext: UserLifeContext = {
      finances: {
        currentMonthlyIncome: params.userProfile?.currentMonthlyIncome,
        targetMonthlyIncome: params.userProfile?.targetMonthlyIncome,
        financialStrainLevel:
          params.userProfile?.targetMonthlyIncome &&
          params.userProfile?.currentMonthlyIncome &&
          params.userProfile.targetMonthlyIncome - params.userProfile.currentMonthlyIncome > 3000
            ? 'moderate'
            : 'low',
      },
      physicalWellbeing: {
        energyLevel: params.energyLevel ?? params.dailyPlan?.energyLevel ?? 7,
        stressLevel: params.stressLevel ?? (params.wellnessLogs && params.wellnessLogs[0]?.stressLevel) ?? 4,
        sleepHours: params.wellnessLogs && params.wellnessLogs[0]?.sleepHours,
      },
      activeGoals: Array.isArray(params.goals)
        ? params.goals.map((g: any) => ({
            id: g.id || 'g-id',
            title: g.title,
            category: g.category || 'General',
            targetDate: g.targetDate,
          }))
        : undefined,
      todayScheduleItems: Array.isArray(params.currentSchedule)
        ? params.currentSchedule.map((s: any) => ({
            title: s.title,
            status: s.status,
            priority: s.priority || 'medium',
          }))
        : undefined,
      recentLifeUpdateNotes: Array.isArray(params.recentLifeUpdates) && params.recentLifeUpdates.length > 0
        ? params.recentLifeUpdates.slice(0, 3).map((u: any) => u.content || u.title).join('; ')
        : undefined,
      confirmedProfileFacts: {
        desiredIdentity: params.userProfile?.desiredIdentity,
        coreMission: params.userProfile?.coreMission,
        primaryObstacle: params.userProfile?.primaryObstacle || params.userProfile?.currentObstacle,
        topSkills: params.userProfile?.topSkills,
        coreValues: params.userProfile?.coreValues,
      },
    };

    // 1. Run Life Priority Assessment
    const priorityAssessment = this.priorityEngine.evaluatePriorities(userLifeContext);

    // 2. Run Momentum Analysis
    const momentumAnalysis = this.momentumEngine.analyzeMomentum({
      energyLevel: params.energyLevel ?? params.dailyPlan?.energyLevel,
      stressLevel: params.stressLevel,
    });

    // 3. Run Core Wisdom Engine Synthesis across 10 domains
    const wisdomSynthesis = this.wisdomEngine.synthesizeWisdom({
      userSituation: params.userMessage,
      desiredIdentity: params.userProfile?.desiredIdentity,
      coreMission: params.userProfile?.coreMission,
      currentObstacle: params.userProfile?.primaryObstacle || params.userProfile?.currentObstacle,
      requestingOrb: params.coachId,
      userEnergyLevel: params.energyLevel ?? params.dailyPlan?.energyLevel ?? 7,
      categoryOfProblem: priorityAssessment.topRankedPriorities[0]?.category,
      momentumHistory: {
        chronicResistanceArea: momentumAnalysis.chronicResistanceCategories[0],
      },
    });

    // 4. Build Orb-Specific System Instruction Scaffolding
    let orbGuidanceDirectives = '';

    switch (params.coachId) {
      case 'guidance':
        orbGuidanceDirectives = `
GUIDANCE ORB DIRECTIVES:
- Focus on practical trajectory, schedule calibration, decision clarity, and long-term consequences.
- Connect the immediate action directly to who the user is becoming: "${params.userProfile?.desiredIdentity || 'their highest potential'}".
- Top Assessed Life Priority Focus: "${priorityAssessment.primaryAttentionFocus}".
- Immediate Next Win: "${priorityAssessment.immediateActionForNow}".
- Strict rule: Give REAL, GENUINE answers tailored to this user's specific context. Never recite generic quotes or proverbs.`;
        break;

      case 'motivation':
        orbGuidanceDirectives = `
MOMENTUM & MOTIVATION ORB DIRECTIVES:
- Meet the user where they are without shame or guilt.
- If friction or avoidance is detected, recommend the smallest viable 2-minute micro-action: "${momentumAnalysis.recommendedMicroAction}".
- Burnout risk level is ${momentumAnalysis.burnoutRiskLevel.toUpperCase()}. Pacing adjustment: "${momentumAnalysis.actionableAdjustment}".
- DO NOT use generic motivational quotes or cliché mantras. Ground courage in purposeful identity and clear biological pacing.`;
        break;

      case 'spiritual':
        orbGuidanceDirectives = `
SPIRITUAL REFLECTION ORB DIRECTIVES:
- Support contemplation of core values, emotional patterns, gratitude, and inner stillness.
- Deep Principle: "${wisdomSynthesis.guidanceSynthesis.primaryShift}".
- Contemplative Reflection: "${wisdomSynthesis.guidanceSynthesis.recommendedReflectionQuestion}".
- Always distinguish established historical/philosophical traditions from personal or metaphysical interpretations. Speak with genuine human depth, not canned sayings.`;
        break;

      case 'health':
        orbGuidanceDirectives = `
VITALITY & HEALTH ORB DIRECTIVES:
- Prioritize biological evidence, circadian rhythms, sleep architecture, nutrition, and nervous system regulation.
- Biological Factor: ${wisdomSynthesis.biologicalFactors.join('; ') || 'Somatic energy pacing'}.
- CRITICAL BOUNDARY: You are not a medical doctor. Provide evidence-informed lifestyle habits, but always direct medical diagnoses to qualified healthcare professionals.`;
        break;

      case 'relationships':
        orbGuidanceDirectives = `
RELATIONSHIPS & CONNECTION ORB DIRECTIVES:
- Focus on non-violent communication, clear boundaries, empathy, and mutual repair.
- Psychological Factor: ${wisdomSynthesis.psychologicalFactors.join('; ') || 'Interpersonal boundaries'}.
- Help user draft clear, respectful communications and understand relational attachment dynamics without judgment.`;
        break;
    }

    const systemPromptAddendum = `
=== AIM SHARED INTELLIGENCE LAYER (INTERNAL - DO NOT EXPOSE RAW JARGON) ===
[Core Wisdom Synthesized Domains]: ${wisdomSynthesis.relevantDomains.join(', ')}
[Evidence Confidence]: ${wisdomSynthesis.evidenceConfidence}
[Recommended Human Shift]: ${wisdomSynthesis.guidanceSynthesis.primaryShift}
[Life Priority Focus]: ${priorityAssessment.primaryAttentionFocus}
[Immediate Recommended Micro-Win]: ${priorityAssessment.immediateActionForNow}
${orbGuidanceDirectives}
=============================================================================
`;

    return {
      systemPromptAddendum,
      wisdomSynthesis,
      priorityAssessment,
    };
  }

  /**
   * Build intelligence scaffolding for the Daily Planner.
   */
  public preparePlannerContext(params: {
    energyLevel: number;
    availableHours: number;
    activeGoals: string[];
    userProfile?: any;
    dayNotes?: string;
  }): { plannerSystemDirective: string; priorityAssessment: LifePriorityAssessment } {
    const userLifeContext: UserLifeContext = {
      physicalWellbeing: {
        energyLevel: params.energyLevel,
      },
      activeGoals: params.activeGoals.map((g, idx) => ({ id: `g-${idx}`, title: g, category: 'Personal' })),
      confirmedProfileFacts: {
        desiredIdentity: params.userProfile?.desiredIdentity,
        coreMission: params.userProfile?.coreMission,
      },
    };

    const priorityAssessment = this.priorityEngine.evaluatePriorities(userLifeContext);
    const momentumAnalysis = this.momentumEngine.analyzeMomentum({ energyLevel: params.energyLevel });

    const wisdomSynthesis = this.wisdomEngine.synthesizeWisdom({
      userSituation: `Generating daily plan with ${params.availableHours}h available, energy ${params.energyLevel}/10. Notes: ${params.dayNotes || 'Standard day'}.`,
      userEnergyLevel: params.energyLevel,
      requestingOrb: 'planner',
    });

    const plannerSystemDirective = `
=== AIM PLANNING ENGINE SCAFFOLDING ===
- Core Rule: "What is the best realistic use of THIS person's day?" Select, sequence, simplify.
- Top Assessed Priority: "${priorityAssessment.primaryAttentionFocus}" (Recommended Action: "${priorityAssessment.immediateActionForNow}").
- Pacing Strategy: Sequence deep work during peak window (${momentumAnalysis.peakProductivityWindow}).
- Energy Feasibility: User has ${params.availableHours} hours with energy ${params.energyLevel}/10. Do not create fantasy schedules.
- Pruning Mandate: ${priorityAssessment.whatToPruneOrPostpone.join('; ')}.
- Core Mindset Principle: "${wisdomSynthesis.guidanceSynthesis.primaryShift}".
- ACTION CLARITY MANDATE: Never give vague guidance. On every task and time block, provide a clear, step-by-step description of what the user should physically and mentally do (setup, chronological execution steps, definition of done).
======================================
`;

    return {
      plannerSystemDirective,
      priorityAssessment,
    };
  }
}
