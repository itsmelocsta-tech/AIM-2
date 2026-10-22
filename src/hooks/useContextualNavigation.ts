import { useEffect, useMemo, useRef, useState } from 'react';
import type { ContextualSpace, UserProfile } from '../types';
import { CONTEXTUAL_MENTION_EVENT, normalizeSpaces, publishUserMention } from '../services/contextualNavigationService';
import { getRevealedCoaches, getRevealedSpaces, getUnlockedModules, ModuleAccessInput } from '../services/moduleAccessService';

export function useContextualNavigation(input: ModuleAccessInput & { userId?: string; ready: boolean; onUpdateProfile: (profile: UserProfile) => void }) {
  const latest = useRef(input);
  latest.current = input;
  const [mentioned, setMentioned] = useState<{ owner?: string; spaces: ContextualSpace[] }>({ spaces: [] });
  useEffect(() => {
    const receive = (event: Event) => {
      const current = latest.current;
      const detail = (event as CustomEvent).detail;
      if (!current.ready || !current.profile.onboardingCompleted || !current.userId || current.profile.id !== current.userId || detail?.userId !== current.userId) return;
      const spaces = normalizeSpaces(Array.isArray(detail.spaces) ? detail.spaces : []);
      setMentioned(previous => ({ owner: current.userId, spaces: normalizeSpaces([...(previous.owner === current.userId ? previous.spaces : []), ...spaces]) }));
    };
    window.addEventListener(CONTEXTUAL_MENTION_EVENT, receive);
    return () => window.removeEventListener(CONTEXTUAL_MENTION_EVENT, receive);
  }, []);
  useEffect(() => {
    if (!input.ready || !input.profile.onboardingCompleted) setMentioned({ spaces: [] });
  }, [input.userId, input.ready, input.profile.onboardingCompleted]);

  const scopedInput = { ...input, profile: { ...input.profile, contextualSpaces: normalizeSpaces([
    ...normalizeSpaces(input.profile.contextualSpaces), ...(mentioned.owner === input.userId ? mentioned.spaces : []),
  ]) } };
  const spaces = getRevealedSpaces(scopedInput);
  const spaceKey = [...spaces].sort().join(',');
  const savedKey = normalizeSpaces(input.profile.contextualSpaces).sort().join(',');
  useEffect(() => {
    const current = latest.current;
    if (!current.ready || !current.profile.onboardingCompleted || current.profile.id !== current.userId || spaceKey === savedKey) return;
    current.onUpdateProfile({ ...current.profile, contextualSpaces: normalizeSpaces(spaceKey ? spaceKey.split(',') : []) });
  }, [input.userId, input.ready, input.profile.onboardingCompleted, spaceKey, savedKey]);

  const modulesKey = [...getUnlockedModules(scopedInput)].sort().join(',');
  const modules = useMemo(() => new Set(modulesKey.split(',')) as ReturnType<typeof getUnlockedModules>, [modulesKey]);
  return { modules, spaces, coaches: getRevealedCoaches(scopedInput), mention: (text: string) => publishUserMention(input.userId, text) };
}
