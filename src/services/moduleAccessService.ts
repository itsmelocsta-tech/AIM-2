import { AIMProject, DailyPlan, Goal, MemoryItem, PersonalOperatingContext, UserProfile, WellnessLog } from '../types';

export type AimModuleId = 'home' | 'scanner' | 'projects' | 'check-in' | 'history' | 'settings' | 'planner' | 'goals' | 'memory' | 'wellness' | 'chat';

interface ModuleAccessInput {
  profile: UserProfile;
  calibrationText?: string;
  context: PersonalOperatingContext;
  projects: AIMProject[];
  goals: Goal[];
  memories: MemoryItem[];
  dailyPlan: DailyPlan;
  wellnessLogs: WellnessLog[];
}

const includesAny = (text: string, terms: string[]) => terms.some((term) => text.includes(term));

/** Build navigation from the user's answers and saved state, never demo data. */
export function getUnlockedModules(input: ModuleAccessInput): Set<AimModuleId> {
  if (!input.profile.onboardingCompleted) return new Set<AimModuleId>(['home']);

  const text = [input.calibrationText || '', input.profile.desiredIdentity, input.profile.coreMission, input.profile.primaryObstacle, input.profile.ninetyDayTrajectory, ...input.profile.topSkills, ...input.profile.coreValues].join(' ').toLowerCase();
  const modules = new Set<AimModuleId>(['home', 'check-in', 'settings', 'chat']);

  if (input.dailyPlan.priorityTasks.length > 0 || input.dailyPlan.timeBlocks.length > 0) modules.add('planner');
  if (input.goals.length > 0) modules.add('goals');
  if (input.memories.length > 0) modules.add('memory');
  if (input.projects.length > 0 || includesAny(text, ['project', 'business', 'album', 'film', 'book', 'app', 'launch', 'build', 'create'])) modules.add('projects');
  if (includesAny(text, ['job', 'work', 'career', 'income', 'employment', 'client', 'money', 'revenue', 'opportunity']) || input.context.workPreferences.incomeUrgency === 'immediate') modules.add('scanner');
  if (input.wellnessLogs.length > 0 || includesAny(text, ['health', 'sleep', 'stress', 'energy', 'exercise', 'workout', 'nutrition', 'meal', 'weight', 'wellness'])) modules.add('wellness');
  if (input.context.auditLog.length > 0) modules.add('history');
  return modules;
}
