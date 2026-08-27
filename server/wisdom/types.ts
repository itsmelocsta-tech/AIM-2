/**
 * AIM Core Wisdom Engine & Knowledge Domain Types
 * Private server-side intelligence types.
 */

export type WisdomDomain =
  | 'ancient_mesopotamian'
  | 'biblical_hebrew'
  | 'etymology_linguistics'
  | 'human_biology'
  | 'psychology_behavior'
  | 'anthropology_history'
  | 'spirituality_consciousness'
  | 'ancient_cosmology_alternative'
  | 'physics_quantum'
  | 'comparative_mythology';

export type EvidenceConfidence =
  | 'ESTABLISHED'
  | 'PROBABLE'
  | 'PLAUSIBLE'
  | 'INTERPRETIVE'
  | 'SPECULATIVE'
  | 'SPIRITUAL_OR_METAPHYSICAL';

export type PatternRelationshipType =
  | 'similarity'
  | 'possible_influence'
  | 'documented_influence'
  | 'shared_human_pattern'
  | 'speculative_relationship';

export interface KnowledgeSnippet {
  id: string;
  domain: WisdomDomain;
  topic: string;
  summary: string;
  historicalContext?: string;
  linguisticRoot?: {
    originalWord?: string;
    language?: 'Sumerian' | 'Akkadian' | 'Biblical Hebrew' | 'Aramaic' | 'Ancient Greek' | 'Latin' | string;
    literalMeaning?: string;
    semanticEvolution?: string;
  };
  evidenceConfidence: EvidenceConfidence;
  comparativePattern?: {
    archetype: string;
    recurringCivilizations: string[];
    relationshipType: PatternRelationshipType;
  };
  practicalWisdomPrinciple: string;
  biologicalOrPsychologicalFactor?: string;
  scientificVsInterpretiveDistinction?: string;
}

export interface WisdomQueryContext {
  userSituation: string;
  desiredIdentity?: string;
  coreMission?: string;
  emotionalState?: string;
  currentObstacle?: string;
  currentPriorities?: string[];
  recentFreeTalkSnippet?: string;
  requestingOrb?: 'guidance' | 'motivation' | 'spiritual' | 'health' | 'relationships' | 'planner' | 'general';
  categoryOfProblem?: string;
  userEnergyLevel?: number;
  momentumHistory?: {
    recentCompletedCount?: number;
    recentPostponedCount?: number;
    chronicResistanceArea?: string;
  };
}

export interface WisdomSynthesisResult {
  relevantDomains: WisdomDomain[];
  humanNeeds: string[];
  behavioralPatterns: string[];
  historicalPatterns: string[];
  biologicalFactors: string[];
  psychologicalFactors: string[];
  spiritualMeaning: string[];
  practicalImplications: string[];
  riskFactors: string[];
  evidenceConfidence: EvidenceConfidence;
  recommendedPrinciples: string[];
  internalRationale: string;
  guidanceSynthesis: {
    primaryShift: string;
    groundedActionAdvice: string;
    recommendedReflectionQuestion: string;
  };
}

export interface IKnowledgeProvider {
  domain: WisdomDomain;
  getRelevantSnippets(query: string, category?: string): KnowledgeSnippet[];
}
