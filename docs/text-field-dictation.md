# Text field dictation

Objective: make Quick Capture and every editable text or numeric field speakable without submitting fragments or adding a separate voice page.

The shared VoiceInput and VoiceTextarea preserve each field's controlled value, validation, refs and existing save/search handlers. They show a 44px microphone beside the field. Tap to start; tap again to stop. The draft stays editable; saving and sending remain explicit. Interim speech replaces the current interim words. Final segments survive browser silence restarts. Existing text is preserved when a new dictation starts. Numeric fields accept recognized digits and leave the previous value unchanged when recognition is not numeric. Existing maximum lengths still apply.

Stop and release the microphone on typing, form submission, field unmount, read-only/disabled state, page hiding and field switching. Ignore late results after stopping. Denied permission and unsupported browsers show recovery text and preserve typing. Existing home, onboarding, coach, voice-modal and primary life-update composers retain their dedicated microphones. Passwords and non-text controls (checkboxes, ranges, dates, times and file pickers) keep their existing input methods.

Affected modules: authentication email, Quick Capture memory/task, reports, weather search, atmosphere description, advisor, Check-In, crystal numeric settings, daily planning, profile foundation, goals, life-update editors, memories, projects, opportunities, settings and wellness notes. Check-In no longer creates a single-phrase recognizer on each toggle.

Acceptance and regression checks:
- Source audit rejects editable fields missing shared dictation or an existing dedicated microphone.
- VoiceEngine tests check silence restarts, cumulative text, interim replacement, stale results, microphone ownership and permission errors.
- Playwright in the Natural Voice Browser QA workflow checks actual Quick Capture memory/task saving, stop/close cleanup, multiple fields, manual edits, max length, numeric validation, disabled controls, permissions/retry, unsupported typing fallback, touch targets and phone/desktop bounds with a simulated recognizer.
- Existing Quality Gate and other affected browser suites remain required. Local type checks, 171 unit tests and production build passed before the first push.

Design reference: https://www.figma.com/design/bkpDV0yonvzZeuaK4Q4v5G?node-id=12-2 . File structure was inspected. Detailed review and deployment comparison are BLOCKED by the connected Figma Starter MCP call limit; no upgrade was made. Commit-bound preview, CI results and screenshots belong in PR #37. Simulated recognition does not prove physical audio capture or Android device behavior. Preserve unrelated working features and the existing release gates.
