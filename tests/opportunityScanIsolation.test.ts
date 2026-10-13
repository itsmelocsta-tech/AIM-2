import { expect, it } from 'vitest';
import { AIMOsService } from '../server/aimOsService';

it('keeps server history private and preserves a person’s own search', async () => {
  const service = AIMOsService.getInstance();
  const alice = await service.scanOpportunities({ uid: 'alice-isolation', description: 'Illustration clients', location: 'Austin' });
  await service.scanOpportunities({ uid: 'bob-isolation', description: 'Remote editing', location: 'Nationwide' });
  expect(alice.searchSuggestions[0].url).toBe('https://www.google.com/search?q=Illustration%20clients%20Austin');
  expect(alice.scanRun.sourcesSearched).toEqual([]);
  expect(alice.liveProviderConnected).toBe(false);
  expect(service.getScanHistory('bob-isolation').runs).toHaveLength(1);
  expect(service.getScanHistory('bob-isolation').runs[0].searchCenter).toBe('Nationwide');
  expect(service.getScanHistory('unknown').runs).toEqual([]);
  service.clearScanHistory('alice-isolation');
  expect(service.getScanHistory('alice-isolation').runs).toEqual([]);
});
