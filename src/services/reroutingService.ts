import {
  ScheduleItem,
  ScheduleItemStatus,
  ScheduleChangeProposal,
  ProposedScheduleChange,
  Goal,
} from '../types';
import { getEffectiveTimeZone, createUtcIsoFromLocal } from '../utils/dateTimeUtils';

export interface RerouteParams {
  userId: string;
  trigger: string;
  currentSchedule: ScheduleItem[];
  goals?: Goal[];
  constraints?: string[];
  currentTime?: Date;
  timeZone?: string;
}

export function proposeScheduleReroute(params: RerouteParams): ScheduleChangeProposal {
  const { currentSchedule, trigger, currentTime = new Date(), timeZone } = params;
  const tz = getEffectiveTimeZone(timeZone);
  const nowMs = currentTime.getTime();

  // 1. Separate completed/past items (immutable) from future items (reschedulable)
  const immutableItems = currentSchedule.filter(
    (item) => item.status === 'completed' || new Date(item.endAt).getTime() <= nowMs
  );

  const pendingItems = currentSchedule.filter(
    (item) => item.status !== 'completed' && new Date(item.endAt).getTime() > nowMs
  );

  const proposedChanges: ProposedScheduleChange[] = [];
  const affectedItemIds: string[] = [];

  // Determine trigger nature
  const isDelayOrLate = /late|delay|behind|busy|emergency|traffic|missed|extended/i.test(trigger);
  const isHealthLowEnergy = /sick|tired|headache|fatigue|exhausted|burnout|low energy/i.test(trigger);
  const isPriorityShift = /urgent|deal|client|emergency|meeting|opportunity/i.test(trigger);

  // If low energy, shorten blocks or insert rest
  if (isHealthLowEnergy) {
    let cursorTimeMs = Math.max(nowMs + 10 * 60 * 1000, nowMs); // start in 10 mins

    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      affectedItemIds.push(item.id);

      if (item.priority === 'low' || item.priority === 'medium') {
        // Skip or reduce low priority tasks
        proposedChanges.push({
          itemId: item.id,
          operation: 'shorten',
          proposedStartAt: new Date(cursorTimeMs).toISOString(),
          proposedEndAt: new Date(cursorTimeMs + 30 * 60 * 1000).toISOString(),
          title: `Light: ${item.title}`,
        });
        cursorTimeMs += 40 * 60 * 1000;
      } else {
        // High priority: protect with clear boundaries
        proposedChanges.push({
          itemId: item.id,
          operation: 'reschedule',
          proposedStartAt: new Date(cursorTimeMs).toISOString(),
          proposedEndAt: new Date(cursorTimeMs + 45 * 60 * 1000).toISOString(),
        });
        cursorTimeMs += 60 * 60 * 1000;
      }
    }
  } else if (isDelayOrLate || isPriorityShift) {
    // Push future items forward smoothly without overlapping
    let cursorTimeMs = Math.max(nowMs + 15 * 60 * 1000, nowMs);

    for (const item of pendingItems) {
      affectedItemIds.push(item.id);
      const originalDurationMs =
        new Date(item.endAt).getTime() - new Date(item.startAt).getTime();
      const safeDurationMs = Math.max(originalDurationMs, 30 * 60 * 1000);

      proposedChanges.push({
        itemId: item.id,
        operation: 'reschedule',
        proposedStartAt: new Date(cursorTimeMs).toISOString(),
        proposedEndAt: new Date(cursorTimeMs + safeDurationMs).toISOString(),
      });

      // Buffer 15 minutes between blocks
      cursorTimeMs += safeDurationMs + 15 * 60 * 1000;
    }
  } else {
    // General adjustment
    let cursorTimeMs = nowMs + 10 * 60 * 1000;
    for (const item of pendingItems) {
      affectedItemIds.push(item.id);
      const originalDurationMs =
        new Date(item.endAt).getTime() - new Date(item.startAt).getTime();
      proposedChanges.push({
        itemId: item.id,
        operation: 'reschedule',
        proposedStartAt: new Date(cursorTimeMs).toISOString(),
        proposedEndAt: new Date(cursorTimeMs + originalDurationMs).toISOString(),
      });
      cursorTimeMs += originalDurationMs + 10 * 60 * 1000;
    }
  }

  return {
    reason: `Recalibrated rest of today based on update: "${trigger.substring(0, 80)}"`,
    affectedItemIds,
    proposedChanges,
    requiresConfirmation: true,
  };
}

/**
 * Validates and applies a confirmed proposal to the schedule list
 */
export function applyConfirmedScheduleChange(
  proposal: ScheduleChangeProposal,
  currentSchedule: ScheduleItem[]
): ScheduleItem[] {
  const updatedSchedule = currentSchedule.map((item) => {
    // If completed, never modify
    if (item.status === 'completed') {
      return item;
    }

    const change = proposal.proposedChanges.find((c) => c.itemId === item.id);
    if (!change) return item;

    if (change.operation === 'skip') {
      return {
        ...item,
        status: 'skipped' as const,
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      ...item,
      title: change.title || item.title,
      startAt: change.proposedStartAt || item.startAt,
      endAt: change.proposedEndAt || item.endAt,
      status: (item.status === 'in_progress' ? 'in_progress' : 'rescheduled') as ScheduleItemStatus,
      updatedAt: new Date().toISOString(),
    };
  });

  // Sort updated schedule chronologically
  return updatedSchedule.sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );
}
