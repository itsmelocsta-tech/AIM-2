import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { reconcilePurchaseToken } from './googlePlay';

const google = new OAuth2Client();
export async function playNotification(req: Request, res: Response) {
  const audience = process.env.PLAY_RTDN_AUDIENCE;
  const email = process.env.PLAY_RTDN_SERVICE_ACCOUNT_EMAIL;
  const packageName = process.env.PLAY_PACKAGE_NAME;
  if (!audience || !email || !packageName) return res.status(503).json({ error: 'Play notifications are not configured.' });
  const bearer = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization || '');
  if (!bearer) return res.sendStatus(401);
  try {
    const ticket = await google.verifyIdToken({ idToken: bearer[1], audience });
    const claims = ticket.getPayload();
    if (claims?.email !== email || claims.email_verified !== true) return res.sendStatus(403);
  } catch { return res.sendStatus(403); }

  let notification;
  try {
    const data = req.body?.message?.data;
    if (typeof data !== 'string' || data.length > 20000) return res.sendStatus(400);
    notification = JSON.parse(Buffer.from(data, 'base64').toString('utf8'));
    if (notification.packageName !== packageName) return res.sendStatus(400);
    if (notification.testNotification) return res.sendStatus(204);
    const token = notification.subscriptionNotification?.purchaseToken ?? notification.voidedPurchaseNotification?.purchaseToken;
    if (typeof token !== 'string' || !token || token.length > 4096) return res.sendStatus(400);
    await reconcilePurchaseToken(token);
    return res.sendStatus(204);
  } catch {
    // Pub/Sub retries failures. Never log purchase tokens or incoming credentials.
    return res.sendStatus(503);
  }
}
