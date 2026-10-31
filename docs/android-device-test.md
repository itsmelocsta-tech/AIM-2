# AIM installed Android test
This debug build opens the immutable corrected web preview:
https://aim-2-ojx3pueb5-itsmelocsta-5904.vercel.app
Web source: 9b2d4b8d17e3413a514196fbcefbdb16e58f19c0.

The app is labelled **AIM Test** and uses package **app.aim.lifeos.debug**. It is not the signed Google Play release. Purchases remain disabled. The workflow checks native unit tests, lint, APK signature, package identity and embedded web origin and provides a SHA-256 report. None of these establish physical-device success.

## Access
The preview keeps Vercel protection. At launch, the debug-only native screen asks the owner to paste the private preview link supplied separately. Accept only the configured HTTPS deployment root and optional _vercel_share token. Do not save or commit that link, owner credentials, bypass secrets or signing keys. No private access token is compiled into the APK. Native voice and billing bridges remain restricted to the configured AIM origin. Release builds retain the existing direct launch behavior.

## Samsung installation and test
1. Download AIM-Test.apk on the Samsung and open it in My Files / Downloads.
2. If Android requests permission for that file source, enable **Allow from this source** only for the source used to open the APK; turn it back off after installation. Do not disable Play Protect or ignore a dangerous-app warning. Stop and report any warning.
3. Install and open **AIM Test**. Paste the supplied private AIM test link and choose Open AIM.
4. Sign in using email or the existing guest option. Embedded native Google OAuth is not implemented; do not call website Google sign-in a native pass.
5. On an empty test field, dictate, pause, continue, then stop; check for duplicate words and late changes after Stop.
6. Choose a harmless test image through the file picker. Confirm that it opens the picker and returns to AIM; do not upload sensitive personal files.
7. Check that the keyboard leaves Save/Send reachable, Back behaves correctly, backgrounding stops listening, and relaunching preserves the correct saved account data.
8. Record which steps pass or fail. A screen recording helps diagnose problems but is not required for every pass.

This native implementation does not declare POST_NOTIFICATIONS or exact-alarm permissions. Do not claim background start/end alarms are native-ready from this package; audit that implementation separately before release.
If an older AIM Test install has a different debug signature, do not remove the main AIM app. Report the installation error; replacing the test installation may require preserving test data first.
