# AIM development workflow

For every AIM task, follow docs/development-workflow.md. The user has selected Figma for design review and Playwright through GitHub Actions for repeating browser QA.

1. Classify the change. Interface changes require Figma review before implementation and comparison after deployment. Backend-only changes record a specific reason for skipping design.
2. Implement in GitHub and run the existing Quality Gate.
3. Run the Playwright Browser QA workflow against the exact change-request head commit. Retain the run URL and report/screenshots as evidence. If the branch lacks the runner or affected-path tests, add them or report BLOCKED; do not substitute another provider.
4. Resolve the READY Vercel preview for that exact commit. Use Playwright and authorized preview access for deployment-specific checks. An authorized interactive browser may supplement Google account selection and checks that require user interaction.
5. Fix confirmed defects, deploy the new commit, and repeat affected QA.
6. Put commit-bound design and QA evidence in the change request. Record QA runner: Playwright and each PASS, FAIL, and BLOCKED outcome. A local harness pass does not verify live Firebase, Gemini, Google login, or the full new-user flow.

Do not invoke TinyFish or other metered browser-testing services for AIM QA. Do not buy additional runner capacity. Report GitHub allocation limits as BLOCKED. Read the relevant installed Figma skill before Figma operations. Do not expose tokens, real user data, credentials, authentication state, or secret-bearing traces in evidence. Do not charge purchases during QA.
