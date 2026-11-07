/** Lightweight, deterministic specialist routing. No additional model calls. */
export type Specialist = 'planner' | 'wellness' | 'finance' | 'relationships' | 'growth';
const rules: Record<Specialist, RegExp> = {
  planner: /\b(schedule|calendar|remind|deadline|appointment|plan my day|to.do list|prioriti[sz]e)\b/i,
  wellness: /\b(sleep|stress|anxious|exercise|workout|nutrition|burnout|exhausted)\b/i,
  finance: /\b(budget|bills?|debt|income|money|job|employment|rent|savings)\b/i,
  relationships: /\b(partner|relationship|argument|friendship|family conflict|boundar(?:y|ies))\b/i,
  growth: /\b(procrastinat|habit|motivat|confidence|self.improv|personal growth)\b/i,
};
const guidance: Record<Specialist,string> = {
  planner: 'Planner: propose at most three concrete actions with realistic timing; do not claim calendar events were created.',
  wellness: 'Wellness: offer practical non-diagnostic support; avoid medical claims and consider professional help where appropriate.',
  finance: 'Finance: distinguish verified facts from possibilities; do not invent job listings, prices or financial outcomes.',
  relationships: 'Relationships: distinguish observations from assumptions; support respectful communication and boundaries.',
  growth: 'Growth: translate reflection into one measurable, manageable action without motivational clichés.',
};
export function selectSpecialists(message: unknown, max = 2): Specialist[] {
  if (typeof message !== 'string') return [];
  return (Object.keys(rules) as Specialist[]).filter(key => rules[key].test(message)).slice(0,max);
}
export function specialistInstruction(message: unknown): string {
  const selected = selectSpecialists(message);
  return selected.length ? 'Relevant specialist guidance (one response; no autonomous actions):\n' + selected.map(k=>guidance[k]).join('\n') : '';
}
