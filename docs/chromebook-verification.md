# Chromebook web completion — November 7, 2026

The owner now uses a Chromebook; the Samsung phone is unavailable. Preserve the existing owner account and saved plan. Do not require screenshot-by-screenshot repetition of browser journeys covered by exact-source automated evidence.

## Physical Chromebook evidence

On preview source 6b3b73d8c73c768fc1e7a9772310bde03a0de801, owner screenshots and explicit confirmations establish welcome/signup/consent progression, speaker playback, microphone dictation/stopping, answer controls and an animation-specific generated plan. This is user-reported physical Chromebook evidence, not native Android/iOS evidence. Owner-account plan activation and persistence were not directly operated by an agent.

## Confirmed follow-up fixes

- The separate VoiceModal captured the render's old transcript in its recognition-end callback. Use the latest transcript, guard duplicate stop/send callbacks, preserve history across successive turns and ignore results after closing/account changes.
- Permission errors now report recovery without submitting partial speech. Failed/empty replies preserve the draft for retry; closing discards unfinished capture and invalidates pending results.
- The duplicate-email attempt exposed raw Firebase diagnostics. Map known authentication codes to recovery guidance; unknown provider messages are not exposed. Existing auth layout is preserved.

## Verification

Local TypeScript, 191 unit tests in 37 files and production build/private-output guard passed after these fixes. Local Playwright execution was blocked before assertions because the Chromium download returned an invalid archive; this is not a product failure. Use the existing GitHub Actions Playwright runner for final browser verification. New phone/desktop regression cases cover two spoken turns and history, duplicate callbacks, close cancellation, denied microphone permission, empty-result retry and late replies.

Final exact-source runs, preview and inspected screenshot/artifact links are maintained in PR #43. Running checks never count as passes. Baseline web and native-build evidence remains revision-specific.

## Design and scope

Existing AIM Figma file was inspected at node 12:2 during this work; that node describes activity alarms and is not a voice-modal visual specification. No layout, navigation, icon placement or styling is changed. Preserve the approved interface and verify regression screenshots. Do not claim a new Figma visual-match pass for these callback and authentication-error corrections.

Direct Chromebook browser control returned an originating-browser-context error. Available automated browser checks are the execution route; do not claim that cloud automation operated the owner's Chromebook. No account reset, paid generation, billing enablement, production promotion or store submission is part of this change. Google OAuth with an authorized real profile, actual production provider/data configuration, genuine Premium flows and native release readiness remain separate unverified gates.
