import {
  PersonalOperatingContext,
  AIMProject,
  DailyActionRecommendation,
  CheckInParseResult,
  JobListing,
} from '../types';

export const CONTEXT_STORAGE_KEYS = {
  PERSONAL_CONTEXT: 'aim_personal_operating_context_v1',
  PROJECTS: 'aim_active_projects_v1',
  DAILY_RECOMMENDATION: 'aim_daily_action_recommendation_v1',
  CHECK_IN_HISTORY: 'aim_check_in_history_v1',
};

export const DEFAULT_PERSONAL_CONTEXT: PersonalOperatingContext = {
  location: '',
  searchRadiusMiles: 25,
  hasPersonalVehicle: false,
  needsEmployerVehicle: false,
  driverLicenseType: '',
  cleanDrivingRecord: false,
  licenseReissueDateNote: '',
  historicalDrivingExperience: '',
  autoScanWeekdays: false,
  scanTime: '08:00 AM',
  transportation: {
    hasPersonalVehicle: false,
    needsEmployerVehicle: false,
    driverLicenseType: '',
    cleanDrivingRecord: false,
    licenseReissueDate: '',
    apparentHistoryUnderOneYear: false,
    historicalDrivingExp: '',
    cdlQualified: false,
  },
  workPreferences: {
    avoidPersonalVehicle: false,
    avoidCDL: false,
    avoidHeavyLifting: false,
    avoidWarehouseLabor: false,
    avoidConstruction: false,
    avoidPrimaryManualLabor: false,
    preferCustomerFacing: false,
    preferShuttleTransport: false,
    preferFleetDelivery: false,
    incomeUrgency: 'medium',
  },
  confirmedFacts: [],
  inferredInfo: [],
  unknownInfo: [],
  lockedDecisions: [],
  auditLog: [],
};

export const DEFAULT_AIM_PROJECTS: AIMProject[] = [];

/**
 * Explicitly labeled example data for demonstration purposes only.
 * Must never be saved to persistent user storage without explicit user confirmation.
 */
export const EXAMPLE_AIM_PROJECTS: AIMProject[] = [
  {
    id: 'example-proj-1',
    name: '[Example data] Primary Income Stream',
    goal: 'Establish steady baseline revenue.',
    purpose: 'Core professional focus and revenue generation.',
    status: 'active',
    phase: 'Execution',
    priority: 1,
    progress: 25,
    whatChanged: 'Identified target market and potential client opportunities.',
    lastCompletedAction: 'Defined target client qualification criteria.',
    blockers: ['Outreach schedule consistency'],
    nextAction: 'Send 3 direct inquiries to qualified prospects.',
    collaborators: ['Self'],
    lastUpdated: new Date().toISOString(),
    notes: 'Demonstration sample project.',
    category: 'Career',
  },
  {
    id: 'example-proj-2',
    name: '[Example data] Service Offering',
    goal: 'Package and launch a high-value consulting or freelance service.',
    purpose: 'Direct-to-client value delivery.',
    status: 'active',
    phase: 'Setup',
    priority: 2,
    progress: 15,
    whatChanged: 'Drafting service packages.',
    lastCompletedAction: 'Outlined 3 service tiers.',
    blockers: ['Finalize pricing sheet'],
    nextAction: 'Review pricing with 2 industry peers.',
    collaborators: ['Self'],
    lastUpdated: new Date().toISOString(),
    notes: 'Demonstration sample project.',
    category: 'Business',
  },
];

// Safe local storage abstraction
const safeStorage = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
};

export const aimContextService = {
  getContext(): PersonalOperatingContext {
    return this.getPersonalContext();
  },

  saveContext(context: PersonalOperatingContext): void {
    this.savePersonalContext(context);
  },

  getPersonalContext(): PersonalOperatingContext {
    try {
      const data = safeStorage.getItem(CONTEXT_STORAGE_KEYS.PERSONAL_CONTEXT);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...DEFAULT_PERSONAL_CONTEXT,
          ...parsed,
          hasPersonalVehicle: parsed.hasPersonalVehicle ?? parsed.transportation?.hasPersonalVehicle ?? false,
          needsEmployerVehicle: parsed.needsEmployerVehicle ?? parsed.transportation?.needsEmployerVehicle ?? false,
          driverLicenseType: parsed.driverLicenseType || parsed.transportation?.driverLicenseType || '',
          cleanDrivingRecord: parsed.cleanDrivingRecord ?? parsed.transportation?.cleanDrivingRecord ?? false,
          licenseReissueDateNote: parsed.licenseReissueDateNote || parsed.transportation?.licenseReissueDate || '',
          historicalDrivingExperience: parsed.historicalDrivingExperience || parsed.transportation?.historicalDrivingExp || '',
          autoScanWeekdays: parsed.autoScanWeekdays ?? false,
          scanTime: parsed.scanTime || '08:00 AM',
          transportation: {
            ...DEFAULT_PERSONAL_CONTEXT.transportation,
            ...(parsed.transportation || {}),
          },
          workPreferences: {
            ...DEFAULT_PERSONAL_CONTEXT.workPreferences,
            ...(parsed.workPreferences || {}),
          },
        };
      }
      return DEFAULT_PERSONAL_CONTEXT;
    } catch {
      return DEFAULT_PERSONAL_CONTEXT;
    }
  },

  savePersonalContext(context: PersonalOperatingContext): void {
    try {
      safeStorage.setItem(CONTEXT_STORAGE_KEYS.PERSONAL_CONTEXT, JSON.stringify(context));
    } catch (e) {
      console.error('[aimContextService] Failed to save context:', e);
    }
  },

  getProjects(): AIMProject[] {
    try {
      const data = safeStorage.getItem(CONTEXT_STORAGE_KEYS.PROJECTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return DEFAULT_AIM_PROJECTS;
    } catch {
      return DEFAULT_AIM_PROJECTS;
    }
  },

  saveProjects(projects: AIMProject[]): void {
    try {
      safeStorage.setItem(CONTEXT_STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.error('[aimContextService] Failed to save projects:', e);
    }
  },

  updateProject(id: string, updates: Partial<AIMProject>): AIMProject[] {
    const projects = this.getProjects();
    const updated = projects.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          ...updates,
          lastUpdated: new Date().toISOString(),
        };
      }
      return p;
    });
    this.saveProjects(updated);
    this.addAuditLogEntry(
      'project_updated',
      `Updated project "${updates.name || id}"`,
      JSON.stringify(updates)
    );
    return updated;
  },

  addAuditLogEntry(actionType: string, description: string, details?: string): void {
    const context = this.getPersonalContext();
    const newEntry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      actionType,
      description,
      details,
    };
    context.auditLog = [newEntry, ...context.auditLog.slice(0, 99)]; // Keep latest 100 entries
    this.savePersonalContext(context);
  },

  getDailyRecommendation(): DailyActionRecommendation | null {
    try {
      const data = safeStorage.getItem(CONTEXT_STORAGE_KEYS.DAILY_RECOMMENDATION);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveDailyRecommendation(rec: DailyActionRecommendation): void {
    try {
      safeStorage.setItem(CONTEXT_STORAGE_KEYS.DAILY_RECOMMENDATION, JSON.stringify(rec));
    } catch (e) {
      console.error('[aimContextService] Failed to save daily recommendation:', e);
    }
  },

  /**
   * Generates the structured 7-question Daily Operating System Action Plan:
   * 1. Where am I right now?
   * 2. What changed since my last check-in?
   * 3. What is my highest-priority goal?
   * 4. What is blocking progress?
   * 5. What is today’s one money move?
   * 6. What is one supporting action?
   * 7. What should I intentionally ignore or defer?
   */
  generateDailyRecommendation(
    context: PersonalOperatingContext = this.getPersonalContext(),
    projects: AIMProject[] = this.getProjects(),
    topJobMatch?: JobListing | null
  ): DailyActionRecommendation {
    const activeProjects = projects.filter((p) => p.status === 'active');
    const sortedProjects = (activeProjects.length > 0 ? activeProjects : projects).slice().sort((a, b) => (a.priority || 99) - (b.priority || 99));

    const primaryProject = sortedProjects[0] || null;
    const secondaryProject = sortedProjects[1] || null;

    let moneyMoveTitle = primaryProject ? `Execute next step on ${primaryProject.name}` : 'Define your #1 priority focus and project';
    let moneyMoveWhy = primaryProject
      ? primaryProject.purpose || primaryProject.goal || 'High-priority focus for today.'
      : 'Setting a clear milestone creates concrete daily momentum.';
    let moneyMoveNeeded = primaryProject?.nextAction || 'Open your Projects tab and create your core active objective.';
    let moneyMoveBlocker = primaryProject?.blockers?.[0] || 'Unscheduled time blocks or competing distractions.';
    let moneyMoveDone = primaryProject ? `Complete: ${primaryProject.nextAction}` : 'Logged first active project in AIM.';
    let moneyMoveType: 'recommendation_with_verified_job' | 'recommendation_with_search_action' = 'recommendation_with_search_action';
    let primaryProjectId = primaryProject?.id || 'general-focus';

    // ZERO FABRICATION: Only link a specific job if it is verified, non-mock, and active
    const isVerifiedJob = Boolean(
      topJobMatch &&
      !topJobMatch.is_mock &&
      !topJobMatch.isMock &&
      topJobMatch.status === 'active' &&
      topJobMatch.provenance === 'verified'
    );

    if (isVerifiedJob && topJobMatch) {
      moneyMoveTitle = `Apply to ${topJobMatch.employer} (${topJobMatch.role})`;
      moneyMoveWhy = `${topJobMatch.whyItFits || 'Matches your specified background and qualifications'}. Pay: ${topJobMatch.pay}.`;
      moneyMoveNeeded = `Application requirements: ${topJobMatch.licenseRequired || 'Resume and credentials'}.`;
      moneyMoveBlocker = topJobMatch.watchOuts?.[0] || 'Commute route and schedule alignment.';
      moneyMoveDone = `Completed direct employer application at ${topJobMatch.employer} and logged in History.`;
      moneyMoveType = 'recommendation_with_verified_job';
      if (primaryProject) primaryProjectId = primaryProject.id;
    }

    const supportingTitle = secondaryProject
      ? `Advance supporting project: ${secondaryProject.name}`
      : 'Schedule your focused deep-work time blocks';
    const supportingWhy = secondaryProject
      ? secondaryProject.purpose || secondaryProject.goal || 'Secondary momentum builder.'
      : 'Protecting uninterrupted focus blocks ensures follow-through.';
    const supportingNeeded = secondaryProject?.nextAction || 'Review Daily Planner and allocate calendar blocks.';
    const supportingBlocker = secondaryProject?.blockers?.[0] || 'Context-switching during scheduled blocks.';
    const supportingDone = secondaryProject ? `Completed checkpoint for ${secondaryProject.name}.` : 'Schedule blocks established in Daily Planner.';
    const secondaryProjectId = secondaryProject?.id || 'supporting-focus';

    const deferItems: string[] = [];
    const pausedProjects = projects.filter((p) => p.status === 'paused' || p.status === 'waiting' || p.status === 'blocked');
    for (const p of pausedProjects) {
      deferItems.push(`${p.name} (${p.status}: ${p.blockers?.[0] || 'deferred to protect primary focus'})`);
    }
    if (deferItems.length === 0) {
      deferItems.push('Low-leverage administrative tasks during peak morning energy hours');
      deferItems.push('Speculative opportunities that do not advance today\'s core priorities');
    }

    const whereYouAreText = context.location
      ? `Operating from ${context.location}. Managing ${projects.length} active project(s) and aligned personal operating constraints.`
      : projects.length > 0
      ? `Managing ${projects.length} active project(s) with daily operating priorities configured.`
      : 'Welcome to AIM. Set your core location, transportation, and career preferences in Settings to personalize daily recommendations.';

    const rec: DailyActionRecommendation = {
      whereYouAre: whereYouAreText,
      whatChanged: 'Daily Operating System evaluated current project milestones and priorities.',
      highestPriorityGoal: primaryProject?.goal || 'Establish clear daily momentum on your top priority.',
      blockingProgress: primaryProject?.blockers?.[0] || 'Define concrete next steps to avoid start friction.',
      moneyMove: {
        title: moneyMoveTitle,
        whyBestMove: moneyMoveWhy,
        timeEstimate: '45m',
        whatIsNeeded: moneyMoveNeeded,
        whatCouldBlockIt: moneyMoveBlocker,
        definitionOfDone: moneyMoveDone,
        projectId: primaryProjectId,
      },
      supportingMove: {
        title: supportingTitle,
        whyBestMove: supportingWhy,
        timeEstimate: '30m',
        whatIsNeeded: supportingNeeded,
        whatCouldBlockIt: supportingBlocker,
        definitionOfDone: supportingDone,
        projectId: secondaryProjectId,
      },
      deferForNow: deferItems.slice(0, 4),
      generatedAt: new Date().toISOString(),
      provenance: {
        whereYouAreSource: 'stored_user_data',
        whatChangedSource: 'stored_user_data',
        goalSource: 'stored_user_data',
        moneyMoveSource: isVerifiedJob ? 'verified' : 'user_provided',
        moneyMoveType,
        lastVerifiedAt: new Date().toISOString(),
        isStale: false,
      },
    };

    this.saveDailyRecommendation(rec);
    return rec;
  },

  /**
   * Conflict Detection Engine:
   * Detects when user input contradicts confirmed facts, locked decisions, or existing project status.
   */
  detectConflicts(
    proposedText: string,
    context: PersonalOperatingContext = this.getPersonalContext(),
    projects: AIMProject[] = this.getProjects()
  ): CheckInParseResult {
    const lower = proposedText.toLowerCase();
    const conflicts: string[] = [];
    const detectedProjectChanges: CheckInParseResult['detectedProjectChanges'] = [];
    const detectedContextChanges: CheckInParseResult['detectedContextChanges'] = [];

    // Conflict Check 1: Personal vehicle assumption if user explicitly logged no personal vehicle
    if (
      context.transportation &&
      context.transportation.hasPersonalVehicle === false &&
      (lower.includes('using my car') ||
        lower.includes('use my personal car') ||
        lower.includes('use my vehicle'))
    ) {
      conflicts.push(
        'Stored Qualification: Your profile currently notes you do NOT have a personal vehicle available for work duty. Does this update confirm you acquired a vehicle?'
      );
    }

    // Conflict Check 2: CDL assumption if user does not have CDL
    if (
      context.transportation &&
      context.transportation.cdlQualified === false &&
      (lower.includes('got my cdl') || lower.includes('applying for cdl job'))
    ) {
      conflicts.push(
        'Stored Qualification: Your profile currently notes you do not hold a commercial CDL license. Did you obtain a CDL qualification?'
      );
    }

    // Check project status updates
    for (const proj of projects) {
      if (lower.includes(proj.name.toLowerCase())) {
        if (lower.includes('pause') || lower.includes('put on hold')) {
          detectedProjectChanges.push({
            projectId: proj.id,
            projectName: proj.name,
            proposedStatus: 'paused',
            explanation: `Request to pause project "${proj.name}"`,
            hasConflict: false,
          });
        } else if (lower.includes('finished') || lower.includes('completed') || lower.includes('done')) {
          detectedProjectChanges.push({
            projectId: proj.id,
            projectName: proj.name,
            proposedStatus: 'completed',
            proposedLastAction: proposedText,
            explanation: `Request to mark project "${proj.name}" as completed`,
            hasConflict: proj.priority === 1,
            conflictDescription:
              proj.priority === 1
                ? 'Immediate Income is your highest-priority project. Are you sure you want to mark it completed?'
                : undefined,
          });
        } else if (lower.includes('block') || lower.includes('stuck') || lower.includes('cant')) {
          detectedProjectChanges.push({
            projectId: proj.id,
            projectName: proj.name,
            proposedStatus: 'blocked',
            proposedBlocker: proposedText,
            explanation: `Identified new blocker on "${proj.name}"`,
            hasConflict: false,
          });
        }
      }
    }

    // Specific phrase matches
    if (lower.includes('finished the landing page') || lower.includes('landing page done')) {
      detectedProjectChanges.push({
        projectId: 'proj-brandnmotion',
        projectName: 'BrandNMotion',
        proposedLastAction: 'Finished the landing page.',
        proposedNextAction: 'Launch client outreach with the new landing page.',
        explanation: 'Updated BrandNMotion with completed landing page.',
        hasConflict: false,
      });
    }

    if (lower.includes('applied to the shuttle driver job') || lower.includes('applied to driver job')) {
      detectedProjectChanges.push({
        projectId: 'proj-immediate-income',
        projectName: 'Immediate Income',
        proposedLastAction: 'Submitted application to DFW shuttle driver position.',
        proposedNextAction: 'Follow up with hiring manager within 48 hours.',
        explanation: 'Recorded job application under Immediate Income.',
        hasConflict: false,
      });
    }

    const hasConflict = conflicts.length > 0;
    const summary = hasConflict
      ? `Potential conflict detected with your confirmed operating facts:\n- ${conflicts.join('\n- ')}`
      : `Parsed update: ${proposedText}`;

    return {
      hasConflict,
      conflicts: conflicts.map((c) => ({
        contradiction: c,
        confirmedFact: c,
        source: 'Confirmed Operating Facts',
      })),
      detectedProjectChanges,
      detectedContextChanges,
      isGeneralUpdate: detectedProjectChanges.length === 0 && detectedContextChanges.length === 0,
      userConfirmationRequired: hasConflict || detectedProjectChanges.length > 0,
      summary,
    };
  },
};
