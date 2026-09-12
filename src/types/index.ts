export type AIMCategory =
  | 'Personal'
  | 'Health'
  | 'Family'
  | 'Relationships'
  | 'Career'
  | 'Business'
  | 'Creative Projects'
  | 'Finances'
  | 'Education'
  | 'Research'
  | 'Goals'
  | 'Journal'
  | 'Ideas'
  | 'Documents'
  | 'Assets'
  | 'Projects';

export const AIM_CATEGORIES: AIMCategory[] = [
  'Business',
  'Finances',
  'Goals',
  'Projects',
  'Ideas',
  'Career',
  'Health',
  'Personal',
  'Creative Projects',
  'Research',
  'Journal',
  'Education',
  'Relationships',
  'Family',
  'Documents',
  'Assets',
];

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  timeZone?: string;
  desiredIdentity: string;
  coreMission: string;
  currentMonthlyIncome: number;
  targetMonthlyIncome: number;
  primaryObstacle: string;
  topSkills: string[];
  coreValues: string[];
  ninetyDayTrajectory: string;
  onboardingCompleted: boolean;
}

export interface MemoryItem {
  id: string;
  title: string;
  content: string;
  category: AIMCategory;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  importance: 'normal' | 'high' | 'critical';
  driveFileId?: string;
  driveUrl?: string;
}

export interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
  targetDate?: string;
}

export interface Goal {
  id: string;
  title: string;
  why: string;
  category: AIMCategory;
  targetDate: string;
  currentProgress: number; // 0 to 100
  obstacles: string[];
  milestones: GoalMilestone[];
  status: 'active' | 'completed' | 'recalculating';
  recalculatedPath?: string;
  revenuePotential?: number;
  createdAt: string;
}

export type LeadStage = 'prospect' | 'contacted' | 'conversation' | 'proposal_sent' | 'paid';

export interface DealPipelineItem {
  id: string;
  clientName: string;
  companyOrNiche: string;
  serviceOffer: string;
  dealValue: number;
  stage: LeadStage;
  notes: string;
  lastContacted: string;
  proposalMarkdown?: string;
  invoiceStatus?: 'unpaid' | 'paid';
  driveExportedUrl?: string;
}

export interface MonetizationOffer {
  id: string;
  title: string;
  hook: string;
  targetNiche: string;
  price: string;
  deliverables: string[];
  pricingTiers: {
    name: string;
    price: string;
    description: string;
  }[];
  coldOutreachScript: string;
  followUpScript: string;
  qualificationQuestions: string[];
  todayActionChecklist: string[];
  urgencyStrategy: string;
  createdAt: string;
}

export interface PriorityTask {
  id: string;
  task: string;
  description?: string; // Detailed step-by-step instructions on what to do
  category: AIMCategory;
  timeEstimate: string;
  impact: 'High' | 'Medium' | 'Low';
  completed: boolean;
}

export interface TimeBlock {
  id: string;
  time: string;
  title: string;
  details: string;
  completed: boolean;
}

export interface DailyPlan {
  date: string;
  theme: string;
  energyLevel: number; // 1-10
  availableHours: number;
  priorityTasks: PriorityTask[];
  timeBlocks: TimeBlock[];
  mindsetReminder: string;
  eveningReflection?: {
    summary: string;
    winsAcknowledged: string[];
    patternsIdentified: string[];
    adjustmentsForTomorrow: string[];
    closingThought: string;
  };
  notes: string;
}

export interface WellnessLog {
  id: string;
  date: string;
  sleepHours: number;
  sleepQuality: number; // 1-10
  movementMinutes: number;
  movementType: string;
  nutritionRating: number; // 1-10
  stressLevel: number; // 1-10
  focusHours: number;
  timeInNatureMinutes: number;
  notes: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'aim';
  content: string;
  timestamp: string;
  category?: AIMCategory;
  suggestedActions?: {
    title: string;
    actionType: 'create_task' | 'add_memory' | 'new_offer' | 'start_plan';
    payload?: any;
  }[];
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  modifiedTime?: string;
}

export interface DriveSyncState {
  isConnected: boolean;
  userEmail: string | null;
  accessToken: string | null;
  lastSyncTime: string | null;
  syncedFiles: GoogleDriveFile[];
  syncFolderId?: string;
  isLoading: boolean;
}

export interface PathwayOption {
  id: string;
  title: string;
  tagline: string;
  pace: string;
  focus: string;
  whyItFits: string;
  actionPlan48h: string[];
  first7DaysMilestones: string[];
  obstaclesNeutralized: string[];
  projected30DayOutcome: string;
}

export interface CrossReferenceResult {
  analysis: {
    coreGapSummary: string;
    hiddenStrengths: string[];
    primaryBottlenecks: string[];
    empoweringInsight: string;
  };
  recommendedOptionId: string;
  recommendedReason: string;
  pathways: PathwayOption[];
  synthesizedProfile: {
    desiredIdentity: string;
    coreMission: string;
    primaryObstacle: string;
    topSkills: string[];
    coreValues: string[];
    ninetyDayTrajectory: string;
  };
  suggestedInitialGoals: {
    title: string;
    category: AIMCategory;
    why: string;
    milestones: string[];
  }[];
  suggestedTodayTasks: {
    task: string;
    category: AIMCategory;
    timeEstimate: string;
    impact: 'High' | 'Medium' | 'Low';
  }[];
}

export * from './coach';

export type LifeUpdateCategory =
  | 'Work and income'
  | 'Money'
  | 'Health and energy'
  | 'Family and relationships'
  | 'Transportation'
  | 'Housing'
  | 'Schedule and availability'
  | 'Goals'
  | 'Projects'
  | 'Creative work'
  | 'Completed achievement'
  | 'Setback or obstacle'
  | 'New opportunity'
  | 'Preference change'
  | 'General life context';

export interface LifeUpdateRevision {
  timestamp: string;
  content: string;
  note?: string;
}

export interface LifeUpdate {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  inputType: 'text' | 'voice';
  originalContent: string;
  voiceTranscript?: string;
  confirmedSummary: string;
  categories: string[];
  entities?: string[];
  affectedGoalIds: string[];
  affectedTaskIds: string[];
  affectedPlanIds: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  userConfirmed: boolean;
  planChangeRequested: boolean;
  rerouteStatus: 'pending' | 'rerouted' | 'no_change_needed' | 'failed' | 'user_declined';
  rerouteExplanation?: string;
  previousPlanSnapshot?: any;
  newPlanSnapshot?: any;
  isPrivate?: boolean;
  revisionHistory?: LifeUpdateRevision[];
  whatChanged?: string[];
  whatWasRemovedOrPaused?: string[];
  newTopPriority?: string;
  nextSpecificAction?: string;
}

export interface LifeUpdateAnalysisResult {
  understandingSummary: string[];
  importantLifeChange: string;
  categories: string[];
  entities: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  affectedGoalIds: string[];
  affectedTaskIds: string[];
  affectedPlanIds: string[];
  conflictsOrUncertainty: string | null;
  planImpact: 'none' | 'minor' | 'major';
  proposedReroute: {
    explanation: string;
    whatChanged: string[];
    whatWasRemovedOrPaused: string[];
    newTopPriority: string;
    nextSpecificAction: string;
    suggestedPriorityTasks: PriorityTask[];
    suggestedTimeBlocks: TimeBlock[];
    updatedGoals?: {
      id?: string;
      title?: string;
      status?: 'active' | 'completed' | 'recalculating';
      recalculatedPath?: string;
    }[];
    updatedProfileFields?: Partial<UserProfile>;
  };
}

export * from './aimContext';
