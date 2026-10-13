import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { AILimitedUseNotice, PrivacyPolicyPage, TermsOfUsePage } from '../src/components/legal/LegalPages';

it('publishes a public privacy page with AI, wellness, provider, and deletion disclosures', () => {
  const html = renderToStaticMarkup(<PrivacyPolicyPage />);
  expect(html).toContain('AIM Privacy Policy');
  expect(html).toContain('Google Gemini');
  expect(html).toContain('sleep, food, movement, energy, stress');
  expect(html).toContain('Google says it may use prompts and answers from unpaid service');
  expect(html).toContain('href="/delete-account"');
  expect(html).toContain('franciscohilburn04@gmail.com');
});

it('publishes terms with clear AI and wellness limits', () => {
  const html = renderToStaticMarkup(<TermsOfUsePage />);
  expect(html).toContain('AIM Terms of Use');
  expect(html).toContain('they do not diagnose, treat, cure, or prevent');
  expect(html).toContain('Deleting your AIM account does not cancel a subscription');
});

it('requires an affirmative choice before the AI disclosure can be accepted', () => {
  const html = renderToStaticMarkup(<AILimitedUseNotice onContinue={() => {}} onSignOut={() => {}} />);
  expect(html).toContain('aria-modal="true"');
  expect(html).toContain('By tapping “Agree and continue,” you agree');
  expect(html).toContain('Agree and continue');
  expect(html).toContain('Sign out');
});
