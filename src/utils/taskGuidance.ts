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
    return `1. Drink 500ml of water immediately to rehydrate after sleep.
2. Complete 5–10 minutes of light dynamic mobility (neck rolls, thoracic rotations, hip openers) with natural outdoor sunlight exposure.
3. Open AIM to review today's top 3 priority tasks and define your single non-negotiable breakthrough outcome.
4. Record a 1-sentence grounding intention before opening notifications, inbox, or social feeds.`;
  }

  // 2. Deep Work / Core Deliverable / Coding / Writing / Building
  if (/deep work|deliverable|sprint|core project|strategic asset|code|coding|build|draft|writing|proposal/i.test(combined)) {
    return `1. Close all communication apps (Slack, Discord, Email) and place your phone on silent in another room.
2. Open the single project file or editor needed and set an uninterrupted 90-minute timer.
3. Focus exclusively on producing concrete output (draft the document, write the core module, or design the asset) without context switching.
4. Stop promptly at the timer, save your progress, and log your milestone in AIM before taking a 5-minute breathing break.`;
  }

  // 3. Vitality / Lunch / Nourishment / Walk / Break
  if (/vitality|nourish|lunch|meal|nourishment|decompression|break|recharge|walk/i.test(combined)) {
    return `1. Fully step away from your computer screen, workstation, and phone.
2. Eat a balanced whole-food meal with clean protein, complex carbohydrates, and water to sustain cognitive focus.
3. Take a brisk 15–20 minute outdoor walk in fresh air without listening to work calls or checking email.
4. Practice 3 minutes of slow diaphragmatic nasal breathing (4s inhale, 6s exhale) to downregulate cortisol and reset nervous system tone.`;
  }

  // 4. Outreach / Client Communication / Sales / Admin / Operations
  if (/outreach|communication|email|correspondence|sales|pitch|monetization|admin|operations/i.test(combined)) {
    return `1. Open your pipeline and review the top 3 prospective clients or collaborators.
2. Craft and dispatch 3 personalized messages offering a concrete solution to their primary bottleneck with a clear booking link.
3. Process pending operational emails and correspondence in a focused 30-minute batch window.
4. Verify tomorrow's calendar appointments and clear any pending scheduling blockers.`;
  }

  // 5. Evening Review / Reflection / Calibration / Memory Vault / Bedtime
  if (/evening|reflection|calibration|wins review|memory vault|journal|review accomplishments|night|wind down/i.test(combined)) {
    return `1. Review today's schedule items in AIM: mark completed tasks and migrate unfinished items to tomorrow without self-criticism.
2. Open the Memory Vault to record 2 specific wins and 1 key lesson or insight learned from today's execution.
3. Identify the single first physical task you will tackle tomorrow morning, prepare the required tabs or materials, and tidy your workspace so you wake up to zero starting friction.`;
  }

  // 6. Workout / Exercise / Movement / Fitness / Gym / Cardio / Strength
  if (/workout|exercise|fitness|movement|gym|run|strength|cardio|training|mobility/i.test(combined)) {
    return `1. Fill your water bottle and spend 5 minutes doing dynamic warm-up movements (jumping jacks, arm circles, leg swings).
2. Execute your scheduled 30–45 minute training session focusing on proper form, controlled tempo, and progressive intensity.
3. Spend 5–10 minutes performing static cool-down stretches focusing on tight muscle groups.
4. Rehydrate with water and electrolytes, and record your completed workout in AIM.`;
  }

  // 7. Reading / Learning / Study / Research
  if (/read|study|learn|course|research|book/i.test(combined)) {
    return `1. Eliminate distractions: silence your phone and open only your reading material or course module.
2. Read or study actively for 45 minutes, taking concise bullet-point notes on key concepts and actionable ideas.
3. Write down 1 practical way to apply what you just learned to your current active goals.
4. Log the key insight into AIM's Memory Vault for long-term retention.`;
  }

  // 8. Default Actionable 3-Step Plan for Any Other Task
  const taskName = title.trim() || 'this task';
  return `1. Setup: Close background distractions, open the specific files, tools, or physical items required for "${taskName}", and set a 45-minute focus timer.
2. Execution: Work through the primary action step systematically without multitasking or switching tabs until the timer rings.
3. Definition of Done: Review your work for completeness and accuracy, save or submit your deliverable, and check off "${taskName}" in AIM.`;
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
