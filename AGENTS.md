# AIM development workflow

For every AIM task, follow docs/development-workflow.md. The user has authorized Figma design review and TinyFish browser QA as part of development.

1. Classify the change. Interface changes require Figma review before implementation and comparison after deployment. Backend-only changes record a specific reason for skipping design.
2. Implement in GitHub and run the existing Quality Gate.
3. Resolve the Vercel preview for the exact commit; wait for READY.
4. Run TinyFish live browser QA against that preview. Do not substitute a build pass for browser verification.
5. Fix confirmed defects, deploy the new commit, and repeat affected QA.
6. Put commit-bound design and QA evidence in the change request using the repository template. Never mark blocked checks as passed.

Read the relevant installed Figma skill before Figma operations and the TinyFish tool instructions before automation. Do not expose tokens, real user data, or credentials in evidence. Do not charge purchases during QA.
