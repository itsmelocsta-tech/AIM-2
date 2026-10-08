# AIM account deletion

The web resource is `/delete-account` on the final AIM HTTPS origin. Add that final URL to Play Console. The same page is linked from the signed-in account menu, and works in the Android app or a web browser without reinstalling the app.

Deletion requires a verified Firebase session, explicit confirmation, and recent sign-in for email/Google accounts. Anonymous sessions can delete their own data without a password. The server removes the user's Firestore hierarchy, free-update allowance, Play verification/ownership records, and Firebase Auth account. Auth removal happens last so a failed cleanup can be retried. The device clears local AIM caches and requests native alarm cancellation. Deletion does not cancel a Google Play subscription or delete files the user saved to their own Google Drive; the page explains both and links Google Play subscription management.

Code and fictional browser tests do not verify a real deletion transaction. Before release, use an explicitly approved disposable test account with nested saved data to verify removal, failure/retry, expired sign-in, and device cleanup. Never delete a real user's account during QA. Confirm the actual data retention and external-provider practices in the owner-approved privacy policy.

Reference: [Google Play account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111).
