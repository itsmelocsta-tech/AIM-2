# Realistic adaptive planning

## Change and reason

- Morning check-in accepts 0–14 productive hours in 15-minute steps using the existing slider. Zero no longer becomes eight hours. A zero-time check-in adds no work and preserves the saved plan.
- Fixed an undefined optional evening-reflection field in morning-plan saves, discovered by the real deployed zero-time/Firebase check. New morning plans omit that field when no reflection exists.
- Server validation rejects invalid capacity, missing action instructions, more than three generated priorities, unmeasurable estimates, overlapping time ranges, and work exceeding the supplied time. Tasks and their corresponding calendar blocks are budgeted separately, not added together.
- Morning-plan reconciliation and life-update rerouting validate the combined schedule, including retained commitments. Unsafe changes are rejected before save; completed and unrelated work stay intact. The existing preview explains the rejection and retains the save-without-changing option.
- AI planning instructions use the locked Awareness, Intention, Motion name and actual time/resource constraints. Removed the job-loss/outreach example that could bias unrelated life updates.
- Removed canned service-offer success responses from both API layers and fixed-price/high-pressure examples from the prompt. Missing skills/audience return 400; unavailable or malformed AI returns 503 instead of a fictional offer.
- Updated stale voice-test expectations to the neural-model order, retry text, current onboarding labels and bounded retry requests already present on main. No voice runtime behavior changed.

## Preserved and deferred

Preserves onboarding, contextual navigation, Basic/Premium access, configured price/trial, existing data, health guidance, voices and optional atmosphere features. No bank connection, watch app, subscription activation, contact outreach, parallel-work UI or new navigation is introduced. These competitor features are not launch prerequisites.

## Test procedure

Use a disposable fictional account on the exact PR preview once available. Browser fixtures use production components and fictional API/local persistence; they do not prove live AI, Firebase, OAuth, payment or physical microphone behavior.

| Test | Expected result |
| --- | --- |
| Planner → Morning check-in → 0 hours → Make my daily plan | No new work; completed tasks and existing commitments remain; notification says so. |
| Move time slider to 0.25 hours | Displays 0.25 hours; generated priorities and scheduled work fit 15 minutes. An existing commitment that would exceed the budget must cause a rejection rather than deletion. |
| Keep a 16:00–17:00 commitment; propose 16:30–17:30 through a life update | Overlap explanation; no reroute confirmation; no saved-plan mutation. |
| Propose a feasible 14:00–14:15 action; inspect preview | Nothing saved before confirmation. Confirm, then reload: new action plus prior commitments and completed work remain. |
| Fixture sends overlapping or excessive morning plan | Error response; saved plan remains intact. |
| Offer service unavailable or malformed | No fabricated price, sales claim or completed-offer response. |

Automated checks: `npm run check`; `cd qa && npx playwright test --config adaptive-plan.config.mjs`. The Plain Language Browser QA workflow runs these affected-path Playwright fixtures plus the existing plan regression against the PR head. Browser QA separately attempts its existing exact-head deployed checks.

## Design review

[Figma interaction review](https://www.figma.com/design/bkpDV0yonvzZeuaK4Q4v5G/AIM?node-id=110-2): preserve current layout and controls; no new tab or onboarding step; allow shorter budgets; retain completed work and reject unsafe changes. This is an interaction review, not a pixel specification. Deployed comparison and exact-head run results are recorded in the pull request.

## Limits

Safety checks reject rather than silently repair model output. Scheduling uses same-day 24-hour time ranges (00:00–23:59, matching the canonical schedule); changed legacy/unparseable blocks must be corrected before rescheduling. Resource and energy instructions guide generation but do not establish real-world feasibility or medical suitability. This change does not prove improved retention or app-store readiness.
