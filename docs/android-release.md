# AIM Android build and Google Play billing

This branch adds a Java Android app that loads the configured AIM HTTPS origin,
Google Play Billing 8.3, an exact-origin AndroidX WebKit message bridge, native
localized offer disclosure, purchase restoration, and authenticated server token
verification. Pricing remains disabled in `play-launch-offer.json`. The web app
continues to work without a native bridge. Subscription controls appear only in
Android's settings screen. No client clock or client-written user document grants
paid access.

## Automated packages

`Android Package` builds and lints an **unsigned-for-Play debug APK** on each pull
request and uploads it as `aim-android-test-<commit>`. The APK is debug-signed and
can be installed for shell testing, but is not the Google Play release deliverable.
Its default origin is this branch's Vercel billing preview; Vercel protection may block it.
The hosting origin must serve this branch's updated frontend and backend before
billing controls work. Email/password and native Google sign-in need device
testing. Google sign-in uses Credential Manager and hands a Google ID token to
Firebase in the exact-origin WebView. Configure `AIM_GOOGLE_WEB_CLIENT_ID` as a
GitHub Actions repository variable containing the Firebase project's OAuth
**web** client ID. Register the Android app's package name and release signing
certificate SHA-1/SHA-256 in Firebase/Google Cloud. The test APK uses a debug
certificate, which must also be registered for test sign-in. With no client ID,
the Google button explains setup is needed and email sign-in remains available.

Manual `workflow_dispatch` additionally builds a signed `.aab`, only if all
release inputs exist. Never silently substitute a debug key for an upload key.
Set GitHub repository variable `AIM_ANDROID_URL` to the final **HTTPS origin**.
The Android package ID is provisionally `com.itsmelocsta.aim`; confirm it against
Play Console before first upload (the published package ID cannot be changed).
Set these GitHub Actions secrets through GitHub's secret settings, never source:

- `AIM_KEYSTORE_BASE64`: base64 of the owner-controlled upload keystore.
- `AIM_KEYSTORE_PASSWORD`, `AIM_KEY_ALIAS`, `AIM_KEY_PASSWORD`.

Use Java 17, Gradle 8.13, Android SDK platform 36 and build tools 36.0.0 locally.
Run `gradle -p android :app:assembleDebug :app:lintDebug`. Release uses
`:app:bundleRelease` and requires the signing environment variables documented in
`android/app/build.gradle`. Workflows added on a branch can run for a pull request;
manual dispatch requires the workflow to exist on the default branch.

## Server setup

Deploy this branch's server with `PLAY_PACKAGE_NAME=com.itsmelocsta.aim` and
server-only `PLAY_SERVICE_ACCOUNT_JSON`. Enable the Google Play Developer API
and grant that identity the necessary access to the app in Play Console. Firebase
Admin also needs read/write access to the existing named Firestore database.
The verification identity may be separate from Firebase Admin.

Private `/api/aim/billing/config`, `/verify`, and `/status` require a Firebase ID
token. `/verify` checks subscriptionsv2 with Google, verifies the obfuscated AIM
account ID, product and monthly base plan, checks state and expiration, binds
token ownership transactionally, and acknowledges active unacknowledged purchases.
Restoration rechecks Google. `/status` rechecks Google rather than trusting a
saved entitlement. Server-owned `playPurchaseOwners` and `playSubscriptions`
collections are outside the client-writable `/users` hierarchy and denied by the
existing default Firestore rules. Purchase tokens are never returned to the web
UI or logged. The app fails closed when verification is unavailable.
The server middleware checks current Google Play status before AIM API features
only when `paymentsEnabled`, `PLAY_BILLING_ENABLED=true`, and
`PLAY_ACCESS_ENFORCED=true` are all set. Billing configuration, restoration, and
status stay accessible to signed-in users. Missing or inactive subscriptions
return 402; failed verification returns 503. All gates remain off in this branch.

## Gates still required before charging or public release

- Configure the real Play subscription `aim_premium`, base plan `monthly`, and
  eligible trial `three_day_trial`; confirm final package name and origin.
- Obtain owner-controlled signing material and build/download the signed AAB.
- Verify native Google sign-in with the final upload certificate and test
  email sign-in, offline/network failure handling, download and microphone
  permissions if these features are offered in the Android app.
- Publish approved privacy policy, terms, account deletion details, Data safety
  declarations, store listing, screenshots, and any required testing track.
- Verify purchase, acknowledgment, trial, renewal, canceled-but-unexpired,
  grace period, account hold, refund/revocation, restore, wrong AIM account, and
  expired Firebase session on a Play-installed app with license testers.
- Add authenticated real-time developer notifications and subscription
  reconciliation. Access checks reverify Google on each request when enabled,
  and are deliberately disabled for the free preview.
- Only after these checks, approve a change to `paymentsEnabled` and set
  server-only `PLAY_BILLING_ENABLED=true`. Both gates must be enabled for the
  purchase button and native purchase flow to proceed. Enable
  `PLAY_ACCESS_ENFORCED` only after the full purchase/restore test.

References: https://developer.android.com/google/play/billing/integrate,
https://developer.android.com/google/play/billing/test,
https://developer.android.com/studio/publish/app-signing,
https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptionsv2
