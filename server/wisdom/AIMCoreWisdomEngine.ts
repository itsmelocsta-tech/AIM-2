/**
 * AIM Core Wisdom Engine
 * Private internal reasoning layer that interconnects 10 core knowledge domains
 * and provides deep, grounded human synthesis to all AIM agents, orbs, and planners.
 */

import {
  WisdomDomain,
  WisdomQueryContext,
  WisdomSynthesisResult,
  KnowledgeSnippet,
  EvidenceConfidence,
} from './types';
import {
  HistoricalMesopotamianProvider,
  ScripturalHebrewProvider,
  EtymologyLinguisticsProvider,
  ScientificBiologyProvider,
  PsychologicalBehavioralProvider,
  AnthropologicalHistoryProvider,
  SpiritualityConsciousnessProvider,
  AncientCosmologyAlternativeProvider,
  PhysicsQuantumProvider,
  ComparativeMythologyProvider,
} from './knowledgeProviders';

export class AIMCoreWisdomEngine {
  private static instance: AIMCoreWisdomEngine;

  private mesopotamianProvider = new HistoricalMesopotamianProvider();
  private scripturalProvider = new ScripturalHebrewProvider();
  private etymologyProvider = new EtymologyLinguisticsProvider();
  private biologyProvider = new ScientificBiologyProvider();
  private psychologyProvider = new PsychologicalBehavioralProvider();
  private anthropologyProvider = new AnthropologicalHistoryProvider();
  private spiritualityProvider = new SpiritualityConsciousnessProvider();
  private cosmologyProvider = new AncientCosmologyAlternativeProvider();
  private physicsProvider = new PhysicsQuantumProvider();
  private mythologyProvider = new ComparativeMythologyProvider();

  public static getInstance(): AIMCoreWisdomEngine {
    if (!AIMCoreWisdomEngine.instance) {
      AIMCoreWisdomEngine.instance = new AIMCoreWisdomEngine();
    }
    return AIMCoreWisdomEngine.instance;
  }

  /**
   * Synthesize deep wisdom across relevant domains without exposing raw academic jargon to the user.
   * Input: User situation, profile, emotional state, requesting orb, problem category, momentum history.
   * Output: Structured internal reasoning for LLM prompt injection and priority alignment.
   */
  public synthesizeWisdom(context: WisdomQueryContext): WisdomSynthesisResult {
    const relevantSnippets: KnowledgeSnippet[] = [];
    const query = `${context.userSituation} ${context.currentObstacle || ''} ${context.categoryOfProblem || ''} ${context.recentFreeTalkSnippet || ''}`;

    // Query domain providers based on context keywords and orb specialty
    const domainScores: Record<WisdomDomain, number> = {
      human_biology: 1,
      psychology_behavior: 1,
      biblical_hebrew: 0,
      ancient_mesopotamian: 0,
      etymology_linguistics: 0,
      anthropology_history: 0,
      spirituality_consciousness: 0,
      ancient_cosmology_alternative: 0,
      physics_quantum: 0,
      comparative_mythology: 0,
    };

    // Weight by requesting orb
    if (context.requestingOrb === 'health') {
      domainScores.human_biology += 3;
      domainScores.psychology_behavior += 2;
    } else if (context.requestingOrb === 'motivation') {
      domainScores.psychology_behavior += 3;
      domainScores.human_biology += 2;
      domainScores.physics_quantum += 1;
    } else if (context.requestingOrb === 'spiritual') {
      domainScores.spirituality_consciousness += 3;
      domainScores.biblical_hebrew += 2;
      domainScores.comparative_mythology += 2;
      domainScores.ancient_mesopotamian += 1;
    } else if (context.requestingOrb === 'relationships') {
      domainScores.psychology_behavior += 3;
      domainScores.anthropology_history += 2;
      domainScores.biblical_hebrew += 1;
    } else if (context.requestingOrb === 'guidance' || context.requestingOrb === 'planner') {
      domainScores.psychology_behavior += 2;
      domainScores.human_biology += 2;
      domainScores.anthropology_history += 1;
    }

    // Contextual triggers
    const qLower = query.toLowerCase();
    if (qLower.includes('sleep') || qLower.includes('tired') || qLower.includes('energy') || qLower.includes('burnout')) {
      domainScores.human_biology += 3;
      domainScores.psychology_behavior += 2;
    }
    if (qLower.includes('afraid') || qLower.includes('fear') || qLower.includes('stuck') || qLower.includes('procrastinat')) {
      domainScores.psychology_behavior += 3;
      domainScores.etymology_linguistics += 2;
    }
    if (qLower.includes('meaning') || qLower.includes('purpose') || qLower.includes('god') || qLower.includes('spirit') || qLower.includes('pray')) {
      domainScores.spirituality_consciousness += 3;
      domainScores.biblical_hebrew += 2;
      domainScores.comparative_mythology += 2;
    }
    if (qLower.includes('history') || qLower.includes('ancient') || qLower.includes('origin') || qLower.includes('anunnaki') || qLower.includes('sumer')) {
      domainScores.ancient_mesopotamian += 3;
      domainScores.ancient_cosmology_alternative += 2;
      domainScores.comparative_mythology += 2;
    }
    if (qLower.includes('quantum') || qLower.includes('entropy') || qLower.includes('physics') || qLower.includes('energy')) {
      domainScores.physics_quantum += 3;
    }

    // Retrieve snippets from top active providers
    if (domainScores.human_biology > 0) {
      relevantSnippets.push(...this.biologyProvider.getRelevantSnippets(query, context.categoryOfProblem));
    }
    if (domainScores.psychology_behavior > 0) {
      relevantSnippets.push(...this.psychologyProvider.getRelevantSnippets(query, context.categoryOfProblem));
    }
    if (domainScores.biblical_hebrew > 0) {
      relevantSnippets.push(...this.scripturalProvider.getRelevantSnippets(query, context.categoryOfProblem));
    }
    if (domainScores.ancient_mesopotamian > 0) {
      relevantSnippets.push(...this.mesopotamianProvider.getRelevantSnippets(query, context.categoryOfProblem));
    }
    if (domainScores.etymology_linguistics > 0) {
      relevantSnippets.push(...this.etymologyProvider.getRelevantSnippets(query, context.categoryOfProblem));
    }
    if (domainScores.anthropology_history > 0) {
      relevantSnippets.push(...this.anthropologyProvider.getRelevantSnippets(query, context.categoryOfProblem));
    }
    if (domainScores.spirituality_consciousness > 0) {
      relevantSnippets.push(...this.spiritualityProvider.getRelevantSnippets(query, context.categoryOfProblem));
    }
    if (domainScores.ancient_cosmology_alternative > 0) {
      relevantSnippets.push(...this.cosmologyProvider.getRelevantSnippets(query, context.categoryOfProblem));
    }
    if (domainScores.physics_quantum > 0) {
      relevantSnippets.push(...this.physicsProvider.getRelevantSnippets(query, context.categoryOfProblem));
    }
    if (domainScores.comparative_mythology > 0) {
      relevantSnippets.push(...this.mythologyProvider.getRelevantSnippets(query, context.categoryOfProblem));
    }

    // Deduplicate domains and snippets
    const detectedDomains = Array.from(new Set(relevantSnippets.map((s) => s.domain)));
    if (detectedDomains.length === 0) {
      detectedDomains.push('psychology_behavior', 'human_biology');
    }

    // Synthesize structured facets
    const humanNeeds: string[] = [];
    const behavioralPatterns: string[] = [];
    const historicalPatterns: string[] = [];
    const biologicalFactors: string[] = [];
    const psychologicalFactors: string[] = [];
    const spiritualMeaning: string[] = [];
    const practicalImplications: string[] = [];
    const riskFactors: string[] = [];
    const recommendedPrinciples: string[] = [];

    // Biological baseline assessment
    if (context.userEnergyLevel !== undefined && context.userEnergyLevel <= 4) {
      biologicalFactors.push('Low physiological energy baseline (nervous system fatigue / prefrontal exhaustion)');
      humanNeeds.push('Somatic recovery & autonomic down-regulation');
      riskFactors.push('High vulnerability to cognitive overwhelm or emotional reactivity if overloaded');
      practicalImplications.push('Shrink immediate tasks to ultra-low cognitive load micro-actions');
    } else {
      biologicalFactors.push('Sufficient physiological energy for focused deep-work execution');
      humanNeeds.push('Compounding execution & momentum maintenance');
    }

    // Process snippets into synthesis buckets
    relevantSnippets.forEach((snippet) => {
      recommendedPrinciples.push(snippet.practicalWisdomPrinciple);
      if (snippet.domain === 'human_biology') {
        biologicalFactors.push(snippet.summary);
      } else if (snippet.domain === 'psychology_behavior') {
        psychologicalFactors.push(snippet.summary);
        behavioralPatterns.push(`Pattern insight: ${snippet.topic}`);
      } else if (snippet.domain === 'biblical_hebrew' || snippet.domain === 'ancient_mesopotamian') {
        historicalPatterns.push(`${snippet.topic}: ${snippet.summary}`);
      } else if (snippet.domain === 'spirituality_consciousness') {
        spiritualMeaning.push(snippet.summary);
      }
    });

    // Momentum engine feedback
    if (context.momentumHistory?.recentPostponedCount && context.momentumHistory.recentPostponedCount > 2) {
      behavioralPatterns.push('Recurring friction/avoidance loop detected in recent daily execution');
      riskFactors.push('Erosion of self-trust if tasks continue to be rolled over without scope reduction');
      practicalImplications.push('Prune unessential secondary commitments and lock in a single non-negotiable 15-minute win');
    }

    // Determine overall evidence confidence
    let confidence: EvidenceConfidence = 'ESTABLISHED';
    if (relevantSnippets.some((s) => s.evidenceConfidence === 'SPECULATIVE')) {
      confidence = 'INTERPRETIVE';
    }

    // Actionable human guidance extraction (Clear human guidance out)
    const primaryShift =
      recommendedPrinciples.length > 0
        ? recommendedPrinciples[0]
        : 'Convert current emotional friction into the smallest viable physical next step.';

    const groundedActionAdvice =
      context.userEnergyLevel && context.userEnergyLevel <= 4
        ? 'Rest and restore your baseline before engaging in demanding cognitive battles.'
        : 'Identify the single highest-leverage priority and execute without distractions for 25 minutes.';

    const recommendedReflectionQuestion =
      context.requestingOrb === 'spiritual'
        ? 'What is this current chapter asking you to surrender or step into?'
        : context.requestingOrb === 'relationships'
        ? 'What clear boundary or honest conversation would restore peace here?'
        : 'What is the immediate next move that makes everything else easier or unnecessary?';

    return {
      relevantDomains: detectedDomains,
      humanNeeds: Array.from(new Set(humanNeeds)),
      behavioralPatterns: Array.from(new Set(behavioralPatterns)),
      historicalPatterns: Array.from(new Set(historicalPatterns)),
      biologicalFactors: Array.from(new Set(biologicalFactors)),
      psychologicalFactors: Array.from(new Set(psychologicalFactors)),
      spiritualMeaning: Array.from(new Set(spiritualMeaning)),
      practicalImplications: Array.from(new Set(practicalImplications)),
      riskFactors: Array.from(new Set(riskFactors)),
      evidenceConfidence: confidence,
      recommendedPrinciples: Array.from(new Set(recommendedPrinciples)),
      internalRationale: `Synthesized across [${detectedDomains.join(', ')}] with focus on ${context.requestingOrb || 'holistic'} alignment.`,
      guidanceSynthesis: {
        primaryShift,
        groundedActionAdvice,
        recommendedReflectionQuestion,
      },
    };
  }
}
