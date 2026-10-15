import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

const store = vi.hoisted(() => new Map<string, any>());
const oidc = vi.hoisted(() => vi.fn());
vi.mock('google-auth-library', () => ({ OAuth2Client: class { verifyIdToken = oidc; } }));

vi.mock('firebase-admin/app', () => ({
  getApps: () => [{}],
  initializeApp: vi.fn(),
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    runTransaction: async (run: any) => {
      const writes: Array<() => void> = [];
      const result = await run({
        get: async (ref: any) => ref.get(),
        set: (ref: any, data: any, options: any) => writes.push(() => ref.set(data, options)),
      });
      for (const write of writes) write();
      return result;
    },
    doc: (path: string) => ({
      get: async () => ({
        exists: store.has(path),
        data: () => store.get(path),
      }),
      set: async (data: any, options?: { merge?: boolean }) => {
        if (Object.values(data).some(value => value === undefined)) throw new Error('Undefined Firestore value');
        if (options?.merge && store.has(path)) {
          store.set(path, { ...store.get(path), ...data });
        } else {
          store.set(path, data);
        }
      },
    }),
  }),
}));

import {
  PlayBillingError,
  hashPurchaseToken,
  hashPlayAccountId,
  deriveEntitlementFromPlayPurchase,
  handlePlayRtdnNotification,
  restorePlaySubscriptionForUser,
  setPlayDeveloperApiClientForTesting,
  verifyAndRecordPlayPurchase,
} from '../server/playBillingService';
import { isPremium, readEntitlement } from '../server/entitlementService';

describe('Android packaging, protected billing records, and Google Play subscription integration', () => {
  beforeEach(() => {
    store.clear();
    setPlayDeveloperApiClientForTesting(null);
    vi.unstubAllEnvs();
    oidc.mockResolvedValue({ getPayload: () => ({ email: 'push@example.test', email_verified: true, iss: 'https://accounts.google.com' }) });
  });

  it('includes Android packaging files, BillingClient v8 bridge, and Play bundle configuration', () => {
    expect(existsSync('android/settings.gradle.kts')).toBe(true);
    expect(existsSync('android/app/build.gradle.kts')).toBe(true);
    expect(existsSync('android/app/src/main/AndroidManifest.xml')).toBe(true);
    expect(existsSync('android/app/src/main/java/app/aim/lifeos/MainActivity.kt')).toBe(true);
    expect(existsSync('android/app/src/main/java/app/aim/lifeos/billing/AimBillingBridge.kt')).toBe(true);

    const gradle = readFileSync('android/app/build.gradle.kts', 'utf8');
    expect(gradle).toContain('applicationId = "app.aim.lifeos"');
    expect(gradle).toContain('com.android.billingclient:billing-ktx');
    expect(gradle).toContain('PLAY_SUBSCRIPTION_PRODUCT_ID');
    expect(gradle).toContain('launchOffer["introductoryOfferId"]');

    const manifest = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
    expect(manifest).toContain('com.android.vending.BILLING');

    const bridge = readFileSync('android/app/src/main/java/app/aim/lifeos/billing/AimBillingBridge.kt', 'utf8');
    expect(bridge).toContain('setObfuscatedAccountId(hashPlayAccountId(firebaseUid))');
    expect(bridge).toContain('queryPurchasesAsync');
  });

  it('protects billing and entitlement records in firestore.rules against client writes', () => {
    const rules = readFileSync('firestore.rules', 'utf8');
    expect(rules).toContain('match /billing/entitlement');
    expect(rules).toContain('allow write: if false;');
    expect(rules).toContain('match /billing_tokens/{tokenHash}');
    expect(rules).toContain("subcollection != 'billing'");
  });

  it('verifies a 3-day free trial purchase, acknowledges it, and writes protected billing records', async () => {
    const futureIso = new Date(Date.now() + 3 * 86400_000).toISOString();
    const acknowledgeMock = vi.fn().mockResolvedValue(undefined);
    setPlayDeveloperApiClientForTesting({
      getSubscriptionV2: vi.fn().mockResolvedValue({
        subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
        acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING',
        externalAccountIdentifiers: { obfuscatedExternalAccountId: hashPlayAccountId('user-trial-1') },
        lineItems: [
          {
            productId: 'aim_premium',
            expiryTime: futureIso,
            autoRenewingPlan: { autoRenewEnabled: true },
            offerDetails: { basePlanId: 'monthly', offerId: 'three_day_trial' },
            offerPhase: { freeTrial: {} },
          },
        ],
      }),
      acknowledgeSubscription: acknowledgeMock,
    });

    const result = await verifyAndRecordPlayPurchase({
      uid: 'user-trial-1',
      purchaseToken: 'play-token-trial-abc12345',
      productId: 'aim_premium',
      packageName: 'app.aim.lifeos',
    });

    expect(result.acknowledged).toBe(true);
    expect(acknowledgeMock).toHaveBeenCalledOnce();
    expect(result.entitlement.plan).toBe('premium');
    expect(result.entitlement.status).toBe('trial');
    expect(result.entitlement.trialEndsAt).toBe(futureIso);

    const savedEntitlement = await readEntitlement('user-trial-1');
    expect(isPremium(savedEntitlement)).toBe(true);
    expect(savedEntitlement.offerId).toBe('three_day_trial');
  });

  it('rejects cross-account purchase token replay when obfuscatedExternalAccountId or token ledger belongs to another UID', async () => {
    const futureIso = new Date(Date.now() + 30 * 86400_000).toISOString();
    setPlayDeveloperApiClientForTesting({
      getSubscriptionV2: vi.fn().mockResolvedValue({
        subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
        acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
        externalAccountIdentifiers: { obfuscatedExternalAccountId: hashPlayAccountId('owner-uid') },
        lineItems: [
          {
            productId: 'aim_premium',
            expiryTime: futureIso,
            autoRenewingPlan: { autoRenewEnabled: true },
            offerDetails: { basePlanId: 'monthly', offerId: null },
          },
        ],
      }),
      acknowledgeSubscription: vi.fn(),
    });

    await expect(
      verifyAndRecordPlayPurchase({
        uid: 'attacker-uid',
        purchaseToken: 'play-token-shared-xyz98765',
      })
    ).rejects.toThrow(PlayBillingError);
  });

  it('handles cancellation during trial, declined payment (grace vs on-hold), reinstatement, and RTDN revocation', async () => {
    const futureIso = new Date(Date.now() + 2 * 86400_000).toISOString();
    const pastIso = new Date(Date.now() - 60_000).toISOString();

    // 1. Canceled during trial still grants access until trialEndsAt
    const canceledDuringTrial = deriveEntitlementFromPlayPurchase(
      {
        subscriptionState: 'SUBSCRIPTION_STATE_CANCELED',
        externalAccountIdentifiers: { obfuscatedExternalAccountId: hashPlayAccountId('user-1') },
        acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
        lineItems: [
          {
            productId: 'aim_premium',
            expiryTime: futureIso,
            autoRenewingPlan: { autoRenewEnabled: false },
            offerDetails: { basePlanId: 'monthly', offerId: 'three_day_trial' },
            offerPhase: { freeTrial: {} },
          },
        ],
      },
      'user-1'
    );
    expect(isPremium(canceledDuringTrial.entitlement)).toBe(true);
    expect(canceledDuringTrial.entitlement.cancelAtPeriodEnd).toBe(true);

    // 2. Once trialEndsAt passes, access returns to Basic
    const expiredAfterCancel = deriveEntitlementFromPlayPurchase(
      {
        subscriptionState: 'SUBSCRIPTION_STATE_CANCELED',
        externalAccountIdentifiers: { obfuscatedExternalAccountId: hashPlayAccountId('user-1') },
        acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
        lineItems: [
          {
            productId: 'aim_premium',
            expiryTime: pastIso,
            autoRenewingPlan: { autoRenewEnabled: false },
            offerDetails: { basePlanId: 'monthly', offerId: 'three_day_trial' },
            offerPhase: { freeTrial: {} },
          },
        ],
      },
      'user-1'
    );
    expect(isPremium(expiredAfterCancel.entitlement)).toBe(false);
    expect(expiredAfterCancel.entitlement.plan).toBe('basic');

    // 3. Declined payment in grace period preserves access; on-hold downgrades to Basic
    const inGrace = deriveEntitlementFromPlayPurchase(
      {
        subscriptionState: 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD',
        externalAccountIdentifiers: { obfuscatedExternalAccountId: hashPlayAccountId('user-1') },
        acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
        lineItems: [
          {
            productId: 'aim_premium',
            expiryTime: futureIso,
            offerDetails: { basePlanId: 'monthly', offerId: null },
          },
        ],
      },
      'user-1'
    );
    expect(isPremium(inGrace.entitlement)).toBe(true);
    expect(inGrace.entitlement.status).toBe('grace');

    const onHold = deriveEntitlementFromPlayPurchase(
      {
        subscriptionState: 'SUBSCRIPTION_STATE_ON_HOLD',
        externalAccountIdentifiers: { obfuscatedExternalAccountId: hashPlayAccountId('user-1') },
        acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
        lineItems: [
          {
            productId: 'aim_premium',
            expiryTime: futureIso,
            offerDetails: { basePlanId: 'monthly', offerId: null },
          },
        ],
      },
      'user-1'
    );
    expect(isPremium(onHold.entitlement)).toBe(false);
    expect(onHold.entitlement.plan).toBe('basic');

    // 4. Existing subscriber signing in on a new device restores active entitlement, and RTDN revocation revokes it
    setPlayDeveloperApiClientForTesting({
      getSubscriptionV2: vi.fn().mockResolvedValue({
        subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
        acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
        externalAccountIdentifiers: { obfuscatedExternalAccountId: hashPlayAccountId('user-restore-1') },
        lineItems: [
          {
            productId: 'aim_premium',
            expiryTime: futureIso,
            autoRenewingPlan: { autoRenewEnabled: true },
            offerDetails: { basePlanId: 'monthly', offerId: null },
          },
        ],
      }),
      acknowledgeSubscription: vi.fn(),
    });

    const restored = await restorePlaySubscriptionForUser({
      uid: 'user-restore-1',
      purchaseToken: 'restore-token-123456789',
    });
    expect(restored.restored).toBe(true);
    expect(isPremium(restored.entitlement)).toBe(true);

    vi.stubEnv('PLAY_RTDN_AUDIENCE', 'https://aim.example.test/api/billing/rtdn');
    vi.stubEnv('PLAY_RTDN_SERVICE_ACCOUNT_EMAIL', 'push@example.test');
    setPlayDeveloperApiClientForTesting({
      getSubscriptionV2: vi.fn().mockResolvedValue({
        subscriptionState: 'SUBSCRIPTION_STATE_EXPIRED',
        acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
        externalAccountIdentifiers: { obfuscatedExternalAccountId: hashPlayAccountId('user-restore-1') },
        lineItems: [{ productId: 'aim_premium', expiryTime: pastIso, offerDetails: { basePlanId: 'monthly' } }],
      }),
      acknowledgeSubscription: vi.fn(),
    });
    const rtdnPayload = {
      message: {
        data: Buffer.from(
          JSON.stringify({
            packageName: 'app.aim.lifeos',
            subscriptionNotification: {
              notificationType: 12, // SUBSCRIPTION_REVOKED
              purchaseToken: 'restore-token-123456789',
              subscriptionId: 'aim_premium',
            },
          })
        ).toString('base64'),
      },
    };
    const rtdnResult = await handlePlayRtdnNotification({
      authorizationHeader: 'Bearer rtdn-secret',
      body: rtdnPayload,
    });
    expect(rtdnResult.status).toBe('synced');
    expect(isPremium(await readEntitlement('user-restore-1'))).toBe(false);
  });
});

function verifiedPurchase(overrides: Record<string, any> = {}) {
  return {
    subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE' as const,
    acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED' as const,
    externalAccountIdentifiers: { obfuscatedExternalAccountId: hashPlayAccountId('owner') },
    lineItems: [{ productId: 'aim_premium', expiryTime: new Date(Date.now() + 86400_000).toISOString(), offerDetails: { basePlanId: 'monthly' } }],
    ...overrides,
  };
}

describe('billing release regressions', () => {
  beforeEach(() => {
    store.clear(); vi.unstubAllEnvs(); setPlayDeveloperApiClientForTesting(null);
    oidc.mockResolvedValue({ getPayload: () => ({ email: 'push@example.test', email_verified: true, iss: 'https://accounts.google.com' }) });
  });
  it.each(['SUBSCRIPTION_STATE_ACTIVE', 'SUBSCRIPTION_STATE_CANCELED'] as const)(
    'uses current phase instead of original offer ID for %s subscriptions', (subscriptionState) => {
      const expiryTime = new Date(Date.now() + 30 * 86400_000).toISOString();
      for (const [offerPhase, expectedStatus] of [
        [{ freeTrial: {} }, 'trial'],
        [{ basePrice: {} }, 'active'],
        [{ introductoryPrice: {} }, 'active'],
        [undefined, 'active'],
      ] as const) {
        const result = deriveEntitlementFromPlayPurchase(verifiedPurchase({
          subscriptionState,
          lineItems: [{ productId: 'aim_premium', expiryTime,
            offerDetails: { basePlanId: 'monthly', offerId: 'three_day_trial' }, offerPhase }],
        }), 'owner');
        expect(result.entitlement.status).toBe(expectedStatus);
        expect(isPremium(result.entitlement)).toBe(true);
        expect(result.entitlement.cancelAtPeriodEnd).toBe(subscriptionState === 'SUBSCRIPTION_STATE_CANCELED');
        if (expectedStatus === 'trial') expect(result.entitlement.trialEndsAt).toBe(expiryTime);
        else expect(result.entitlement).not.toHaveProperty('trialEndsAt');
      }
    }
  );
  it('rejects a purchase missing its account binding or base plan', async () => {
    expect(() => deriveEntitlementFromPlayPurchase(verifiedPurchase({ externalAccountIdentifiers: {} }), 'owner')).toThrow(PlayBillingError);
    expect(() => deriveEntitlementFromPlayPurchase(verifiedPurchase({ lineItems: [{ productId: 'aim_premium' }] }), 'owner')).toThrow(PlayBillingError);
  });
  it('rejects conflicting token ledger ownership without partial writes', async () => {
    const token = 'purchase-token-owner-conflict';
    store.set(`billing_tokens/${hashPurchaseToken(token)}`, { uid: 'other-user' });
    const original = Array.from(store.entries());
    setPlayDeveloperApiClientForTesting({ getSubscriptionV2: vi.fn().mockResolvedValue(verifiedPurchase()), acknowledgeSubscription: vi.fn() });
    await expect(verifyAndRecordPlayPurchase({ uid: 'owner', purchaseToken: token })).rejects.toMatchObject({ code: 'PLAY_ACCOUNT_MISMATCH' });
    expect(Array.from(store.entries())).toEqual(original);
  });
  it('cannot overwrite another account through linkedPurchaseToken', async () => {
    const linked = 'linked-token-other-owner';
    store.set(`billing_tokens/${hashPurchaseToken(linked)}`, { uid: 'other-user' });
    const original = Array.from(store.entries());
    setPlayDeveloperApiClientForTesting({ getSubscriptionV2: vi.fn().mockResolvedValue(verifiedPurchase({ linkedPurchaseToken: linked })), acknowledgeSubscription: vi.fn() });
    await expect(verifyAndRecordPlayPurchase({ uid: 'owner', purchaseToken: 'replacement-token-12345' })).rejects.toMatchObject({ code: 'PLAY_ACCOUNT_MISMATCH' });
    expect(Array.from(store.entries())).toEqual(original);
  });
  it('records a pending subscription without undefined expiry or Premium access', async () => {
    const acknowledge = vi.fn();
    setPlayDeveloperApiClientForTesting({ getSubscriptionV2: vi.fn().mockResolvedValue(verifiedPurchase({
      subscriptionState: 'SUBSCRIPTION_STATE_PENDING', acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING',
      lineItems: [{ productId: 'aim_premium', offerDetails: { basePlanId: 'monthly' } }],
    })), acknowledgeSubscription: acknowledge });
    const result = await verifyAndRecordPlayPurchase({ uid: 'owner', purchaseToken: 'pending-token-12345' });
    expect(isPremium(result.entitlement)).toBe(false); expect(acknowledge).not.toHaveBeenCalled();
    expect(store.get('users/owner/billing/play_subscription')).not.toHaveProperty('expiryTime');
  });
  it('requires a verified Pub/Sub audience and allowed push identity', async () => {
    vi.stubEnv('PLAY_RTDN_AUDIENCE', 'https://aim.example.test/api/billing/rtdn');
    vi.stubEnv('PLAY_RTDN_SERVICE_ACCOUNT_EMAIL', 'push@example.test');
    const body = { message: { data: Buffer.from(JSON.stringify({ testNotification: {} })).toString('base64') } };
    oidc.mockRejectedValueOnce(new Error('Bad signature'));
    await expect(handlePlayRtdnNotification({ authorizationHeader: 'Bearer invalid', body })).rejects.toMatchObject({ code: 'RTDN_UNAUTHORIZED' });
    oidc.mockResolvedValueOnce({ getPayload: () => ({ email: 'intruder@example.test', email_verified: true, iss: 'https://accounts.google.com' }) });
    await expect(handlePlayRtdnNotification({ authorizationHeader: 'Bearer signed', body })).rejects.toMatchObject({ code: 'RTDN_UNAUTHORIZED' });
    expect((await handlePlayRtdnNotification({ authorizationHeader: 'Bearer valid', body })).handled).toBe(true);
    expect(oidc).toHaveBeenLastCalledWith({ idToken: 'valid', audience: 'https://aim.example.test/api/billing/rtdn' });
  });
  it('ignores notifications for replaced tokens and rechecks current Play state for reordered revocations', async () => {
    vi.stubEnv('PLAY_RTDN_AUDIENCE', 'https://aim.example.test/api/billing/rtdn');
    vi.stubEnv('PLAY_RTDN_SERVICE_ACCOUNT_EMAIL', 'push@example.test');
    const token = 'old-token-12345'; const path = `billing_tokens/${hashPurchaseToken(token)}`;
    store.set(path, { uid: 'owner', replacedByTokenHash: 'new-token-hash' });
    const query = vi.fn().mockResolvedValue(verifiedPurchase());
    setPlayDeveloperApiClientForTesting({ getSubscriptionV2: query, acknowledgeSubscription: vi.fn() });
    const body = { message: { data: Buffer.from(JSON.stringify({ packageName: 'app.aim.lifeos', subscriptionNotification: { purchaseToken: token, notificationType: 12 } })).toString('base64') } };
    expect((await handlePlayRtdnNotification({ authorizationHeader: 'Bearer valid', body })).status).toBe('superseded_purchase_token');
    expect(query).not.toHaveBeenCalled();
    store.set(path, { uid: 'owner' });
    const result = await handlePlayRtdnNotification({ authorizationHeader: 'Bearer valid', body });
    expect(query).toHaveBeenCalledOnce(); expect(isPremium(result.entitlement!)).toBe(true);
  });
});
