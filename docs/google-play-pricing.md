# AIM Google Play launch offer

**Decision:** Free install; three days of full access for eligible new subscribers; then **$7.99 USD each month**, automatically renewing. No annual plan at launch. `play-launch-offer.json` is the single source for the intended U.S. price and product identifiers.

This repository currently builds a React web application and Express server. It has no Android app bundle, Google Play Billing integration, or verified subscription entitlement. The offer configuration is **not live** and cannot charge anyone. Do not show a purchase button or claim that access is paid until the native Play purchase flow and backend are ready.

## Play Console setup when the Android build exists

1. Create the subscription product `aim_premium` with a recurring monthly base plan `monthly` at $7.99 in the U.S.
2. Add a new-subscriber offer `three_day_trial` with a three-day free-trial phase, followed by the monthly base price. Limit eligibility to new subscribers.
3. Show this copy directly before purchase: **“Try AIM free for 3 days. Then $7.99 per month, automatically renewed until you cancel. Cancel any time in Google Play subscriptions.”** Explain which parts of AIM require a subscription and provide the cancellation link inside the app.
4. Connect the Android purchase flow to a secure backend. Verify each purchase token with the Google Play Developer API, acknowledge the purchase, and keep entitlements in sync with renewals, cancellations, refunds, payment failures, and account restoration. Never grant paid access from the client clock or a self-reported purchase.
5. Test the actual Play trial and renewal with license testers, including cancellation during the trial, declined payment, reinstatement, and an existing subscriber signing in on a new device.

## Charge-ready gate

The first new account must land on **“Where you are right now”** and complete a personalized starting plan. A life update must show the concrete edits before confirmation and persist those edits without losing completed or unrelated work. The app must visibly fail when analysis is unavailable. Finish the Android and billing work above, publish the owner-approved Privacy Policy and Terms, then turn on purchases. Measure real per-subscriber AI and voice costs before adding an annual discount.

Google references: [subscription setup](https://support.google.com/googleplay/android-developer/answer/140504), [billing integration](https://developer.android.com/google/play/billing/integrate), [server verification and notifications](https://developer.android.com/google/play/billing/backend), and [trial disclosure rules](https://support.google.com/googleplay/android-developer/answer/9900533).
