# AIM preview on Vercel

The Vite project publishes only `dist/` as static files. The local/Cloud Run
server is built into `build/server.cjs`, outside that public output. Vercel
routes `/api/*` to `api/index.ts`, which imports the generated `api/server.cjs`
bundle and exports its Express application. Bundling all server dependencies
avoids Node ESM resolving the source `server/` directory at runtime.
`npm run test:api-package` checks the actual bundle after building.
The app currently uses state-based navigation, so unrecognized URLs are not
rewritten to the frontend. Add a separate SPA rewrite if browser routes are
introduced later.

## Preview configuration

1. Keep the Vercel production branch on `main`. Use a separate branch or pull
   request for a Preview deployment, and do not promote it to Production.
2. In Vercel Project Settings → Environment Variables, scope `GEMINI_API_KEY`,
   `FIREBASE_PROJECT_ID`, and `FIREBASE_SERVICE_ACCOUNT_JSON` to **Preview**.
   Paste the complete service-account JSON as a secret. Its `project_id` must
   match `FIREBASE_PROJECT_ID`. Do not put the JSON in source or a `VITE_` var.
   An attached Google identity with Application Default Credentials is an
   alternative to the JSON secret. The server will reject signed-in requests
   if no usable Admin credential is supplied.
3. The browser's Firebase config is in `firebase-applet-config.json`. Confirm
   that the actual preview hostname is allowed by Firebase Authentication for
   Google sign-in. Check App Check settings if enforcement is enabled.
4. Vercel Authentication currently protects the deployment. Give a tester
   explicit access to the preview, or use a time-limited Vercel share link.
   Do not make the production deployment public just for a test.

## Acceptance checks

* `GET /api/health` returns 200 with `status: "ok"`. `hasApiKey` indicates
  whether the Gemini secret is present; it does not prove an AI call works.
* An unsigned `POST /api/aim/voice/format-spoken` returns 401. A signed-in
  disposable user can complete all three onboarding answers, receive a
  generated pathway, save and reload their profile, then sign out.
* Verify Google sign-in separately on the final preview hostname and check
  Vercel runtime logs for credential or upstream failures.
* `GET /server.cjs` and `GET /server.cjs.map` must return 404.

`npm run check` covers types, unit tests, and both build outputs locally. A
passing build alone does not establish that Vercel routing, Firebase Admin,
Gemini, or the full browser journey works.
