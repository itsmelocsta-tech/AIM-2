# AIM design, build, deploy, and QA

## Orchestration
The development agent coordinates GitHub, Figma, Vercel, and TinyFish during each AIM work session. AGENTS.md makes these steps persistent repository instructions. The Workflow Evidence check requires evidence fields on every change request and checks that QA refers to its current commit.

The enabled ChatGPT automation “AIM automated design QA” wakes on AIM-2 GitHub change requests and commit updates. It uses the authorized GitHub, Figma, Vercel, and TinyFish connections to run this workflow without a new chat request. Direct pushes without a change request and Vercel deployment-ready events are not registered triggers. Closed/merged requests and previously completed commits are skipped. Each run allows at most two repair commits, rechecks the head before writing, and records missing prerequisites as BLOCKED. Production promotion and automatic merging are excluded. TinyFish consumes the existing wallet; the automation cannot top up or change auto-reload. The Friday AIM summary was paused to free the automation slot. Trigger registration is confirmed; end-to-end unattended execution must be verified from an actual event and its evidence.

## Figma
For changes to screens, navigation, visual styling, onboarding, or user-facing interaction:
- Use Figma to inspect the existing AIM design or create a review file if no source exists.
- Preserve the calm mobile experience, progressive onboarding, clear next action, readable text, and accessible controls.
- Record file/node URL, inspected screens, review outcome, and unresolved defects.
- Compare the deployed mobile and desktop screenshots with the intended design.
- Populate Design evidence with the Figma URL and findings. Backend-only changes use "not-applicable:" followed by a concrete reason.

## TinyFish QA
After Vercel reports READY, verify its commit matches the change request head.
Use run_web_automation once per test run, then wait_for_run until terminal. Record its run ID, preview URL, commit, outcomes, and evidence. Follow metering and authentication instructions. If account selection or an unavailable credential blocks a path, report BLOCKED.

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
Complete all template fields. QA commit must equal the current head SHA; new code invalidates earlier QA. QA result must be PASS before Workflow Evidence can pass. Design evidence must link Figma or explain why design is inapplicable. The check validates the record, not the truth of screenshots or test claims; reviewers and agents inspect the supporting evidence.

Branch protection is not configured by this change. To enforce checks at merge time, Workflow Evidence and Quality Gate must be required in repository rules.
