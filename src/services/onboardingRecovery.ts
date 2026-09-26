import { OnboardingDraft } from './storage';

export function chooseOnboardingDraft(local: OnboardingDraft | null, remote: OnboardingDraft | null) {
  if (!local) return remote;
  if (!remote) return local;
  return (local.updatedAt ?? 0) >= (remote.updatedAt ?? 0) ? local : remote;
}

export function getOnboardingStep(completed: boolean | undefined, draft: OnboardingDraft | null) {
  if (completed) return 'active_os' as const;
  if (!draft) return 'tell_about_yourself' as const;
  // Old two-answer drafts must collect the missing change answer first.
  if (!draft.changeState?.trim()) {
    if (draft.step === 'tell_about_yourself' || !draft.currentState.trim()) return 'tell_about_yourself' as const;
    return 'what_to_change' as const;
  }
  if (draft.step === 'tell_about_yourself' || draft.step === 'what_to_change') return draft.step;
  if (draft.result) return 'pathway_selection' as const;
  return 'who_do_you_wanna_be' as const;
}

// Keep rapid edits ordered, including when an earlier request fails.
export function createDraftWriter(save: (draft: OnboardingDraft) => Promise<void>, timeoutMs = 15000) {
  let pending = Promise.resolve();
  return (draft: OnboardingDraft) => {
    pending = pending.catch(() => {}).then(() => withSaveTimeout(save(draft), timeoutMs));
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
