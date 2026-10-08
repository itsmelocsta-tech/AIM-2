import { beforeEach, describe, expect, it, vi } from 'vitest';
const verified = vi.hoisted(() => ({ value: {} as any, unavailable: false, uid: '' }));
vi.mock('../server/billing/googlePlay', () => ({ currentSubscription: async (uid: string) => {
  verified.uid = uid;
  if (verified.unavailable) throw new Error('Unavailable');
  return verified.value;
} }));
import { isPremium, readEntitlement } from '../server/entitlementService';

beforeEach(() => { verified.value = {}; verified.unavailable = false; verified.uid = ''; });

describe('server Premium enforcement', () => {
  it('rejects Basic and expired states', () => {
    expect(isPremium({ plan: 'basic', status: 'free' })).toBe(false);
    expect(isPremium({ plan: 'premium', status: 'expired' })).toBe(false);
  });
  it('accepts active, grace, and live trial states', () => {
    expect(isPremium({ plan: 'premium', status: 'active' })).toBe(true);
    expect(isPremium({ plan: 'premium', status: 'grace' })).toBe(true);
    expect(isPremium({ plan: 'premium', status: 'trial', trialEndsAt: new Date(Date.now()+60000).toISOString() })).toBe(true);
  });
  it('grants access only after server purchase verification', async () => {
    verified.value = { active: true, expiresAt: new Date(Date.now() + 60000).toISOString(), state: 'SUBSCRIPTION_STATE_ACTIVE' };
    expect(await readEntitlement('owner')).toMatchObject({ plan: 'premium', status: 'active' });
    expect(verified.uid).toBe('owner');
  });
  it('rejects cached, expired, invalid, and unavailable purchase states', async () => {
    for (const value of [
      { active: false },
      { active: true, expiresAt: new Date(Date.now() - 60000).toISOString() },
      { active: true, expiresAt: 'invalid' },
      { active: true },
    ]) {
      verified.value = value;
      expect(await readEntitlement('owner')).toEqual({ plan: 'basic', status: 'free' });
    }
    verified.unavailable = true;
    expect(await readEntitlement('owner')).toEqual({ plan: 'basic', status: 'free' });
  });
});
