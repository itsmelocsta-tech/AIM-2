import type { CrossReferenceResult } from '../types';

// Only rename AIM's shipped labels. Leave custom titles, user answers and task details alone.
const oldLabels: Record<string, string> = {
  'Rapid Momentum & Quick-Win Sprint': 'Start Small',
  'Systematic Foundation & Compounding Engine': 'Build a Routine',
  'Total Identity Shift & Bold Leap': 'Make a Bigger Change',
  'Immediate high-leverage action to break inertia and generate fast proof in 7 days': 'Take a few simple steps to get started this week.',
  'Restructure daily rhythms, core skills, and repeatable systems for sustainable growth': 'Make steady progress with a routine you can keep.',
  'High-conviction transformation: cutting low-leverage anchors and stepping directly into the target standard': 'Put more time and effort into one important change.',
  'Fast / Immediate': 'A few small steps',
  'Balanced & Scalable': 'A steady pace',
  'Intensive & Transformative': 'More time and effort',
};
export function plainPlanLabel(text: string): string {
  return Object.prototype.hasOwnProperty.call(oldLabels, text) ? oldLabels[text] : text;
}
export function plainPlanOptions(result: CrossReferenceResult | null): CrossReferenceResult | null {
  if (!result) return result;
  return { ...result, pathways: result.pathways.map(option => ({
    ...option, title: plainPlanLabel(option.title), tagline: plainPlanLabel(option.tagline), pace: plainPlanLabel(option.pace),
  })) };
}
