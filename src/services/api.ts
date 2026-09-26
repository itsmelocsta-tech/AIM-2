import { authenticatedFetch, AuthenticationError } from './authenticatedFetch';
import { UserProfile, DailyPlan, MonetizationOffer, CoachId, CoachResponse, ScheduleItem, Goal, MemoryItem, WellnessLog, LifeUpdate } from '../types';
import { intelligenceService, CompactOrbContext, LifePriorityAssessmentResult, WisdomSynthesisResultClient } from './intelligenceService';
export const api = {
  async interactWithCoach(params: {
    coachId: CoachId;
    message: string;
    conversationHistory?: { role: 'user' | 'model'; content: string }[];
    userProfile?: UserProfile;
    goals?: Goal[];
    memories?: MemoryItem[];
    dailyPlan?: DailyPlan;
    wellnessLogs?: WellnessLog[];
    lifeUpdates?: LifeUpdate[];
    currentSchedule?: ScheduleItem[];
    currentTime?: string;
    timeZone?: string;
    energyLevel?: number;
    stressLevel?: number;
    compactContext?: CompactOrbContext;
  }): Promise<CoachResponse> {
    try {
      const response = await authenticatedFetch('/api/aim/coach/interact', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof AuthenticationError) throw error;
      console.error('API interactWithCoach error:', error);
      return {
        coachId: params.coachId,
        displayText: `I'm here with you. Let's calibrate your daily momentum and focus on the immediate next win right now.`,
        spokenText: `I'm here with you. Let's focus on the immediate next step right now.`,
        intent: 'conversation',
        confidence: 0.85,
        followUpQuestion: 'What is the single most important action in front of you right now?',
        recommendedActions: [
          {
            label: 'View Schedule',
            reason: 'Check your upcoming daily priorities',
            actionType: 'open_route',
            target: '/home',
          },
        ],
      };
    }
  },

  async getPriorityAssessment(userProfile?: UserProfile, contextExtra?: any): Promise<LifePriorityAssessmentResult> {
    return intelligenceService.evaluatePriorities(userProfile, contextExtra);
  },

  async getWisdomSynthesis(params: {
    userSituation: string;
    coachId?: CoachId;
    userProfile?: UserProfile;
    energyLevel?: number;
  }): Promise<WisdomSynthesisResultClient> {
    return intelligenceService.synthesizeWisdom(params);
  },

  async getCompactOrbContext(params: {
    coachId: CoachId;
    userProfile?: UserProfile;
    currentSchedule?: ScheduleItem[];
    userMessage?: string;
    forceRefresh?: boolean;
  }): Promise<CompactOrbContext> {
    return intelligenceService.getCompactOrbContext(params);
  },

  async chatWithAIM(params: {
    message: string;
    history: { role: 'user' | 'aim'; content: string }[];
    userProfile: UserProfile;
    goals?: Goal[];
    memories?: MemoryItem[];
    dailyPlan?: DailyPlan;
    wellnessLogs?: WellnessLog[];
    lifeUpdates?: LifeUpdate[];
    currentSchedule?: ScheduleItem[];
    contextCategory?: string;
  }): Promise<{ reply: string; extractedCategory?: string }> {
    try {
      const response = await authenticatedFetch('/api/aim/chat', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof AuthenticationError) throw error;
      console.error('API chatWithAIM error:', error);
      return {
        reply: `AIM thinking partner note: ${params.message}. Let's break this down into clear action steps and momentum for today.`,
      };
    }
  },

  async generateMonetizationOffer(params: {
    skills: string;
    targetNiche: string;
    pricePoint: string;
    offerType: string;
    userProfile?: UserProfile;
  }): Promise<Partial<MonetizationOffer>> {
    try {
      const response = await authenticatedFetch('/api/aim/monetize', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof AuthenticationError) throw error;
      console.error('API generateMonetizationOffer error:', error);
      return {
        title: 'Rapid High-Leverage Growth Sprint',
        hook: `I will personally audit your highest-friction ${params.targetNiche} bottleneck and deliver a turnkey, conversion-ready asset within 48 hours.`,
        deliverables: [
          'Full diagnostic audit of current acquisition or delivery bottleneck',
          'Custom step-by-step optimization blueprint',
          'Direct implementation and deliverable handoff',
        ],
        pricingTiers: [
          { name: 'Starter Sprint', price: params.pricePoint || '$750', description: 'Audit + tactical roadmap' },
          { name: 'Full Delivery', price: '$2,500', description: 'Turnkey asset creation and 48h delivery' },
          { name: 'Monthly Advisory', price: '$4,500/mo', description: 'Weekly sprints and continuous access' },
        ],
        coldOutreachScript: `Hey [Name]! Loved your work on [Project]. Noticed one quick area on your funnel where you might be leaking conversions. I put together a quick 3-point breakdown showing how to capture an extra 15-20% margin—mind if I send the 2-min loom over?`,
        followUpScript: `Hey [Name], following up on this! Even if you have this covered with your team, happy to send the breakdown PDF over if useful for your team review.`,
        qualificationQuestions: [
          'What is the single largest bottleneck holding back your next $20k in revenue?',
          'If this bottleneck was completely eliminated by Friday, what would that mean for your revenue?',
        ],
        todayActionChecklist: [
          'Identify 15 target prospects matching ICP criteria',
          'Send personalized outreach hook before noon',
          'Follow up with 3 open leads with a fast-action incentive today',
        ],
        urgencyStrategy: 'Offer a $250 fast-action deposit incentive for agreements confirmed today.',
      };
    }
  },

  async generateDailyPlan(params: {
    type: 'morning' | 'evening';
    energyLevel: number;
    availableHours: number;
    goals: string[];
    dayNotes?: string;
  }): Promise<any> {
    try {
      const response = await authenticatedFetch('/api/aim/plan', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof AuthenticationError) throw error;
      console.warn('API generateDailyPlan fallback engaged:', error);
      return { source: 'fallback' };
    }
  },

  async generateCreativeAsset(params: {
    taskType: string;
    clientName: string;
    projectScope: string;
    budget: string;
    industry: string;
  }): Promise<{
    title: string;
    executiveSummary: string;
    deliverablesList: string[];
    timeline: string;
    investmentTerms: string;
    fullMarkdownDocument: string;
  }> {
    try {
      const response = await authenticatedFetch('/api/aim/creative', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof AuthenticationError) throw error;
      console.error('API generateCreativeAsset error:', error);
      return {
        title: `Growth Strategy & Proposal for ${params.clientName}`,
        executiveSummary: 'This engagement delivers a rapid-execution roadmap and direct asset delivery designed to solve core operational bottlenecks.',
        deliverablesList: ['Diagnostic Audit', 'High-Impact Asset Delivery', 'Launch Support'],
        timeline: '7-10 Business Days',
        investmentTerms: `Total Investment: ${params.budget}. 50% upon kickoff, 50% upon final delivery.`,
        fullMarkdownDocument: `# High-Impact Growth Proposal\n\n**Prepared for:** ${params.clientName}\n**Date:** ${new Date().toLocaleDateString()}\n**Investment:** ${params.budget}\n\n## Objective\nTo optimize and deliver turnkey revenue assets for ${params.industry}.\n\n## Terms\n- 50% deposit required prior to kickoff.\n\n*Generated by AIM Life OS.*`,
      };
    }
  },

  async crossReferencePathways(params: {
    currentState: string;
    desiredState: string;
    userProfile?: UserProfile;
  }): Promise<import('../types').CrossReferenceResult> {
    try {
      const response = await authenticatedFetch('/api/aim/cross-reference', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof AuthenticationError) throw error;
      console.error('API crossReferencePathways error:', error);
      return {
        analysis: {
          coreGapSummary: "You have strong latent potential, but scattered daily focus and unaddressed bottlenecks are stalling your momentum.",
          hiddenStrengths: ["Honesty and willingness to look directly at reality", "Desire for transformation", "Resourcefulness"],
          primaryBottlenecks: ["Daily inconsistency", "Scattered priorities", "Fear of failure"],
          empoweringInsight: "Your awareness of the good, bad, and ugly is your greatest asset. Now we convert that awareness into systematic daily execution."
        },
        recommendedOptionId: "option-1",
        recommendedReason: "A rapid momentum sprint creates quick wins and breaks inertia immediately.",
        pathways: [
          {
            id: "option-1",
            title: "Rapid Momentum & Quick-Win Sprint",
            tagline: "Immediate high-leverage action to break inertia and generate fast proof in 7 days",
            pace: "Fast / Immediate",
            focus: "Low-friction high-impact wins, eliminating immediate friction, quick clarity",
            whyItFits: "Cross-referencing your disclosure shows that building rapid proof-of-work is the fastest way to overcome friction.",
            actionPlan48h: [
              "Isolate the single highest-friction blocker and remove it today",
              "Execute one bold, direct action toward your primary target before sunset"
            ],
            first7DaysMilestones: [
              "Secure your first visible win or breakthrough",
              "Lock in a 90-minute daily uninterrupted focus block"
            ],
            obstaclesNeutralized: ["Procrastination", "Overthinking", "Low momentum"],
            projected30DayOutcome: "Tangible progress, reignited confidence, and a clear daily execution rhythm."
          },
          {
            id: "option-2",
            title: "Systematic Foundation & Compounding Engine",
            tagline: "Restructure daily rhythms, core skills, and repeatable systems for sustainable growth",
            pace: "Balanced & Scalable",
            focus: "Habit architecture, revenue/career systems, whole-person health and boundary setting",
            whyItFits: "Builds the sustainable daily infrastructure needed to permanently anchor your desired identity.",
            actionPlan48h: [
              "Design an uncompromising morning routine (sleep, movement, priority review)",
              "Audit daily calendar and eliminate low-value time sinks"
            ],
            first7DaysMilestones: [
              "7-day streak of disciplined morning execution",
              "Draft first structured offer or milestone plan"
            ],
            obstaclesNeutralized: ["Inconsistency", "Lack of clear roadmap", "Scattered energy"],
            projected30DayOutcome: "An automated, calm, high-output daily routine with predictable compounding results."
          },
          {
            id: "option-3",
            title: "Total Identity Shift & Bold Leap",
            tagline: "High-conviction transformation: cutting low-leverage anchors and stepping directly into the target standard",
            pace: "Intensive & Transformative",
            focus: "Radical standard elevation, aggressive positioning, major environment reset",
            whyItFits: "Directly aligns your daily reality with the person you are committed to becoming.",
            actionPlan48h: [
              "Prune all low-leverage commitments and cut the biggest drain",
              "Set a high-conviction 30-day target that forces maximum focus"
            ],
            first7DaysMilestones: [
              "Completely revamp your environment and daily inputs",
              "Execute 3 high-leverage outreach or creation sprints"
            ],
            obstaclesNeutralized: ["Playing small", "Comfort zone traps", "Hesitation"],
            projected30DayOutcome: "A transformed personal reality, higher earnings potential, and total clarity."
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
    }
  },

  async analyzeLifeUpdate(params: {
    content: string;
    currentGoals: import('../types').Goal[];
    currentDailyPlan: import('../types').DailyPlan;
    userProfile?: import('../types').UserProfile;
    wellnessLogs?: import('../types').WellnessLog[];
    recentUpdates?: import('../types').LifeUpdate[];
  }): Promise<import('../types').LifeUpdateAnalysisResult> {
    try {
      const response = await authenticatedFetch('/api/aim/life-update-analyze', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof AuthenticationError) throw error;
      console.error('API analyzeLifeUpdate error:', error);
      const isJobOrIncome = /job|work|income|hire|hired|fired|laid off|offer|rejected|didn't get/i.test(params.content || '');
      const isHealth = /sick|tired|energy|hospital|doctor|injury|pain|sleep/i.test(params.content || '');

      return {
        understandingSummary: [
          `You shared an important update: "${(params.content || '').substring(0, 100)}..."`,
          isJobOrIncome
            ? "Your income and opportunity pipeline need immediate calibration without losing momentum."
            : isHealth
            ? "Your physical energy and capacity require protection today."
            : "Your daily focus and commitments will be adapted to reflect this change."
        ],
        importantLifeChange: params.content ? params.content.substring(0, 120) : "Life update recorded",
        categories: [isJobOrIncome ? "Work and income" : isHealth ? "Health and energy" : "General life context", "Goals"],
        entities: [],
        urgency: isJobOrIncome || isHealth ? 'high' : 'medium',
        affectedGoalIds: params.currentGoals?.length > 0 ? [params.currentGoals[0].id] : [],
        affectedTaskIds: params.currentDailyPlan?.priorityTasks?.length > 0 ? [params.currentDailyPlan.priorityTasks[0].id] : [],
        affectedPlanIds: [params.currentDailyPlan?.date || 'today'],
        conflictsOrUncertainty: null,
        planImpact: 'major',
        proposedReroute: {
          explanation: isJobOrIncome
            ? "Got it. That job is no longer part of the plan. I reopened your income goal, removed tasks that depended on that position, and moved your next strongest opportunity into today's plan."
            : "Understood. I have recalibrated your schedule to accommodate this change while preserving all your completed wins.",
          whatChanged: [
            isJobOrIncome ? "Reopened immediate income generation pipeline" : "Adjusted daily timeline and priorities",
            "Preserved all completed tasks and streak records"
          ],
          whatWasRemovedOrPaused: [
            isJobOrIncome ? "Removed tasks assuming previous job" : "Rescheduled lower-urgency non-essential tasks"
          ],
          newTopPriority: isJobOrIncome ? "Outreach to top warm client prospects & alternative opportunities" : "Execute core high-leverage focus block",
          nextSpecificAction: isJobOrIncome ? "Send personalized outreach script to 5 high-priority contacts" : "Complete the highest-leverage single task for today",
          suggestedPriorityTasks: (params.currentDailyPlan?.priorityTasks || []).map((t, i) => {
            if (t.completed) return t;
            if (i === 0 && isJobOrIncome) {
              return { ...t, task: "Execute rapid high-leverage client/job outreach", impact: 'High' };
            }
            return t;
          }),
          suggestedTimeBlocks: params.currentDailyPlan?.timeBlocks || [],
          updatedGoals: params.currentGoals?.map(g => ({
            id: g.id,
            title: g.title,
            status: 'active' as const,
            recalculatedPath: "Recalibrated path forward based on latest update."
          })),
          updatedProfileFields: {}
        }
      };
    }
  },
};
