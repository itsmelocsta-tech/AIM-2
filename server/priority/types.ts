/**
 * AIM Life Priority Intelligence Engine - Types
 * Evaluates what deserves the user's attention NOW based on whole-person life context.
 *
 * CRITICAL DIRECTIVE: Under NO circumstances may this engine calculate, estimate,
 * predict, infer, or secretly model date of death, remaining lifespan, expected death age,
 * mortality countdown, "time left", hidden life expectancy, or likely death window.
 */

export type LifePriorityCategory =
  | 'SAFETY'
  | 'HEALTH'
  | 'HOUSING'
  | 'FOOD'
  | 'INCOME'
  | 'EMPLOYMENT'
  | 'TRANSPORTATION'
  | 'FINANCIAL_STABILITY'
  | 'LEGAL_ADMIN'
  | 'FAMILY'
  | 'RELATIONSHIPS'
  | 'MENTAL_EMOTIONAL_WELLBEING'
  | 'REST'
  | 'PERSONAL_DEVELOPMENT'
  | 'EDUCATION'
  | 'CREATIVE_WORK'
  | 'BUSINESS'
  | 'LONG_TERM_GOALS'
  | 'SPIRITUAL_DEVELOPMENT'
  | 'JOY_MEANING';

export interface PriorityScoringFactors {
  urgency: number;            // 1-10: Immediacy of required action
  impact: number;             // 1-10: Magnitude of positive outcome
  riskIfIgnored: number;      // 1-10: Severity of downside if neglected
  timeSensitivity: number;    // 1-10: Fixed deadlines or fleeting window
  goalAlignment: number;      // 1-10: Alignment with user's core trajectory
  userImportance: number;     // 1-10: Explicit user priority
  dependencyScore: number;    // 1-10: How many other steps block on this
  availableResources: number; // 1-10: Realistic capability to execute now
  currentEnergy: number;      // 1-10: User somatic/cognitive readiness
  momentumValue: number;      // 1-10: Psychological leverage of quick win
  longTermValue: number;      // 1-10: Compounding multi-year payoff
  biologicalNeed: number;     // 1-10: Fundamental physical survival/vitality
  emotionalNeed: number;      // 1-10: Mental health, stress relief, peace
  financialEffect: number;    // 1-10: Direct cashflow/stability impact
  relationshipEffect: number; // 1-10: Vital social/family bonding
}

export interface EvaluatedPriorityItem {
  id: string;
  title: string;
  category: LifePriorityCategory;
  score: number; // Composite 1-100
  factors: PriorityScoringFactors;
  reasoning: string;
  recommendedAction: string;
  isImmediateBottleneck: boolean;
}

export interface UserLifeContext {
  ageRange?: string;
  location?: string;
  familyObligations?: string[];
  finances?: {
    currentMonthlyIncome?: number;
    targetMonthlyIncome?: number;
    financialStrainLevel?: 'low' | 'moderate' | 'high' | 'critical';
  };
  employmentStatus?: string;
  physicalWellbeing?: {
    sleepHours?: number;
    energyLevel?: number; // 1-10
    stressLevel?: number; // 1-10
    hasPhysicalPainOrIllness?: boolean;
  };
  emotionalState?: string;
  activeGoals?: { id: string; title: string; category: string; targetDate?: string }[];
  todayScheduleItems?: { title: string; status: string; priority: string }[];
  missedOrPostponedTasksCount?: number;
  recentAchievements?: string[];
  recentLifeUpdateNotes?: string;
  confirmedProfileFacts?: {
    desiredIdentity?: string;
    coreMission?: string;
    primaryObstacle?: string;
    topSkills?: string[];
    coreValues?: string[];
  };
}

export interface LifePriorityAssessment {
  timestamp: string;
  primaryAttentionFocus: string;
  topRankedPriorities: EvaluatedPriorityItem[];
  criticalBottleneck?: EvaluatedPriorityItem;
  immediateActionForNow: string;
  whatToPruneOrPostpone: string[];
  sustainabilityWarning?: string;
  internalWisdomInterlock?: string;
}
