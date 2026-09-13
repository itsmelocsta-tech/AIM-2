import { describe, it, expect, beforeEach } from 'vitest';
import { jobScannerService } from '../src/services/jobScannerService';
import { driveService } from '../src/services/driveService';
import { storageService, DEFAULT_PROFILE } from '../src/services/storage';

describe('Real-Data Integrity & Zero-Fabrication', () => {
  beforeEach(() => {
    storageService.clearAllData();
  });

  it('jobScannerService does not fabricate live jobs without verified provider', () => {
    // When demo data is disabled (the default), no mock or demo listings should be returned as verified
    jobScannerService.setDemoDataAllowed(false);
    const listings = jobScannerService.getListings();
    expect(listings.every((l) => !l.is_mock && !l.isMock && l.provenance === 'verified')).toBe(true);
  });

  it('driveService rejects export when unauthenticated without pretending success', async () => {
    driveService.disconnect();
    const result = await driveService.exportDocumentToDrive({
      title: 'Test Blueprint',
      content: '# Test Content',
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('not connected');
  });

  it('driveService.requestAccessToken rejects when client ID or environment is missing', async () => {
    await expect(driveService.requestAccessToken('')).rejects.toThrow();
  });

  it('storageService.clearAllData completely resets user profile to unpersonalized state', () => {
    storageService.saveProfile({
      id: 'test-user',
      name: 'Jane Doe',
      email: 'jane@example.com',
      desiredIdentity: 'Creator',
      coreMission: 'Empower communities',
      currentMonthlyIncome: 5000,
      targetMonthlyIncome: 10000,
      primaryObstacle: 'Time management',
      topSkills: ['Writing'],
      coreValues: ['Integrity'],
      ninetyDayTrajectory: 'Launch publication',
      onboardingCompleted: true,
    });

    storageService.clearAllData();
    const current = storageService.getProfile();
    expect(current.name).toBe('');
    expect(current.email).toBe('');
    expect(current.onboardingCompleted).toBe(false);
  });
});
