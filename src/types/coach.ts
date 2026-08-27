import { AIMCategory } from './index';

export type CoachId =
  | 'guidance'
  | 'motivation'
  | 'spiritual'
  | 'health'
  | 'relationships';

export type CoachToolName =
  | 'get_daily_schedule'
  | 'get_schedule_range'
  | 'get_relevant_user_context'
  | 'create_life_update_draft'
  | 'propose_schedule_reroute'
  | 'apply_confirmed_schedule_change'
  | 'update_schedule_item_status'
  | 'get_related_resources'
  | 'save_coach_message';

export interface CoachConfig {
  id: CoachId;
  label: string;
  shortLabel: string;
  route: string;
  roleTitle: string;
  subtitle: string;
  systemInstruction: string;
  openingPrompt: string;
  orbVariant: CoachId;
  themeColor: string;
  accentColor: string;
  allowedTools: CoachToolName[];
  safetyRules: string[];
}

export type ScheduleItemStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'skipped'
  | 'missed'
  | 'rescheduled'
  | 'cancelled';

export interface ScheduleItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startAt: string; // ISO UTC string
  endAt: string;   // ISO UTC string
  timeZone: string;
  status: ScheduleItemStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  goalId?: string;
  projectId?: string;
  sourceCoachId?: CoachId;
  relatedResourceIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TodayScheduleSections {
  earlier: ScheduleItem[];
  current: ScheduleItem | null;
  upcoming: ScheduleItem[];
}

export interface GreetingSessionState {
  sessionId: string;
  hasSpokenHomeGreeting: boolean;
  spokenAt?: string;
  lastSpokenText?: string;
}

export type VoiceState =
  | 'idle'
  | 'requesting_permission'
  | 'listening'
  | 'transcribing'
  | 'processing'
  | 'speaking'
  | 'interrupted'
  | 'error';

export type SpeakerState = 'ready' | 'speaking' | 'playing' | 'paused' | 'finished' | 'error';

export type LoadState =
  | 'idle'
  | 'loading'
  | 'success'
  | 'empty'
  | 'offline'
  | 'error';

export interface CoachRecommendedAction {
  label: string;
  reason: string;
  actionType: 'none' | 'open_route' | 'create_proposal' | 'call_tool';
  target?: string;
}

export interface ProposedScheduleChange {
  itemId: string;
  operation: 'reschedule' | 'extend' | 'shorten' | 'skip' | 'add';
  proposedStartAt?: string;
  proposedEndAt?: string;
  title?: string;
}

export interface ScheduleChangeProposal {
  reason: string;
  affectedItemIds: string[];
  proposedChanges: ProposedScheduleChange[];
  requiresConfirmation: true;
}

export interface CoachSafetyNotice {
  category: 'none' | 'medical' | 'self_harm' | 'violence' | 'abuse';
  urgent: boolean;
  message?: string;
}

export interface CoachResponse {
  coachId: CoachId;
  displayText: string;
  spokenText: string;
  intent:
    | 'conversation'
    | 'view_schedule'
    | 'life_update'
    | 'schedule_change'
    | 'goal_update'
    | 'health_safety'
    | 'relationship_safety'
    | 'clarification';
  confidence: number;
  followUpQuestion?: string;
  recommendedActions: CoachRecommendedAction[];
  scheduleChangeProposal?: ScheduleChangeProposal;
  safety?: CoachSafetyNotice;
}

export interface CoachMessage {
  id: string;
  coachId: CoachId;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  spokenText?: string;
  structuredResponse?: CoachResponse;
  timestamp: string;
}

export type GenderPresentation = 'masculine' | 'feminine';

export type USAccentStyle =
  | 'general_american'
  | 'texas'
  | 'southern'
  | 'new_york_city'
  | 'midwestern'
  | 'california_west_coast'
  | 'boston_new_england'
  | 'philadelphia_mid_atlantic'
  | 'appalachian'
  | 'louisiana_gulf_south';

export interface VoiceProfile {
  id: string; // e.g. 'masculine_texas', 'feminine_new_york_city'
  displayName: string;
  accentStyle: USAccentStyle;
  accentTitle: string;
  accentDescription: string;
  genderPresentation: GenderPresentation;
  provider: 'gemini-tts' | 'webspeech' | 'browser';
  providerVoiceId: string;
  geminiVoiceName?: string;
  speakingRate: number;
  pitch: number;
  cadenceDescription: string;
  preferredVoiceNames: string[];
  styleInstructions: string;
}

export interface VoicePreference {
  gender: GenderPresentation;
  accentStyle: USAccentStyle;
  voiceProfileId: string;
  voiceName: string;
  rate: number;
  pitch: number;
  isMuted: boolean;
}
