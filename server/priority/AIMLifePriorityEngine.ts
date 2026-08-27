/**
 * AIM Life Priority Intelligence Engine
 * Assesses: "What does this person realistically need, based on their life circumstances,
 * responsibilities, goals, wellbeing, opportunities, risks, and long-term direction?"
 *
 * CRITICAL RULE: Under NO circumstances may this engine calculate, estimate,
 * predict, infer, or secretly model date of death, remaining lifespan, expected death age,
 * mortality countdown, "time left", hidden life expectancy, or likely death window.
 */

import {
  LifePriorityCategory,
  UserLifeContext,
  LifePriorityAssessment,
  EvaluatedPriorityItem,
  PriorityScoringFactors,
} from './types';
import { AIMCoreWisdomEngine } from '../wisdom/AIMCoreWisdomEngine';

export class AIMLifePriorityEngine {
  private static instance: AIMLifePriorityEngine;
  private wisdomEngine = AIMCoreWisdomEngine.getInstance();

  public static getInstance(): AIMLifePriorityEngine {
    if (!AIMLifePriorityEngine.instance) {
      AIMLifePriorityEngine.instance = new AIMLifePriorityEngine();
    }
    return AIMLifePriorityEngine.instance;
  }

  /**
   * Evaluate the user's holistic life priorities right now.
   */
  public evaluatePriorities(context: UserLifeContext): LifePriorityAssessment {
    const assessedItems: EvaluatedPriorityItem[] = [];
    const energy = context.physicalWellbeing?.energyLevel ?? 7;
    const stress = context.physicalWellbeing?.stressLevel ?? 4;
    const hasPhysicalIssue = context.physicalWellbeing?.hasPhysicalPainOrIllness ?? false;
    const sleep = context.physicalWellbeing?.sleepHours ?? 7.5;
    const financialStrain = context.finances?.financialStrainLevel ?? 'low';

    // 1. Evaluate Biological / Physical Recovery Priority
    if (sleep < 6 || hasPhysicalIssue || energy <= 3) {
      const factors: PriorityScoringFactors = {
        urgency: 9,
        impact: 9,
        riskIfIgnored: 9,
        timeSensitivity: 8,
        goalAlignment: 8,
        userImportance: 7,
        dependencyScore: 10, // Everything else depends on biological baseline
        availableResources: 8,
        currentEnergy: energy,
        momentumValue: 8,
        longTermValue: 9,
        biologicalNeed: 10,
        emotionalNeed: 8,
        financialEffect: 4,
        relationshipEffect: 6,
      };

      assessedItems.push({
        id: 'prio_vitality_recovery',
        title: 'Physiological Baseline Restoration & Rest',
        category: 'REST',
        score: this.calculateCompositeScore(factors),
        factors,
        reasoning: 'Sleep debt or physical fatigue is actively impairing prefrontal executive function and emotional regulation.',
        recommendedAction: 'Schedule a protected 45-60 min rest/recovery window before taking on heavy cognitive tasks.',
        isImmediateBottleneck: true,
      });
    }

    // 2. Evaluate Financial / Income Pipeline Priority
    const incomeGap =
      (context.finances?.targetMonthlyIncome || 0) - (context.finances?.currentMonthlyIncome || 0);
    if (financialStrain === 'high' || financialStrain === 'critical' || incomeGap > 2000) {
      const factors: PriorityScoringFactors = {
        urgency: financialStrain === 'critical' ? 10 : 8,
        impact: 9,
        riskIfIgnored: 8,
        timeSensitivity: 7,
        goalAlignment: 9,
        userImportance: 9,
        dependencyScore: 8,
        availableResources: 7,
        currentEnergy: energy,
        momentumValue: 9,
        longTermValue: 9,
        biologicalNeed: 7,
        emotionalNeed: 8,
        financialEffect: 10,
        relationshipEffect: 6,
      };

      assessedItems.push({
        id: 'prio_income_generation',
        title: 'High-Leverage Income & Client Outreach Sprint',
        category: 'INCOME',
        score: this.calculateCompositeScore(factors),
        factors,
        reasoning: 'Financial security provides the sovereign breathing room required to pursue higher creative and personal goals.',
        recommendedAction: 'Execute direct outreach to top 3 warm opportunities before 1 PM today.',
        isImmediateBottleneck: financialStrain === 'critical',
      });
    }

    // 3. Evaluate Active Goals from User Profile
    if (context.activeGoals && context.activeGoals.length > 0) {
      context.activeGoals.forEach((goal, idx) => {
        const factors: PriorityScoringFactors = {
          urgency: 7 - idx,
          impact: 8,
          riskIfIgnored: 6,
          timeSensitivity: 6,
          goalAlignment: 10,
          userImportance: 9,
          dependencyScore: 7,
          availableResources: 8,
          currentEnergy: energy,
          momentumValue: 8,
          longTermValue: 9,
          biologicalNeed: 3,
          emotionalNeed: 7,
          financialEffect: goal.category === 'Finances' || goal.category === 'Business' ? 9 : 4,
          relationshipEffect: goal.category === 'Relationships' || goal.category === 'Family' ? 9 : 3,
        };

        assessedItems.push({
          id: `prio_goal_${goal.id}`,
          title: `Advance Core Goal: ${goal.title}`,
          category: this.mapAimCategoryToPriorityCategory(goal.category),
          score: this.calculateCompositeScore(factors),
          factors,
          reasoning: `Directly aligns with user's declared mission: "${goal.title}".`,
          recommendedAction: `Dedicate one uninterrupted 60-minute sprint to progress this milestone today.`,
          isImmediateBottleneck: false,
        });
      });
    }

    // 4. Evaluate Stress & Emotional Decompression
    if (stress >= 7) {
      const factors: PriorityScoringFactors = {
        urgency: 8,
        impact: 8,
        riskIfIgnored: 8,
        timeSensitivity: 7,
        goalAlignment: 7,
        userImportance: 8,
        dependencyScore: 8,
        availableResources: 9,
        currentEnergy: energy,
        momentumValue: 7,
        longTermValue: 8,
        biologicalNeed: 8,
        emotionalNeed: 10,
        financialEffect: 3,
        relationshipEffect: 7,
      };

      assessedItems.push({
        id: 'prio_stress_reset',
        title: 'Nervous System De-escalation & Nature Reset',
        category: 'MENTAL_EMOTIONAL_WELLBEING',
        score: this.calculateCompositeScore(factors),
        factors,
        reasoning: 'Elevated sympathetic stress is risking emotional reactivity and task avoidance.',
        recommendedAction: 'Take a 20-minute silent walk in nature or practice 10 physiological sighs.',
        isImmediateBottleneck: false,
      });
    }

    // Ensure baseline items exist if context is sparse
    if (assessedItems.length === 0) {
      const defaultFactors: PriorityScoringFactors = {
        urgency: 7,
        impact: 8,
        riskIfIgnored: 6,
        timeSensitivity: 6,
        goalAlignment: 8,
        userImportance: 8,
        dependencyScore: 6,
        availableResources: 8,
        currentEnergy: energy,
        momentumValue: 9,
        longTermValue: 8,
        biologicalNeed: 5,
        emotionalNeed: 6,
        financialEffect: 6,
        relationshipEffect: 5,
      };

      assessedItems.push({
        id: 'prio_default_execution',
        title: 'Lock In Primary High-Leverage Win',
        category: 'BUSINESS',
        score: 78,
        factors: defaultFactors,
        reasoning: 'Establishing early daily momentum anchors self-efficacy and psychological momentum.',
        recommendedAction: 'Choose the single most impactful task on your list and complete it before noon.',
        isImmediateBottleneck: false,
      });
    }

    // Sort by composite score descending
    assessedItems.sort((a, b) => b.score - a.score);

    const topRanked = assessedItems.slice(0, 3);
    const bottleneck = assessedItems.find((i) => i.isImmediateBottleneck) || topRanked[0];

    // Bidirectional query to Wisdom Engine for deep context interlock
    const wisdomSynthesis = this.wisdomEngine.synthesizeWisdom({
      userSituation: `Top priority: ${bottleneck.title}. Category: ${bottleneck.category}. Energy level: ${energy}/10, Stress: ${stress}/10.`,
      userEnergyLevel: energy,
      categoryOfProblem: bottleneck.category,
      requestingOrb: 'guidance',
    });

    const whatToPruneOrPostpone: string[] = [];
    if (energy <= 4 || stress >= 8) {
      whatToPruneOrPostpone.push('Postpone low-urgency administrative sorting');
      whatToPruneOrPostpone.push('Reschedule non-essential exploratory calls to protected recovery blocks');
    } else {
      whatToPruneOrPostpone.push('Prune reactive social media checks during morning deep work');
    }

    return {
      timestamp: new Date().toISOString(),
      primaryAttentionFocus: bottleneck.title,
      topRankedPriorities: topRanked,
      criticalBottleneck: bottleneck.isImmediateBottleneck ? bottleneck : undefined,
      immediateActionForNow: bottleneck.recommendedAction,
      whatToPruneOrPostpone,
      sustainabilityWarning:
        energy <= 3
          ? 'Warning: Severe physical fatigue detected. Aggressive output without recovery risks burnout.'
          : undefined,
      internalWisdomInterlock: wisdomSynthesis.guidanceSynthesis.primaryShift,
    };
  }

  private calculateCompositeScore(f: PriorityScoringFactors): number {
    // Weighted algorithm:
    // Core weights: Urgency (15%), Impact (15%), Risk (15%), Dependency (10%), Goal Alignment (15%),
    // Biological/Energy feasibility (15%), Long Term Value (15%)
    const raw =
      f.urgency * 1.5 +
      f.impact * 1.5 +
      f.riskIfIgnored * 1.5 +
      f.dependencyScore * 1.0 +
      f.goalAlignment * 1.5 +
      f.biologicalNeed * 1.0 +
      f.currentEnergy * 0.5 +
      f.momentumValue * 1.0 +
      f.longTermValue * 1.5;

    // Normalizes to approximate 1-100
    return Math.min(100, Math.max(10, Math.round(raw)));
  }

  private mapAimCategoryToPriorityCategory(cat: string): LifePriorityCategory {
    switch (cat) {
      case 'Health':
        return 'HEALTH';
      case 'Finances':
        return 'FINANCIAL_STABILITY';
      case 'Business':
      case 'Career':
        return 'BUSINESS';
      case 'Relationships':
        return 'RELATIONSHIPS';
      case 'Family':
        return 'FAMILY';
      case 'Creative Projects':
        return 'CREATIVE_WORK';
      case 'Education':
      case 'Research':
        return 'EDUCATION';
      case 'Personal':
      case 'Journal':
        return 'PERSONAL_DEVELOPMENT';
      case 'Goals':
      case 'Projects':
        return 'LONG_TERM_GOALS';
      default:
        return 'JOY_MEANING';
    }
  }
}
