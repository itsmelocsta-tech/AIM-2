import { AIMProject, ChatMessage, CoachId, DailyPlan, Goal, LifeUpdate, MemoryItem, PersonalOperatingContext, UserProfile, WellnessLog } from '../types';
import { normalizeSpaces, spacesMentionedIn, userDisclosureText } from './contextualNavigationService';

export type AimModuleId = 'home' | 'scanner' | 'projects' | 'check-in' | 'history' | 'settings' | 'planner' | 'goals' | 'memory' | 'wellness' | 'chat' | 'relationships' | 'life-update';

export interface ModuleAccessInput {
  profile: UserProfile;
  calibrationText?: string;
  context: PersonalOperatingContext;
  projects: AIMProject[];
  goals: Goal[];
  memories: MemoryItem[];
  dailyPlan: DailyPlan;
  wellnessLogs: WellnessLog[];
  chatMessages?: ChatMessage[];
  lifeUpdates?: LifeUpdate[];
}

export function getRevealedSpaces(input: ModuleAccessInput) {
  return normalizeSpaces([...normalizeSpaces(input.profile.contextualSpaces), ...spacesMentionedIn(userDisclosureText({ ...input, userId: input.profile.id }))]);
}

/** Build navigation from the user's answers and saved state, never demo data. */
export function getUnlockedModules(input: ModuleAccessInput): Set<AimModuleId> {
  if (!input.profile.onboardingCompleted) return new Set<AimModuleId>(['home']);

  const spaces = new Set(getRevealedSpaces(input));
  const modules = new Set<AimModuleId>(['home', 'planner', 'check-in', 'settings', 'chat', 'life-update']);

  for (const id of ['scanner', 'projects', 'goals', 'memory', 'history', 'wellness', 'relationships'] as const) {
    if (spaces.has(id)) modules.add(id);
  }
  // A user who already saved their own opportunity focus can still return to it.
  if (input.context.opportunityFocus) modules.add('scanner');
  return modules;
}

export function getRevealedCoaches(input: ModuleAccessInput): CoachId[] {
  if (!input.profile.onboardingCompleted) return ['guidance'];
  const spaces = new Set(getRevealedSpaces(input));
  return ['guidance', ...(spaces.has('wellness') ? ['health'] : []),
    ...(['relationships', 'motivation', 'spiritual'] as const).filter(id => spaces.has(id))] as CoachId[];
}
