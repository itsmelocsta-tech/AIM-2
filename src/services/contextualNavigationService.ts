import type { ChatMessage, ContextualSpace, LifeUpdate, MemoryItem } from '../types';

export const CONTEXTUAL_MENTION_EVENT = 'aim:user-context-mentioned';
const rules: Record<ContextualSpace, RegExp> = {
  wellness: /\b(health|wellness|sleep(?:ing)?|insomnia|stress(?:ed|ful)?|energy|exercise|exercising|workouts?|nutrition|meals?|weight|diet|pain|fitness|tired|anxiety|anxious|medication|doctor)\b/i,
  relationships: /\b(relationships?|friends?|friendship|dating|dates?|partner|marriage|married|spouse|wife|husband|girlfriend|boyfriend|family|breakup|divorce)\b/i,
  scanner: /\b(jobs?|work|career|income|employment|clients?|money|revenue|opportunit(?:y|ies)|funding|grants?)\b/i,
  projects: /\b(projects?|business|albums?|films?|books?|apps?|launch|build|create)\b/i,
  goals: /\b(goals?|milestones?|ambitions?)\b/i,
  memory: /\b(remember|memories|memory|notes?|files?|upload|documents?)\b/i,
  history: /\b(history|audit|previous check[ -]?ins?)\b/i,
  motivation: /\b(motivation|motivated|unmotivated|discouraged|procrastinat\w*|stuck)\b/i,
  spiritual: /\b(spiritual\w*|faith|prayer|meditat\w*)\b/i,
  atmosphere: /\b(fractals?|atmosphere|soundscapes?|ambient|visuals?)\b/i,
  'crystal-lab': /\b(photonics|optics|refractive|crystals?|optical simulation)\b/i,
};

export function normalizeSpaces(values: readonly unknown[] = []): ContextualSpace[] {
  return [...new Set(values.filter((value): value is ContextualSpace => typeof value === 'string' && Object.hasOwn(rules, value)))];
}

/** Lightweight topic hints, not a diagnosis or an assessment of a relationship. */
export function spacesMentionedIn(text: string): ContextualSpace[] {
  return (Object.keys(rules) as ContextualSpace[]).filter(space => rules[space].test(text));
}

/** The foundation also contains generated advice; only the user's original answers count. */
export function userDisclosureText(input: { calibrationText?: string; memories?: MemoryItem[]; chatMessages?: ChatMessage[]; lifeUpdates?: LifeUpdate[]; userId?: string }): string {
  return [input.calibrationText || '',
    ...(input.memories || []).filter(m => m.tags?.some(tag => ['alignment', 'quick-capture'].includes(tag)))
      .map(m => m.content.split(/\n\nCHOSEN PLAN:/i)[0]),
    ...(input.chatMessages || []).filter(m => m.role === 'user').map(m => m.content),
    ...(input.lifeUpdates || []).filter(update => update.userId === input.userId && update.userConfirmed)
      .map(update => update.originalContent || update.voiceTranscript || ''),
  ].join('\n');
}

/** Share topic IDs only; never put the conversation transcript into a browser event. */
export function publishUserMention(userId: string | undefined, text: string): void {
  if (!userId || typeof window === 'undefined') return;
  const spaces = spacesMentionedIn(text);
  if (spaces.length) window.dispatchEvent(new CustomEvent(CONTEXTUAL_MENTION_EVENT, { detail: { userId, spaces } }));
}
