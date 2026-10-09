const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20,
};

/** Read only explicit availability statements; incidental hour mentions are ignored. */
export function extractExplicitAvailableHours(content: string): number | null {
  const match = content.match(/\b(?:i\s+(?:only\s+)?have|my\s+available\s+time\s+is|available\s+time\s+is)\s+(\d{1,2}|[a-z]+)\s+(?:productive\s+)?hours?\b/i);
  if (!match) return null;
  const token = match[1].toLowerCase();
  const hours = /^\d+$/.test(token) ? Number(token) : NUMBER_WORDS[token];
  return Number.isInteger(hours) && hours >= 0 && hours <= 24 ? hours : null;
}

/** Preserve a user-stated time budget when the model omits its structured field. */
export function applyExplicitAvailableHours(
  analysis: Record<string, any>,
  content: string,
  currentDailyPlan: { availableHours?: number; timeBlocks?: Array<{ id: string; time: string; completed?: boolean }> },
): void {
  const hours = extractExplicitAvailableHours(content);
  if (hours === null || hours === currentDailyPlan.availableHours) return;

  analysis.affectedGoalIds ??= [];
  analysis.affectedTaskIds ??= [];
  analysis.affectedTimeBlockIds ??= [];
  analysis.planImpact = analysis.planImpact === 'major' || analysis.planImpact === 'critical' ? 'major' : 'minor';

  const proposal = analysis.proposedReroute && typeof analysis.proposedReroute === 'object'
    ? analysis.proposedReroute
    : {};
  proposal.updatedPlanFields = { ...(proposal.updatedPlanFields || {}), availableHours: hours };
  proposal.suggestedPriorityTasks ??= [];
  proposal.suggestedTimeBlocks ??= [];
  proposal.whatChanged ??= [];
  const summary = `Available time updated to ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  if (!proposal.whatChanged.includes(summary)) proposal.whatChanged.push(summary);

  const currentBlocks = Array.isArray(currentDailyPlan.timeBlocks) ? currentDailyPlan.timeBlocks : [];
  const removed = new Set<string>(Array.isArray(proposal.removedTimeBlockIds) ? proposal.removedTimeBlockIds : []);
  const affected = new Set<string>(Array.isArray(analysis.affectedTimeBlockIds) ? analysis.affectedTimeBlockIds : []);
  const proposedBlocks = Array.isArray(proposal.suggestedTimeBlocks) ? proposal.suggestedTimeBlocks : [];
  const proposedById = new Map(proposedBlocks.filter((block: any) => affected.has(block?.id)).map((block: any) => [block.id, block]));
  const currentIds = new Set(currentBlocks.map(block => block.id));

  const durationMinutes = (range: string): number | null => {
    const parseClock = (value: string): number | null => {
      const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
      if (!match) return null;
      let hour = Number(match[1]);
      const minute = Number(match[2] || 0);
      if (minute > 59 || hour > (match[3] ? 12 : 23) || (match[3] && hour < 1)) return null;
      if (match[3]) hour = hour % 12 + (match[3].toLowerCase() === 'pm' ? 12 : 0);
      return hour * 60 + minute;
    };
    const parts = range.split(/\s*[-–—]\s*/);
    if (parts.length !== 2) return null;
    const start = parseClock(parts[0]), end = parseClock(parts[1]);
    if (start === null || end === null) return null;
    return end > start ? end - start : end - start + 1440;
  };

  const pending: Array<{ id: string; duration: number; isNew: boolean }> = [];
  for (const block of currentBlocks) {
    if (block.completed || removed.has(block.id)) continue;
    const replacement = proposedById.get(block.id) as { time?: string } | undefined;
    const duration = durationMinutes(replacement?.time || block.time) ?? hours * 60 + 1;
    pending.push({ id: block.id, duration, isNew: false });
  }
  for (const block of proposedBlocks) {
    if (!block?.id || currentIds.has(block.id) || removed.has(block.id)) continue;
    const duration = durationMinutes(block.time || '') ?? hours * 60 + 1;
    pending.push({ id: block.id, duration, isNew: true });
  }

  let scheduledMinutes = pending.reduce((sum, block) => sum + block.duration, 0);
  for (const block of pending.slice().reverse()) {
    if (scheduledMinutes <= hours * 60) break;
    scheduledMinutes -= block.duration;
    if (block.isNew) {
      proposal.suggestedTimeBlocks = proposal.suggestedTimeBlocks.filter((item: any) => item?.id !== block.id);
    } else {
      removed.add(block.id);
      affected.add(block.id);
    }
  }
  if (removed.size) proposal.removedTimeBlockIds = [...removed];
  if (affected.size) analysis.affectedTimeBlockIds = [...affected];
  analysis.proposedReroute = proposal;
}
