import { describe, it, expect } from 'vitest';
import { DEFAULT_PROFILE, DEFAULT_MEMORIES, DEFAULT_GOALS, DEFAULT_DAILY_PLAN, DEFAULT_WELLNESS } from '../src/services/storage';
import { DEFAULT_PERSONAL_CONTEXT, DEFAULT_AIM_PROJECTS, aimContextService } from '../src/services/aimContextService';

describe('User Isolation & Data Neutrality', () => {
  it('DEFAULT_PROFILE is completely unpersonalized and empty of foreign personal data', () => {
    expect(DEFAULT_PROFILE.name).toBe('');
    expect(DEFAULT_PROFILE.email).toBe('');
    expect(DEFAULT_PROFILE.desiredIdentity).toBe('');
    expect(DEFAULT_PROFILE.coreMission).toBe('');
    expect(DEFAULT_PROFILE.primaryObstacle).toBe('');
    expect(DEFAULT_PROFILE.topSkills).toEqual([]);
    expect(DEFAULT_PROFILE.coreValues).toEqual([]);
    expect(DEFAULT_PROFILE.ninetyDayTrajectory).toBe('');
    expect(DEFAULT_PROFILE.onboardingCompleted).toBe(false);
  });

  it('DEFAULT_PERSONAL_CONTEXT has zero hardcoded personal or geographic details', () => {
    expect(DEFAULT_PERSONAL_CONTEXT.location).toBe('');
    expect(DEFAULT_PERSONAL_CONTEXT.driverLicenseType).toBe('');
    expect(DEFAULT_PERSONAL_CONTEXT.licenseReissueDateNote).toBe('');
    expect(DEFAULT_PERSONAL_CONTEXT.historicalDrivingExperience).toBe('');
    expect(DEFAULT_PERSONAL_CONTEXT.transportation.driverLicenseType).toBe('');
    expect(DEFAULT_PERSONAL_CONTEXT.transportation.historicalDrivingExp).toBe('');
    expect(DEFAULT_PERSONAL_CONTEXT.transportation.licenseReissueDate).toBe('');
  });

  it('DEFAULT_AIM_PROJECTS is an empty array by default', () => {
    expect(DEFAULT_AIM_PROJECTS).toEqual([]);
    expect(DEFAULT_MEMORIES).toEqual([]);
    expect(DEFAULT_GOALS).toEqual([]);
    expect(DEFAULT_WELLNESS).toEqual([]);
  });

  it('aimContextService.getPersonalContext does not fall back to Fort Worth or The Ride Guys', () => {
    const context = aimContextService.getPersonalContext();
    expect(context.location).not.toContain('Fort Worth');
    expect(context.driverLicenseType).not.toContain('Texas non-CDL');
    expect(context.licenseReissueDateNote).not.toContain('August 2026');
    expect(context.historicalDrivingExperience).not.toContain('The Ride Guys');
  });

  it('Daily action recommendations respect clean user context without hardcoded defaults', () => {
    const rec = aimContextService.generateDailyRecommendation(DEFAULT_PERSONAL_CONTEXT, []);
    expect(rec.moneyMove.title).not.toContain('BrandNMotion');
    expect(rec.whereYouAre).not.toContain('Fort Worth');
    expect(rec.provenance.moneyMoveType).toBe('recommendation_with_search_action');
  });
});
