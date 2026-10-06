# AIM design, build, deploy, and QA

## Orchestration
The development agent coordinates GitHub, Figma, Vercel, and Playwright during each AIM work session. AGENTS.md makes these steps persistent repository instructions. The Workflow Evidence check requires evidence fields on every change request and checks that QA refers to its current commit.

This is agent-driven orchestration, not a hosted plugin webhook service. ChatGPT plugin connections are not GitHub Actions credentials. An unattended Figma/TinyFish service needs separately configured API access and a runner; none is assumed or embedded here.

## Figma
For changes to screens, navigation, visual styling, onboarding, or user-facing interaction:
- Use Figma to inspect the existing AIM design or create a review file if no source exists.
- Preserve the calm mobile experience, progressive onboarding, clear next action, readable text, and accessible controls.
- Record file/node URL, inspected screens, review outcome, and unresolved defects.
- Compare the deployed mobile and desktop screenshots with the intended design.
- Populate Design evidence with the Figma URL and findings. Backend-only changes use "not-applicable:" followed by a concrete reason.

## Playwright browser QA
The Browser QA GitHub workflow runs on each change request and on pushes to main. It installs Chromium, starts the browser-only harness from the exact checked-out commit, and uploads its report, trace, and screenshots as build artifacts. The alarm regression covers start, identical finish time after reload, planner choices, cancellation, restoration, and a visible one-minute finish alert. It uses fictional local test state and does not call paid AI services or TinyFish.

After Vercel reports READY, verify its commit matches the change request head. Deployment-only paths that depend on Vercel protection, Firebase authorized domains, Google account selection, or live server credentials still require an authorized interactive browser check. Report unavailable credentials as BLOCKED.

Use fictional test data and disposable accounts. Cover:
1. Fresh guest and email signup/login; Google login with an authorized test profile.
2. All three onboarding answers and back/forward navigation.
3. Real plan generation, visible recovery after errors, and bounded loading.
4. Reload and sign-out/sign-in retain the correct saved plan without restarting onboarding.
5. A life update reroutes the plan.
6. Opportunity focus accepts the user's own category/description/location without inheriting Cisco's DFW preferences.
7. Mobile and desktop layouts; failures in the browser/API/database chain.

A smoke test does not count as a full-path pass. List each PASS, FAIL, and BLOCKED separately. Never report Google login, Gemini generation, persistence, or billing as passed without direct evidence.

## Defect loop
Give the implementation agent the exact failed action, expected/actual behavior, preview commit, browser evidence, and relevant Vercel runtime error. Fix the first broken boundary; redeploy; rerun affected paths and relevant regression checks. Do not claim automatic repair outside an active agent session.

## Review evidence
Complete all template fields. QA commit must equal the current head SHA; new code invalidates earlier QA. QA result must be PASS before Workflow Evidence can pass. Design evidence must link Figma or explain why design is inapplicable. QA evidence may link the current Playwright GitHub run/artifact or an authorized interactive browser report. The check validates the record, not the truth of screenshots or test claims; reviewers and agents inspect the supporting evidence.

Branch protection is not configured by this change. To enforce checks at merge time, Workflow Evidence and Quality Gate must be required in repository rules.
