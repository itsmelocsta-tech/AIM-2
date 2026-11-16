import { describe, expect, it } from 'vitest';
import { AIMCoreWisdomEngine } from '../server/wisdom/AIMCoreWisdomEngine';

describe('AIM Core Wisdom Engine guidance loop', () => {
  it('grounds Awareness, Intention, Motion, and adaptation in supplied facts', () => {
    const result = AIMCoreWisdomEngine.getInstance().synthesizeWisdom({
      userSituation: 'I need help deciding what to do after my schedule changed.',
      currentObstacle: 'My work shift moved earlier.',
      currentCircumstances: ['The work shift now starts two hours earlier.'],
      recentReflections: ['Checking messages before writing made it harder to start.'],
      observedPatterns: ['Phone-free starts reduced drift'],
      activePlan: ['Outline the final scene'],
      latestLifeChange: 'The work shift now starts two hours earlier.',
      requestingOrb: 'guidance',
      userEnergyLevel: 4,
      availableHours: 2,
    });

    expect(result.guidanceSynthesis.awareness).toBe('The work shift now starts two hours earlier.');
    expect(result.guidanceSynthesis.intention).toBe('Outline the final scene');
    expect(result.guidanceSynthesis.motion).toContain('10 to 15 minute');
    expect(result.guidanceSynthesis.adaptation).toContain('alter only affected commitments');
    expect(result.guidanceSynthesis.pitfallToAvoid).toContain('Phone-free starts reduced drift');
    expect(result.behavioralPatterns).toContain('User-confirmed reflection pattern: Phone-free starts reduced drift');
  });

  it('does not claim a personal pattern when none was supplied', () => {
    const result = AIMCoreWisdomEngine.getInstance().synthesizeWisdom({
      userSituation: 'Help me pick a next step.',
      requestingOrb: 'guidance',
      activePlan: ['Open the saved plan'],
      userEnergyLevel: 7,
    });

    expect(result.guidanceSynthesis.pitfallToAvoid).toContain('Do not claim a personal pattern');
    expect(result.behavioralPatterns.some((pattern) => pattern.startsWith('User-confirmed'))).toBe(false);
  });
});
