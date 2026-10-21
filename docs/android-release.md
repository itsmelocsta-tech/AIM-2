# Prepare the signed AIM Android bundle

The manual **Android Signed Release Bundle** workflow creates an upload-signed
Android App Bundle for `app.aim.lifeos`. It does not upload to Play Console,
publish a release, change the website, or enable payments. Run it on `main`
after this workflow has been reviewed and merged. Other branches are skipped.

## Owner-controlled signing setup

In the AIM-2 repository's Settings > Secrets and variables > Actions, configure:

| Repository secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Base64 encoding of the owner's Android upload keystore |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Alias of the upload signing key inside that keystore |
| `ANDROID_KEY_PASSWORD` | Password for that signing key |

Use the upload key already registered with Google Play if this application
already exists there. For a first release, establish an owner-controlled upload
key and keep a separate secure backup before configuring these secrets. Do not
send keys/passwords in chat, commit them, or upload them as workflow artifacts.
This workflow never creates or substitutes a signing key. GitHub's settings UI
accepts secret values without requiring them in a repository file.

The workflow maps these secrets to the existing Gradle signing inputs.
`ANDROID_KEYSTORE_PATH` is a temporary runner path, not another secret.
Missing secrets stop the job before installing build tooling.

## Build and retrieve

1. Open Actions > Android Signed Release Bundle > Run workflow.
2. Select `main` and supply the verified public HTTPS AIM origin. The current
   default is `https://aim-2-sepia.vercel.app`. Confirm that this is the origin
   intended for the Android release; syntax validation does not establish that
   legal pages, authentication, and API flows work on that origin.
3. After a successful run, download `aim-signed-aab-<commit>`. It contains
   `app-release.aab` and `SHA256SUMS.txt`; no keystore or signing passwords.
   The artifact expires after seven days, so retain the release bundle securely.

The build uses Java 17/API 36, compiles release code, runs native release unit
tests and lint, checks for a bundle signature, verifies it with `jarsigner`,
and records the commit and SHA-256 checksum. The temporary keystore is removed
even if the build fails. Signing steps disable Gradle build/configuration caches.

The release currently uses version code `1` / version name `1.0.0`. Check Play
Console before uploading; every subsequent upload needs an unused version code.
The debug package is `app.aim.lifeos.debug` and is separate from this release.

## What remains after the bundle build

- Upload the AAB to the appropriate Play internal-testing track and enroll the
  physical-device tester. An AAB is uploaded to Play; it is not directly
  installable like an APK.
- Register the appropriate native Google/Firebase OAuth signing certificates;
  distinguish the upload certificate from the Play app-signing certificate.
- Verify real-device login, microphone, file picker, navigation, lifecycle,
  offline recovery, and the fractal visuals/audio in the native app.
- Complete public privacy/terms/deletion/support pages and owner-approved store
  listing, data-safety and content declarations.
- Configure Play products and service access, then verify purchase, restore,
  renewal and refund/revocation in the authorized license-testing setup before
  any separate decision to enable checkout. No purchase is performed here.

The workflow refuses to build if `paymentsEnabled` in `play-launch-offer.json`
is anything other than `false`. A signed bundle is packaging evidence, not a
claim that the app is approved for sale or that billing/device tests passed.
