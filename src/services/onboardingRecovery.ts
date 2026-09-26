import { OnboardingDraft } from './storage';

export function chooseOnboardingDraft(local: OnboardingDraft | null, remote: OnboardingDraft | null) {
  if (!local) return remote;
  if (!remote) return local;
  return (local.updatedAt ?? 0) >= (remote.updatedAt ?? 0) ? local : remote;
}

export function getOnboardingStep(completed: boolean | undefined, draft: OnboardingDraft | null) {
  if (completed) return 'active_os' as const;
  if (draft?.result) return 'pathway_selection' as const;
  if (draft?.currentState.trim()) return 'who_do_you_wanna_be' as const;
  return 'tell_about_yourself' as const;
}

// Keep rapid edits ordered, including when an earlier request fails.
export function createDraftWriter(save: (draft: OnboardingDraft) => Promise<void>) {
  let pending = Promise.resolve();
  return (draft: OnboardingDraft) => {
    pending = pending.catch(() => {}).then(() => save(draft));
    return pending;
  };
}

export async function withSaveTimeout<T>(save: Promise<T>, timeoutMs = 15000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([save, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Saving timed out. Please retry.')), timeoutMs);
    })]);
  } finally {
    clearTimeout(timer);
  }
}

export async function persistGuideAdvance(
  step: 'intro' | 'planner' | 'check-in',
  save: (next: 'planner' | 'check-in' | 'done') => Promise<void>,
  apply: (next: 'planner' | 'check-in' | 'done') => void,
) {
  const next = step === 'intro' ? 'planner' : step === 'planner' ? 'check-in' : 'done';
  await withSaveTimeout(save(next));
  apply(next);
}
