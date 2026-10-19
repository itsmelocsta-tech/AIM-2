# AI request recovery

All server calls through `generateWithFallback` share a 75-second total budget,
25 seconds per model, and abort the timed-out request. Explicit owner model
overrides remain first. Current defaults are Gemini 3.5 Flash-Lite, 3.8 Flash,
and 3.1 Flash-Lite. Invalid requests or rejected credentials stop immediately;
transient errors and unavailable models may fail over. Safety blocks stop the
chain. Request schemas and output format are retained for each attempt.

These text models have a published free tier. This change does not enable
billing, buy capacity, rotate keys, or substitute a fictional successful plan.
Availability and quota still depend on the existing Google project.

Sources checked October 19, 2026:

- https://ai.google.dev/gemini-api/docs/models
- https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite
- https://ai.google.dev/gemini-api/docs/pricing

Google limits access to 2.5 models for projects without legacy usage. The
previous default/fallback chain could spend its budget on unavailable or
overloaded models. The live disposable-account journey must verify generation,
cloud recovery and cleanup; unit tests alone do not establish provider success.
