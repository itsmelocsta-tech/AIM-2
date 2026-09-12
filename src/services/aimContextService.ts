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
  location: 'Fort Worth, Texas',
  searchRadiusMiles: 35, // Encompasses Fort Worth, Arlington, Dallas, Irving, Grapevine, Carrollton, Las Colinas, DFW Airport
  hasPersonalVehicle: false,
  needsEmployerVehicle: true,
  driverLicenseType: 'Texas non-CDL Class C',
  cleanDrivingRecord: true,
  licenseReissueDateNote: 'August 2026',
  historicalDrivingExperience: 'Passenger and chauffeur driving experience through The Ride Guys (approx. 2019–2022)',
  autoScanWeekdays: true,
  scanTime: '07:30 AM',
  transportation: {
    hasPersonalVehicle: false,
    needsEmployerVehicle: true,
    driverLicenseType: 'Texas non-CDL Class C',
    cleanDrivingRecord: true,
    licenseReissueDate: 'August 2026',
    apparentHistoryUnderOneYear: true,
    historicalDrivingExp: 'Passenger and chauffeur driving experience through The Ride Guys (approx. 2019–2022)',
    cdlQualified: false,
  },
  workPreferences: {
    avoidPersonalVehicle: true,
    avoidCDL: true,
    avoidHeavyLifting: true,
    avoidWarehouseLabor: true,
    avoidConstruction: true,
    avoidPrimaryManualLabor: true,
    preferCustomerFacing: true,
    preferShuttleTransport: true,
    preferFleetDelivery: true,
    incomeUrgency: 'immediate',
  },
  confirmedFacts: [
    'Resident of Fort Worth, Texas; searches within the DFW metro area (Fort Worth, Arlington, Dallas, Irving, Grapevine, DFW Airport)',
    'Texas non-CDL Class C driver license (clean driving record, no major violations)',
    'License was reissued in early August 2026 (license card issue date appears under 1 year, but actual driving history spans multiple years)',
    'Passenger/chauffeur professional driving experience with The Ride Guys from approx. 2019–2022',
    'Currently does not own a personal vehicle; cannot provide personal vehicle for work',
    'For driving roles, requires an employer-provided vehicle for work duty',
    'Distinguish between: (1) employer-provided vehicle for on-duty work only, (2) take-home company vehicle, and (3) personal-owned vehicle. Never assume work vehicle is available for commuting.',
    'Disallowed roles: CDL required, personal vehicle required, heavy lifting, warehouse work, construction, primary manual labor, substantial patient lifting',
    'Preferred roles: customer-facing driving, shuttle driver, passenger transportation, route driver, fleet driver, rental-car movement, customer-facing delivery, light medical/pharmacy delivery, field service with employer vehicle',
    'Immediate income must be prioritized over long-term speculative projects',
    'Everfleet has a ~$340 deposit blocker and license-age review hurdle; do not recommend as immediate action until resolved',
    'Amber and Cisco collaborate on Hustle N Found; source of truth is Google Drive Hustle N Found Hub',
  ],
  inferredInfo: [
    'Public transit, rideshare, or local transportation rides needed to commute to employer vehicle dispatch base',
    'Highest probability immediate income is local Fort Worth / Arlington / DFW Airport passenger shuttles, rental fleet logistics, or light route delivery with company vehicle',
  ],
  unknownInfo: [
    'Exact employer documentation or W-2/1099 verification for 2019-2022 Ride Guys passenger driving if requested by commercial underwriters',
    'Current credit/capital status for Everfleet $340 onboarding deposit',
  ],
  lockedDecisions: [
    'Never auto-apply to jobs or contact employers without explicit user review and approval',
    'Never recommend personal-vehicle or CDL jobs',
    'Do not recommend Everfleet as immediate action while deposit and license blockers remain unresolved',
    'Require user confirmation before changing core qualifications, priorities, or project statuses',
  ],
  auditLog: [
    {
      id: 'log-init-1',
      timestamp: '2026-09-07T10:00:00.000Z',
      actionType: 'context_initialized',
      eventType: 'context_initialized',
      description: 'Initialized persistent personal context for Fort Worth, TX driver & builder operating profile',
    },
  ],
};

export const DEFAULT_AIM_PROJECTS: AIMProject[] = [
  {
    id: 'proj-immediate-income',
    name: 'Immediate Income',
    goal: 'Obtain realistic income as soon as possible.',
    purpose: 'Company-vehicle jobs, transportation work, Everfleet, and practical immediate income opportunities.',
    status: 'active',
    phase: 'Execution',
    priority: 1, // Highest current priority
    progress: 30,
    whatChanged: 'Scanning Fort Worth and DFW area for verified employer-provided vehicle driver and shuttle roles.',
    lastCompletedAction: 'Defined exact driver qualifications (Texas non-CDL Class C, clean record, 2019-2022 chauffeur experience).',
    blockers: [
      'No personal vehicle (must be employer-provided vehicle on duty)',
      'License reissued Aug 2026 may appear under 1 yr to automated ATS filters',
    ],
    nextAction: 'Review and submit direct employer application for the highest-ranked Fort Worth/DFW company-vehicle shuttle or delivery job.',
    collaborators: ['Self'],
    lastUpdated: '2026-09-07T12:00:00.000Z',
    notes: 'Prioritize fast cash speed and realistic commute feasibility without a personal car.',
    category: 'Career',
  },
  {
    id: 'proj-ride-guys-detail',
    name: 'Ride Guys Auto Detail',
    goal: 'Build and grow an auto-detailing business.',
    purpose: 'High-margin mobile and direct automotive detailing services.',
    status: 'active',
    phase: 'Setup & Outreach',
    priority: 2,
    progress: 20,
    whatChanged: 'Service menu and pricing structure under review; preparing initial client outreach.',
    lastCompletedAction: 'Outlined core packages: Interior Deep Clean, Exterior Paint Protection, Full Reset.',
    blockers: [
      'Currently no active clients',
      'Needs website, order flow, and digital payment acceptance',
      'Needs clear service pricing and customer outreach plan',
    ],
    nextAction: 'Finalize 3 tiered service packages and send outreach offer to 5 local vehicle owners or dealership contacts.',
    collaborators: ['Self'],
    lastUpdated: '2026-09-07T11:30:00.000Z',
    notes: 'Can generate immediate cash flow once initial 2-3 recurring clients are secured.',
    category: 'Business',
  },
  {
    id: 'proj-brandnmotion',
    name: 'BrandNMotion',
    goal: 'Create a productized AI content and creative service.',
    purpose: 'Productized creative engine delivering video, branding, and content sprints for businesses.',
    status: 'active',
    phase: 'Packaging',
    priority: 3,
    progress: 25,
    whatChanged: 'Service tiers mapped out; targeting founders and creators who need fast turnkey content.',
    lastCompletedAction: 'Drafted sample deliverables and rapid turnaround promise.',
    blockers: [
      'Needs clear, one-sentence productized offer',
      'Needs sample portfolio landing page',
      'Needs outreach automation pipeline',
    ],
    nextAction: 'Build a 1-page offer document and draft 3 personalized cold outreach hooks for local DFW brands.',
    collaborators: ['Self'],
    lastUpdated: '2026-09-07T11:00:00.000Z',
    notes: 'High margin, remote-capable, high leverage.',
    category: 'Business',
  },
  {
    id: 'proj-cool-fruit-truck',
    name: 'Cool Fruit Truck',
    goal: 'Launch a DFW mobile fresh-fruit business.',
    purpose: 'Health-forward mobile fresh-fruit, smoothie, and snack truck across DFW high-traffic hubs.',
    status: 'paused',
    phase: 'Research & Financing',
    priority: 4,
    progress: 15,
    whatChanged: 'Paused active execution to preserve focus and capital while evaluating loan package.',
    lastCompletedAction: 'Researched business economics and preliminary commissary requirements.',
    blockers: [
      'Evaluating feasibility and repayment risk of a $60,000 loan package',
      'Requires truck acquisition, permits, and refrigeration equipment',
      'Temporarily paused in favor of immediate income generation',
    ],
    nextAction: 'Keep business model and permit research on file; revisit loan evaluation once steady monthly income is restored.',
    collaborators: ['Self'],
    lastUpdated: '2026-09-07T10:45:00.000Z',
    notes: 'Healthy long-term asset, but requires upfront capital and stable baseline income first.',
    category: 'Business',
  },
  {
    id: 'proj-aim',
    name: 'AIM',
    goal: 'Build this AI-powered personal life operating system.',
    purpose: 'A persistent life operating system turning goals, constraints, and opportunities into focused daily moves.',
    status: 'active',
    phase: 'Development',
    priority: 5,
    progress: 70,
    whatChanged: 'Implementing persistent context engine, job opportunity scanner, project tracking, and daily action engine.',
    lastCompletedAction: 'Architected non-vague task guidance engine and voice/chat intelligence layers.',
    blockers: [],
    nextAction: 'Continue testing the zero-fabrication job scanner against live external endpoints and local caches.',
    collaborators: ['Self', 'AI Engineering Partner'],
    lastUpdated: '2026-09-07T13:00:00.000Z',
    notes: 'The core operating foundation for all other personal and business projects.',
    category: 'Projects',
  },
  {
    id: 'proj-into-it',
    name: 'Into It / N2IT',
    goal: 'Produce an animated feature.',
    purpose: 'Kid-friendly, comedic animated feature film with vibrant characters and heartwarming storytelling.',
    status: 'active',
    phase: 'Pre-Production',
    priority: 6,
    progress: 40,
    whatChanged: 'Scripts and character bible are established.',
    lastCompletedAction: 'Completed core character bible and story outline.',
    blockers: [
      'Balancing production time with immediate income requirements',
      'Need dedicated rendering/prompting blocks',
    ],
    nextAction: 'Draft thumbnail storyboard sequence and prompt bible for opening comedy sequence.',
    collaborators: ['Creative Team'],
    lastUpdated: '2026-09-07T09:30:00.000Z',
    notes: 'Keep tone kid-friendly, playful, and comedic.',
    category: 'Creative Projects',
  },
  {
    id: 'proj-hustle-n-found',
    name: 'Hustle N Found',
    goal: 'Build a resale business with Amber.',
    purpose: 'Resale, sourcing, and live-selling business leveraging Whatnot and multi-platform commerce.',
    status: 'active',
    phase: 'Operations',
    priority: 7,
    progress: 45,
    whatChanged: 'Source of truth maintained in Hustle N Found Hub in Google Drive.',
    lastCompletedAction: 'Confirmed team roles: Amber handles photos, listings, and branding; Cisco handles sourcing, inventory, live support, and packing.',
    blockers: [
      'Need to schedule and inventory lots for the next Whatnot live sale',
      'Organizing packing materials and shipping station',
    ],
    nextAction: 'Sync Google Drive Hub catalog, verify 15 sourced items ready for listing, and schedule live support block.',
    collaborators: ['Amber', 'Cisco'],
    lastUpdated: '2026-09-07T10:15:00.000Z',
    notes: 'Track catalog, images, listings, and Whatnot workflow through Drive Hub.',
    category: 'Business',
  },
  {
    id: 'proj-everfleet',
    name: 'Everfleet',
    goal: 'Use a vehicle-based work opportunity.',
    purpose: 'Commercial fleet access for flexible courier and route income.',
    status: 'blocked',
    phase: 'Onboarding Review',
    priority: 8,
    progress: 20,
    whatChanged: 'Identified concrete financial and licensing blockers; paused as immediate action.',
    lastCompletedAction: 'Reviewed onboarding terms and vehicle security requirements.',
    blockers: [
      'Approximately $340 upfront deposit requirement',
      'Possible gig-account/license-age restrictions (reissued license in Aug 2026)',
    ],
    nextAction: 'Contact Everfleet driver onboarding support to clarify if 2019-2022 chauffeur history satisfies underwriting before paying deposit.',
    collaborators: ['Self'],
    lastUpdated: '2026-09-07T11:45:00.000Z',
    notes: 'CRITICAL: Do NOT recommend this as an immediate daily action until the deposit and license blockers are confirmed solvable.',
    category: 'Career',
  },
  {
    id: 'proj-ride-guys-second-chance',
    name: 'Ride Guys second-chance rideshare',
    goal: 'Explore a future relaunch or second-chance rideshare concept.',
    purpose: 'Ethical, second-chance transportation model providing fair driver opportunities and reliable rides.',
    status: 'paused',
    phase: 'Concept & Groundwork',
    priority: 9,
    progress: 10,
    whatChanged: 'Stored in idea vault; paused to focus all immediate energy on cash generation.',
    lastCompletedAction: 'Documented core mission and driver incentive model.',
    blockers: [
      'Requires substantial insurance, vehicle fleet, and regulatory compliance capital',
      'High operational complexity',
    ],
    nextAction: 'Keep concept blueprints in Memory Vault; review quarterly after baseline cash flow is established.',
    collaborators: ['Self'],
    lastUpdated: '2026-09-07T08:00:00.000Z',
    notes: 'Long-term vision. Groundwork only right now.',
    category: 'Creative Projects',
  },
  {
    id: 'proj-dds-app',
    name: 'DDS app',
    goal: 'Develop the blueprint for another app or product concept.',
    purpose: 'Proprietary application blueprint and system design.',
    status: 'waiting',
    phase: 'Blueprint Planning',
    priority: 10,
    progress: 15,
    whatChanged: 'Blueprint notes logged in storage.',
    lastCompletedAction: 'Outlined initial feature architecture and user flow diagram.',
    blockers: [
      'Awaiting completion of AIM core release and Immediate Income milestone',
    ],
    nextAction: 'Maintain architectural outline in project notes; defer active coding until immediate income goal is hit.',
    collaborators: ['Self'],
    lastUpdated: '2026-09-07T08:30:00.000Z',
    notes: 'Planning and blueprint stage only.',
    category: 'Projects',
  },
];

export const aimContextService = {
  getContext(): PersonalOperatingContext {
    return this.getPersonalContext();
  },

  saveContext(context: PersonalOperatingContext): void {
    this.savePersonalContext(context);
  },

  getPersonalContext(): PersonalOperatingContext {
    try {
      const data = localStorage.getItem(CONTEXT_STORAGE_KEYS.PERSONAL_CONTEXT);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...DEFAULT_PERSONAL_CONTEXT,
          ...parsed,
          hasPersonalVehicle: parsed.hasPersonalVehicle ?? parsed.transportation?.hasPersonalVehicle ?? false,
          needsEmployerVehicle: parsed.needsEmployerVehicle ?? parsed.transportation?.needsEmployerVehicle ?? true,
          driverLicenseType: parsed.driverLicenseType || parsed.transportation?.driverLicenseType || 'Texas non-CDL Class C',
          cleanDrivingRecord: parsed.cleanDrivingRecord ?? parsed.transportation?.cleanDrivingRecord ?? true,
          licenseReissueDateNote: parsed.licenseReissueDateNote || parsed.transportation?.licenseReissueDate || 'August 2026',
          historicalDrivingExperience: parsed.historicalDrivingExperience || parsed.transportation?.historicalDrivingExp || 'Passenger and chauffeur driving experience through The Ride Guys (approx. 2019–2022)',
          autoScanWeekdays: parsed.autoScanWeekdays ?? true,
          scanTime: parsed.scanTime || '07:30 AM',
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
      localStorage.setItem(CONTEXT_STORAGE_KEYS.PERSONAL_CONTEXT, JSON.stringify(context));
    } catch (e) {
      console.error('[aimContextService] Failed to save context:', e);
    }
  },

  getProjects(): AIMProject[] {
    try {
      const data = localStorage.getItem(CONTEXT_STORAGE_KEYS.PROJECTS);
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
      localStorage.setItem(CONTEXT_STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
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
      const data = localStorage.getItem(CONTEXT_STORAGE_KEYS.DAILY_RECOMMENDATION);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveDailyRecommendation(rec: DailyActionRecommendation): void {
    try {
      localStorage.setItem(CONTEXT_STORAGE_KEYS.DAILY_RECOMMENDATION, JSON.stringify(rec));
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
    const immediateIncomeProject = projects.find((p) => p.id === 'proj-immediate-income') || projects[0];
    const rideGuysProject = projects.find((p) => p.id === 'proj-ride-guys-detail') || projects[1];

    let moneyMoveTitle = 'Search Fort Worth verified company-vehicle driver positions';
    let moneyMoveWhy = 'Immediate income is your highest-priority objective. Searching verified employer-provided vehicle roles on official careers portals requires $0 upfront capital.';
    let moneyMoveNeeded = 'Texas non-CDL Class C driver license, clean driving history record, contact phone/email.';
    let moneyMoveBlocker = 'Lack of personal vehicle requires verifying that the employer provides the vehicle on duty.';
    let moneyMoveDone = 'Submit 1 direct application via official employer career portal with confirmation number.';
    let moneyMoveType: 'recommendation_with_verified_job' | 'recommendation_with_search_action' = 'recommendation_with_search_action';

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
      moneyMoveWhy = `${topJobMatch.whyItFits || 'Employer provides vehicle on-duty'}. Pay: ${topJobMatch.pay}.`;
      moneyMoveNeeded = `Texas Class C license, direct application link, resume highlighting The Ride Guys passenger driving.`;
      moneyMoveBlocker = topJobMatch.watchOuts?.[0] || 'Commute to vehicle dispatch location.';
      moneyMoveDone = `Completed direct employer application at ${topJobMatch.employer} and logged in AIM History.`;
      moneyMoveType = 'recommendation_with_verified_job';
    }

    const rec: DailyActionRecommendation = {
      whereYouAre:
        'You are based in Fort Worth, Texas, with a clean driving record and Texas Class C license. You need immediate income, require an employer-provided vehicle for work, and are actively managing 10 prioritized ventures.',
      whatChanged:
        'Opportunity Scanner refreshed DFW company-vehicle driving opportunities. Project priorities ranked with Immediate Income leading.',
      highestPriorityGoal:
        'Secure reliable immediate income through an employer-provided vehicle driving or shuttle position in the Fort Worth / DFW area.',
      blockingProgress:
        'Lack of personal vehicle requires 100% employer-provided work vehicle; Everfleet remains blocked by $340 deposit requirement.',
      moneyMove: {
        title: moneyMoveTitle,
        whyBestMove: moneyMoveWhy,
        timeEstimate: '45m',
        whatIsNeeded: moneyMoveNeeded,
        whatCouldBlockIt: moneyMoveBlocker,
        definitionOfDone: moneyMoveDone,
        projectId: immediateIncomeProject.id,
      },
      supportingMove: {
        title: 'Draft Ride Guys Auto Detail 3-tier pricing and outreach script',
        whyBestMove:
          'Building your own client-funded service generates local cash flow and pairs directly with your automotive expertise.',
        timeEstimate: '30m',
        whatIsNeeded: 'Target pricing sheet ($150-$350 tiers) and a 3-sentence text message offer.',
        whatCouldBlockIt: 'Over-complicating website setup before securing first paying client.',
        definitionOfDone: 'Pricing sheet written down and ready to text to 3 personal or business contacts.',
        projectId: rideGuysProject.id,
      },
      deferForNow: [
        'Everfleet ($340 deposit and license review required — defer until capital is secured)',
        'Cool Fruit Truck ($60,000 loan package evaluation — paused to prioritize immediate cash)',
        'Ride Guys second-chance rideshare (concept only — defer fleet and software build)',
        'DDS app (blueprint stage — defer active coding until income baseline is stabilized)',
      ],
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

    // Conflict Check 1: Personal vehicle assumption
    if (
      lower.includes('using my car') ||
      lower.includes('use my personal car') ||
      lower.includes('bought a car') ||
      lower.includes('use my vehicle')
    ) {
      conflicts.push(
        'Confirmed Fact: You currently do NOT have a personal vehicle and require an employer-provided vehicle. Does this update confirm you acquired a personal vehicle?'
      );
    }

    // Conflict Check 2: CDL assumption
    if (lower.includes('got my cdl') || lower.includes('applying for cdl job')) {
      conflicts.push(
        'Stored Qualification: You hold a Texas non-CDL Class C license. Did you obtain a commercial CDL license?'
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
