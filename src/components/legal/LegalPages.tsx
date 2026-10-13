import React, { useEffect } from 'react';

type LegalPageKind = 'privacy' | 'terms';

const CONTACT_EMAIL = 'franciscohilburn04@gmail.com';
const EFFECTIVE_DATE = 'October 11, 2026';

function LegalShell({ title, kind, children }: { title: string; kind: LegalPageKind; children: React.ReactNode }) {
  useEffect(() => {
    document.title = `${title} | AIM`;
    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!description) {
      description = document.createElement('meta');
      description.name = 'description';
      document.head.appendChild(description);
    }
    description.content = kind === 'privacy'
      ? 'AIM Privacy Policy: what information AIM handles, how it is used, service providers, your choices, and account deletion.'
      : 'AIM Terms of Use: rules and limits for the AIM planning and wellness-support service.';
  }, [kind, title]);
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:py-12">
      <article className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl sm:p-10">
        <a href="/" className="text-sm font-semibold text-indigo-300 hover:text-indigo-200">AIM</a>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">Effective date: {EFFECTIVE_DATE}</p>
        <div className="mt-8 space-y-7 text-sm leading-7 text-slate-200 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_a]:text-indigo-300 [&_a]:underline [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
          {children}
        </div>
        <footer className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-800 pt-5 text-sm">
          <a href="/privacy" aria-current={kind === 'privacy' ? 'page' : undefined}>Privacy policy</a>
          <a href="/terms" aria-current={kind === 'terms' ? 'page' : undefined}>Terms of use</a>
          <a href="/delete-account">Delete an AIM account</a>
          <a href={`mailto:${CONTACT_EMAIL}`}>Contact AIM</a>
        </footer>
      </article>
    </main>
  );
}

export function PrivacyPolicyPage() {
  return (
    <LegalShell title="AIM Privacy Policy" kind="privacy">
      <p><strong>Awakened Minds Group Inc.</strong> (“AIM,” “we,” or “us”) runs the AIM life-planning app and website. This policy explains what information AIM handles, why it is used, which services help us run AIM, and how you can control or delete your information.</p>

      <section><h2>Information AIM handles</h2>
        <ul>
          <li><strong>Account details:</strong> email address, sign-in provider, display name when available, and account ID. Firebase Authentication handles sign-in. AIM does not receive or store your Google password.</li>
          <li><strong>Information you choose to add:</strong> your current situation, goals, plans, tasks, project details, notes, saved opportunities, chat messages, life updates, and preferences.</li>
          <li><strong>Wellness details:</strong> information you choose to record about sleep, food, movement, energy, stress, and routines. Do not use AIM for emergency care or enter details you do not want processed by an AI service.</li>
          <li><strong>Location:</strong> a city or place you type, and, if you choose to use local weather, approximate location inferred from your internet address or precise device location if your browser grants permission. Weather and map services receive the location or coordinates needed to return results.</li>
          <li><strong>Voice:</strong> if you choose voice input, your device or browser may use a speech-recognition service to turn speech into text. AIM receives and may save the resulting text. AIM does not intentionally save raw microphone recordings. AIM can send written text to Google Gemini to create spoken audio.</li>
          <li><strong>Device and service information:</strong> internet address, browser or device details, timestamps, and technical logs used by Firebase, Vercel, Google, or other service providers to run the app, keep it secure, and diagnose failures.</li>
          <li><strong>Subscription status:</strong> if you buy Premium through Google Play, the app and our server receive purchase identifiers and subscription status needed to check access. Google Play handles payment-card details; AIM does not receive your full card number.</li>
          <li><strong>Information stored on your device:</strong> settings, temporary app data, alarms, and some workspace data may be stored in browser or app storage. Android alarms stay on your device and may show an activity title in an AIM notification. Anyone with access to your unlocked device may be able to see locally saved data.</li>
        </ul>
      </section>

      <section><h2>How AIM uses information</h2>
        <ul>
          <li>To create and maintain your account, save your plans and workspace, and restore them when you sign in.</li>
          <li>To answer questions, create plans, summarize information, and provide wellness, goal, and project features.</li>
          <li>To provide weather and location features when you use them.</li>
          <li>To save a copy of information to Google Drive only when you connect Drive and choose an export. AIM does not control files you save to your Drive.</li>
          <li>To verify Google Play purchases, restore subscriptions, prevent fraud, and provide paid features.</li>
          <li>To protect AIM, troubleshoot errors, respond to support requests, and meet legal obligations.</li>
        </ul>
      </section>

      <section><h2>AI processing and your choice</h2>
        <p>AIM sends the text and saved context needed for an AI feature to Google’s Gemini API. This can include information about your goals, relationships, work, finances, location, or wellness if you put it in AIM. Google processes that information to return AIM’s answer.</p>
        <p>Google’s Gemini terms depend on whether the project uses unpaid or paid API service. Google says it may use prompts and answers from unpaid service to improve its products, and human reviewers may review some content. For paid API service, Google says it does not use prompts and answers to improve its products, but may keep them for a limited time for safety and legal reasons. AIM’s owner must keep the project’s billing and data-use settings current. Until you know which applies, do not enter confidential information, passwords, account numbers, or other highly sensitive details. Read <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer">Google’s Gemini API terms</a>.</p>
        <p>You can use account and non-AI parts of AIM without sending a new prompt to Gemini. You can stop using an AI feature at any time. Your information is not sold by AIM. You can report an AI response from the app footer. AIM stores the reported text, your notes, and account ID for review and content-safety improvements; these records are removed when you delete your account.</p>
      </section>

      <section><h2>Services that help run AIM</h2>
        <p>AIM uses service providers to operate the features you request. Depending on the feature, information may be processed by <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noreferrer">Google Firebase and Google sign-in</a>, <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer">Google Gemini</a>, <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google Drive and Google Play</a>, <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">Vercel hosting</a>, <a href="https://open-meteo.com/en/terms" target="_blank" rel="noreferrer">Open-Meteo weather and geocoding</a>, <a href="https://www.bigdatacloud.com/privacy-policy" target="_blank" rel="noreferrer">BigDataCloud</a>, <a href="https://osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noreferrer">OpenStreetMap</a>, <a href="https://freeipapi.com/privacy" target="_blank" rel="noreferrer">FreeIPAPI</a>, or <a href="https://ipapi.co/privacy/" target="_blank" rel="noreferrer">ipapi.co</a> for approximate location. Each provider handles information under its own terms and privacy practices. AIM does not control how you use those services outside AIM.</p>
        <p>When you connect Google Drive, AIM requests permission to create AIM exports and read Drive file information for the Drive feature. Disconnect Drive in AIM and remove AIM’s access in your Google Account settings to stop future access. Deleting your AIM account does not delete exported files in Google Drive.</p>
        <p>AIM does not use advertising trackers or sell personal information. We do not currently include a third-party analytics or crash-reporting SDK in this app build. Hosting, authentication, and security providers may still create technical service logs.</p>
      </section>

      <section><h2>Where information is stored and how long we keep it</h2>
        <p>Account workspaces are stored in Google Firebase Firestore. Information may also stay in local browser or app storage on your device. We keep account information and saved workspace data while your account is active or as needed to provide AIM. You may remove individual information where AIM provides a delete control, export your settings from Settings, or request account deletion.</p>
        <p>Use the <a href="/delete-account">AIM account deletion page</a> to request deletion. AIM removes the account and saved AIM records it controls, including profile, goals, plans, memories, check-ins, wellness records, opportunity settings, and subscription-verification records. The request does not cancel a Google Play subscription, erase files you exported to Drive, or instantly erase copies held in provider backups or security logs. Google says Firebase Authentication data is removed from live and backup systems within 180 days after deletion is requested. Other providers follow their own retention schedules. We may retain limited records when law requires it or for security, fraud prevention, and disputes.</p>
      </section>

      <section><h2>Security</h2>
        <p>AIM uses HTTPS for network connections, Firebase sign-in, access checks, and server-side purchase verification. No online service can promise perfect security. Keep your sign-in details private and contact us if you think someone accessed your account.</p>
      </section>

      <section><h2>Children</h2>
        <p>AIM is not designed for children under 13, and we do not knowingly collect personal information from children under 13. If you believe a child under 13 provided information to AIM, contact us so we can review and delete it.</p>
      </section>

      <section><h2>Your choices and privacy requests</h2>
        <ul>
          <li>Review or change information in AIM settings and your workspace.</li>
          <li>Export available operating settings from Settings.</li>
          <li>Disconnect Google Drive and remove its access through your Google Account.</li>
          <li>Request account deletion at the <a href="/delete-account">AIM account deletion page</a>.</li>
          <li>Ask a privacy question or request access, correction, or deletion by emailing <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</li>
        </ul>
        <p>Some privacy rights depend on where you live. We will review requests under the laws that apply to you. We may need to verify your identity before acting on a request.</p>
      </section>

      <section><h2>Changes and contact</h2>
        <p>We may update this policy when AIM or the law changes. We will post the new version here and update the effective date. For privacy questions, contact Awakened Minds Group Inc. at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </section>
    </LegalShell>
  );
}

export function TermsOfUsePage() {
  return (
    <LegalShell title="AIM Terms of Use" kind="terms">
      <p>These terms apply when you use AIM, a planning and wellness-support app operated by <strong>Awakened Minds Group Inc.</strong> By using AIM, you agree to these terms. If you do not agree, do not use the service.</p>

      <section><h2>Who can use AIM</h2>
        <p>You must be at least 13 and able to agree to these terms. If you are under the age of legal adulthood where you live, use AIM only with a parent or guardian’s permission. AIM is not designed for children under 13.</p>
      </section>

      <section><h2>Your account and information</h2>
        <p>Give accurate account information, protect your sign-in details, and tell us if you think someone is using your account. You are responsible for what you add to AIM and for keeping a separate copy of anything important. Do not submit passwords, payment-card numbers, government ID numbers, or information you are not allowed to share.</p>
        <p>You keep ownership of the information you provide. You give AIM permission to store and process it only to provide, protect, and improve the AIM service you use, including sending relevant text and context to Google Gemini for AI features. Google Drive exports are saved to your own Google account under Google’s terms.</p>
      </section>

      <section><h2>AI and wellness limits</h2>
        <p>AIM uses AI to offer ideas and organize your next steps. Answers can be wrong, incomplete, or out of date. Check important information before acting on it. AIM does not replace a doctor, therapist, lawyer, financial adviser, emergency service, or other qualified professional. Wellness features are for general information and planning; they do not diagnose, treat, cure, or prevent a condition.</p>
        <p>Do not use AIM for an emergency. Contact local emergency services or a qualified professional if you need urgent help. You decide whether to follow AIM’s suggestions and accept responsibility for your choices.</p>
      </section>

      <section><h2>Fair use</h2>
        <p>Use AIM lawfully and do not try to break, overload, copy, reverse engineer, or access accounts or data that are not yours. Do not use AIM to threaten people, violate another person’s rights, or upload content you do not have permission to use.</p>
      </section>

      <section><h2>Free and paid features</h2>
        <p>AIM may offer free and paid features. If a subscription is offered, the current price, billing period, trial, renewal date, and cancellation terms will be shown by Google Play before you confirm a purchase. Google Play manages payment and cancellation. Subscriptions renew unless canceled through Google Play before renewal. Deleting your AIM account does not cancel a subscription; cancel it in Google Play.</p>
        <p>Paid features depend on verified purchase status and may be unavailable if a payment or verification service is down. We may change or discontinue a feature, subject to applicable law and any active subscription obligations.</p>
      </section>

      <section><h2>Privacy and deletion</h2>
        <p>The <a href="/privacy">AIM Privacy Policy</a> explains how information is used and shared. You can request deletion from within AIM or on the <a href="/delete-account">AIM account deletion page</a>. Deletion does not remove files you exported to Google Drive or cancel Google Play purchases.</p>
      </section>

      <section><h2>AIM ownership</h2>
        <p>AIM’s software, name, design, and materials belong to Awakened Minds Group Inc. or its licensors. We give you a personal, limited, non-transferable right to use AIM while these terms are in effect. You may not claim AIM’s brand or materials as your own.</p>
      </section>

      <section><h2>Availability and limits</h2>
        <p>We work to keep AIM available, but we cannot promise uninterrupted service or that every AI result will be available. To the extent allowed by law, AIM is provided “as is.” We are not responsible for indirect or unexpected losses caused by your use of AIM. Nothing in these terms limits rights or remedies that cannot legally be limited.</p>
      </section>

      <section><h2>Suspension, ending use, and changes</h2>
        <p>You may stop using AIM and request account deletion at any time. We may suspend or end access if needed to protect users, comply with law, or respond to misuse. We may update these terms by posting a new version here. Continued use after a change takes effect means you accept the updated terms.</p>
      </section>

      <section><h2>Contact</h2>
        <p>Questions about these terms can be sent to Awakened Minds Group Inc. at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </section>
    </LegalShell>
  );
}

export function AILimitedUseNotice({ onContinue, onSignOut }: { onContinue: () => void; onSignOut: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 px-4 py-8" role="dialog" aria-modal="true" aria-labelledby="aim-ai-notice-title">
      <section className="max-h-full w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl sm:p-8">
        <h1 id="aim-ai-notice-title" className="text-2xl font-bold text-white">A quick note about your information</h1>
        <div className="mt-4 space-y-3 text-sm leading-6 text-slate-200">
          <p>AIM sends the details you choose to share, and some saved plan information, to Google Gemini so it can make plans and answer you. This may include things about your health, money, work, relationships, or location.</p>
          <p>Google’s terms depend on whether AIM uses free or paid Gemini service. With free service, Google may use prompts and replies to improve its products, and human reviewers may review some content. With paid service, Google says it does not use prompts and replies to improve its products, but may keep them briefly for safety and legal reasons. AIM has not confirmed which billing mode is active, so please assume the free-service rules could apply.</p>
          <p>Do not enter passwords, account numbers, government ID numbers, or private details you would not want reviewed. Read the <a className="text-indigo-300 underline" href="/privacy">Privacy Policy</a> before you continue.</p>
          <p>By tapping “Agree and continue,” you agree that AIM can send the information you choose to share to Google Gemini for the AI features described above.</p>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button type="button" onClick={onSignOut} className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800">Sign out</button>
          <button type="button" onClick={onContinue} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500">Agree and continue</button>
        </div>
      </section>
    </div>
  );
}
