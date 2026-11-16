import type { DailyPlan, LifeUpdate, UserProfile } from '../types';

export type AIMPhase = 'awareness' | 'intention' | 'motion';

export interface AIMWisdomGuidance {
  awareness: {
    circumstance: string;
    reflection: string;
    confirmedPatterns: string[];
  };
  intention: {
    focus: string;
    reason: string;
  };
  motion: {
    nextAction: string;
    setup: string;
    timeboxMinutes: number;
    definitionOfDone: string;
  };
  adaptation: {
    summary: string;
    changes: string[];
    sourceUpdateId?: string;
    status: 'current' | 'recalibrating' | 'rerouted';
  };
  evolution: {
    phase: AIMPhase;
    revision: string;
    completedCount: number;
    totalCount: number;
    palette: 'lagoon' | 'amethyst' | 'ember' | 'forest';
    geometry: 'contours' | 'rings' | 'branches' | 'petals';
    density: number;
    motion: number;
    explanation: string;
  };
}

export interface AIMWisdomGuidanceInput {
  userProfile: UserProfile;
  dailyPlan: DailyPlan;
  lifeUpdates?: LifeUpdate[];
}

const clean = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : fallback;

const unique = (values: unknown[], limit = 4) =>
  Array.from(new Set(values.map((value) => clean(value)).filter(Boolean))).slice(0, limit);

const updateTime = (update: LifeUpdate) => {
  const timestamp = Date.parse(update.updatedAt || update.createdAt || '');
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const latestUpdate = (updates: LifeUpdate[]) =>
  [...updates].sort((a, b) => updateTime(b) - updateTime(a))[0];

const parseMinutes = (estimate: string | undefined) => {
  const text = clean(estimate).toLowerCase();
  const hours = Number(text.match(/(\d+(?:\.\d+)?)\s*(?:h|hour)/)?.[1] || 0);
  const minutes = Number(text.match(/(\d+)\s*(?:m|min)/)?.[1] || 0);
  const total = Math.round(hours * 60 + minutes);
  return total > 0 ? total : 15;
};

const stableRevision = (parts: unknown[]) => {
  const text = JSON.stringify(parts);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};

/**
 * Builds the visible Awareness–Intention–Motion loop only from saved user facts.
 * It deliberately does not infer emotions, diagnoses, wins, or behavioral patterns.
 */
export function buildAIMWisdomGuidance({
  userProfile,
  dailyPlan,
  lifeUpdates = [],
}: AIMWisdomGuidanceInput): AIMWisdomGuidance {
  const update = latestUpdate(lifeUpdates);
  const tasks = Array.isArray(dailyPlan.priorityTasks) ? dailyPlan.priorityTasks : [];
  const completed = tasks.filter((task) => task.completed);
  const pending = tasks.filter((task) => !task.completed);
  const nextTask = pending[0];
  const reflection = dailyPlan.eveningReflection;
  const confirmedPatterns = unique(reflection?.patternsIdentified || [], 3);
  const circumstanceFromUpdate = clean(update?.confirmedSummary) || clean(update?.originalContent);
  const circumstance = circumstanceFromUpdate
    || clean(userProfile.primaryObstacle)
    || clean(dailyPlan.notes)
    || `Energy is ${Math.max(1, Math.min(10, dailyPlan.energyLevel || 1))}/10 with ${Math.max(0, dailyPlan.availableHours || 0)} hours available.`;

  const reflectionText = clean(reflection?.userNotes)
    || clean(reflection?.summary)
    || (confirmedPatterns.length > 0
      ? `A confirmed reflection noted: ${confirmedPatterns[0]}`
      : 'No reflection pattern has been confirmed yet. AIM will not guess one.');

  const focus = clean(update?.newTopPriority)
    || clean(nextTask?.task)
    || clean(dailyPlan.theme)
    || clean(userProfile.coreMission)
    || clean(userProfile.desiredIdentity)
    || 'Choose one useful priority for today.';

  const reason = update?.newTopPriority
    ? 'This is the priority saved with the latest life update and reroute.'
    : nextTask
      ? `This is the first unfinished item in the saved plan${dailyPlan.theme ? ` for “${clean(dailyPlan.theme)}”` : ''}.`
      : completed.length > 0
        ? 'The saved priorities are complete, so the next intention should come from reflection rather than invented work.'
        : `This direction comes from the saved mission: ${clean(userProfile.coreMission) || clean(userProfile.desiredIdentity) || 'define what matters next'}.`;

  const requestedMinutes = parseMinutes(nextTask?.timeEstimate);
  const energy = Math.max(1, Math.min(10, dailyPlan.energyLevel || 1));
  const timeboxMinutes = Math.max(5, Math.min(requestedMinutes, energy <= 4 ? 15 : energy <= 6 ? 25 : 45));
  const nextAction = clean(update?.nextSpecificAction) || clean(nextTask?.task) || 'Review what changed and choose the next concrete step.';
  const setup = clean(nextTask?.description)
    || (nextTask
      ? `Open the materials for “${clean(nextTask.task)},” remove unrelated tabs or notifications, and begin the first visible step.`
      : 'Open Today’s Plan, compare it with your current circumstances, and add one specific action only if it is still realistic.');
  const definitionOfDone = nextTask
    ? `Complete the saved task “${clean(nextTask.task)}” or record the exact blocker before the timebox ends.`
    : 'The next action is named, time-bounded, and saved without inventing extra commitments.';

  const needsRecalibration = Boolean(update && ['pending', 'failed'].includes(update.rerouteStatus));
  const wasRerouted = Boolean(update?.rerouteStatus === 'rerouted');
  const adaptationChanges = unique([
    ...(update?.whatChanged || []),
    ...(update?.whatWasRemovedOrPaused || []).map((item) => `Paused or removed: ${clean(item)}`),
  ], 4);
  const adaptationSummary = update
    ? needsRecalibration
      ? `AIM is holding the current plan steady while it recalibrates around: ${circumstanceFromUpdate || 'the latest life update'}.`
      : wasRerouted
        ? clean(update.rerouteExplanation) || `The plan was rerouted around: ${circumstanceFromUpdate || 'the latest life update'}.`
        : `The latest life update is recorded. Unaffected priorities remain in place: ${circumstanceFromUpdate || 'no additional summary was saved'}.`
    : 'When life changes, AIM returns to Awareness, checks which assumptions changed, and adjusts only the affected parts of the plan.';

  let phase: AIMPhase;
  let palette: AIMWisdomGuidance['evolution']['palette'];
  let geometry: AIMWisdomGuidance['evolution']['geometry'];
  let explanation: string;
  if (needsRecalibration || tasks.length === 0 || (tasks.length > 0 && completed.length === tasks.length)) {
    phase = 'awareness';
    palette = needsRecalibration ? 'lagoon' : tasks.length > 0 && completed.length === tasks.length ? 'forest' : 'lagoon';
    geometry = needsRecalibration ? 'contours' : tasks.length > 0 && completed.length === tasks.length ? 'petals' : 'contours';
    explanation = needsRecalibration
      ? 'A new circumstance moved the loop back to Awareness before the plan changes.'
      : tasks.length > 0
        ? 'The saved priorities are complete, so the pattern opens into reflection.'
        : 'The pattern stays open while AIM gathers enough real context to choose a direction.';
  } else if (completed.length === 0) {
    phase = 'intention';
    palette = 'amethyst';
    geometry = 'rings';
    explanation = 'The plan has a direction; the atmosphere centers on the first realistic commitment.';
  } else {
    phase = 'motion';
    palette = 'ember';
    geometry = 'branches';
    explanation = 'Completed work adds branches while the next unfinished priority stays visible.';
  }

  return {
    awareness: { circumstance, reflection: reflectionText, confirmedPatterns },
    intention: { focus, reason },
    motion: { nextAction, setup, timeboxMinutes, definitionOfDone },
    adaptation: {
      summary: adaptationSummary,
      changes: adaptationChanges,
      sourceUpdateId: update?.id,
      status: needsRecalibration ? 'recalibrating' : wasRerouted ? 'rerouted' : 'current',
    },
    evolution: {
      phase,
      revision: stableRevision([
        dailyPlan.date,
        tasks.map((task) => [task.id, task.completed]),
        reflection?.summary,
        confirmedPatterns,
        update && [update.id, update.updatedAt, update.rerouteStatus, update.newTopPriority],
      ]),
      completedCount: completed.length,
      totalCount: tasks.length,
      palette,
      geometry,
      density: Math.max(2, Math.min(7, 2 + completed.length + Math.min(lifeUpdates.length, 2))),
      motion: phase === 'motion' ? Math.max(1, Math.min(5, pending.length)) : phase === 'intention' ? 1 : 0,
      explanation,
    },
  };
}
