# AIM — Apple App Store readiness
Reviewed 2026-10-31. Status: NOT IMPLEMENTED; not submission-ready.

## Source evidence
The release/google-play-web-ready tree has a React web app and a custom Kotlin Android app. No iOS project, Xcode project/workspace, Info.plist, entitlements, privacy manifest, archive or StoreKit integration exists. Browser and Android results are not iOS evidence.

## Required implementation
Build an iOS client that preserves AIM's approved conversation-first flow, real account persistence, explicit Google Gemini consent, account deletion and reporting. Include native permission recovery, reliable voice capture, file picking, safe external navigation, keyboard/safe-area behavior, lifecycle handling and usable accessibility. A bare website wrapper does not establish Apple's minimum-functionality compliance (4.2).
Use the existing Firebase backend and secure server API; never put provider keys in the client. Verify a stable public API origin before coupling a native release to it.
Resolve Apple login requirements for any Google/social login offered in iOS (4.8); do not assume email alongside Google satisfies the privacy-preserving equivalent-login requirement.
Keep purchases disabled. Do not reuse Android billing code or offer an unverified external payment flow. If monetization is enabled later, implement and test the applicable Apple purchase/restore/subscription lifecycle.

## Owner/platform gates
Apple Developer membership, correct legal entity/account, App Store Connect app identity and roles, agreements, signing team/certificates/provisioning and a verified bundle identifier are unknown in this session. Do not invent or replace identities.
Xcode/macOS build, archive validation, real iPhone installation and testing, TestFlight processing, and actual native screenshots are required evidence still unavailable.
Prepare accurate App Privacy responses from the actual final SDK/data inventory; confirm retention, deletion, linked identifiers and tracking. Assess privacy manifest and required-reason API obligations against the actual native dependencies.
Provide a secure dedicated reviewer account and accessible backend, accurate age rating/export compliance, support/privacy URLs and final metadata. Never commit reviewer passwords.

## Official references checked
- https://developer.apple.com/app-store/review/guidelines/ — 2.1 completeness, 4.2 minimum functionality, 4.8 login, 5.1 privacy/deletion and explicit third-party AI data-sharing permission.
- https://developer.apple.com/help/app-review/before-submitting-for-review/complete-review — reviewer access and external-service information.
- https://developer.apple.com/app-store/submitting/ — submission preparation.
This is a preparation record, not evidence of an uploaded or approved iOS build.
