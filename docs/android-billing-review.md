# Android and Play billing preparation

This integrates the public, main-derived PR18 candidate with current AI recovery,
account isolation, atmosphere preferences and billing rules. Payments remain
disabled. There is no working consumer checkout or signed release claim.

- Android targets API 36 with Play Billing 8.0.0. Messages are accepted only from
  the configured HTTPS main-frame origin. Debug defaults to the existing public
  AIM origin; release tasks require an explicitly verified origin.
- Server purchase verification uses Google's current subscription state,
  hashed account binding, expiry checks, transactional token ownership and
  signed Pub/Sub push identity. Superseded tokens cannot restore access.
- Trial status uses Google's current offerPhase.freeTrial, not an original
  offer identifier. Cancelled subscriptions retain access only until expiry.
- Shared draft offer: $7.99/month and a 3-day trial for eligible new subscribers.
  Google Play must confirm final price and eligibility. Checkout stays disabled.
- Current recursive Firestore rules deny all client billing writes. Owners can
  read their billing records; global token records remain denied to clients.
- Existing persistence repairs preserve life notes, normalize today's date in
  the user's timezone and avoid wiping the same account's schedule cache.

CI must compile the debug APK, run origin unit tests and Android lint, then run
Quality Gate and the current-head browser suites including real email/AI/cloud
recovery. Debug compilation does not establish physical-device behavior.

Release needs owner-controlled AIM_ANDROID_WEB_ORIGIN, ANDROID_KEYSTORE_PATH,
ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS and ANDROID_KEY_PASSWORD.
Never commit signing material. Configure Play service-account permissions,
PLAY_RTDN_AUDIENCE and PLAY_RTDN_SERVICE_ACCOUNT_EMAIL through secret settings.
No secret values or billing settings are changed by this patch.

Remaining release work: native Google credential return and certificate setup;
microphone/file/back/lifecycle/offline behavior; verified account deletion;
published privacy/terms/deletion/support pages and owner-approved store content;
Play Console products and license-device purchase, restore, renewal and refund
tests. Figma reference: https://www.figma.com/design/EjzsPVuGWNnrLSIdi1DTIa .
Further Figma MCP operations are blocked by the existing free-plan quota.
Record current screenshots and exact-head results in the PR without claiming
Google login, signed release or real Play billing passed.

Offer-phase reference: https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptionsv2#OfferPhase
