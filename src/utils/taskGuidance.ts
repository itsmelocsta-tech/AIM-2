/**
 * Task Guidance Utility for AIM Life Operating System
 *
 * Enforces the core principle: "On all daily tasks give a detailed description
 * of what the user should do. Never give vague guidance."
 */

const VAGUE_PHRASES = [
  'hydration, light movement',
  'uninterrupted focus on primary breakthrough',
  'healthy meal, outdoor walking',
  'client outreach, administrative actions',
  'review accomplishments, log insights',
  'work on core goals',
  'deep work session',
  'focused implementation',
  'direct execution on primary objective',
  'focus on priorities',
  'core asset building',
  'strategy, coordination & review',
  'movement & energy recharge',
  'evening alignment & wins review',
  'review trajectory and momentum',
  'cardio / strength session',
  'high leverage task 1',
  'send proposals and follow-ups',
  'deliverable building',
  'decompress and recharge',
  'log wins in aim',
  'focus session',
];

/**
 * Detects if existing text is missing or contains vague placeholder guidance.
 */
export function isVagueGuidance(text?: string | null): boolean {
  if (!text || text.trim().length === 0) return true;
  const trimmed = text.trim();
  if (trimmed.length < 50 && !trimmed.includes('1.')) return true;

  const lower = trimmed.toLowerCase();
  for (const phrase of VAGUE_PHRASES) {
    if (lower.includes(phrase) && trimmed.length < 130) {
      return true;
    }
  }
  return false;
}

/**
 * Returns a rich, detailed, non-vague description of what the user should do.
 * If the current description is already sufficiently detailed, it preserves it.
 */
export function ensureDetailedTaskGuidance(title: string, currentDesc?: string | null): string {
  // If current description is already rich and multi-step (>120 chars with numbered steps or clear detail)
  if (currentDesc && !isVagueGuidance(currentDesc)) {
    return currentDesc.trim();
  }

  const combined = (title + ' ' + (currentDesc || '')).toLowerCase();

  // 1. Morning Routine / Grounding / Waking up
  if (/morning|alignment|grounding routine|wake up|start day|morning power/i.test(combined)) {
    return `1. Drink a glass of water after you wake up.
2. Move and stretch gently for 5 to 10 minutes. Get some daylight if you can.
3. Open AIM and look at your three main tasks. Pick the one that matters most today.
4. Write one sentence about how you want today to go before checking your phone.`;
  }

  // 2. Deep Work / Core Deliverable / Coding / Writing / Building
  if (/deep work|deliverable|sprint|core project|strategic asset|code|coding|build|draft|writing|proposal/i.test(combined)) {
    return `1. Close your message apps and put your phone on silent.
2. Open what you need for your main task. Set a timer for 90 minutes.
3. Work on one thing, such as writing a page, making a design, or building part of your project.
4. When the timer ends, save your work and note what you finished in AIM. Take a five-minute break.`;
  }

  // 3. Vitality / Lunch / Nourishment / Walk / Break
  if (/vitality|nourish|lunch|meal|nourishment|decompression|break|recharge|walk/i.test(combined)) {
    return `1. Step away from your screen and put your phone down.
2. Eat a balanced meal with some protein, such as beans, eggs, or meat. Drink water.
3. Try a 15 to 20 minute walk outside without work calls or email.
4. Breathe slowly for three minutes. Try breathing in for four seconds and out for six.`;
  }

  // 4. Outreach / Client Communication / Sales / Admin / Operations
  if (/outreach|communication|email|correspondence|sales|pitch|monetization|admin|operations/i.test(combined)) {
    return `1. Look at three people you want to contact about work or a project.
2. Send each person a short, personal message about how you can help. Give them a clear next step.
3. Set aside 30 minutes to answer work messages and handle bills or other paperwork.
4. Check tomorrow’s meetings and fix any timing problems.`;
  }

  // 5. Evening Review / Reflection / Calibration / Memory Vault / Bedtime
  if (/evening|reflection|calibration|wins review|memory vault|journal|review accomplishments|night|wind down/i.test(combined)) {
    return `1. Look at your tasks in AIM. Check off what you finished and move unfinished tasks to tomorrow.
2. Save two things that went well and one thing you learned in your notes.
3. Pick your first task for tomorrow. Get what you need ready and clear your workspace.`;
  }

  // 6. Workout / Exercise / Movement / Fitness / Gym / Cardio / Strength
  if (/workout|exercise|fitness|movement|gym|run|strength|cardio|training|mobility/i.test(combined)) {
    return `1. Fill your water bottle. Warm up gently for five minutes with arm circles, leg swings, or easy movement.
2. Do your planned 30 to 45 minute workout. Move carefully at a pace that fits you.
3. Cool down with gentle stretches for 5 to 10 minutes.
4. Drink water and record your workout in AIM.`;
  }

  // 7. Reading / Learning / Study / Research
  if (/read|study|learn|course|research|book/i.test(combined)) {
    return `1. Put your phone on silent. Open your book, lesson, or study notes.
2. Read or study for 45 minutes. Write short notes about the main ideas.
3. Write down one way to use what you learned toward your goal.
4. Save that idea in your AIM notes.`;
  }

  // 8. Default Actionable 3-Step Plan for Any Other Task
  const taskName = title.trim() || 'this task';
  return `1. Get ready: Put distractions aside. Gather what you need for "${taskName}" and set a 45-minute timer.
2. Get started: Work on one part of the task until the timer rings. Try to avoid switching between tasks.
3. Finish up: Check your work, save or send it, and mark "${taskName}" done in AIM if you finished.`;
}

/**
 * Splits a detailed description into clean displayable steps or bullets
 */
export function parseTaskSteps(description?: string | null): string[] {
  if (!description) return [];
  const lines = description.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1) {
    return lines;
  }
  // Try splitting on numbered markers like "1. ", "2. "
  const parts = description.split(/(?=\d+\.\s)/g).map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1) {
    return parts;
  }
  return [description.trim()];
}
