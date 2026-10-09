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
  currentDailyPlan: { availableHours?: number },
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
  analysis.proposedReroute = proposal;
}
