import { afterEach, describe, expect, it, vi } from 'vitest';
import { chooseOnboardingDraft, createDraftWriter, getOnboardingStep, persistGuideAdvance } from '../src/services/onboardingRecovery';

const draft = { currentState: 'Variable shifts', desiredState: 'Finish three demos', changeState: 'Protect creative time', updatedAt: 10 };
afterEach(() => vi.useRealTimers());

describe('onboarding recovery', () => {
  it('resumes at the goal/retry screen when both answers exist but generation failed', () => {
    expect(getOnboardingStep(false, draft)).toBe('who_do_you_wanna_be');
    expect(getOnboardingStep(false, { ...draft, desiredState: '' })).toBe('who_do_you_wanna_be');
    expect(getOnboardingStep(false, null)).toBe('tell_about_yourself');
    expect(getOnboardingStep(false, { ...draft, result: { pathways: [{}] } })).toBe('pathway_selection');
    expect(getOnboardingStep(true, draft)).toBe('active_os');
  });
  it('keeps a partial first answer on question one and restores Back navigation', () => {
    expect(getOnboardingStep(false, { ...draft, step: 'tell_about_yourself' })).toBe('tell_about_yourself');
    expect(getOnboardingStep(false, { ...draft, step: 'what_to_change' })).toBe('what_to_change');
    expect(getOnboardingStep(false, { currentState: 'Old answer', desiredState: 'Old goal' })).toBe('what_to_change');
  });
  it('retries a hung draft save rather than waiting forever behind it', async () => {
    vi.useFakeTimers();
    const save = vi.fn().mockImplementationOnce(() => new Promise(() => {})).mockResolvedValue(undefined);
    const write = createDraftWriter(save, 10);
    const first = expect(write(draft)).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(10);
    await first;
    await write({ ...draft, updatedAt: 20 });
    expect(save).toHaveBeenCalledTimes(2);
  });
  it('recovers the account draft on a new device, preserving newer unsynced local edits', () => {
    expect(chooseOnboardingDraft(null, draft)).toEqual(draft);
    const newer = { ...draft, desiredState: 'A changed goal', updatedAt: 20 };
    expect(chooseOnboardingDraft(newer, draft)).toEqual(newer);
    expect(chooseOnboardingDraft(draft, newer)).toEqual(newer);
    expect(chooseOnboardingDraft(draft, null)).toEqual(draft);
  });
  it('serializes writes and allows retry after a failed save', async () => {
    let rejectFirst!: (error: Error) => void;
    const save = vi.fn().mockImplementationOnce(() => new Promise((_, reject) => { rejectFirst = reject; }))
      .mockResolvedValue(undefined);
    const write = createDraftWriter(save);
    const first = write(draft);
    const failed = expect(first).rejects.toThrow('offline');
    const second = write({ ...draft, desiredState: 'Latest answer' });
    await Promise.resolve(); await Promise.resolve();
    expect(save).toHaveBeenCalledTimes(1);
    rejectFirst(new Error('offline'));
    await failed;
    await second;
    expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ desiredState: 'Latest answer' }));
  });
});

describe('guide progress', () => {
  it('does not advance or change cached state until the remote save succeeds', async () => {
    let resolve!: () => void;
    const save = vi.fn(() => new Promise<void>((done) => { resolve = done; }));
    const apply = vi.fn();
    const pending = persistGuideAdvance('intro', save, apply);
    expect(save).toHaveBeenCalledWith('planner');
    expect(apply).not.toHaveBeenCalled();
    resolve(); await pending;
    expect(apply).toHaveBeenCalledWith('planner');
  });
  it('leaves the guide in place after failure and allows the same step to retry', async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
    const apply = vi.fn();
    await expect(persistGuideAdvance('planner', save, apply)).rejects.toThrow('offline');
    expect(apply).not.toHaveBeenCalled();
    await persistGuideAdvance('planner', save, apply);
    expect(apply).toHaveBeenCalledExactlyOnceWith('check-in');
  });
  it('times out an offline save without advancing even if the write completes later', async () => {
    vi.useFakeTimers();
    let resolve!: () => void;
    const save = () => new Promise<void>((done) => { resolve = done; });
    const apply = vi.fn();
    const pending = persistGuideAdvance('check-in', save, apply);
    const failure = expect(pending).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(15000);
    await failure;
    resolve(); await Promise.resolve();
    expect(apply).not.toHaveBeenCalled();
    await persistGuideAdvance('check-in', async () => {}, apply);
    expect(apply).toHaveBeenCalledWith('done');
  });
});
