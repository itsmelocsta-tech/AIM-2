import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from './firebaseAdmin';
import firebaseConfig from '../firebase-applet-config.json';
import playLaunchOffer from '../play-launch-offer.json';
import {
  ProtectedPlaySubscriptionRecord,
  ServerEntitlement,
  isPremium,
  readEntitlement,
  writeProtectedBillingRecords,
} from './entitlementService';

export type PlaySubscriptionState =
  | 'SUBSCRIPTION_STATE_UNSPECIFIED'
  | 'SUBSCRIPTION_STATE_PENDING'
  | 'SUBSCRIPTION_STATE_ACTIVE'
  | 'SUBSCRIPTION_STATE_PAUSED'
  | 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD'
  | 'SUBSCRIPTION_STATE_ON_HOLD'
  | 'SUBSCRIPTION_STATE_CANCELED'
  | 'SUBSCRIPTION_STATE_EXPIRED'
  | 'SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED';

export type PlayAcknowledgementState =
  | 'ACKNOWLEDGEMENT_STATE_UNSPECIFIED'
  | 'ACKNOWLEDGEMENT_STATE_PENDING'
  | 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED';

export interface PlaySubscriptionLineItem {
  productId: string;
  expiryTime?: string;
  autoRenewingPlan?: {
    autoRenewEnabled?: boolean;
  };
  offerDetails?: {
    basePlanId?: string;
    offerId?: string | null;
    offerTags?: string[];
  };
}

export interface PlaySubscriptionPurchaseV2 {
  kind?: string;
  subscriptionState: PlaySubscriptionState;
  acknowledgementState: PlayAcknowledgementState;
  lineItems: PlaySubscriptionLineItem[];
  startTime?: string;
  linkedPurchaseToken?: string;
  externalAccountIdentifiers?: {
    obfuscatedExternalAccountId?: string;
    obfuscatedExternalProfileId?: string;
  };
  canceledStateContext?: Record<string, unknown>;
  testPurchase?: Record<string, unknown>;
}

export interface PlayDeveloperApiClient {
  getSubscriptionV2(packageName: string, purchaseToken: string): Promise<PlaySubscriptionPurchaseV2>;
  acknowledgeSubscription(params: {
    packageName: string;
    productId: string;
    purchaseToken: string;
    developerPayload?: string;
  }): Promise<void>;
}

export class PlayBillingError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.name = 'PlayBillingError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function hashPurchaseToken(purchaseToken: string): string {
  return crypto.createHash('sha256').update(purchaseToken.trim()).digest('hex');
}

export function hashPlayAccountId(uid: string): string {
  return crypto.createHash('sha256').update(uid).digest('hex');
}

export function getPlayLaunchOffer() {
  return {
    ...playLaunchOffer,
    paymentsEnabled:
      process.env.AIM_PAYMENTS_ENABLED === 'true'
        ? true
        : Boolean(playLaunchOffer.paymentsEnabled),
  };
}

/**
 * Maps a verified Google Play Developer API subscriptionsv2 response into an AIM ServerEntitlement.
 * Never trusts client-reported status or device clock.
 */
export function deriveEntitlementFromPlayPurchase(
  purchase: PlaySubscriptionPurchaseV2,
  expectedUid: string,
  nowMs: number = Date.now()
): {
  entitlement: ServerEntitlement;
  lineItem: PlaySubscriptionLineItem;
  autoRenewEnabled: boolean;
} {
  if (!purchase || !Array.isArray(purchase.lineItems) || purchase.lineItems.length === 0) {
    throw new PlayBillingError(
      'INVALID_PLAY_PURCHASE',
      'Google Play subscription record contains no line items.',
      400
    );
  }

  const boundUid = purchase.externalAccountIdentifiers?.obfuscatedExternalAccountId;
  if (!boundUid || boundUid !== hashPlayAccountId(expectedUid)) {
    throw new PlayBillingError(
      'PLAY_ACCOUNT_MISMATCH',
      'This Google Play subscription is bound to a different AIM account.',
      403
    );
  }

  const lineItem = purchase.lineItems.find(
    (item) => item.productId === playLaunchOffer.subscriptionProductId
  );
  if (!lineItem) {
    throw new PlayBillingError(
      'UNRECOGNIZED_PRODUCT_ID',
      `Subscription product must be ${playLaunchOffer.subscriptionProductId}.`,
      400
    );
  }

  const basePlanId = lineItem.offerDetails?.basePlanId;
  if (basePlanId !== playLaunchOffer.basePlanId) {
    throw new PlayBillingError(
      'UNRECOGNIZED_BASE_PLAN',
      `Subscription base plan must be ${playLaunchOffer.basePlanId}.`,
      400
    );
  }

  const offerId = lineItem.offerDetails?.offerId ?? null;
  const expiryTime = lineItem.expiryTime;
  const expiryMs = expiryTime ? Date.parse(expiryTime) : NaN;
  const hasFutureExpiry = Number.isFinite(expiryMs) && expiryMs > nowMs;
  const autoRenewEnabled =
    purchase.subscriptionState !== 'SUBSCRIPTION_STATE_CANCELED' &&
    purchase.subscriptionState !== 'SUBSCRIPTION_STATE_EXPIRED' &&
    lineItem.autoRenewingPlan?.autoRenewEnabled !== false;

  const isIntroTrialOffer = offerId === playLaunchOffer.introductoryOfferId;
  const state = purchase.subscriptionState;

  if (state === 'SUBSCRIPTION_STATE_ACTIVE') {
    if (!hasFutureExpiry) {
      return {
        entitlement: {
          plan: 'basic',
          status: 'expired',
          renewsAt: expiryTime,
          productId: lineItem.productId,
          basePlanId,
          offerId,
          cancelAtPeriodEnd: true,
          source: 'google_play',
        },
        lineItem,
        autoRenewEnabled: false,
      };
    }

    if (isIntroTrialOffer) {
      return {
        entitlement: {
          plan: 'premium',
          status: 'trial',
          trialEndsAt: expiryTime,
          renewsAt: expiryTime,
          productId: lineItem.productId,
          basePlanId,
          offerId,
          cancelAtPeriodEnd: !autoRenewEnabled,
          source: 'google_play',
        },
        lineItem,
        autoRenewEnabled,
      };
    }

    return {
      entitlement: {
        plan: 'premium',
        status: 'active',
        renewsAt: expiryTime,
        productId: lineItem.productId,
        basePlanId,
        offerId,
        cancelAtPeriodEnd: !autoRenewEnabled,
        source: 'google_play',
      },
      lineItem,
      autoRenewEnabled,
    };
  }

  if (state === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD') {
    if (hasFutureExpiry) {
      return {
        entitlement: {
          plan: 'premium',
          status: 'grace',
          renewsAt: expiryTime,
          productId: lineItem.productId,
          basePlanId,
          offerId,
          cancelAtPeriodEnd: !autoRenewEnabled,
          source: 'google_play',
        },
        lineItem,
        autoRenewEnabled,
      };
    }
  }

  if (state === 'SUBSCRIPTION_STATE_CANCELED') {
    // A canceled trial or subscription retains access until the paid/trial period ends.
    if (hasFutureExpiry) {
      return {
        entitlement: {
          plan: 'premium',
          status: isIntroTrialOffer ? 'trial' : 'active',
          ...(isIntroTrialOffer ? { trialEndsAt: expiryTime } : {}),
          renewsAt: expiryTime,
          productId: lineItem.productId,
          basePlanId,
          offerId,
          cancelAtPeriodEnd: true,
          source: 'google_play',
        },
        lineItem,
        autoRenewEnabled: false,
      };
    }
  }

  // ON_HOLD, PAUSED, EXPIRED, PENDING, PENDING_PURCHASE_CANCELED, or past expiry -> downgrade to Basic without deleting user data.
  return {
    entitlement: {
      plan: 'basic',
      status: state === 'SUBSCRIPTION_STATE_PENDING' ? 'free' : 'expired',
      ...(expiryTime ? { renewsAt: expiryTime } : {}),
      productId: lineItem.productId,
      basePlanId,
      offerId,
      cancelAtPeriodEnd: true,
      source: 'google_play',
    },
    lineItem,
    autoRenewEnabled: false,
  };
}

let customPlayApiClient: PlayDeveloperApiClient | null = null;

export function setPlayDeveloperApiClientForTesting(client: PlayDeveloperApiClient | null) {
  customPlayApiClient = client;
}

async function getGooglePlayAccessToken(): Promise<string> {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new PlayBillingError(
      'PLAY_VERIFIER_UNCONFIGURED',
      'Google Play billing verification is not configured on this server.',
      503
    );
  }
  let credentials: { client_email?: string; private_key?: string; token_uri?: string };
  try {
    credentials = JSON.parse(raw);
  } catch {
    throw new PlayBillingError(
      'PLAY_VERIFIER_UNCONFIGURED',
      'Google Play service account credentials could not be parsed.',
      503
    );
  }
  if (!credentials.client_email || !credentials.private_key) {
    throw new PlayBillingError(
      'PLAY_VERIFIER_UNCONFIGURED',
      'Google Play service account credentials are incomplete.',
      503
    );
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const tokenUri = credentials.token_uri || 'https://oauth2.googleapis.com/token';
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: tokenUri,
      iat: nowSec,
      exp: nowSec + 3600,
    })
  ).toString('base64url');

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${header}.${payload}`);
  const signature = signer.sign(credentials.private_key, 'base64url');
  const assertion = `${header}.${payload}.${signature}`;

  const response = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
  });

  if (!response.ok) {
    throw new PlayBillingError(
      'PLAY_VERIFIER_UNAVAILABLE',
      'Could not obtain Google Play Developer API access token.',
      503
    );
  }
  const tokenData = (await response.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    throw new PlayBillingError(
      'PLAY_VERIFIER_UNAVAILABLE',
      'Google Play Developer API token response was empty.',
      503
    );
  }
  return tokenData.access_token;
}

const defaultPlayApiClient: PlayDeveloperApiClient = {
  async getSubscriptionV2(packageName: string, purchaseToken: string): Promise<PlaySubscriptionPurchaseV2> {
    const accessToken = await getGooglePlayAccessToken();
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(
      packageName
    )}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.status === 404 || res.status === 400 || res.status === 410) {
      throw new PlayBillingError('INVALID_PURCHASE_TOKEN', 'Google Play rejected the purchase token.', 400);
    }
    if (!res.ok) {
      throw new PlayBillingError(
        'PLAY_API_FAILURE',
        `Google Play Developer API returned status ${res.status}.`,
        503
      );
    }
    return (await res.json()) as PlaySubscriptionPurchaseV2;
  },

  async acknowledgeSubscription(params: {
    packageName: string;
    productId: string;
    purchaseToken: string;
    developerPayload?: string;
  }): Promise<void> {
    const accessToken = await getGooglePlayAccessToken();
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(
      params.packageName
    )}/purchases/subscriptions/${encodeURIComponent(
      params.productId
    )}/tokens/${encodeURIComponent(params.purchaseToken)}:acknowledge`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        developerPayload: params.developerPayload || '',
      }),
    });
    if (!res.ok) {
      throw new PlayBillingError(
        'PLAY_ACKNOWLEDGE_FAILED',
        `Google Play purchase acknowledgement failed with status ${res.status}.`,
        503
      );
    }
  },
};

function getPlayClient(): PlayDeveloperApiClient {
  return customPlayApiClient || defaultPlayApiClient;
}

export async function verifyAndRecordPlayPurchase(params: {
  uid: string;
  purchaseToken: string;
  productId?: string;
  packageName?: string;
  lastNotificationType?: number;
}): Promise<{
  entitlement: ServerEntitlement;
  acknowledged: boolean;
  tokenHash: string;
}> {
  const { uid } = params;
  if (!uid) {
    throw new PlayBillingError('AUTH_REQUIRED', 'Authentication required.', 401);
  }
  const purchaseToken = typeof params.purchaseToken === 'string' ? params.purchaseToken.trim() : '';
  if (!purchaseToken || purchaseToken.length < 8) {
    throw new PlayBillingError('MISSING_PURCHASE_TOKEN', 'A valid Google Play purchaseToken is required.', 400);
  }

  const packageName = (params.packageName || playLaunchOffer.packageName).trim();
  if (packageName !== playLaunchOffer.packageName) {
    throw new PlayBillingError(
      'INVALID_PACKAGE_NAME',
      `Package name must match ${playLaunchOffer.packageName}.`,
      400
    );
  }

  if (params.productId && params.productId !== playLaunchOffer.subscriptionProductId) {
    throw new PlayBillingError(
      'UNRECOGNIZED_PRODUCT_ID',
      `Subscription product must be ${playLaunchOffer.subscriptionProductId}.`,
      400
    );
  }

  const client = getPlayClient();
  const purchase = await client.getSubscriptionV2(packageName, purchaseToken);
  const { entitlement, lineItem, autoRenewEnabled } = deriveEntitlementFromPlayPurchase(purchase, uid);

  let acknowledged = purchase.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED';
  if (purchase.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING' && isPremium(entitlement)) {
    await client.acknowledgeSubscription({
      packageName,
      productId: lineItem.productId,
      purchaseToken,
      developerPayload: uid,
    });
    acknowledged = true;
  }

  const tokenHash = hashPurchaseToken(purchaseToken);
  const linkedTokenHash = purchase.linkedPurchaseToken
    ? hashPurchaseToken(purchase.linkedPurchaseToken)
    : null;

  const subscriptionRecord: ProtectedPlaySubscriptionRecord = {
    uid,
    tokenHash,
    packageName,
    productId: lineItem.productId,
    basePlanId: lineItem.offerDetails?.basePlanId || playLaunchOffer.basePlanId,
    offerId: lineItem.offerDetails?.offerId ?? null,
    subscriptionState: purchase.subscriptionState,
    acknowledgementState: acknowledged
      ? 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED'
      : purchase.acknowledgementState,
    ...(lineItem.expiryTime ? { expiryTime: lineItem.expiryTime } : {}),
    autoRenewEnabled,
    verifiedAt: new Date().toISOString(),
    ...(typeof params.lastNotificationType === 'number'
      ? { lastNotificationType: params.lastNotificationType }
      : {}),
  };

  try {
    const savedEntitlement = await writeProtectedBillingRecords({
      uid,
      entitlement,
      subscriptionRecord,
      linkedTokenHash,
    });
    return { entitlement: savedEntitlement, acknowledged, tokenHash };
  } catch (err: any) {
    if (err?.code === 'PLAY_TOKEN_OWNERSHIP_MISMATCH') {
      throw new PlayBillingError('PLAY_ACCOUNT_MISMATCH', err.message, 403);
    }
    throw err;
  }
}

export async function restorePlaySubscriptionForUser(params: {
  uid: string;
  purchaseToken?: string;
  packageName?: string;
}): Promise<{ entitlement: ServerEntitlement; restored: boolean }> {
  if (!params.uid) {
    throw new PlayBillingError('AUTH_REQUIRED', 'Authentication required.', 401);
  }

  if (typeof params.purchaseToken === 'string' && params.purchaseToken.trim()) {
    const { entitlement } = await verifyAndRecordPlayPurchase({
      uid: params.uid,
      purchaseToken: params.purchaseToken,
      packageName: params.packageName,
    });
    return { entitlement, restored: isPremium(entitlement) };
  }

  const entitlement = await readEntitlement(params.uid);
  return { entitlement, restored: isPremium(entitlement) };
}

/**
 * Google Play Real-Time Developer Notification (RTDN) types:
 * 1 = SUBSCRIPTION_RECOVERED
 * 2 = SUBSCRIPTION_RENEWED
 * 3 = SUBSCRIPTION_CANCELED
 * 4 = SUBSCRIPTION_PURCHASED
 * 5 = SUBSCRIPTION_ON_HOLD
 * 6 = SUBSCRIPTION_IN_GRACE_PERIOD
 * 7 = SUBSCRIPTION_RESTARTED
 * 10 = SUBSCRIPTION_PAUSED
 * 12 = SUBSCRIPTION_REVOKED
 * 13 = SUBSCRIPTION_EXPIRED
 */
export async function handlePlayRtdnNotification(params: {
  authorizationHeader?: string;
  body: any;
}): Promise<{ handled: boolean; status: string; entitlement?: ServerEntitlement }> {
  const audience = process.env.PLAY_RTDN_AUDIENCE;
  const serviceAccountEmail = process.env.PLAY_RTDN_SERVICE_ACCOUNT_EMAIL;
  if (!audience || !serviceAccountEmail) {
    throw new PlayBillingError(
      'RTDN_UNCONFIGURED',
      'Google Pub/Sub push authentication is not configured.',
      503
    );
  }
  const match = /^Bearer ([^\s]+)$/i.exec(params.authorizationHeader || '');
  if (!match) {
    throw new PlayBillingError('RTDN_UNAUTHORIZED', 'Unauthorized RTDN webhook request.', 401);
  }
  try {
    const ticket = await new OAuth2Client().verifyIdToken({ idToken: match[1], audience });
    const payload = ticket.getPayload();
    if (!payload || payload.email !== serviceAccountEmail || payload.email_verified !== true ||
        !['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss)) {
      throw new Error('Unexpected Pub/Sub push identity.');
    }
  } catch {
    throw new PlayBillingError('RTDN_UNAUTHORIZED', 'Unauthorized RTDN webhook request.', 401);
  }

  const encodedData = params.body?.message?.data;
  if (!encodedData || typeof encodedData !== 'string') {
    throw new PlayBillingError('INVALID_RTDN_PAYLOAD', 'Missing Pub/Sub message.data.', 400);
  }

  let decoded: any;
  try {
    decoded = JSON.parse(Buffer.from(encodedData, 'base64').toString('utf8'));
  } catch {
    throw new PlayBillingError('INVALID_RTDN_PAYLOAD', 'Malformed base64 JSON in Pub/Sub message.', 400);
  }

  if (decoded.testNotification) {
    return { handled: true, status: 'test_notification_acknowledged' };
  }

  const subNotification = decoded.subscriptionNotification;
  if (!subNotification?.purchaseToken) {
    return { handled: false, status: 'ignored_non_subscription_notification' };
  }

  const packageName = decoded.packageName || playLaunchOffer.packageName;
  if (packageName !== playLaunchOffer.packageName) {
    throw new PlayBillingError('INVALID_PACKAGE_NAME', 'RTDN package name mismatch.', 400);
  }

  const purchaseToken = String(subNotification.purchaseToken).trim();
  const notificationType = Number(subNotification.notificationType || 0);
  const tokenHash = hashPurchaseToken(purchaseToken);

  const app = getFirebaseAdminApp();
  if (!app) {
    throw new PlayBillingError('FIRESTORE_UNAVAILABLE', 'Firebase Admin is unavailable.', 503);
  }
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  const tokenSnap = await db.doc(`billing_tokens/${tokenHash}`).get();
  const tokenData = tokenSnap.data() as { uid?: string; productId?: string; replacedByTokenHash?: string } | undefined;

  if (!tokenData?.uid) {
    return { handled: false, status: 'unlinked_purchase_token' };
  }
  if (tokenData.replacedByTokenHash) {
    return { handled: false, status: 'superseded_purchase_token' };
  }

  const uid = tokenData.uid;

  // Pub/Sub can redeliver and reorder events. Always query current Play state,
  // including revocations, instead of treating the event type as entitlement truth.
  const { entitlement } = await verifyAndRecordPlayPurchase({
    uid,
    purchaseToken,
    productId: subNotification.subscriptionId || playLaunchOffer.subscriptionProductId,
    packageName,
    lastNotificationType: notificationType,
  });

  return { handled: true, status: 'synced', entitlement };
}
