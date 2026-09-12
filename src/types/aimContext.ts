export type DataProvenanceSource =
  | 'verified'
  | 'user_provided'
  | 'connected_account'
  | 'api_result'
  | 'stored_user_data'
  | 'ai_generated'
  | 'unknown'
  | 'stale'
  | 'demo';

export interface DataVerificationMeta {
  source: DataProvenanceSource;
  sourceType?: 'official_employer' | 'api_provider' | 'user_input' | 'ai_synthesis' | 'demo';
  sourceName?: string;
  sourceUrl?: string;
  retrievedAt?: string;
  verifiedAt?: string;
  lastUpdated?: string;
  confidence?: 'verified' | 'high' | 'provisional' | 'unknown';
  isMock?: boolean;
}

export interface WriteResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  operation: 'create' | 'update' | 'delete' | 'read_back';
  timestamp: string;
}

export interface JobSearchSuggestion {
  id: string;
  title: string;
  employerCategory?: string;
  searchQuery?: string;
  directSearchUrl?: string;
  whyRecommended?: string;
  requirementsNote?: string;
  vehicleNote?: string;
  type?: 'employer_portal' | 'job_search_engine';
  organization?: string;
  location?: string;
  notes?: string;
  vehiclePolicyNote?: string;
  category?: string;
  url?: string;
}

export type AIMProjectStatus =
  | 'active'
  | 'blocked'
  | 'waiting'
  | 'maintenance'
  | 'paused'
  | 'completed';

export type ProjectStatus = AIMProjectStatus;

export interface CheckInConflictResult {
  contradiction: string;
  confirmedFact: string;
  source?: string;
}

export interface ProposedProjectUpdate {
  projectId: string;
  projectName: string;
  proposedStatus?: AIMProjectStatus;
  proposedLastAction?: string;
  proposedNextAction?: string;
  proposedBlocker?: string;
  explanation: string;
  hasConflict?: boolean;
  conflictDescription?: string;
}

export interface AIMProject {
  id: string;
  name: string;
  goal: string;
  purpose: string;
  status: AIMProjectStatus;
  phase: string;
  priority: number; // 1 is highest priority (Immediate Income = 1)
  progress: number; // 0 to 100
  whatChanged: string;
  lastCompletedAction: string;
  blockers: string[];
  nextAction: string;
  collaborators: string[];
  lastUpdated: string;
  notes: string;
  category?: string;
}

export type VehiclePolicyType =
  | 'employer_provided_on_duty'
  | 'take_home'
  | 'personal_required'
  | 'unknown';

export interface VehiclePolicyDetails {
  type: VehiclePolicyType;
  label: string;
  commuteEligible: boolean;
  explanation: string;
}

export type JobFitRating =
  | 'strong_fit'
  | 'possible_fit'
  | 'conditional_fit'
  | 'poor_fit'
  | 'excluded';

export interface JobListing {
  id: string;
  employer: string;
  normalizedEmployer: string;
  role: string;
  normalizedRole: string;
  location: string;
  normalizedLocation: string;
  isExpandedRadius: boolean;
  pay: string;
  schedule: string;
  employmentType: string;
  vehiclePolicy: VehiclePolicyType;
  vehicleExplanation: string; // Explains on-duty vs take-home vs personal
  licenseRequired: string;
  cdlRequired: boolean;
  drivingHistoryReq: string;
  minimumLicenseTenureMonths: number;
  physicalRequirements: string;
  liftingRequirements: string;
  customerFacingDuties: string;
  applicationDeadline?: string;
  postingDate: string;
  dateLastVerified: string;
  directApplicationUrl: string;
  sourceUrl: string;
  sourceType: 'official_employer' | 'aggregator';
  sourceName: string;
  fitRating: JobFitRating;
  fitReason: string;
  watchOuts: string[];
  whyItFits: string;
  listingHash: string; // Deduplication hash: normalizedEmployer:normalizedRole:normalizedLocation
  firstSeenDate: string;
  lastSeenDate: string;
  status: 'active' | 'stale' | 'expired';
  isMock?: boolean;
  is_mock?: boolean;
  provenance?: DataProvenanceSource;
  retrievedAt?: string;
  verifiedAt?: string;
  sourceProvider?: string;
  priorPay?: string;
  priorRequirements?: string;
  priorSchedule?: string;
  materialChangeSummary?: string;
  appliedDate?: string;
  appliedNotes?: string;
}

export interface JobScanRun {
  id: string;
  scanStartTime: string;
  scanCompletionTime: string;
  sourcesSearched: string[];
  candidatesFound: number;
  excludedCount: number;
  newMatchesCount: number;
  materialChangesCount: number;
  status: 'success' | 'failed' | 'running';
  errorMessage?: string;
  isWeekdayScheduled: boolean;
  summaryMessage: string;
  searchRadiusMiles: number;
  searchCenter: string;
  isMock?: boolean;
  liveProviderConnected?: boolean;
}

export interface JobMaterialChange {
  id: string;
  listingId: string;
  employer: string;
  role: string;
  changeType: 'pay' | 'schedule' | 'requirements' | 'vehicle_policy' | 'reactivated';
  oldValue: string;
  newValue: string;
  summary: string;
  detectedAt: string;
}

export interface PersonalOperatingContext {
  location: string;
  searchRadiusMiles: number;
  hasPersonalVehicle?: boolean;
  needsEmployerVehicle?: boolean;
  driverLicenseType?: string;
  cleanDrivingRecord?: boolean;
  licenseReissueDateNote?: string;
  historicalDrivingExperience?: string;
  autoScanWeekdays?: boolean;
  scanTime?: string;
  transportation: {
    hasPersonalVehicle: boolean;
    needsEmployerVehicle: boolean;
    driverLicenseType: string;
    cleanDrivingRecord: boolean;
    licenseReissueDate: string;
    apparentHistoryUnderOneYear: boolean;
    historicalDrivingExp: string;
    cdlQualified: boolean;
  };
  workPreferences: {
    avoidPersonalVehicle: boolean;
    avoidCDL: boolean;
    avoidHeavyLifting: boolean;
    avoidWarehouseLabor: boolean;
    avoidConstruction: boolean;
    avoidPrimaryManualLabor: boolean;
    preferCustomerFacing: boolean;
    preferShuttleTransport: boolean;
    preferFleetDelivery: boolean;
    incomeUrgency: 'immediate' | 'medium' | 'low';
  };
  confirmedFacts: string[];
  inferredInfo: string[];
  unknownInfo: string[];
  lockedDecisions: string[];
  auditLog: Array<{
    id: string;
    timestamp: string;
    actionType?: string;
    eventType?: string;
    description: string;
    details?: string;
  }>;
}

export interface DailyActionRecommendation {
  whereYouAre: string;
  whatChanged: string;
  highestPriorityGoal: string;
  blockingProgress: string;
  moneyMove: {
    title: string;
    whyBestMove: string;
    timeEstimate: string;
    whatIsNeeded: string;
    whatCouldBlockIt: string;
    definitionOfDone: string;
    projectId: string;
  };
  supportingMove: {
    title: string;
    whyBestMove: string;
    timeEstimate: string;
    whatIsNeeded: string;
    whatCouldBlockIt?: string;
    definitionOfDone: string;
    projectId: string;
  };
  deferForNow: string[];
  generatedAt: string;
  provenance?: {
    whereYouAreSource: DataProvenanceSource;
    whatChangedSource: DataProvenanceSource;
    goalSource: DataProvenanceSource;
    moneyMoveSource: DataProvenanceSource;
    moneyMoveType: 'recommendation_with_verified_job' | 'recommendation_with_search_action';
    lastVerifiedAt: string;
    isStale: boolean;
  };
}

export interface CheckInParseResult {
  hasConflict?: boolean;
  conflicts?: CheckInConflictResult[];
  detectedProjectChanges?: Array<{
    projectId: string;
    projectName: string;
    proposedStatus?: AIMProjectStatus;
    proposedLastAction?: string;
    proposedNextAction?: string;
    proposedBlocker?: string;
    explanation: string;
    hasConflict: boolean;
    conflictDescription?: string;
  }>;
  detectedContextChanges?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    explanation: string;
    hasConflict: boolean;
    conflictDescription?: string;
  }>;
  suggestedMoneyMoveUpdate?: string;
  isGeneralUpdate: boolean;
  userConfirmationRequired: boolean;
  summary: string;
}
