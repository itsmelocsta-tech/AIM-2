# AIM Google Play Privacy Materials

**Reviewed against the AIM release code on October 11, 2026.** This file is an internal Play Console worksheet. The public policy and terms are served at `/privacy` and `/terms`; the account deletion page is served at `/delete-account`.

## Public links

The intended policy routes are `/privacy`, `/delete-account`, and `/terms`. Do not submit the Vercel preview or app aliases as the Play policy URL yet: on October 11, 2026, the Vercel project reported `live: false`, its latest deployment was a Preview deployment, and SSO protection was enabled for Vercel-hosted URLs. The policy therefore has no verified public, sign-in-free URL at this time.

Once the owner enables a public production origin or assigns a public custom domain, use that origin (not a preview URL):

- Privacy policy: `https://<production-origin>/privacy`
- Account deletion request: `https://<production-origin>/delete-account`
- Terms of use: `https://<production-origin>/terms`
- In-app links: the app footer and account controls link to these pages.

These pages must be publicly reachable without signing in, be non-editable HTML, and remain available while the app is distributed. The deletion page lets a signed-in user submit a request; it requires recent sign-in for non-anonymous accounts and asks for a clear confirmation.

**Release gate:** verify all three URLs from a signed-out browser and an external network after deployment. Do not turn off protection for the entire app to expose the policy; use an owner-approved public origin or host the legal pages separately.

## Play Console Data safety worksheet

Google requires the developer to review all app versions, libraries, and service providers and submit the Data safety form. The entries below are a code-based draft for the current release. The app owner must confirm the production configuration and final answers in Play Console before submission.

| Play data type | Current AIM behavior | Likely purpose | Draft handling |
|---|---|---|---|
| Personal info: name, email address | Firebase Authentication may hold display name and email; AIM profile can also save a name and email | Account management, app functionality | Collected; required for email account, optional for anonymous account; delete request available |
| Personal info: user IDs | Firebase UID links a user to their Firestore workspace and purchase records | Account management, app functionality, fraud prevention | Collected; delete request available |
| Health and fitness: health information | Users may record sleep, food, movement, energy, stress, and wellness notes; those records can be saved and included in AI context | App functionality, personalization | Collected; optional; delete request available |
| Location: approximate and precise | User-entered city/location is saved with settings; weather may use browser GPS coordinates, IP-derived location, or a typed city and sends the necessary location to weather/geocoding providers | App functionality | Approximate location is collected when saved; GPS coordinates are transmitted for a weather request when permission is granted. Confirm whether Play treats this as collection or ephemeral processing for the final version |
| User-generated content: messages and other content | User answers, chats, goals, plans, notes, memories, projects, opportunity searches, and life updates are stored in Firestore and some are sent to Gemini for requested AI features | App functionality, personalization | Collected; optional; delete request available |
| App activity: in-app search history / other actions | Saved opportunity search descriptions and locations, schedule/planner state, and feature preferences | App functionality, personalization | Collected when saved; optional; delete request available |
| Financial info: purchase history | Google Play subscription token and status are verified by the server; full card details are processed by Google Play | App functionality, fraud prevention | Declare purchase/subscription status if requested by the form; do not claim AIM receives card numbers |
| Audio files | AIM does not intentionally store raw microphone recordings. Browser/WebView speech recognition may use a platform speech service and returns text to AIM | App functionality | Verify native WebView microphone/speech behavior on the Play build before final declaration |
| Device or other IDs | Firebase Authentication and Google Play use account and purchase identifiers; no advertising ID or analytics SDK is declared in this code | Account management, app functionality, fraud prevention | Confirm provider SDK disclosures and exact form mapping before submission |

### Data sharing review

- Google Firebase/Authentication and Vercel host the app, authenticate users, and process workspace data or service logs.
- Google Gemini receives user text and saved context needed for AI responses. Its unpaid API terms permit broader product-improvement use and human review; paid API terms differ. AIM's actual project billing mode must be verified by the owner. Until confirmed, do not state that user content is never used for model improvement.
- Google Drive receives an export only after the user connects Drive and requests an export. The user controls the destination files.
- Weather and geocoding providers receive the city or coordinates needed for a requested weather/location result. IP-location providers receive the network request and may infer approximate location.
- Google Play handles payment-card details; AIM's server receives purchase tokens/status needed to verify a subscription.

Treat user data as shared with Gemini for the Data safety form unless the owner verifies the applicable service-provider or prominent-disclosure exception and documents why it applies. Google says developers are responsible for the accuracy of the form, including SDK and provider behavior.

### Security and deletion questions

- **Encryption in transit:** likely Yes. The app's API, Firebase, Google, and weather/geocoding calls use HTTPS. Confirm the deployed app and every production endpoint before submission.
- **Account creation:** Yes. Email, Google, and anonymous sessions are supported.
- **Account deletion:** Yes, in-app via Account & Security and on the public `/delete-account` web resource. A deletion request removes AIM-controlled account data and server records; the privacy policy explains provider backups, Drive exports, and subscription cancellation limits.
- **Account deletion retention:** Firebase documents that Authentication data is removed from live and backup systems within 180 days after a deletion request. Do not promise immediate removal from provider backups or logs.
- **Data not collected:** No ad personalization, advertising ID, analytics SDK, contacts, SMS, call history, camera, or Health Connect integration appears in the inspected release code. Recheck dependencies, Android manifest, and any later feature before submission.

## Health apps declaration and listing text

AIM includes wellness support for sleep, nutrition, movement, stress, energy, and routines. Complete the Health apps declaration in Play Console and declare the applicable wellness/fitness features. Google's Health Content and Services policy requires a declaration even for apps with no health features.

Use this short disclaimer in the Play listing and in health-related app surfaces:

> AIM provides general planning and wellness information. It is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. It is not a substitute for advice from a qualified health professional.

Do not claim clinical outcomes, diagnosis, treatment, or emergency support.

## Release owner checks

Before completing Play Console:

1. Verify whether the Gemini project is using unpaid or paid service, and confirm its terms match the disclosure shown in AIM.
2. Confirm `Awakened Minds Group Inc.` is the exact developer or legal entity name used on the store listing and confirm the privacy contact email is monitored.
3. Deploy the public pages to the final production origin and test each link while signed out and from outside the app.
4. Inspect the final Android bundle's manifest, permissions, SDKs, speech behavior, and billing behavior; update this worksheet for any change.
5. Complete and save the Data safety and Health apps declaration forms in Play Console. This worksheet is not a substitute for those owner submissions.

## Official references

- [Google Play User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311)
- [Google Play account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111)
- [Google Play Data safety form](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Google Play Health Content and Services policy](https://support.google.com/googleplay/android-developer/answer/16679511)
- [Gemini API terms](https://ai.google.dev/gemini-api/terms)
- [Firebase privacy and security](https://firebase.google.com/support/privacy)
