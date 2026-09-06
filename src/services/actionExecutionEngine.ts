import {
  AIMAction,
  DailyPlan,
  Goal,
  MemoryItem,
  LifeUpdate,
  UserProfile,
  ScheduleItem,
  ScheduleItemStatus,
} from '../types';
import { scheduleRepository } from './repositories/scheduleRepository';
import { storageService } from './storage';
import { getEffectiveTimeZone, getTodayDateString, createUtcIsoFromLocal } from '../utils/dateTimeUtils';
import { ensureDetailedTaskGuidance } from '../utils/taskGuidance';

export interface ActionExecutionContext {
  userProfile: UserProfile;
  dailyPlan: DailyPlan;
  goals: Goal[];
  memories: MemoryItem[];
  lifeUpdates: LifeUpdate[];
  onUpdateDailyPlan?: (plan: DailyPlan) => void;
  onUpdateGoals?: (goals: Goal[]) => void;
  onUpdateMemories?: (memories: MemoryItem[]) => void;
  onUpdateLifeUpdates?: (updates: LifeUpdate[]) => void;
  onUpdateProfile?: (profile: UserProfile) => void;
  onToast?: (msg: string) => void;
}

export interface ActionExecutionResult {
  executedCount: number;
  successfulActions: AIMAction[];
  failedActions: AIMAction[];
  summary: string[];
}

export class ActionExecutionEngine {
  private static instance: ActionExecutionEngine;

  public static getInstance(): ActionExecutionEngine {
    if (!ActionExecutionEngine.instance) {
      ActionExecutionEngine.instance = new ActionExecutionEngine();
    }
    return ActionExecutionEngine.instance;
  }

  public async executeActions(
    actions: AIMAction[],
    context: ActionExecutionContext
  ): Promise<ActionExecutionResult> {
    if (!actions || actions.length === 0) {
      return { executedCount: 0, successfulActions: [], failedActions: [], summary: [] };
    }

    const successfulActions: AIMAction[] = [];
    const failedActions: AIMAction[] = [];
    const summary: string[] = [];

    const effectiveTz = getEffectiveTimeZone(context.userProfile.timeZone);
    const todayStr = getTodayDateString(effectiveTz);
    const userId = context.userProfile.id || 'default_user';

    let currentPlan = { ...context.dailyPlan };
    let currentGoals = [...context.goals];
    let currentMemories = [...context.memories];
    let currentLifeUpdates = [...context.lifeUpdates];
    let currentProfile = { ...context.userProfile };

    let planModified = false;
    let goalsModified = false;
    let memoriesModified = false;
    let lifeUpdatesModified = false;
    let profileModified = false;

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'createTask': {
            const taskText = action.payload?.task || action.payload?.title || action.payload?.name || 'New task';
            const category = action.payload?.category || 'Personal';
            const impact = action.payload?.impact || 'High';
            const timeEstimate = action.payload?.timeEstimate || '45m';
            const description = ensureDetailedTaskGuidance(taskText, action.payload?.description);

            const newTask = {
              id: 'pt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
              task: taskText,
              description,
              category,
              timeEstimate,
              impact,
              completed: false,
            };

            currentPlan.priorityTasks = [...currentPlan.priorityTasks, newTask];
            planModified = true;
            summary.push(`Added task: "${taskText}"`);
            successfulActions.push({ ...action, executed: true, status: 'success' });
            break;
          }

          case 'updateTask': {
            const taskId = action.payload?.taskId || action.payload?.id;
            const taskQuery = action.payload?.query || action.payload?.title;
            const newText = action.payload?.task || action.payload?.title;

            currentPlan.priorityTasks = currentPlan.priorityTasks.map((t) => {
              const matches = (taskId && t.id === taskId) || (taskQuery && t.task.toLowerCase().includes(taskQuery.toLowerCase()));
              if (matches) {
                const finalTitle = newText || t.task;
                return {
                  ...t,
                  task: finalTitle,
                  description: action.payload?.description
                    ? ensureDetailedTaskGuidance(finalTitle, action.payload.description)
                    : ensureDetailedTaskGuidance(finalTitle, t.description),
                  impact: action.payload?.impact || t.impact,
                  category: action.payload?.category || t.category,
                  timeEstimate: action.payload?.timeEstimate || t.timeEstimate,
                };
              }
              return t;
            });

            planModified = true;
            summary.push(`Updated task details in Daily Plan`);
            successfulActions.push({ ...action, executed: true, status: 'success' });
            break;
          }

          case 'completeTask': {
            const taskId = action.payload?.taskId || action.payload?.id;
            const taskQuery = action.payload?.query || action.payload?.title || action.payload?.task;

            let completedTitle = '';
            currentPlan.priorityTasks = currentPlan.priorityTasks.map((t) => {
              const matches = (taskId && t.id === taskId) || (taskQuery && t.task.toLowerCase().includes(taskQuery.toLowerCase()));
              if (matches) {
                completedTitle = t.task;
                return { ...t, completed: true };
              }
              return t;
            });

            planModified = true;
            summary.push(`Marked task complete: "${completedTitle || 'Task'}"`);
            successfulActions.push({ ...action, executed: true, status: 'success' });
            break;
          }

          case 'rescheduleTask': {
            const taskId = action.payload?.taskId || action.payload?.id;
            const taskQuery = action.payload?.query || action.payload?.title;
            const newTime = action.payload?.newTime || action.payload?.time;

            // Update daily plan timeblock or task note
            if (newTime) {
              summary.push(`Rescheduled "${taskQuery || 'Task'}" to ${newTime}`);
            } else {
              summary.push(`Moved "${taskQuery || 'Task'}" to tomorrow's plan`);
            }

            // Also check scheduleRepository for matching schedule item
            const schedule = await scheduleRepository.getDailySchedule({ userId, timeZone: effectiveTz });
            const matchingItem = schedule.find(
              (s) => (taskId && s.id === taskId) || (taskQuery && s.title.toLowerCase().includes(taskQuery.toLowerCase()))
            );

            if (matchingItem && newTime) {
              const start24 = newTime.includes(':') ? newTime.split(' - ')[0].trim() : '14:00';
              const end24 = newTime.includes(' - ') ? newTime.split(' - ')[1].trim() : '15:00';
              matchingItem.startAt = createUtcIsoFromLocal(todayStr, start24, effectiveTz);
              matchingItem.endAt = createUtcIsoFromLocal(todayStr, end24, effectiveTz);
              matchingItem.status = 'rescheduled';
              await scheduleRepository.saveScheduleItem(matchingItem);
            }

            successfulActions.push({ ...action, executed: true, status: 'success' });
            break;
          }

          case 'removeTask': {
            const taskId = action.payload?.taskId || action.payload?.id;
            const taskQuery = action.payload?.query || action.payload?.title;

            currentPlan.priorityTasks = currentPlan.priorityTasks.filter((t) => {
              if (taskId && t.id === taskId) return false;
              if (taskQuery && t.task.toLowerCase().includes(taskQuery.toLowerCase())) return false;
              return true;
            });

            planModified = true;
            summary.push(`Removed task from plan`);
            successfulActions.push({ ...action, executed: true, status: 'success' });
            break;
          }

          case 'createScheduleBlock':
          case 'createAppointment': {
            const title = action.payload?.title || action.payload?.name || 'Scheduled Block';
            const startTime = action.payload?.startTime || action.payload?.start || '14:00';
            const endTime = action.payload?.endTime || action.payload?.end || '15:00';
            const description = ensureDetailedTaskGuidance(title, action.payload?.description);
            const priority = action.payload?.priority || 'high';

            const newItem: ScheduleItem = {
              id: `sched-${todayStr}-${Date.now().toString(36)}`,
              userId,
              title,
              description,
              startAt: createUtcIsoFromLocal(todayStr, startTime, effectiveTz),
              endAt: createUtcIsoFromLocal(todayStr, endTime, effectiveTz),
              timeZone: effectiveTz,
              status: 'scheduled',
              priority,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            await scheduleRepository.saveScheduleItem(newItem);
            summary.push(`Scheduled "${title}" at ${startTime} - ${endTime}`);
            successfulActions.push({ ...action, executed: true, status: 'success' });
            break;
          }

          case 'updateScheduleBlock': {
            const blockId = action.payload?.id || action.payload?.blockId;
            const titleQuery = action.payload?.query || action.payload?.title;

            const schedule = await scheduleRepository.getDailySchedule({ userId, timeZone: effectiveTz });
            const item = schedule.find(
              (s) => (blockId && s.id === blockId) || (titleQuery && s.title.toLowerCase().includes(titleQuery.toLowerCase()))
            );

            if (item) {
              if (action.payload?.status) item.status = action.payload.status as ScheduleItemStatus;
              if (action.payload?.title) item.title = action.payload.title;
              if (action.payload?.description) {
                item.description = ensureDetailedTaskGuidance(item.title, action.payload.description);
              }
              if (action.payload?.priority) item.priority = action.payload.priority;
              await scheduleRepository.saveScheduleItem(item);
              summary.push(`Updated schedule block: "${item.title}"`);
              successfulActions.push({ ...action, executed: true, status: 'success' });
            }
            break;
          }

          case 'rescheduleScheduleBlock': {
            const blockId = action.payload?.id || action.payload?.blockId;
            const titleQuery = action.payload?.query || action.payload?.title;
            const newStart = action.payload?.newStart || action.payload?.startTime;
            const newEnd = action.payload?.newEnd || action.payload?.endTime;

            const schedule = await scheduleRepository.getDailySchedule({ userId, timeZone: effectiveTz });
            const item = schedule.find(
              (s) => (blockId && s.id === blockId) || (titleQuery && s.title.toLowerCase().includes(titleQuery.toLowerCase()))
            );

            if (item && newStart) {
              item.startAt = createUtcIsoFromLocal(todayStr, newStart, effectiveTz);
              if (newEnd) {
                item.endAt = createUtcIsoFromLocal(todayStr, newEnd, effectiveTz);
              }
              item.status = 'rescheduled';
              await scheduleRepository.saveScheduleItem(item);
              summary.push(`Rerouted schedule block "${item.title}" to ${newStart}`);
              successfulActions.push({ ...action, executed: true, status: 'success' });
            }
            break;
          }

          case 'removeScheduleBlock': {
            const blockId = action.payload?.id || action.payload?.blockId;
            const titleQuery = action.payload?.query || action.payload?.title;

            const schedule = await scheduleRepository.getDailySchedule({ userId, timeZone: effectiveTz });
            const item = schedule.find(
              (s) => (blockId && s.id === blockId) || (titleQuery && s.title.toLowerCase().includes(titleQuery.toLowerCase()))
            );

            if (item) {
              await scheduleRepository.deleteScheduleItem(item.id, userId);
              summary.push(`Removed "${item.title}" from today's schedule`);
              successfulActions.push({ ...action, executed: true, status: 'success' });
            }
            break;
          }

          case 'updateGoal': {
            const goalId = action.payload?.id || action.payload?.goalId;
            const goalTitle = action.payload?.title || action.payload?.name;
            const progress = action.payload?.progress || action.payload?.currentProgress;
            const status = action.payload?.status || 'active';

            let matched = false;
            currentGoals = currentGoals.map((g) => {
              if ((goalId && g.id === goalId) || (goalTitle && g.title.toLowerCase().includes(goalTitle.toLowerCase()))) {
                matched = true;
                return {
                  ...g,
                  currentProgress: typeof progress === 'number' ? progress : g.currentProgress,
                  status: status || g.status,
                  recalculatedPath: action.payload?.recalculatedPath || g.recalculatedPath,
                };
              }
              return g;
            });

            if (!matched && goalTitle) {
              const newGoal: Goal = {
                id: 'goal-' + Date.now(),
                title: goalTitle,
                category: (action.payload?.category as any) || 'Personal',
                status: 'active',
                currentProgress: typeof progress === 'number' ? progress : 0,
                targetDate: action.payload?.targetDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                why: action.payload?.why || 'Core personal trajectory goal',
                milestones: Array.isArray(action.payload?.milestones)
                  ? action.payload.milestones.map((m: any, idx: number) =>
                      typeof m === 'string' ? { id: `m-${idx}`, title: m, completed: false } : m
                    )
                  : [{ id: 'm-1', title: 'Initiate foundational roadmap step', completed: false }],
                obstacles: action.payload?.obstacles || [],
                createdAt: new Date().toISOString(),
              };
              currentGoals.push(newGoal);
            }

            goalsModified = true;
            summary.push(`Calibrated goal: "${goalTitle || 'Goal'}"`);
            successfulActions.push({ ...action, executed: true, status: 'success' });
            break;
          }

          case 'saveLifeUpdate': {
            const content = action.payload?.content || action.payload?.text || action.payload?.update;
            if (content) {
              const newUpdate: LifeUpdate = {
                id: 'lu-' + Date.now(),
                userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                inputType: 'text',
                originalContent: content,
                confirmedSummary: action.payload?.title || content.substring(0, 80),
                categories: action.payload?.category ? [action.payload.category] : ['General life context'],
                affectedGoalIds: [],
                affectedTaskIds: [],
                affectedPlanIds: [],
                urgency: action.payload?.urgency || 'medium',
                userConfirmed: true,
                planChangeRequested: false,
                rerouteStatus: 'no_change_needed',
              };
              currentLifeUpdates = [newUpdate, ...currentLifeUpdates];
              lifeUpdatesModified = true;
              summary.push(`Logged life update in AIM`);
              successfulActions.push({ ...action, executed: true, status: 'success' });
            }
            break;
          }

          case 'saveRelevantMemory': {
            const title = action.payload?.title || action.payload?.topic || 'AIM Insight';
            const memoryContent = action.payload?.content || action.payload?.fact || action.payload?.text;
            if (memoryContent) {
              const newMemory: MemoryItem = {
                id: 'mem-' + Date.now(),
                title,
                content: memoryContent,
                category: (action.payload?.category as any) || 'General',
                tags: action.payload?.tags || ['coach-insight'],
                importance: action.payload?.importance || 'normal',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              currentMemories = [newMemory, ...currentMemories];
              memoriesModified = true;
              summary.push(`Saved memory: "${title}"`);
              successfulActions.push({ ...action, executed: true, status: 'success' });
            }
            break;
          }

          case 'updateProfile': {
            if (action.payload) {
              currentProfile = { ...currentProfile, ...action.payload };
              profileModified = true;
              summary.push(`Updated user profile traits`);
              successfulActions.push({ ...action, executed: true, status: 'success' });
            }
            break;
          }

          default:
            console.warn('Unhandled AIMAction type:', action.type);
            break;
        }
      } catch (err: any) {
        console.error('Error executing action:', action, err);
        failedActions.push({ ...action, executed: false, status: 'failed' });
      }
    }

    // Persist all modified states
    if (planModified && context.onUpdateDailyPlan) {
      context.onUpdateDailyPlan(currentPlan);
    }
    if (goalsModified && context.onUpdateGoals) {
      context.onUpdateGoals(currentGoals);
    }
    if (memoriesModified && context.onUpdateMemories) {
      context.onUpdateMemories(currentMemories);
    }
    if (lifeUpdatesModified && context.onUpdateLifeUpdates) {
      context.onUpdateLifeUpdates(currentLifeUpdates);
    }
    if (profileModified && context.onUpdateProfile) {
      context.onUpdateProfile(currentProfile);
    }

    if (summary.length > 0 && context.onToast) {
      context.onToast(`AIM: ${summary.slice(0, 2).join(' • ')}`);
    }

    return {
      executedCount: successfulActions.length,
      successfulActions,
      failedActions,
      summary,
    };
  }
}

export const actionExecutionEngine = ActionExecutionEngine.getInstance();
