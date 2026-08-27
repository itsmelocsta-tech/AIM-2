/**
 * AIM Core Wisdom Engine - Knowledge Providers
 * Modular, evidence-classified knowledge domains powering AIM's private reasoning layer.
 */

import {
  WisdomDomain,
  KnowledgeSnippet,
  IKnowledgeProvider,
  EvidenceConfidence,
  PatternRelationshipType,
} from './types';

export class HistoricalMesopotamianProvider implements IKnowledgeProvider {
  domain: WisdomDomain = 'ancient_mesopotamian';

  private snippets: KnowledgeSnippet[] = [
    {
      id: 'meso_gilgamesh_mortality',
      domain: 'ancient_mesopotamian',
      topic: 'Epic of Gilgamesh & Confronting Limits',
      summary: 'Gilgamesh mourns Enkidu, seeks immortality from Utnapishtim, but learns true legacy lies in the walls of Uruk—tangible craftsmanship, human connection, and accepting temporal existence.',
      historicalContext: 'Standard Babylonian version compiled by Sin-leqi-unninni (c. 1200 BCE) from earlier Sumerian poems (c. 2100 BCE).',
      evidenceConfidence: 'ESTABLISHED',
      practicalWisdomPrinciple: 'Human transformation occurs when energy shifts from evading reality or chasing unattainable permanency toward building enduring daily craft and community.',
    },
    {
      id: 'meso_enuma_elish_order',
      domain: 'ancient_mesopotamian',
      topic: 'Enuma Elish & Establishing Order from Chaos',
      summary: 'Marduk subdues the chaotic primordial saltwater abyss (Tiamat) and organizes the heavens, calendar, constellations, and societal responsibilities.',
      historicalContext: 'Babylonian creation epic recited annually during the Akitu New Year festival (c. 18th–12th century BCE).',
      evidenceConfidence: 'ESTABLISHED',
      practicalWisdomPrinciple: 'When life feels disordered and overwhelming, breaking down chaos into structured temporal intervals and clear responsibilities restores psychological sovereignty.',
    },
    {
      id: 'meso_atrahasis_humanity',
      domain: 'ancient_mesopotamian',
      topic: 'Atrahasis Epic & The Architecture of Labor and Rest',
      summary: 'Humanity is created by Enki and Ninhursag from clay mixed with the spirit of an intelligent deity to maintain the world and steward life.',
      historicalContext: '18th-century BCE Akkadian epic; earliest comprehensive flood narrative on cuneiform tablets.',
      evidenceConfidence: 'ESTABLISHED',
      practicalWisdomPrinciple: 'Purpose emerges when effort is aligned with stewarding one’s immediate environment rather than viewing responsibilities as meaningless burdens.',
    },
    {
      id: 'meso_inanna_descent',
      domain: 'ancient_mesopotamian',
      topic: 'Descent of Inanna & Psychological Pruning',
      summary: 'Inanna descends to the Kur (underworld), shedding a piece of regalia at each of the seven gates until completely vulnerable before her sister Ereshkigal, undergoing death and rebirth.',
      historicalContext: 'Sumerian cuneiform hymn (c. 1900 BCE); earliest recorded descent-and-return myth.',
      evidenceConfidence: 'ESTABLISHED',
      practicalWisdomPrinciple: 'Entering a major life transformation often requires shedding outdated identities and defensive armors gate by gate before genuine renewal is possible.',
    },
    {
      id: 'meso_divine_councils_anunnaki',
      domain: 'ancient_mesopotamian',
      topic: 'Anunna / Anunnaki in Cuneiform Records',
      summary: 'In Sumerian and Akkadian administrative and religious texts, the Anunna are the collective assembly of major deities (Anu, Enlil, Enki, Ninhursag) acting as arbiters of cosmic destiny (Me) and societal laws.',
      historicalContext: 'Tablets from Ur III, Old Babylonian, and Neo-Assyrian archives.',
      evidenceConfidence: 'ESTABLISHED',
      practicalWisdomPrinciple: 'Complex decisions require weighing multifaceted perspectives (creative insight, protective boundaries, strategic order) rather than acting impulsively.',
    },
  ];

  getRelevantSnippets(query: string, category?: string): KnowledgeSnippet[] {
    const q = (query + ' ' + (category || '')).toLowerCase();
    return this.snippets.filter(
      (s) =>
        q.includes(s.topic.toLowerCase()) ||
        q.includes('history') ||
        q.includes('ancient') ||
        q.includes('meaning') ||
        q.includes('chaos') ||
        q.includes('order') ||
        q.includes('purpose') ||
        q.includes('transformation') ||
        q.includes('restart') ||
        q.includes('death') ||
        q.includes('legacy')
    );
  }
}

export class ScripturalHebrewProvider implements IKnowledgeProvider {
  domain: WisdomDomain = 'biblical_hebrew';

  private snippets: KnowledgeSnippet[] = [
    {
      id: 'hebrew_ruach_breath',
      domain: 'biblical_hebrew',
      topic: 'Ruach, Nephesh, and Neshama (Breath, Life, and Soul)',
      summary: 'Ancient Hebrew anthropology views the human being not as a divided soul-body dichotomy, but as a unified living being (Nephesh Chayah) animated by divine breath (Ruach/Neshama).',
      historicalContext: 'Genesis 2:7, Ecclesiastes, Tanakh wisdom literature; distinct from later Greek Cartesian dualism.',
      linguisticRoot: {
        originalWord: 'נֶפֶשׁ (Nephesh) / רוּחַ (Ruach)',
        language: 'Biblical Hebrew',
        literalMeaning: 'Throat/creaturely vitality (Nephesh) and wind/breath/spirit (Ruach)',
        semanticEvolution: 'Shifted from holistic living vitality to abstract disembodied soul in later Hellenistic translations.',
      },
      evidenceConfidence: 'ESTABLISHED',
      practicalWisdomPrinciple: 'Mental clarity, physical vitality, and spiritual intention are one integrated system; nurturing sleep, breath, and movement directly elevates emotional focus.',
    },
    {
      id: 'hebrew_covenant_responsibility',
      domain: 'biblical_hebrew',
      topic: 'Berit (Covenant) & Relational Integrity',
      summary: 'Covenant in ancient Hebrew traditions is a binding, reciprocal pact prioritizing steadfast loyalty (Hesed), mutual accountability, and justice rather than mere transactional contracts.',
      historicalContext: 'Torah, Exodus, Deuteronomy, Ancient Near Eastern suzerainty treaties.',
      evidenceConfidence: 'ESTABLISHED',
      practicalWisdomPrinciple: 'Commitments made to oneself and others gain compounding strength when treated with sacred consistency and clear mutual boundaries.',
    },
    {
      id: 'hebrew_shabbat_rest',
      domain: 'biblical_hebrew',
      topic: 'Shabbat & Deliberate Cessation',
      summary: 'Shabbat (from Shavat, to cease) is the radical decoupling of human worth from relentless production, establishing rhythm and sanctuary in time.',
      historicalContext: 'Genesis 2:2-3, Exodus 20:8-11, Abraham Joshua Heschel historical studies.',
      linguisticRoot: {
        originalWord: 'שָׁבַת (Shavat)',
        language: 'Biblical Hebrew',
        literalMeaning: 'To cease, desist, rest from generative exertion',
      },
      evidenceConfidence: 'ESTABLISHED',
      practicalWisdomPrinciple: 'Structured rest is not the reward for exhaustion; it is the vital boundary that preserves human dignity, prevents burnout, and renews creative capacity.',
    },
    {
      id: 'hebrew_hokhmah_wisdom',
      domain: 'biblical_hebrew',
      topic: 'Hokhmah (Applied Practical Wisdom)',
      summary: 'In Proverbs and Tanakh literature, Hokhmah is not abstract theoretical contemplation but master craftsmanship in living—the skill of making wise, generative decisions in daily life.',
      linguisticRoot: {
        originalWord: 'חָכְמָה (Chokhmah)',
        language: 'Biblical Hebrew',
        literalMeaning: 'Technical skill, artistic craftsmanship, moral acumen',
      },
      evidenceConfidence: 'ESTABLISHED',
      practicalWisdomPrinciple: 'True wisdom is measured by how effectively one executes daily integrity, manages relationships, and turns ideals into grounded habits.',
    },
  ];

  getRelevantSnippets(query: string, category?: string): KnowledgeSnippet[] {
    const q = (query + ' ' + (category || '')).toLowerCase();
    return this.snippets.filter(
      (s) =>
        q.includes('spiritual') ||
        q.includes('rest') ||
        q.includes('burnout') ||
        q.includes('soul') ||
        q.includes('purpose') ||
        q.includes('commitment') ||
        q.includes('integrity') ||
        q.includes('wisdom') ||
        q.includes('hebrew') ||
        q.includes('biblical')
    );
  }
}

export class EtymologyLinguisticsProvider implements IKnowledgeProvider {
  domain: WisdomDomain = 'etymology_linguistics';

  private snippets: KnowledgeSnippet[] = [
    {
      id: 'etym_discipline',
      domain: 'etymology_linguistics',
      topic: 'Discipline from Discere (To Learn)',
      summary: 'Discipline originates from Latin "discipulus" and "discere" meaning a learner or disciple, rather than punitive self-chastisement.',
      linguisticRoot: {
        originalWord: 'Disciplina / Discere',
        language: 'Latin',
        literalMeaning: 'Instruction, learning, study, cultivation of knowledge',
        semanticEvolution: 'Evolved in modern culture from loving apprenticeship to harsh self-punishment.',
      },
      evidenceConfidence: 'ESTABLISHED',
      practicalWisdomPrinciple: 'Approach daily routines not as a harsh prison warden punishing yourself, but as an apprentice curious about mastering your life craft.',
    },
    {
      id: 'etym_courage',
      domain: 'etymology_linguistics',
      topic: 'Courage from Cor (Heart)',
      summary: 'Courage derives from Latin "cor" (heart) and Old French "corage", meaning to speak and act from the core of one\'s authentic being.',
      linguisticRoot: {
        originalWord: 'Cor / Corage',
        language: 'Latin / Old French',
        literalMeaning: 'Heart, innermost seat of feeling and purpose',
      },
      evidenceConfidence: 'ESTABLISHED',
      practicalWisdomPrinciple: 'Courage is not the absence of fear, but taking the necessary next step because your deeper purpose matters more than the temporary discomfort.',
    },
    {
      id: 'etym_crisis',
      domain: 'etymology_linguistics',
      topic: 'Crisis from Krino (To Sift, Discern, Decide)',
      summary: 'Ancient Greek "krisis" denotes a turning point, decisive moment, or the act of sifting wheat from chaff.',
      linguisticRoot: {
        originalWord: 'κρίσις (Krisis)',
        language: 'Ancient Greek',
        literalMeaning: 'Decision, judgment, sifting, turning point',
      },
      evidenceConfidence: 'ESTABLISHED',
      practicalWisdomPrinciple: 'A life crisis is a decisive fork in the road requiring you to sift what is truly essential from what must be released.',
    },
    {
      id: 'etym_sin_hamartia',
      domain: 'etymology_linguistics',
      topic: 'Missing the Mark (Hamartia / Chata)',
      summary: 'In Biblical Hebrew (Chata) and Ancient Greek (Hamartia), the root meaning is an archer who misses the center target, inviting recalibration rather than permanent condemnation.',
      linguisticRoot: {
        originalWord: 'חָטָא (Chata) / ἁμαρτία (Hamartia)',
        language: 'Biblical Hebrew / Ancient Greek',
        literalMeaning: 'To miss the target, lose the way, err in trajectory',
      },
      evidenceConfidence: 'ESTABLISHED',
      practicalWisdomPrinciple: 'When you miss a daily goal or stumble on a routine, do not shame yourself; simply recalibrate your stance, adjust your aim, and take the next shot.',
    },
  ];

  getRelevantSnippets(query: string, category?: string): KnowledgeSnippet[] {
    const q = (query + ' ' + (category || '')).toLowerCase();
    return this.snippets.filter(
      (s) =>
        q.includes('discipline') ||
        q.includes('courage') ||
        q.includes('fear') ||
        q.includes('quit') ||
        q.includes('fail') ||
        q.includes('crisis') ||
        q.includes('language') ||
        q.includes('etymology') ||
        q.includes('guilt') ||
        q.includes('shame')
    );
  }
}

export class ScientificBiologyProvider implements IKnowledgeProvider {
  domain: WisdomDomain = 'human_biology';

  private snippets: KnowledgeSnippet[] = [
    {
      id: 'bio_circadian_sleep',
      domain: 'human_biology',
      topic: 'Circadian Biology, Adenosine, and Prefrontal Energy',
      summary: 'Sleep debt and disrupted circadian rhythms impair the prefrontal cortex, reducing executive function, emotional regulation, and willpower while elevating amygdala reactivity.',
      evidenceConfidence: 'ESTABLISHED',
      biologicalOrPsychologicalFactor: 'Adenosine accumulation, melatonin-cortisol rhythm synchronization, REM/slow-wave neurotoxin clearance.',
      practicalWisdomPrinciple: 'Never judge your character or long-term potential when you are operating on severe sleep deprivation; prioritize physiological baseline recovery first.',
    },
    {
      id: 'bio_dopamine_reward',
      domain: 'human_biology',
      topic: 'Dopamine Dynamics, Baseline vs Spikes, and Effort Satiety',
      summary: 'Dopamine mediates anticipation and pursuit rather than ultimate pleasure. Cheap high-spike inputs deplete tonic dopamine baselines, causing anhedonia and friction toward effortful deep work.',
      evidenceConfidence: 'ESTABLISHED',
      biologicalOrPsychologicalFactor: 'Mesolimbic pathway, dopamine receptor D2 regulation, reward prediction error.',
      practicalWisdomPrinciple: 'Protect morning hours from cheap stimulation (scrolling, notifications) to preserve cognitive baseline for rewarding deep work.',
    },
    {
      id: 'bio_nervous_system_autonomic',
      domain: 'human_biology',
      topic: 'Autonomic Regulation: Sympathetic vs Parasympathetic',
      summary: 'Chronic stress locks the nervous system in sympathetic hyperarousal (fight/flight) or dorsal vagal freeze (procrastination/exhaustion), shutting down creative problem-solving.',
      evidenceConfidence: 'ESTABLISHED',
      biologicalOrPsychologicalFactor: 'Polyvagal theory, vagal tone, cortisol/adrenaline cascades.',
      practicalWisdomPrinciple: 'Use physiological sighs (two quick inhales, long slow exhale) and physical movement to shift state before attempting cognitive planning.',
    },
    {
      id: 'bio_nutrition_blood_sugar',
      domain: 'human_biology',
      topic: 'Metabolic Energy and Glycemic Stability',
      summary: 'Glucose volatility creates rapid cognitive crashes and emotional irritability misidentified as lack of motivation.',
      evidenceConfidence: 'ESTABLISHED',
      practicalWisdomPrinciple: 'Anchor energy with balanced protein, hydration, and regular nourishing meals to sustain steady mental momentum throughout the day.',
    },
  ];

  getRelevantSnippets(query: string, category?: string): KnowledgeSnippet[] {
    const q = (query + ' ' + (category || '')).toLowerCase();
    return this.snippets.filter(
      (s) =>
        q.includes('sleep') ||
        q.includes('tired') ||
        q.includes('energy') ||
        q.includes('stress') ||
        q.includes('health') ||
        q.includes('brain') ||
        q.includes('focus') ||
        q.includes('procrastinat') ||
        q.includes('biology') ||
        q.includes('exhaust')
    );
  }
}

export class PsychologicalBehavioralProvider implements IKnowledgeProvider {
  domain: WisdomDomain = 'psychology_behavior';

  private snippets: KnowledgeSnippet[] = [
    {
      id: 'psych_habit_loops',
      domain: 'psychology_behavior',
      topic: 'Habit Architecture and Identity-Based Change',
      summary: 'Habits form via Cue-Routine-Reward loops. Sustainable behavioral change occurs not through brute willpower, but by redesigning environmental cues and adopting identity-aligned micro-actions.',
      evidenceConfidence: 'ESTABLISHED',
      practicalWisdomPrinciple: 'Every action you take is a vote for the person you wish to become. Make the starting friction so low that you cannot say no (the 2-minute rule).',
    },
    {
      id: 'psych_avoidance_emotion',
      domain: 'psychology_behavior',
      topic: 'Procrastination as Emotional Regulation Deficit',
      summary: 'Procrastination is rarely laziness or poor time management; it is an instinctual avoidance of negative emotions (boredom, anxiety, self-doubt, fear of failure) triggered by a task.',
      evidenceConfidence: 'ESTABLISHED',
      practicalWisdomPrinciple: 'Acknowledge the specific feeling creating friction without self-judgment, shrink the task to its immediate first physical step, and begin without needing to feel like doing it.',
    },
    {
      id: 'psych_decision_fatigue',
      domain: 'psychology_behavior',
      topic: 'Decision Fatigue and Cognitive Load Management',
      summary: 'Each decision depletes finite daily willpower reserves. Ambiguity and endless open tabs paralyze action.',
      evidenceConfidence: 'ESTABLISHED',
      practicalWisdomPrinciple: 'Decide tomorrow’s top priority today so you wake up with an uninterrupted track rather than a confusing menu of choices.',
    },
    {
      id: 'psych_attachment_boundaries',
      domain: 'psychology_behavior',
      topic: 'Relational Boundaries and Secure Attachment',
      summary: 'Healthy boundaries protect emotional bandwidth and foster genuine intimacy without codependent resentment.',
      evidenceConfidence: 'ESTABLISHED',
      practicalWisdomPrinciple: 'Clear, compassionate boundaries are not walls to keep people out; they are the rules of engagement that make safe connection possible.',
    },
  ];

  getRelevantSnippets(query: string, category?: string): KnowledgeSnippet[] {
    const q = (query + ' ' + (category || '')).toLowerCase();
    return this.snippets.filter(
      (s) =>
        q.includes('habit') ||
        q.includes('quit') ||
        q.includes('start') ||
        q.includes('procrastinat') ||
        q.includes('motivation') ||
        q.includes('fear') ||
        q.includes('relationship') ||
        q.includes('boundary') ||
        q.includes('decision') ||
        q.includes('identity') ||
        q.includes('overwhelm')
    );
  }
}

export class AnthropologicalHistoryProvider implements IKnowledgeProvider {
  domain: WisdomDomain = 'anthropology_history';

  private snippets: KnowledgeSnippet[] = [
    {
      id: 'anthro_storytelling_tribe',
      domain: 'anthropology_history',
      topic: 'Tribal Cohesion, Ritual, and Mythmaking',
      summary: 'For 99% of human history, small kin groups synchronized effort through shared stories, evening fireside reflections, and initiation rites that marked developmental transitions.',
      evidenceConfidence: 'ESTABLISHED',
      practicalWisdomPrinciple: 'Humans need daily rituals (morning alignment, evening review) to close mental loops and mark progress across life chapters.',
    },
    {
      id: 'anthro_hunter_gatherer_pacing',
      domain: 'anthropology_history',
      topic: 'Evolutionary Mismatch & Continuous Industrial Alert',
      summary: 'Human physiology evolved for episodic exertion followed by community restoration, not the non-stop cognitive hyper-vigilance of modern digital notifications.',
      evidenceConfidence: 'ESTABLISHED',
      practicalWisdomPrinciple: 'Structure your day into episodic sprints (60-90m) followed by real sensory disconnection to align with human evolutionary rhythms.',
    },
  ];

  getRelevantSnippets(query: string, category?: string): KnowledgeSnippet[] {
    const q = (query + ' ' + (category || '')).toLowerCase();
    return this.snippets.filter(
      (s) =>
        q.includes('history') ||
        q.includes('tribe') ||
        q.includes('ritual') ||
        q.includes('burnout') ||
        q.includes('modern') ||
        q.includes('human') ||
        q.includes('society')
    );
  }
}

export class SpiritualityConsciousnessProvider implements IKnowledgeProvider {
  domain: WisdomDomain = 'spirituality_consciousness';

  private snippets: KnowledgeSnippet[] = [
    {
      id: 'spirit_mindfulness_witness',
      domain: 'spirituality_consciousness',
      topic: 'The Witness Consciousness (Sakshi / Meta-Awareness)',
      summary: 'In Vedic, Buddhist, and contemplative traditions, the true self is the silent observing awareness behind thoughts, emotions, and sensations rather than the fleeting thoughts themselves.',
      evidenceConfidence: 'SPIRITUAL_OR_METAPHYSICAL',
      practicalWisdomPrinciple: 'You are not your anxious thoughts or temporary setbacks; you are the conscious space in which those experiences arise and pass away.',
    },
    {
      id: 'spirit_manifestation_alignment',
      domain: 'spirituality_consciousness',
      topic: 'Intentional Manifestation as Embodied Coherence',
      summary: 'Manifestation traditions emphasize aligning internal state, clear intention, and diligent outward action to create resonance and recognize opportunities.',
      evidenceConfidence: 'INTERPRETIVE',
      scientificVsInterpretiveDistinction: 'Mindset changes perception and opportunity recognition; it does not replace physical causation or effort.',
      practicalWisdomPrinciple: 'Clarity of vision sharpens your attention to notice resources and pathways that were previously invisible.',
    },
  ];

  getRelevantSnippets(query: string, category?: string): KnowledgeSnippet[] {
    const q = (query + ' ' + (category || '')).toLowerCase();
    return this.snippets.filter(
      (s) =>
        q.includes('spiritual') ||
        q.includes('consciousness') ||
        q.includes('manifest') ||
        q.includes('meditation') ||
        q.includes('peace') ||
        q.includes('meaning') ||
        q.includes('mindful')
    );
  }
}

export class AncientCosmologyAlternativeProvider implements IKnowledgeProvider {
  domain: WisdomDomain = 'ancient_cosmology_alternative';

  private snippets: KnowledgeSnippet[] = [
    {
      id: 'cosmo_anunnaki_nibiru_analysis',
      domain: 'ancient_cosmology_alternative',
      topic: 'Anunnaki, Nibiru, and Alternative Interpretations',
      summary: 'Cuneiform tablets document Anunna deities and "Nibiru" as a celestial marker associated with Jupiter or Marduk. 20th-century alternative authors (e.g. Zecharia Sitchin) hypothesized extraterrestrial colonizers.',
      historicalContext: 'Astronomical text MUL.APIN (c. 1000 BCE) vs Sitchin "12th Planet" (1976).',
      evidenceConfidence: 'SPECULATIVE',
      scientificVsInterpretiveDistinction: 'Academic Assyriology translates Nibiru as a crossing point/planetary marker; ancient astronaut hypotheses remain speculative interpretations without archaeological peer verification.',
      practicalWisdomPrinciple: 'Examine intriguing historical hypotheses with intellectual honesty, enjoying deep symbolic questions while keeping daily action grounded in verifiable reality.',
    },
    {
      id: 'cosmo_tiamat_primordial_chaos',
      domain: 'ancient_cosmology_alternative',
      topic: 'Tiamat & Primordial Saltwater Symbolism',
      summary: 'In Mesopotamian cosmology, Tiamat symbolizes the untamed primordial ocean from which heaven and earth are formed.',
      evidenceConfidence: 'ESTABLISHED',
      practicalWisdomPrinciple: 'Creative birth frequently emerges from wrestling with raw, shapeless raw material until clear structure is forged.',
    },
  ];

  getRelevantSnippets(query: string, category?: string): KnowledgeSnippet[] {
    const q = (query + ' ' + (category || '')).toLowerCase();
    return this.snippets.filter(
      (s) =>
        q.includes('anunnaki') ||
        q.includes('nibiru') ||
        q.includes('tiamat') ||
        q.includes('alien') ||
        q.includes('ancient astronaut') ||
        q.includes('cosmology') ||
        q.includes('sky') ||
        q.includes('planet')
    );
  }
}

export class PhysicsQuantumProvider implements IKnowledgeProvider {
  domain: WisdomDomain = 'physics_quantum';

  private snippets: KnowledgeSnippet[] = [
    {
      id: 'physics_thermodynamics_entropy',
      domain: 'physics_quantum',
      topic: 'Thermodynamics & Dissipative Structures',
      summary: 'The Second Law of Thermodynamics dictates entropy increases in closed systems. Living organisms maintain internal order by taking in energy and expelling entropy.',
      evidenceConfidence: 'ESTABLISHED',
      practicalWisdomPrinciple: 'Order, habits, and clarity require continuous, deliberate daily energy input; drift into disorder is a natural physical law, not a personal flaw.',
    },
    {
      id: 'physics_quantum_measurement',
      domain: 'physics_quantum',
      topic: 'Quantum Mechanics, Superposition, and Measurement',
      summary: 'Quantum states evolve deterministically via the Schrödinger equation until interaction/decoherence occurs. Note: Quantum effects operate at microscopic subatomic scales and do not validate macroscopic mystical pseudoscience.',
      evidenceConfidence: 'ESTABLISHED',
      scientificVsInterpretiveDistinction: 'Quantum entanglement and superposition are rigorous mathematical physics; metaphorical applications to human thoughts are poetic analogies, not experimental physical proof.',
      practicalWisdomPrinciple: 'Focus your active measurement (attention) on constructive possibilities rather than fixating on anxieties.',
    },
  ];

  getRelevantSnippets(query: string, category?: string): KnowledgeSnippet[] {
    const q = (query + ' ' + (category || '')).toLowerCase();
    return this.snippets.filter(
      (s) =>
        q.includes('physics') ||
        q.includes('quantum') ||
        q.includes('energy') ||
        q.includes('entropy') ||
        q.includes('science')
    );
  }
}

export class ComparativeMythologyProvider implements IKnowledgeProvider {
  domain: WisdomDomain = 'comparative_mythology';

  private snippets: KnowledgeSnippet[] = [
    {
      id: 'myth_flood_archetype',
      domain: 'comparative_mythology',
      topic: 'Universal Deluge Traditions & Collective Reset',
      summary: 'Flood narratives appear across Mesopotamia (Utnapishtim/Atrahasis), Genesis (Noah), Greece (Deucalion), India (Manu), and Mesoamerica. They represent cosmic cataclysm and total moral/structural recalibration.',
      comparativePattern: {
        archetype: 'Cataclysmic Water & Archetypal Ark',
        recurringCivilizations: ['Sumerian', 'Akkadian', 'Hebrew', 'Greek', 'Hindu', 'Mayan'],
        relationshipType: 'documented_influence', // Mesopotamian to Hebrew; shared human pattern globally
      },
      evidenceConfidence: 'ESTABLISHED',
      practicalWisdomPrinciple: 'When catastrophic disruption washes away old structures, building a vessel of core essentials allows you to emerge onto renewed terra firma.',
    },
    {
      id: 'myth_clay_humanity_creation',
      domain: 'comparative_mythology',
      topic: 'Creation from Earth/Clay and Divine Breath',
      summary: 'Humanity created from clay/earth infused with breath or divine essence appears in Enki/Ninhursag myths, Genesis 2, Prometheus in Greece, and Nuwa in China.',
      comparativePattern: {
        archetype: 'Formed from Earth, Animated by Spirit',
        recurringCivilizations: ['Sumerian', 'Babylonian', 'Hebrew', 'Greek', 'Chinese', 'Yoruba'],
        relationshipType: 'shared_human_pattern',
      },
      evidenceConfidence: 'ESTABLISHED',
      practicalWisdomPrinciple: 'You possess both earthly biological constraints and elevated conscious agency; respect both your physical needs and your creative potential.',
    },
    {
      id: 'myth_hero_descent_rebirth',
      domain: 'comparative_mythology',
      topic: 'Descent, Abyss, and Renewal (Nekuia / Hero Journey)',
      summary: 'The motif of entering darkness (underworld, belly of the whale, dark forest) to recover a lost treasure appears universally (Gilgamesh, Inanna, Jonah, Orpheus, Dante).',
      comparativePattern: {
        archetype: 'Death and Rebirth / Katabasis',
        recurringCivilizations: ['Sumerian', 'Egyptian', 'Greek', 'Hebrew', 'Norse', 'Indigenous Americas'],
        relationshipType: 'shared_human_pattern',
      },
      evidenceConfidence: 'ESTABLISHED',
      practicalWisdomPrinciple: 'Difficult chapters of uncertainty or grief are not dead ends; they are the transformative descent from which renewed wisdom is forged.',
    },
  ];

  getRelevantSnippets(query: string, category?: string): KnowledgeSnippet[] {
    const q = (query + ' ' + (category || '')).toLowerCase();
    return this.snippets.filter(
      (s) =>
        q.includes('myth') ||
        q.includes('flood') ||
        q.includes('symbol') ||
        q.includes('hero') ||
        q.includes('pattern') ||
        q.includes('reset') ||
        q.includes('creation') ||
        q.includes('story')
    );
  }
}
