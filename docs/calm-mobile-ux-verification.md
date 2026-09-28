# Calm mobile experience — implementation and verification

AIM now puts one next move on Today. The default screen contains a stationary orb, local-time greeting, one saved task (or an honest empty/completed state), and one primary action. Four navigation controls remain: Today, Talk to AIM, Check-in, More.

## Moved

More contains the detailed overview, planner, projects, goals, opportunity scanner, memory, wellness, history, planning preferences, advisor chat, coaches, profile, voice preferences, Drive, capture, account, and tour replay. Existing modules remain available; their backend capabilities were not deleted. This is intentional disclosure after the user opens More, rather than eleven competing tabs on every screen.

Talk to AIM opens the existing voice/text life-update workflow, which analyzes the user's context and asks for confirmation before applying a changed plan. It is not a newly implemented universal router for every subsystem.

## Fresh-user journey

Signup → AIM introduction → current situation → desired changes → desired future → existing AI analysis → one recommended starting path, with alternatives under details → save plan → three short contextual highlights (Today, Talk to AIM, Check-in) → calm Today.

Question drafts are account-scoped in local storage. The current question is recorded so refreshing unfinished writing does not silently submit it. Legacy drafts still resume. Completed onboarding and tour progress use the existing profile persistence. Tour writes are awaited; failed saves keep the current step visible. Skip and replay are supported. Draft answers before plan confirmation remain device-local, not cross-device synced.

The next move is the first unfinished priority from today's saved plan, using the user's timezone. Completed priorities lead to check-in; missing or stale plans lead to a neutral planning prompt. This does not invent jobs, wellness records, appointments or task urgency, and it does not claim to rank every life subsystem.

## Preserved

Firebase authentication, private request tokens, Firestore user isolation, confirmed onboarding writes, confirmed reroutes, plan persistence, existing coaching modules, billing behavior, and production deployment configuration. No charging or deployment was enabled.

## Verification

- `npm run check`: TypeScript passed, 74 tests passed across 15 files, production build passed.
- `npm run test:browser`: 7 Playwright scenarios passed against the real application UI with explicit browser-only Firebase/repository/API doubles.
- Complete signup-to-home journey checked at 360×800, 390×844, 412×915, 1280×720, 1440×900, and 1920×1080.
- Checks cover question order, unfinished draft refresh, submitted-answer resume, plan display, tour resume/completion/skip, failed tour write, secondary tool availability, browser back, long input, unavailable voice, unavailable analysis, sign-out/sign-in, no horizontal overflow, and a static orb under reduced motion.
- Mobile home and tour screenshots visually inspected: no clipping, competing cards, counters, or bouncing toast; tour fits within the 390×844 screen.
- `git diff --check`: passed.
- Added browser checks to the existing GitHub quality gate. Service doubles are only installed by the browser tests and are not referenced by production code.

## Limits and remaining verification

The default Chromium download returned invalid archives in this workspace. The official alternate download supplied Chromium headless shell 134; local tests used it through `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Playwright 1.62.1 is pinned consistently in both lockfiles; CI installs its matching Chromium normally.

Live Firebase email and guest signup, sign-in, named-database owner access, and cross-user denial were subsequently verified with disposable accounts; see [live-firebase-audit.md](live-firebase-audit.md). The browser checks still use controlled service responses, so the full AIM UI, private Express API, live Gemini analysis, and physical-phone voice remain unverified against a reachable deployment. Production build retains a large-bundle warning. No production deployment was performed.
