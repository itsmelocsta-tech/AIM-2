import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { AIMCoreWisdomEngine } from './server/wisdom/AIMCoreWisdomEngine';
import { AIMLifePriorityEngine } from './server/priority/AIMLifePriorityEngine';
import { AIMMomentumEngine } from './server/momentum/AIMMomentumEngine';
import { AIMSharedIntelligenceService } from './server/intelligence/AIMSharedIntelligenceService';
import { AIMVoiceService } from './server/voice/AIMVoiceService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Google GenAI Client
let genAIClient: GoogleGenAI | null = null;
const AIM_MODEL = 'gemini-3.7-flash';
const FALLBACK_MODELS = ['gemini-3.7-flash', 'gemini-2.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set in environment.');
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// Resilient helper to execute GenAI requests with immediate failover on high-demand 503s
async function generateWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    preferredModel?: string;
  }
): Promise<any> {
  const modelsToTry = [
    params.preferredModel || AIM_MODEL,
    ...FALLBACK_MODELS.filter((m) => m !== (params.preferredModel || AIM_MODEL)),
  ];

  let lastError: any = null;

  for (let mIdx = 0; mIdx < modelsToTry.length; mIdx++) {
    const model = modelsToTry[mIdx];
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      if (response && (response.text || response.candidates?.length)) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      const isHighDemand =
        errMsg.includes('503') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('high demand') ||
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('overloaded');

      const isNetworkTimeout = errMsg.includes('timeout') || errMsg.includes('ECONNRESET');

      // If high demand, instantly switch to next available model in the fallback chain without stalled delays
      if (isHighDemand && mIdx < modelsToTry.length - 1) {
        console.info(`[GenAI] Model ${model} under high demand; seamlessly switching to ${modelsToTry[mIdx + 1]}...`);
        continue;
      }

      // If network timeout on first attempt, brief backoff retry
      if (isNetworkTimeout) {
        try {
          await new Promise((r) => setTimeout(r, 750));
          const retryResponse = await ai.models.generateContent({
            model,
            contents: params.contents,
            config: params.config,
          });
          if (retryResponse && (retryResponse.text || retryResponse.candidates?.length)) {
            return retryResponse;
          }
        } catch (retryErr: any) {
          lastError = retryErr;
        }
      }
    }
  }

  throw lastError || new Error('All GenAI models failed to respond');
}

const AIM_SYSTEM_INSTRUCTION = `You are AIM (Artificial Intelligence for Manifestation), an AI-powered personal Life Operating System and thinking partner.

Your purpose is not simply to answer questions. Your purpose is to help the user organize their thoughts, understand their patterns, solve real-world problems, and take meaningful action toward the person they want to become.

CRITICAL CONVERSATIONAL DIRECTIVES:
1. GENUINE & REAL OVER QUOTES: NEVER recite cliché motivational quotes, proverbs, famous sayings, or canned aphorisms (e.g. do NOT say "As the ancient proverb goes...", "Remember that a journey of a thousand miles...", "Believe in yourself...", etc.). Speak in your own authentic, intelligent, grounded voice.
2. GROUNDED IN SAVED USER INFORMATION: You have access to the user's saved profile, active goals, memories, today's schedule, wellness status, and recent life updates below. Tailor your responses specifically and genuinely to THIS person's actual situation, goals, obstacles, and context.
3. CONVERSATIONAL & HUMAN: Speak naturally, warmly, like an insightful, empathetic thinking partner and trusted mentor sitting across the table. Be direct, clear, articulate, and supportive without being robotic or patronizing.
4. NO UNSOLICITED MONETIZATION / SALES TALK: Only bring up business frameworks, sales tactics, or monetization if the user explicitly asks about business, finances, income, or career monetization. Never force sales pitches on general life, spiritual, relationship, or wellness reflections.
5. ONE THOUGHTFUL FOLLOW-UP: End your response with ONE thoughtful, practical, reflective follow-up question or immediate next action to help the user move forward naturally.

Keep your response articulate, warm, and concise (typically 2-4 short paragraphs, ending with one clear, reflective follow-up question).`;

function buildUserSavedInformationPrompt(params: {
  userProfile?: any;
  goals?: any[];
  memories?: any[];
  dailyPlan?: any;
  wellnessLogs?: any[];
  lifeUpdates?: any[];
  currentSchedule?: any[];
}): string {
  const sections: string[] = [];

  // User Profile
  if (params.userProfile) {
    const p = params.userProfile;
    const profileParts: string[] = [];
    if (p.name) profileParts.push(`- Name: ${p.name}`);
    if (p.desiredIdentity) profileParts.push(`- Desired Identity / Trajectory: ${p.desiredIdentity}`);
    if (p.coreMission) profileParts.push(`- Core Life Mission: ${p.coreMission}`);
    if (p.primaryObstacle || p.currentObstacle) profileParts.push(`- Stated Primary Obstacle: ${p.primaryObstacle || p.currentObstacle}`);
    if (p.ninetyDayTrajectory) profileParts.push(`- 90-Day Trajectory: ${p.ninetyDayTrajectory}`);
    if (Array.isArray(p.coreValues) && p.coreValues.length > 0) profileParts.push(`- Core Values: ${p.coreValues.join(', ')}`);
    if (Array.isArray(p.topSkills) && p.topSkills.length > 0) profileParts.push(`- Top Skills: ${p.topSkills.join(', ')}`);
    if (p.targetMonthlyIncome) profileParts.push(`- Monthly Income Goal: $${p.targetMonthlyIncome.toLocaleString()}/mo (Current: $${(p.currentMonthlyIncome || 0).toLocaleString()}/mo)`);
    if (profileParts.length > 0) {
      sections.push(`USER'S SAVED PROFILE & IDENTITY:\n${profileParts.join('\n')}`);
    }
  }

  // Active Goals
  if (Array.isArray(params.goals) && params.goals.length > 0) {
    const goalLines = params.goals.slice(0, 8).map((g: any) => {
      const whyPart = g.why ? ` (Why: "${g.why}")` : '';
      const progPart = typeof g.currentProgress === 'number' ? ` [${g.currentProgress}% complete]` : '';
      const obstaclePart = Array.isArray(g.obstacles) && g.obstacles.length > 0 ? ` | Obstacles: ${g.obstacles.join(', ')}` : '';
      return `- [${g.category || 'Goal'}] "${g.title}"${progPart}${whyPart}${obstaclePart}`;
    });
    sections.push(`USER'S SAVED ACTIVE GOALS:\n${goalLines.join('\n')}`);
  }

  // Saved Memories & Insights
  if (Array.isArray(params.memories) && params.memories.length > 0) {
    const memoryLines = params.memories.slice(0, 8).map((m: any) => {
      const cat = m.category ? `[${m.category}] ` : '';
      const contentPreview = m.content ? `: ${m.content.substring(0, 140)}` : '';
      return `- ${cat}"${m.title}"${contentPreview}`;
    });
    sections.push(`USER'S SAVED MEMORIES & KEY FACTS:\n${memoryLines.join('\n')}`);
  }

  // Today's Daily Plan & Tasks
  if (params.dailyPlan) {
    const dp = params.dailyPlan;
    const planParts: string[] = [];
    if (dp.theme) planParts.push(`- Today's Focus Theme: "${dp.theme}"`);
    if (typeof dp.energyLevel === 'number') planParts.push(`- Logged Energy Level: ${dp.energyLevel}/10`);
    if (Array.isArray(dp.priorityTasks) && dp.priorityTasks.length > 0) {
      const taskLines = dp.priorityTasks.map((t: any) => `  * [${t.completed ? 'COMPLETED' : 'PENDING'}] ${t.task} (${t.impact || 'Normal'} Impact, ${t.timeEstimate || '30m'})`);
      planParts.push(`- Today's Priority Tasks:\n${taskLines.join('\n')}`);
    }
    if (dp.mindsetReminder) planParts.push(`- Mindset Reminder: "${dp.mindsetReminder}"`);
    if (planParts.length > 0) {
      sections.push(`TODAY'S DAILY PLAN & TASKS:\n${planParts.join('\n')}`);
    }
  }

  // Recent Life Updates
  if (Array.isArray(params.lifeUpdates) && params.lifeUpdates.length > 0) {
    const updateLines = params.lifeUpdates.slice(0, 5).map((u: any) => {
      const cat = u.primaryCategory ? `[${u.primaryCategory}] ` : '';
      return `- ${cat}${u.content || u.title || ''} (${new Date(u.createdAt || Date.now()).toLocaleDateString()})`;
    });
    sections.push(`RECENT LIFE UPDATES & CONTEXT:\n${updateLines.join('\n')}`);
  }

  // Wellness Logs
  if (Array.isArray(params.wellnessLogs) && params.wellnessLogs.length > 0) {
    const latest = params.wellnessLogs[0];
    const wellnessParts: string[] = [];
    if (typeof latest.sleepHours === 'number') wellnessParts.push(`Sleep: ${latest.sleepHours}h (Quality: ${latest.sleepQuality || 'N/A'}/10)`);
    if (typeof latest.stressLevel === 'number') wellnessParts.push(`Stress: ${latest.stressLevel}/10`);
    if (typeof latest.focusHours === 'number') wellnessParts.push(`Focus: ${latest.focusHours}h`);
    if (latest.movementType || latest.movementMinutes) wellnessParts.push(`Movement: ${latest.movementMinutes || 0}m (${latest.movementType || 'general'})`);
    if (latest.notes) wellnessParts.push(`Notes: "${latest.notes}"`);
    if (wellnessParts.length > 0) {
      sections.push(`LATEST WELLNESS & VITALITY STATUS:\n${wellnessParts.join(' | ')}`);
    }
  }

  // Current Schedule
  if (Array.isArray(params.currentSchedule) && params.currentSchedule.length > 0) {
    const schedLines = params.currentSchedule.map((s: any) => `- [${s.status || 'pending'}] ${s.title} (${s.startAt || ''} to ${s.endAt || ''})`);
    sections.push(`TODAY'S SCHEDULE BLOCKS:\n${schedLines.join('\n')}`);
  }

  return sections.length > 0 ? sections.join('\n\n') : 'No saved user information recorded yet.';
}

// API Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString(), hasApiKey: Boolean(process.env.GEMINI_API_KEY) });
});

// Chat & General Reasoning Endpoint
app.post('/api/aim/chat', async (req: Request, res: Response) => {
  const {
    message,
    history = [],
    userProfile,
    goals = [],
    memories = [],
    dailyPlan,
    wellnessLogs = [],
    lifeUpdates = [],
    currentSchedule = [],
    contextCategory,
  } = req.body;

  try {
    const ai = getGenAI();

    // Query AIM Shared Intelligence Layer for deep wisdom synthesis and priority evaluation
    const sharedIntel = AIMSharedIntelligenceService.getInstance();
    const coachContext = sharedIntel.prepareCoachContext({
      coachId: 'guidance',
      userMessage: message || '',
      userProfile,
      goals,
      memories,
      dailyPlan,
      wellnessLogs,
      recentLifeUpdates: lifeUpdates,
      currentSchedule,
    });

    const userSavedContext = buildUserSavedInformationPrompt({
      userProfile,
      goals,
      memories,
      dailyPlan,
      wellnessLogs,
      lifeUpdates,
      currentSchedule,
    });

    if (!ai) {
      return res.json({
        reply: `I hear you clearly on "${message}". Looking at your focus for today, your primary next priority is: ${coachContext.priorityAssessment.immediateActionForNow}. How can we make tangible progress on this right now?`,
        extractedCategory: contextCategory || 'General Guidance',
        suggestedActions: [
          { title: 'Define immediate next milestone', type: 'task' },
          { title: 'Log key insight in AIM memory', type: 'memory' }
        ]
      });
    }

    const systemPrompt = `${AIM_SYSTEM_INSTRUCTION}

=== SAVED USER INFORMATION & LIVING CONTEXT ===
${userSavedContext}
==============================================

Current Focus Category: ${contextCategory || 'General Guidance'}
${coachContext.systemPromptAddendum}

Remember: Give a real, genuine, articulate, empathetic answer specifically addressing what the user said in light of their saved information above. DO NOT give generic quotes.`;

    const formattedContents = [
      ...history.slice(-10).map((h: { role: string; content: string }) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }]
      })),
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    const response = await generateWithFallback(ai, {
      contents: formattedContents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    const replyText = response.text || `I hear you clearly on "${message}". Let's align on your next practical step.`;

    res.json({
      reply: replyText,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.warn('Chat endpoint resilient fallback:', error?.message);
    res.json({
      reply: `I heard you clearly: "${message}". Let's keep your focus anchored and take the next practical step toward your goals today.`,
      extractedCategory: contextCategory || 'General Guidance',
      timestamp: new Date().toISOString(),
      suggestedActions: [
        { title: 'Focus on primary today priority', type: 'task' }
      ]
    });
  }
});

// Monetization & Fast-Cash Sprint Generator
app.post('/api/aim/monetize', async (req: Request, res: Response) => {
  const { skills, targetNiche, pricePoint, offerType, userProfile } = req.body;
  const fallbackOffer = {
    offerTitle: "Rapid Execution Growth Sprint",
    oneSentenceHook: `I will audit your top operational bottleneck and deliver a ready-to-launch ${targetNiche || 'growth'} asset within 48 hours.`,
    deliverables: ["Comprehensive diagnostic of current conversion funnel", "Tailored step-by-step optimization blueprint", "Direct turnkey implementation and delivery"],
    pricingTiers: [
      { name: "Starter Sprint", price: pricePoint || "$500", description: "Audit + high-impact action roadmap" },
      { name: "Full Implementation", price: "$1,500", description: "End-to-end delivery in 3 days" },
      { name: "Growth Retainer", price: "$3,000/mo", description: "Continuous weekly strategy and asset delivery" }
    ],
    coldOutreachScript: `Hey [Name], saw what you're building with [Project]. Noticed one quick area where you might be leaving margin on the table. I put together a quick 3-point fix—mind if I send over a 2-minute breakdown?`,
    followUpScript: "Hey [Name], just checking in on this! Happy to share the blueprint for free if it helps you guys hit your targets this quarter.",
    qualificationQuestions: ["What is currently the single biggest constraint slowing your revenue?", "If this was solved in 7 days, what would that be worth to your business?", "Are you in a position to start this week if the fit is right?"],
    todayActionChecklist: [
      "List 10 targeted prospects matching ICP criteria",
      "Send personalized outreach hook to all 10",
      "Post 1 high-value problem-solving insight offering the free audit"
    ],
    urgencyStrategy: "Offer a $200 fast-action incentive for agreements confirmed today."
  };

  try {
    const ai = getGenAI();

    const prompt = `Act as AIM's Chief Revenue & Monetization Strategist.
Create an actionable, high-ticket "Make Money Today" Sprint Plan based on:
- User Skills / Assets: ${skills || 'Consulting, Design, Marketing, Strategy, Problem Solving, Tech'}
- Target Niche / Client: ${targetNiche || 'Small business owners, founders, busy executives, creators'}
- Target Price: ${pricePoint || '$500 - $2,500'}
- Offer Type: ${offerType || 'Done-For-You Sprint or 1-on-1 High-Impact Strategy'}

Return a structured JSON object strictly with the following schema:
{
  "offerTitle": "Short catchy name for the irresistible offer",
  "oneSentenceHook": "The bold promise solving an urgent pain point",
  "deliverables": ["Specific deliverable 1", "Specific deliverable 2", "Specific deliverable 3"],
  "pricingTiers": [
    {"name": "Fast Action Tier", "price": "$500", "description": "Quick 48-hour turnaround deliverable"},
    {"name": "Complete Growth Solution", "price": "$1,500", "description": "Full end-to-end implementation"},
    {"name": "VIP Retainer", "price": "$3,500/mo", "description": "Ongoing dedicated partnership"}
  ],
  "coldOutreachScript": "Word-for-word DM / email script to send to 10 prospects right now",
  "followUpScript": "Follow-up message for prospects who don't reply in 24h",
  "qualificationQuestions": ["Question 1 to ask on sales call", "Question 2", "Question 3"],
  "todayActionChecklist": [
    "Identify 10 specific prospects matching criteria",
    "Send personalized outreach script",
    "Follow up with 3 warm contacts from past network"
  ],
  "urgencyStrategy": "How to close the deal before the day ends"
}`;

    if (!ai) {
      return res.json(fallbackOffer);
    }

    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: "You are an elite business monetizer and offer architect. Output strictly valid JSON.",
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.warn('Monetization endpoint resilient fallback:', error?.message);
    res.json(fallbackOffer);
  }
});

// Daily Planning & Reflection Endpoint
app.post('/api/aim/plan', async (req: Request, res: Response) => {
  const { type, energyLevel, availableHours, goals, dayNotes, userProfile } = req.body;
  const isMorning = type === 'morning';

  // Query Shared Intelligence Planner Scaffolding
  const sharedIntel = AIMSharedIntelligenceService.getInstance();
  const plannerContext = sharedIntel.preparePlannerContext({
    energyLevel: energyLevel || 8,
    availableHours: availableHours || 8,
    activeGoals: goals || [],
    userProfile,
    dayNotes,
  });

  const defaultMorningPlan = {
    theme: "High-Leverage Execution & Compounding Action",
    topThreePriorityTasks: [
      { task: plannerContext.priorityAssessment.immediateActionForNow || "Execute primary high-impact deliverable / outreach sprint", category: "Business", timeEstimate: "60m", impact: "High" },
      { task: "Deep work session on core strategic asset", category: "Projects", timeEstimate: "90m", impact: "High" },
      { task: "45 min physical movement & mindfulness reset", category: "Health", timeEstimate: "45m", impact: "Medium" }
    ],
    timeBlocks: [
      { time: "08:30 - 10:00", title: "Deep Work Sprint: High-Leverage Priorities", details: "Direct execution on primary objective" },
      { time: "10:30 - 12:30", title: "Core Asset Building", details: "Focused deliverable implementation" },
      { time: "14:00 - 15:30", title: "Strategy, Coordination & Review", details: "Review trajectory and momentum" },
      { time: "16:30 - 17:30", title: "Movement & Energy Recharge", details: "Cardio / Strength session" },
      { time: "19:00 - 19:30", title: "Evening Alignment & Wins Review", details: "Log daily achievements in AIM" }
    ],
    mindsetReminder: "Focus strictly on compounding actions that move your reality forward."
  };

  const defaultEveningReview = {
    summary: "You demonstrated solid consistency today and kept your focus on core priorities.",
    winsAcknowledged: ["Moved key goals forward", "Maintained execution discipline"],
    patternsIdentified: ["Peak cognitive focus was utilized effectively"],
    adjustmentsForTomorrow: ["Protect early morning deep work blocks from non-essential noise"],
    closingThought: "Rest deeply knowing every focused day accumulates toward your ultimate vision."
  };

  try {
    const ai = getGenAI();

    const prompt = isMorning
      ? `Generate an Ideal Daily Master Plan for AIM Life OS.
${plannerContext.plannerSystemDirective}
Energy level: ${energyLevel || 'High (8/10)'}
Available productive hours: ${availableHours || 8}
Long-term Goals: ${JSON.stringify(goals || ['Hit target revenue', 'Daily physical workout', 'Ship high-value project'])}
Notes/intent for today: ${dayNotes || 'Focus on high-leverage tasks, deep work, and balanced recovery.'}

Return JSON with:
{
  "theme": "Inspiring 3-5 word focus theme for today",
  "topThreePriorityTasks": [
    {"task": "Revenue Generating Task", "category": "Business", "timeEstimate": "90m", "impact": "High"},
    {"task": "Deep Work Core Project", "category": "Projects", "timeEstimate": "120m", "impact": "High"},
    {"task": "Vital Wellness / Physical recharge", "category": "Health", "timeEstimate": "45m", "impact": "Medium"}
  ],
  "timeBlocks": [
    {"time": "08:00 - 09:30", "title": "Morning Power Routine & Deep Focus", "details": "High leverage task 1"},
    {"time": "10:00 - 12:00", "title": "Client Outreach & Monetization Sprint", "details": "Send proposals and follow-ups"},
    {"time": "13:30 - 15:30", "title": "Creation & Project Execution", "details": "Deliverable building"},
    {"time": "16:00 - 17:00", "title": "Physical Movement & Outdoor Walk", "details": "Decompress and recharge"},
    {"time": "19:00 - 19:30", "title": "Evening Review & Next Day Alignment", "details": "Log wins in AIM"}
  ],
  "mindsetReminder": "A sharp, empowering psychological anchor for the day"
}`
      : `Analyze the user's Evening Day Review for AIM Life OS.
Day notes / completed tasks: ${dayNotes || 'Completed priority tasks, pushed project forward, worked out.'}
Energy / Mood: ${energyLevel || '7/10'}
${plannerContext.plannerSystemDirective}

Return JSON with:
{
  "summary": "Objective, encouraging 2-sentence summary of the day's momentum",
  "winsAcknowledged": ["Win 1", "Win 2"],
  "patternsIdentified": ["Pattern noticed in execution or energy"],
  "adjustmentsForTomorrow": ["Specific tweak for higher leverage tomorrow"],
  "closingThought": "A grounding evening reflection honoring who they are becoming"
}`;

    if (!ai) {
      return res.json(isMorning ? defaultMorningPlan : defaultEveningReview);
    }

    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: "You are AIM Life OS Planner. Provide structured, realistic, empowering planning. Output valid JSON.",
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.warn('Planner endpoint resilient fallback:', error?.message);
    res.json(isMorning ? defaultMorningPlan : defaultEveningReview);
  }
});

// Life Update & Adaptive Plan GPS Rerouting
app.post('/api/aim/life-update-analyze', async (req: Request, res: Response) => {
  const { content, currentGoals, currentDailyPlan, userProfile, wellnessLogs, recentUpdates } = req.body;
  const isJobOrIncome = /job|work|income|hire|hired|fired|laid off|offer|rejected|didn't get/i.test(content || '');
  const isHealth = /sick|tired|energy|hospital|doctor|injury|pain|sleep/i.test(content || '');
  const isSchedule = /late|delay|travel|flight|cancelled|reschedule|busy/i.test(content || '');

  let primaryCategory = 'General life context';
  if (isJobOrIncome) primaryCategory = 'Work and income';
  else if (isHealth) primaryCategory = 'Health and energy';
  else if (isSchedule) primaryCategory = 'Schedule and availability';

  const defaultLifeUpdateFallback = {
    understandingSummary: [
      `You shared an important update: "${(content || '').substring(0, 100)}..."`,
      isJobOrIncome
        ? "Your income and opportunity pipeline need immediate calibration without losing momentum."
        : isHealth
        ? "Your physical capacity and energy need protection today; high-friction tasks will be adjusted."
        : "Your daily focus and commitments will be aligned with this shift."
    ],
    importantLifeChange: content ? content.substring(0, 120) : "Life circumstances adjusted",
    categories: [primaryCategory, 'Goals'],
    entities: [],
    urgency: isJobOrIncome || isHealth ? 'high' : 'medium',
    affectedGoalIds: currentGoals?.length > 0 ? [currentGoals[0].id] : [],
    affectedTaskIds: currentDailyPlan?.priorityTasks?.length > 0 ? [currentDailyPlan.priorityTasks[0].id] : [],
    affectedPlanIds: [currentDailyPlan?.date || 'today'],
    conflictsOrUncertainty: null,
    planImpact: 'major',
    proposedReroute: {
      explanation: isJobOrIncome
        ? "Got it. I have calibrated your active goals, deprioritized tasks tied to past assumptions, and prioritized rapid alternative momentum."
        : "Understood. I have adjusted your schedule to accommodate this change while preserving all your completed wins.",
      whatChanged: [
        isJobOrIncome ? "Reopened active income generation stream" : "Adjusted daily timeline and priorities",
        "Preserved all completed tasks and streak records"
      ],
      whatWasRemovedOrPaused: [
        isJobOrIncome ? "Removed tasks assuming previous outcome" : "Rescheduled low-urgency non-essential tasks"
      ],
      newTopPriority: isJobOrIncome ? "Activate alternative outreach and monetization sprint" : "Focus on core high-leverage actions within available capacity",
      nextSpecificAction: isJobOrIncome ? "Review and send 3 rapid outreach messages" : "Complete the highest-leverage single task for today",
      suggestedPriorityTasks: (currentDailyPlan?.priorityTasks || []).map((t: any, i: number) => {
        if (t.completed) return t;
        if (i === 0 && isJobOrIncome) {
          return { ...t, task: "Execute high-leverage outreach / fast-action opportunity", impact: 'High' };
        }
        return t;
      }),
      suggestedTimeBlocks: (currentDailyPlan?.timeBlocks || []).map((b: any) => b),
      updatedGoals: currentGoals?.map((g: any) => ({
        id: g.id,
        title: g.title,
        status: 'active',
        recalculatedPath: "Recalibrated path forward based on latest update."
      })),
      updatedProfileFields: {}
    }
  };

  try {
    const ai = getGenAI();

    const goalsSummary = Array.isArray(currentGoals)
      ? currentGoals.map((g: any) => `[ID: ${g.id}] "${g.title}" (Status: ${g.status}, Category: ${g.category})`).join('\n')
      : 'No active goals';

    const tasksSummary = currentDailyPlan?.priorityTasks
      ? currentDailyPlan.priorityTasks.map((t: any) => `[ID: ${t.id}] "${t.task}" (Done: ${t.completed}, Category: ${t.category}, Impact: ${t.impact})`).join('\n')
      : 'No tasks scheduled today';

    const scheduleSummary = currentDailyPlan?.timeBlocks
      ? currentDailyPlan.timeBlocks.map((b: any) => `[ID: ${b.id}] "${b.time}: ${b.title}" (Done: ${b.completed})`).join('\n')
      : 'No time blocks';

    const prompt = `Act as AIM (Artificial Intelligence for Manifestation) - an AI-powered Life Operating System GPS.
The user has submitted a Life Update sharing a new event, change of circumstance, obstacle, breakthrough, or shift in their reality.

USER UPDATE:
"""
${content || 'No update provided.'}
"""

CURRENT SYSTEM STATE:
- User Desired Identity: ${userProfile?.desiredIdentity || 'Not specified'}
- Current Primary Obstacle: ${userProfile?.primaryObstacle || 'Not specified'}
- Active Goals:
${goalsSummary}
- Today's Priority Tasks:
${tasksSummary}
- Today's Time Blocks:
${scheduleSummary}
- Energy Level: ${currentDailyPlan?.energyLevel || 8}/10
- Available Hours: ${currentDailyPlan?.availableHours || 8} hrs

YOUR MISSION:
1. Identify the core life change, facts, and emotional/logistical implications.
2. Determine which specific goals, tasks, deadlines, assumptions, priorities, or schedules are affected.
3. If an update conflicts with existing facts (e.g. earlier had interview pending vs now didn't get job), note it. If there's an ambiguity, formulate a short follow-up question.
4. REROUTE ADAPTIVELY LIKE A GPS:
   - Modify ONLY affected parts. DO NOT wipe out entire schedules or unrelated goals.
   - PRESERVE COMPLETED TASKS AND EXISTING WINS COMPLETELY.
   - Do NOT use guilt-based language or shame. Recalculate calmly with encouraging, pragmatic steps.
   - If the update is purely informational or positive reflection with no plan changes needed, set planImpact="none" and explain that nothing needs to change yet.
   - Never predict or display lifespan, death date, or estimated time of death.

Return strictly valid JSON matching this schema:
{
  "understandingSummary": [
    "Clear, concise bullet point 1 of what AIM understood",
    "Clear, concise bullet point 2 of what this implies for the plan"
  ],
  "importantLifeChange": "Concise summary of the life change",
  "categories": ["Work and income", "Goals"],
  "entities": ["Company name", "Opportunity", "Location"],
  "urgency": "low" | "medium" | "high" | "critical",
  "affectedGoalIds": ["goal_id_if_any"],
  "affectedTaskIds": ["task_id_if_any"],
  "affectedPlanIds": ["plan_date_or_id"],
  "conflictsOrUncertainty": null,
  "planImpact": "none" | "minor" | "major",
  "proposedReroute": {
    "explanation": "Got it. That job is no longer part of the plan. I reopened your income goal, removed tasks that depended on that position, and moved your next strongest job opportunity into today’s plan.",
    "whatChanged": ["Reopened immediate income generation pipeline", "De-prioritized onboarding prep for previous offer"],
    "whatWasRemovedOrPaused": ["Removed 'Sign employment contract' task", "Paused onboarding schedule blocks"],
    "newTopPriority": "Outreach to top 3 warm client prospects and alternative opportunities",
    "nextSpecificAction": "Send personalized outreach script to 5 high-priority contacts before 2:00 PM",
    "suggestedPriorityTasks": [
      {
        "id": "pt-rerouted-1",
        "task": "Specific new high-priority action",
        "category": "Business",
        "timeEstimate": "45m",
        "impact": "High",
        "completed": false
      }
    ],
    "suggestedTimeBlocks": [
      {
        "id": "tb-rerouted-1",
        "time": "09:00 - 10:30",
        "title": "Deep Work: Alternative Opportunity Sprint",
        "details": "Direct client outreach & proposal delivery",
        "completed": false
      }
    ],
    "updatedGoals": [
      {
        "id": "goal_id",
        "title": "Goal Title",
        "status": "recalculating",
        "recalculatedPath": "New pragmatic roadmap"
      }
    ],
    "updatedProfileFields": {
      "primaryObstacle": "Updated obstacle if changed"
    }
  }
}`;

    if (!ai) {
      return res.json(defaultLifeUpdateFallback);
    }

    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: "You are AIM Life OS GPS. Perform surgical, compassionate, pragmatic plan rerouting. Output strictly valid JSON.",
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.warn('Life Update analyze endpoint resilient fallback:', error?.message);
    res.json(defaultLifeUpdateFallback);
  }
});

// Cross-Reference Pathway & Identity Alignment Generator
app.post('/api/aim/cross-reference', async (req: Request, res: Response) => {
  const { currentState, desiredState, userProfile } = req.body;
  const defaultCrossReferenceFallback = {
    analysis: {
      coreGapSummary: "You have strong latent capabilities and clear aspirations, but scattered daily momentum and unaddressed friction are holding back your compounding power.",
      hiddenStrengths: ["Self-awareness and honesty", "Drive to transform", "Adaptive problem-solving"],
      primaryBottlenecks: ["Daily inconsistency", "Scattered priorities", "Hesitation to take high-stakes actions"],
      empoweringInsight: "The fact that you can clearly articulate the bad and ugly is your greatest advantage. Awareness is the first half of transformation; structured execution is the rest."
    },
    recommendedOptionId: "option-1",
    recommendedReason: "Starting with a high-velocity momentum sprint creates immediate proof and breaks psychological friction without feeling overwhelmed.",
    pathways: [
      {
        "id": "option-1",
        "title": "Rapid Momentum & Quick-Win Sprint",
        "tagline": "Immediate high-leverage action to break inertia and generate fast proof in 7 days",
        "pace": "Fast / Immediate",
        "focus": "Low-friction high-impact wins, eliminating immediate friction, quick clarity",
        "whyItFits": "Cross-referencing your situation shows that breaking inertia is the highest ROI move right now.",
        "actionPlan48h": [
          "Identify the single highest-friction bottleneck and remove or delegate it today",
          "Execute one bold, direct action toward your primary target before sunset"
        ],
        "first7DaysMilestones": [
          "Secure first visible win or breakthrough",
          "Lock in a 90-minute daily uninterrupted focus block"
        ],
        "obstaclesNeutralized": ["Procrastination", "Overthinking", "Low momentum"],
        "projected30DayOutcome": "Tangible progress, reignited confidence, and clear daily execution rhythm."
      },
      {
        "id": "option-2",
        "title": "Systematic Foundation & Compounding Engine",
        "tagline": "Restructure daily rhythms, core skills, and repeatable systems for sustainable growth",
        "pace": "Balanced & Scalable",
        "focus": "Habit architecture, revenue/career systems, whole-person health and boundary setting",
        "whyItFits": "Builds the sustainable daily infrastructure you need to permanently anchor your desired identity.",
        "actionPlan48h": [
          "Design an uncompromising morning routine (sleep, movement, hydration, priority review)",
          "Audit daily calendar and eliminate low-value time sinks"
        ],
        "first7DaysMilestones": [
          "7-day streak of disciplined morning execution",
          "Draft first structured offer or milestone plan"
        ],
        "obstaclesNeutralized": ["Inconsistency", "Lack of clear roadmap", "Scattered energy"],
        "projected30DayOutcome": "An automated, calm, high-output daily routine with predictable compounding results."
      },
      {
        "id": "option-3",
        "title": "Total Identity Shift & Bold Leap",
        "tagline": "High-conviction transformation: cutting low-leverage anchors and stepping directly into the target standard",
        "pace": "Intensive & Transformative",
        "focus": "Radical standard elevation, aggressive positioning, major environment reset",
        "whyItFits": "Directly aligns your daily reality with the person you are committed to becoming.",
        "actionPlan48h": [
          "Publicly or privately commit to your highest standard and prune all distracting commitments",
          "Set a high-conviction 30-day target that forces maximum focus"
        ],
        "first7DaysMilestones": [
          "Completely revamp your environment and daily inputs",
          "Execute 3 high-leverage outreach or creation sprints"
        ],
        "obstaclesNeutralized": ["Playing small", "Comfort zone traps", "Hesitation"],
        "projected30DayOutcome": "A transformed personal reality, higher earnings potential, and total clarity."
      }
    ],
    synthesizedProfile: {
      desiredIdentity: "High-Leverage Sovereign Builder",
      coreMission: "Transform potential into compounded daily mastery and measurable freedom.",
      primaryObstacle: "Overcoming inertia and maintaining daily focus rhythm",
      topSkills: ["Strategic Vision", "Problem Solving", "Rapid Learning"],
      coreValues: ["Intellectual Honesty", "Relentless Action", "Vital Health"],
      ninetyDayTrajectory: "Achieve baseline financial stability and master daily high-energy execution."
    },
    suggestedInitialGoals: [
      {
        title: "Anchor Daily High-Leverage Deep Work Rhythm",
        category: "Personal",
        why: "Consistency is the fundamental engine of manifestation.",
        milestones: ["Establish morning 90m block", "Complete 14-day consistency streak"]
      },
      {
        title: "Achieve Target Financial & Career Trajectory",
        category: "Finances",
        why: "Provides freedom and sovereignty to focus on life's true mission.",
        milestones: ["Package core high-value offer", "Generate first major cash milestone"]
      }
    ],
    suggestedTodayTasks: [
      {
        task: "Calibrate top 3 daily priorities in AIM and execute the first one right now",
        category: "Personal",
        timeEstimate: "30m",
        impact: "High"
      },
      {
        task: "Take a 30-minute nature walk and clear your cognitive slate",
        category: "Health",
        timeEstimate: "30m",
        impact: "Medium"
      }
    ]
  };

  try {
    const ai = getGenAI();

    const prompt = `Act as AIM (Artificial Intelligence for Manifestation) - an elite Life Operating System strategist, cognitive analyst, and growth architect.

The user has provided two deep, honest disclosures:
1. WHERE THEY ARE TODAY ("The Good, The Bad, and The Ugly"):
"""
${currentState || 'No current state provided.'}
"""

2. WHO THEY WANT TO BE / WHERE THEY ARE TRYING TO BE:
"""
${desiredState || 'No target destination provided.'}
"""

TASK:
Perform a deep cross-reference analysis between where the user is (their assets, bad habits, bottlenecks, frustrations) and where they want to be (their target identity, financial goals, lifestyle, wellness).
Identify the core gap, eliminate their bottlenecks, leverage their hidden strengths, and generate the top 3 best strategic options/pathways to get them there.

Return strictly valid JSON matching this schema:
{
  "analysis": {
    "coreGapSummary": "1-2 sharp sentences identifying the exact gap between their current reality and target identity",
    "hiddenStrengths": ["Strength 1 extracted from their 'good'", "Strength 2"],
    "primaryBottlenecks": ["Core obstacle 1 from their 'bad & ugly'", "Core obstacle 2"],
    "empoweringInsight": "An intellectually honest, compassionate, and deeply motivating observation"
  },
  "recommendedOptionId": "option-1",
  "recommendedReason": "Why this specific pathway has the highest probability of success for their current psychological and practical state",
  "pathways": [
    {
      "id": "option-1",
      "title": "Rapid Momentum & Quick-Win Sprint",
      "tagline": "Immediate high-leverage action to break inertia and generate fast proof in 7 days",
      "pace": "Fast / Immediate",
      "focus": "Low-friction high-impact wins, eliminating immediate friction, quick cash or clarity",
      "whyItFits": "Direct cross-reference explaining how this uses their strengths to solve their specific ugly bottlenecks",
      "actionPlan48h": [
        "Concrete step to do in the first 24-48 hours",
        "Second concrete step to do immediately"
      ],
      "first7DaysMilestones": [
        "Milestone 1 for Day 3",
        "Milestone 2 for Day 7"
      ],
      "obstaclesNeutralized": ["Specific obstacle from their input this eliminates"],
      "projected30DayOutcome": "Where they will stand in 30 days"
    },
    {
      "id": "option-2",
      "title": "Systematic Foundation & Compounding Engine",
      "tagline": "Restructure daily rhythms, core skills, and repeatable systems for sustainable growth",
      "pace": "Balanced & Scalable",
      "focus": "Habit architecture, revenue/career systems, whole-person health and boundary setting",
      "whyItFits": "How this builds the permanent structural foundation needed for their desired identity",
      "actionPlan48h": [
        "Design foundational daily schedule and eliminate top 2 time drains",
        "Establish first core deliverable or asset"
      ],
      "first7DaysMilestones": [
        "Lock in daily deep work & wellness protocol",
        "Build repeatable workflow or initial offer"
      ],
      "obstaclesNeutralized": ["Inconsistency, lack of structure, scattered focus"],
      "projected30DayOutcome": "Consistent execution rhythm, clear progress on major metrics"
    },
    {
      "id": "option-3",
      "title": "Total Identity Shift & Bold Leap",
      "tagline": "High-conviction transformation: cutting low-leverage anchors and stepping directly into the target standard",
      "pace": "Intensive & Transformative",
      "focus": "Radical standard elevation, aggressive high-ticket positioning, major environment reset",
      "whyItFits": "Why a bold, uncompromising leap directly targets their highest vision",
      "actionPlan48h": [
        "Cut the single largest emotional or practical anchor holding you back",
        "Make a bold public commitment or initiate high-stakes outreach"
      ],
      "first7DaysMilestones": [
        "Rebrand / reposition core identity and daily standards",
        "Close first major breakthrough or ship primary asset"
      ],
      "obstaclesNeutralized": ["Playing small, lingering in comfort zone, fear of failure"],
      "projected30DayOutcome": "Complete lifestyle and financial reality upgrade"
    }
  ],
  "synthesizedProfile": {
    "desiredIdentity": "Crisp 3-6 word identity title (e.g., Elite High-Leverage Consultant & Creative Strategist)",
    "coreMission": "Clear 1-sentence mission statement",
    "primaryObstacle": "The main bottleneck to eliminate",
    "topSkills": ["Skill 1", "Skill 2", "Skill 3"],
    "coreValues": ["Value 1", "Value 2", "Value 3"],
    "ninetyDayTrajectory": "Specific 90-day target outcome"
  },
  "suggestedInitialGoals": [
    {
      "title": "Clear measurable goal 1",
      "category": "Finances",
      "why": "Direct tie to desired identity",
      "milestones": ["Milestone 1", "Milestone 2"]
    },
    {
      "title": "Clear measurable goal 2",
      "category": "Health",
      "why": "Physical and mental foundation",
      "milestones": ["Milestone 1", "Milestone 2"]
    }
  ],
  "suggestedTodayTasks": [
    {
      "task": "Single highest-leverage action to take today",
      "category": "Personal",
      "timeEstimate": "45m",
      "impact": "High"
    },
    {
      "task": "Secondary foundational task",
      "category": "Health",
      "timeEstimate": "30m",
      "impact": "Medium"
    }
  ]
}`;

    if (!ai) {
      return res.json(defaultCrossReferenceFallback);
    }

    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: "You are AIM Life OS. Cross-reference inputs with surgical precision. Output strictly valid JSON.",
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.warn('Cross-reference endpoint resilient fallback:', error?.message);
    res.json(defaultCrossReferenceFallback);
  }
});

// Coach Interaction Endpoint with Structured Outputs and Tool Coordination
app.post('/api/aim/coach/interact', async (req: Request, res: Response) => {
  const {
    coachId = 'guidance',
    message,
    conversationHistory = [],
    userProfile,
    goals = [],
    memories = [],
    dailyPlan,
    wellnessLogs = [],
    lifeUpdates = [],
    currentSchedule = [],
    currentTime,
    timeZone = 'UTC',
    energyLevel,
    stressLevel,
  } = req.body;

  try {
    const ai = getGenAI();

    // Query AIM Shared Intelligence Layer (Core Wisdom + Life Priority Engine)
    const sharedIntel = AIMSharedIntelligenceService.getInstance();
    const coachContext = sharedIntel.prepareCoachContext({
      coachId: coachId as any,
      userMessage: message || '',
      userProfile,
      goals,
      memories,
      dailyPlan,
      wellnessLogs,
      recentLifeUpdates: lifeUpdates,
      currentSchedule,
      energyLevel,
      stressLevel,
    });

    const userSavedContext = buildUserSavedInformationPrompt({
      userProfile,
      goals,
      memories,
      dailyPlan,
      wellnessLogs,
      lifeUpdates,
      currentSchedule,
    });

    // Coach persona specifics with distinct jobs and decision rules
    const coachInstructions: Record<string, string> = {
      guidance: `You are the Guidance Coach, AIM's primary daily coordinator and life navigator.
PURPOSE: Life navigation, schedule calibration, decision-making, and priority coordination.
WHEN USER ASKS "What should I do now?" or questions about their day:
- Inspect the current local time, today's schedule blocks, unfinished priority tasks, upcoming appointments, and recent updates.
- Give a direct, pragmatic, highly specific answer explaining what makes the most sense right now.
- If the user asks to move an appointment, reschedule a task, or add a commitment, describe what changed AND emit the exact structured action in the "actions" array.
- NEVER use generic motivational filler ("Let's get to it", "Believe in yourself"). Be a sharp, calm, practical navigator.`,

      motivation: `You are the Motivation Coach inside AIM (Momentum & Accountability).
PURPOSE: Overcome friction, break inertia, rebuild confidence, and lock in execution.
WHEN USER FEELS RESISTANCE, OVERWHELMED, OR STUCK:
- Validate their experience without indulging in excuses or shame.
- Ground your advice in their stated desired identity and active goals.
- Prescribe ONE immediate 2-minute micro-action to break inertia right now.
- Do NOT act like a general calendar planner or recite cliché motivational quotes. Focus purely on psychological momentum and practical accountability.`,

      spiritual: `You are the Spiritual Coach inside AIM (Inner Alignment & Reflection).
PURPOSE: Meaning, core values, gratitude, emotional perspective, and grounded wisdom.
WHEN USER REFLECTS OR EXPLORES PURPOSE:
- Help them connect outward daily actions to their deepest inner convictions, core mission, and identity.
- Ask thoughtful, contemplative questions that illuminate unexamined feelings and inner clarity.
- Ground insights in their saved core values and life mission. Do NOT preach dogmatically.`,

      health: `You are the Health & Vitality Coach inside AIM.
PURPOSE: Daily wellness support across sleep, nutrition, movement, hydration, stress, and recovery.
WHEN USER DISCUSSES HEALTH OR ENERGY:
- Check their recent wellness logs (sleep hours, stress levels, energy).
- Provide practical, sustainable adjustments to optimize their physical energy and mental clarity.
- Clarify that you offer general wellness guidance and are not a substitute for licensed medical advice.`,

      relationships: `You are the Relationships Coach inside AIM.
PURPOSE: Friendships, family, partners, communication, healthy boundaries, and interpersonal decisions.
WHEN USER DISCUSSES RELATIONSHIPS OR CONFLICTS:
- Help them reflect on communication patterns, clarify intentions, and set healthy, respectful boundaries.
- Offer constructive dialogue scripts or reframing exercises for real-world interactions.`,
    };

    const specificInstruction = coachInstructions[coachId] || coachInstructions.guidance;

    const systemPrompt = `You are a specialized coach inside AIM (Artificial Intelligence for Manifestation).
${specificInstruction}

=== USER'S SAVED INFORMATION & LIVING CONTEXT ===
${userSavedContext}
================================================

TimeZone: ${timeZone}
Current Local Time: ${currentTime || new Date().toISOString()}

${coachContext.systemPromptAddendum}

CRITICAL RULES:
1. GENUINE & REAL OVER QUOTES: NEVER recite generic motivational quotes, proverbs, aphorisms, or clichés (e.g. "As the ancient proverb goes...", "A journey of a thousand miles..."). Speak in an authentic, intelligent, grounded voice.
2. GROUNDED IN REAL USER CONTEXT: You know who this person is, their goals, their schedule, and their obstacles. Tailor your response directly to their situation.
3. ACTION DISCIPLINE & INTEGRITY:
   - Distinguish between TALKING about an action and EXECUTING an action.
   - If you state that you created, rescheduled, completed, or removed a task or schedule block, YOU MUST include the matching action in the "actions" array.
   - Supported action types: "createTask", "updateTask", "completeTask", "rescheduleTask", "removeTask", "createScheduleBlock", "updateScheduleBlock", "rescheduleScheduleBlock", "removeScheduleBlock", "createAppointment", "updateGoal", "saveLifeUpdate", "saveRelevantMemory", "updateProfile".
   - If an action cannot be performed, state it clearly. Never pretend.
4. CONVERSATIONAL SPOKEN TEXT: The "spokenText" field is spoken aloud by TTS. Make it 1-3 natural, warm, human sentences. Absolutely NO markdown, asterisks (*), hashtags (#), or bullet points in spokenText.
5. Output strictly a valid JSON object matching the schema.`;

    const userPrompt = `User said to ${coachId} coach: "${message}"

Respond strictly as a JSON object:
{
  "coachId": "${coachId}",
  "displayText": "Clear, grounded response directly addressing the user's situation and saved context, with genuine insight and clear next steps.",
  "spokenText": "Natural, warm, human spoken voice response (1-3 sentences, completely free of asterisks, quotes, markdown, or bullet points).",
  "intent": "conversation",
  "confidence": 0.95,
  "followUpQuestion": "One thoughtful, practical follow-up question.",
  "actions": [
    {
      "type": "createTask | completeTask | rescheduleTask | removeTask | createScheduleBlock | rescheduleScheduleBlock | updateGoal | saveLifeUpdate | saveRelevantMemory",
      "payload": { ... }
    }
  ],
  "recommendedActions": [
    {
      "label": "Action label",
      "reason": "Why this action helps",
      "actionType": "none"
    }
  ]
}`;

    if (!ai) {
      // Intelligent offline response based on message content and coach
      const isScheduleQuestion = /what should i do|schedule|free hours|next|time/i.test(message);
      const isCompleteAction = /finished|done|completed|checked off/i.test(message);

      let displayText = `I hear you on "${message}". Looking at your active priorities, let's focus on: ${coachContext.priorityAssessment.immediateActionForNow}`;
      let spokenText = `I hear you. Let's focus on your immediate next priority right now.`;
      const fallbackActions: any[] = [];

      if (coachId === 'guidance' && isScheduleQuestion) {
        displayText = `Looking at your schedule and active priorities, your top focus right now is "${coachContext.priorityAssessment.immediateActionForNow}". Let's dedicate the next focused block to making tangible progress on this.`;
        spokenText = `Looking at your schedule, your top focus right now is to work on your primary priority. Let's get that done.`;
      } else if (coachId === 'motivation') {
        displayText = `Friction is just a signal of resistance, not a reason to stop. Let's take the smallest possible step: spend just 2 minutes starting on "${coachContext.priorityAssessment.immediateActionForNow}". Once you start, momentum takes care of the rest.`;
        spokenText = `Let's take the smallest step forward right now: spend two minutes getting started, and let the momentum build.`;
      }

      if (isCompleteAction) {
        fallbackActions.push({
          type: 'completeTask',
          payload: { query: message.replace(/finished|done|completed|checked off/gi, '').trim() }
        });
      }

      return res.json({
        coachId,
        displayText,
        spokenText,
        intent: 'conversation',
        confidence: 0.9,
        followUpQuestion: 'What is the single most important thing you want to accomplish next?',
        actions: fallbackActions,
        recommendedActions: [
          {
            label: 'Focus on Priority',
            reason: 'Commit to your immediate task',
            actionType: 'none',
          },
        ],
      });
    }

    const formattedContents = [
      ...conversationHistory.slice(-6).map((h: { role: string; content: string }) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }],
      })),
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ];

    const response = await generateWithFallback(ai, {
      contents: formattedContents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (!parsed.displayText) {
      parsed.displayText = `I hear you clearly. Let's take the next best step for your day.`;
    }
    if (!parsed.spokenText) {
      parsed.spokenText = parsed.displayText.replace(/[*#_`~[\]()]/g, '').substring(0, 200);
    }
    if (!Array.isArray(parsed.actions)) {
      parsed.actions = [];
    }
    parsed.coachId = coachId;

    res.json(parsed);
  } catch (error: any) {
    console.warn('Coach interact resilient fallback:', error?.message);
    res.json({
      coachId: coachId || 'guidance',
      displayText: `I'm here with you. Let's look at what's in front of you today and take the next practical step.`,
      spokenText: `I'm here with you. Let's look at what's in front of you today and take the next step.`,
      intent: 'conversation',
      confidence: 0.8,
      followUpQuestion: 'How can I best support your focus right now?',
      recommendedActions: [],
    });
  }
});

// Priority Intelligence Assessment Endpoint
app.post('/api/aim/intelligence/priority-assessment', (req: Request, res: Response) => {
  try {
    const userLifeContext = req.body || {};
    const priorityEngine = AIMLifePriorityEngine.getInstance();
    const assessment = priorityEngine.evaluatePriorities(userLifeContext);
    res.json(assessment);
  } catch (err: any) {
    console.error('Priority assessment error:', err);
    res.status(500).json({ error: 'Failed to evaluate life priorities' });
  }
});

// Wisdom Engine Synthesis Endpoint
app.post('/api/aim/intelligence/wisdom-synthesis', (req: Request, res: Response) => {
  try {
    const wisdomContext = req.body || {};
    const wisdomEngine = AIMCoreWisdomEngine.getInstance();
    const synthesis = wisdomEngine.synthesizeWisdom(wisdomContext);
    res.json(synthesis);
  } catch (err: any) {
    console.error('Wisdom synthesis error:', err);
    res.status(500).json({ error: 'Failed to synthesize wisdom' });
  }
});

// Momentum Engine Analysis Endpoint
app.post('/api/aim/momentum/analyze', (req: Request, res: Response) => {
  try {
    const params = req.body || {};
    const momentumEngine = AIMMomentumEngine.getInstance();
    const analysis = momentumEngine.analyzeMomentum(params);
    res.json(analysis);
  } catch (err: any) {
    console.error('Momentum analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze momentum' });
  }
});

// Creative Studio & Client Proposal Generator
app.post('/api/aim/creative', async (req: Request, res: Response) => {
  const { taskType, clientName, projectScope, budget, industry } = req.body;
  const defaultCreativeFallback = {
    title: `Growth Strategy Proposal for ${clientName || 'Client'}`,
    executiveSummary: "This engagement delivers a rapid-execution roadmap and direct asset delivery designed to solve your core operational and acquisition bottlenecks.",
    deliverablesList: ["Phase 1: Deep Diagnostic & Strategic Blueprint", "Phase 2: High-Converting Asset Delivery", "Phase 3: Launch Support & Performance Review"],
    timeline: "10 Business Days",
    investmentTerms: `Total Investment: ${budget || '$2,500'}. 50% upon kickoff, 50% upon final signoff.`,
    fullMarkdownDocument: `# High-Impact Growth Proposal\n\n**Prepared for:** ${clientName || 'Valued Client'}\n**Date:** ${new Date().toLocaleDateString()}\n**Investment:** ${budget || '$2,500'}\n\n## Objective\nTo rapidly design, optimize, and launch key revenue assets to accelerate your business growth.\n\n## Key Deliverables\n1. **Strategic Blueprint:** Comprehensive audit and bottleneck diagnostic.\n2. **Turnkey Implementation:** Ready-to-use marketing and conversion assets.\n3. **Post-Launch Review:** 14-day optimization guidance.\n\n## Terms of Agreement\n- 50% deposit required prior to project kickoff.\n- Delivery timeline begins upon receipt of initial materials.\n\n*Generated by AIM Life Operating System.*`
  };

  try {
    const ai = getGenAI();

    const prompt = `Act as an elite Creative & Commercial Specialist for AIM.
Generate a complete, ready-to-send professional asset:
- Type: ${taskType || 'Client Proposal & Invoice Agreement'}
- Client: ${clientName || 'Prospective High-Value Client'}
- Scope: ${projectScope || 'Turnkey Brand Strategy & Growth Sprint'}
- Value / Price: ${budget || '$2,500'}
- Industry: ${industry || 'Tech & Creator Economy'}

Return JSON:
{
  "title": "Document Title",
  "executiveSummary": "Compelling summary of value proposition",
  "deliverablesList": ["Milestone 1", "Milestone 2", "Milestone 3"],
  "timeline": "Timeline breakdown (e.g. 7-14 business days)",
  "investmentTerms": "Clear pricing and payment schedule terms (50% upfront, 50% on completion)",
  "fullMarkdownDocument": "A complete, beautifully formatted Markdown document ready to export to Google Drive or send to client."
}`;

    if (!ai) {
      return res.json(defaultCreativeFallback);
    }

    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: "You are AIM Creative & Contract Studio. Output valid JSON.",
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.warn('Creative studio endpoint resilient fallback:', error?.message);
    res.json(defaultCreativeFallback);
  }
});

// ==========================================
// AIM Conversational Voice Engine Endpoints
// ==========================================

// Spoken text formatter endpoint (turns written response into spoken natural phrasing)
app.post('/api/aim/voice/format-spoken', (req: Request, res: Response) => {
  try {
    const { text, emotion } = req.body || {};
    const voiceService = AIMVoiceService.getInstance();
    const spokenText = voiceService.formatSpokenResponse(text || '', emotion);
    const emotionDetected = emotion || voiceService.detectEmotion(spokenText);
    res.json({
      spokenText,
      emotionDetected,
      originalText: text || '',
    });
  } catch (err: any) {
    console.error('Spoken format error:', err);
    res.status(500).json({ error: 'Failed to format spoken response', spokenText: req.body?.text || '' });
  }
});

// High-fidelity natural neural speech synthesis endpoint via Gemini TTS
app.post('/api/aim/voice/speak', async (req: Request, res: Response) => {
  try {
    const {
      text,
      voiceProfileId,
      gender,
      accentStyle,
      emotion,
      speakingRate,
      pitch,
      formatForSpeech,
    } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Missing or empty text parameter' });
    }

    const ai = getGenAI();
    const voiceService = AIMVoiceService.getInstance();

    if (!ai) {
      // Return formatted spoken text for client fallback
      const spokenText = voiceService.formatSpokenResponse(text, emotion);
      return res.json({
        audioBase64: null,
        mimeType: null,
        spokenText,
        emotionDetected: emotion || voiceService.detectEmotion(spokenText),
        voiceNameUsed: 'local-fallback',
        provider: 'fallback',
      });
    }

    const result = await voiceService.synthesizeSpeech(ai, {
      text,
      voiceProfileId,
      gender,
      accentStyle,
      emotion,
      speakingRate,
      pitch,
      formatForSpeech: formatForSpeech !== false,
    });

    res.json(result);
  } catch (err: any) {
    console.error('Voice speak API error:', err?.message || err);
    const voiceService = AIMVoiceService.getInstance();
    const spokenText = voiceService.formatSpokenResponse(req.body?.text || '', req.body?.emotion);
    res.status(200).json({
      audioBase64: null,
      mimeType: null,
      spokenText,
      emotionDetected: req.body?.emotion || voiceService.detectEmotion(spokenText),
      voiceNameUsed: 'local-fallback',
      provider: 'fallback',
      warning: err?.message || 'TTS synthesis failed, fall back to browser voice',
    });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AIM Life OS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
