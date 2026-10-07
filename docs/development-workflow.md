# AIM design, build, deploy, and QA

## Orchestration
The development agent coordinates GitHub, Figma, Vercel, and Playwright during each AIM work session. AGENTS.md makes these steps persistent repository instructions. The Workflow Evidence check requires evidence fields on every change request and checks that QA refers to its current commit.

The AIM event-driven automation coordinates design review and inspects GitHub browser-test results. Repeating browser tests run with Playwright in GitHub Actions; ChatGPT plugin connections are not GitHub Actions credentials. The automation must never invoke TinyFish or another metered browser-testing service. Use the existing GitHub allocation and report exhausted limits as BLOCKED without buying capacity.

## Figma
For changes to screens, navigation, visual styling, onboarding, or user-facing interaction:
- Use Figma to inspect the existing AIM design or create a review file if no source exists.
- Preserve the calm mobile experience, progressive onboarding, clear next action, readable text, and accessible controls.
- Record file/node URL, inspected screens, review outcome, and unresolved defects.
- Compare the deployed mobile and desktop screenshots with the intended design.
- Populate Design evidence with the Figma URL and findings. Backend-only changes use "not-applicable:" followed by a concrete reason.

## Playwright QA
After Vercel reports READY, verify its commit matches the change request head.
Run the branch's Browser QA GitHub Actions workflow and inspect its Playwright steps, tests, and uploaded evidence. Record the exact tested head SHA, run URL, report/artifact links, preview URL when applicable, and individual outcomes. Configure checkout to use the change-request head SHA, not a synthetic merge SHA.

Playwright currently has an activity-alarm regression suite on the activity-alarms change request. It tests the browser-only harness at a phone-sized viewport. Its pass does not prove deployed onboarding, Firebase, Gemini, or Google sign-in. A branch without a Playwright runner or affected-path tests must add the applicable suite or report BLOCKED; never silently switch providers.

For deployed checks, point Playwright at the matching READY Vercel preview using only authorized preview access. Preserve deployment protection. If account selection, credentials, quota, or access prevents a path, report BLOCKED. An authorized interactive browser can supplement checks requiring user interaction. Do not publish authentication state or secret-bearing traces.

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
Complete all template fields, including QA runner: Playwright. QA commit must equal the current head SHA; new code invalidates earlier QA. QA result must be PASS before Workflow Evidence can pass. Design evidence must link Figma or explain why design is inapplicable. QA evidence must link the current Playwright GitHub run/report/artifact or an authorized supplementary browser report. The check rejects another QA runner and TinyFish evidence. It validates the record, not the truth of screenshots or test claims; reviewers and agents inspect the supporting evidence.

Branch protection is not configured by this change. To enforce checks at merge time, Workflow Evidence and Quality Gate must be required in repository rules.
