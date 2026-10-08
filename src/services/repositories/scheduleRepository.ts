import { ScheduleItem, ScheduleItemStatus, CoachId, DailyPlan } from '../../types';
import { getEffectiveTimeZone, getTodayDateString, createUtcIsoFromLocal } from '../../utils/dateTimeUtils';
import { ensureDetailedTaskGuidance, isVagueGuidance } from '../../utils/taskGuidance';
import { storageService } from '../storage';
import { SCHEDULE_CHANGE } from '../activityAlarms';

const SCHEDULE_STORAGE_KEY = 'aim_canonical_schedule_items';

/**
 * Creates sensible default schedule items for a given day in the user's timezone
 * with explicit, actionable, step-by-step instructions. Never gives vague guidance.
 */
export function generateDefaultDaySchedule(userId: string, dateStr: string, timeZone: string): ScheduleItem[] {
  const tz = getEffectiveTimeZone(timeZone);
  const nowUtc = new Date().toISOString();

  const blocks = [
    {
      title: 'Start your morning',
      description: `1. Drink a glass of water after you wake up.
2. Move and stretch gently for 5 to 10 minutes. Get some daylight if you can.
3. Open AIM and look at your three main tasks. Pick the one that matters most today.
4. Write one sentence about how you want today to go before checking your phone.`,
      startTime: '08:00',
      endTime: '09:00',
      priority: 'high' as const,
      status: 'scheduled' as ScheduleItemStatus,
      sourceCoachId: 'guidance' as CoachId,
    },
    {
      title: 'Focused work',
      description: `1. Close your message apps and put your phone on silent.
2. Open what you need for your main task. Set a timer for 90 minutes.
3. Work on one thing, such as writing a page, making a design, or building part of your project.
4. When the timer ends, save your work and note what you finished in AIM. Take a five-minute break.`,
      startTime: '09:30',
      endTime: '11:30',
      priority: 'critical' as const,
      status: 'scheduled' as ScheduleItemStatus,
      sourceCoachId: 'motivation' as CoachId,
    },
    {
      title: 'Lunch and a break',
      description: `1. Step away from your screen and put your phone down.
2. Eat a balanced meal with some protein, such as beans, eggs, or meat. Drink water.
3. Try a 15 to 20 minute walk outside without work calls or email.
4. Breathe slowly for three minutes. Try breathing in for four seconds and out for six.`,
      startTime: '12:00',
      endTime: '13:00',
      priority: 'medium' as const,
      status: 'scheduled' as ScheduleItemStatus,
      sourceCoachId: 'health' as CoachId,
    },
    {
      title: 'Work and messages',
      description: `1. Look at three people you want to contact about work or a project.
2. Send each person a short, personal message about how you can help. Give them a clear next step.
3. Set aside 30 minutes to answer work messages and handle bills or other paperwork.
4. Check tomorrow’s meetings and fix any timing problems.`,
      startTime: '13:30',
      endTime: '15:30',
      priority: 'high' as const,
      status: 'scheduled' as ScheduleItemStatus,
      sourceCoachId: 'relationships' as CoachId,
    },
    {
      title: 'Look back on your day',
      description: `1. Look at your tasks in AIM. Check off what you finished and move unfinished tasks to tomorrow.
2. Save two things that went well and one thing you learned in your notes.
3. Pick your first task for tomorrow. Get what you need ready and clear your workspace.`,
      startTime: '17:00',
      endTime: '17:45',
      priority: 'medium' as const,
      status: 'scheduled' as ScheduleItemStatus,
      sourceCoachId: 'spiritual' as CoachId,
    },
  ];

  return blocks.map((b, i) => ({
    id: `sched-${dateStr}-${i + 1}-${Date.now().toString(36)}`,
    userId,
    title: b.title,
    description: b.description,
    startAt: createUtcIsoFromLocal(dateStr, b.startTime, tz),
    endAt: createUtcIsoFromLocal(dateStr, b.endTime, tz),
    timeZone: tz,
    status: b.status,
    priority: b.priority,
    sourceCoachId: b.sourceCoachId,
    createdAt: nowUtc,
    updatedAt: nowUtc,
  }));
}

export class ScheduleRepository {
  public getAlarmItems(userId: string): ScheduleItem[] {
    return this.getStoredItems().filter(item => item.userId === userId);
  }
  private syncedDayKey(userId: string, date: string): string {
    return `aim_schedule_synced_${userId}_${date}`;
  }

  /** Keep the coach's schedule view aligned with the account's saved daily plan. */
  public syncDayFromPlan(userId: string, plan: DailyPlan, timeZone?: string, validateOnly = false): void {
    const tz = getEffectiveTimeZone(timeZone);
    const now = new Date().toISOString();
    const parseClock = (value: string): string => {
      const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
      if (!match) throw new Error('AIM returned a time block with an unreadable time. Your plan was not changed.');
      let hour = Number(match[1]);
      const minute = Number(match[2] || '0');
      if (minute > 59 || hour > (match[3] ? 12 : 23) || (match[3] && hour < 1)) {
        throw new Error('AIM returned an invalid time block. Your plan was not changed.');
      }
      if (match[3]) hour = (hour % 12) + (match[3].toLowerCase() === 'pm' ? 12 : 0);
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    };

    const existing = this.getStoredItems();
    const byId = new Map(existing.filter(item => item.userId === userId).map(item => [item.id, item]));
    const items = plan.timeBlocks.map(block => {
      const [start, end] = block.time.split(/\s*[-–—]\s*/);
      if (!start || !end) throw new Error('AIM returned an incomplete time block. Your plan was not changed.');
      const startAt = createUtcIsoFromLocal(plan.date, parseClock(start), tz);
      const prior = byId.get(block.id);
      const endClock = parseClock(end);
      let endAt = createUtcIsoFromLocal(plan.date, endClock, tz);
      // A started activity may legitimately cross midnight. Preserve its explicit UTC end.
      if (prior && Date.parse(prior.startAt) === Date.parse(startAt) && Date.parse(prior.endAt) > Date.parse(startAt) && Date.parse(endAt) <= Date.parse(startAt)) {
        const priorEndClock = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(prior.endAt));
        if (priorEndClock === endClock) endAt = prior.endAt;
      }
      if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
        throw new Error('AIM returned a time block that ends before it starts. Your plan was not changed.');
      }
      return {
        id: block.id, userId, title: block.title,
        description: block.details,
        startAt, endAt, timeZone: tz,
        status: block.completed ? 'completed' : prior?.status === 'completed' ? 'scheduled' : prior?.status || 'scheduled',
        priority: prior?.priority || 'medium',
        sourceCoachId: prior?.sourceCoachId || 'guidance',
        createdAt: prior?.createdAt || now,
        updatedAt: now,
      } as ScheduleItem;
    });
    if (validateOnly) return;
    const planItemIds = new Set(items.map(item => item.id));
    const kept = existing.filter(item => {
      if (item.userId !== userId) return true;
      const localDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(new Date(item.startAt));
      if (localDate !== plan.date) return true;
      // Start-now activities are canonical schedule items even when they were
      // launched from a priority card instead of a planner time block. Keep an
      // active one while rebuilding the saved plan after reload; otherwise its
      // finish alarm loses the schedule item it is attached to.
      return item.status === 'in_progress' && !planItemIds.has(item.id);
    });
    this.saveStoredItems([...kept, ...items]);
    try {
      localStorage.setItem(this.syncedDayKey(userId, plan.date), '1');
    } catch (error) {
      console.warn('Could not mark the schedule as synced:', error);
    }
  }

  private getStoredItems(): ScheduleItem[] {
    try {
      const raw = localStorage.getItem(SCHEDULE_STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) || [];
    } catch {
      return [];
    }
  }

  private saveStoredItems(items: ScheduleItem[]): void {
    try {
      localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(items));
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') window.dispatchEvent(new Event(SCHEDULE_CHANGE));
    } catch (e) {
      console.warn('Failed to persist schedule items:', e);
    }
  }

  /**
   * Primary canonical query for a single day's schedule
   */
  public async getDailySchedule(params: {
    userId: string;
    date?: string; // YYYY-MM-DD
    timeZone?: string;
  }): Promise<ScheduleItem[]> {
    const tz = getEffectiveTimeZone(params.timeZone);
    const dateStr = params.date || getTodayDateString(tz);
    const allItems = this.getStoredItems();

    // Filter items that fall on the specified local date
    const dayItems = allItems.filter((item) => {
      if (item.userId && item.userId !== params.userId) return false;
      const itemLocalDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(item.startAt));
      return itemLocalDate === dateStr;
    });

    if (dayItems.length > 0) {
      let needsSave = false;
      const enriched = dayItems.map((item) => {
        if (isVagueGuidance(item.description)) {
          needsSave = true;
          return {
            ...item,
            description: ensureDetailedTaskGuidance(item.title, item.description),
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      });

      if (needsSave) {
        const enrichedMap = new Map(enriched.map((i) => [i.id, i]));
        const updatedAll = allItems.map((i) => enrichedMap.get(i.id) || i);
        this.saveStoredItems(updatedAll);
      }

      return enriched.sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      );
    }

    // A personalized plan can intentionally have no time blocks.
    if (localStorage.getItem(this.syncedDayKey(params.userId, dateStr))) return [];

    // If today has no items yet, check if DailyPlan has timeblocks to import
    const existingDailyPlan = storageService.getDailyPlan(dateStr);
    if (existingDailyPlan?.timeBlocks && existingDailyPlan.timeBlocks.length > 0) {
      const convertedItems: ScheduleItem[] = existingDailyPlan.timeBlocks.map((b, idx) => {
        const timeParts = b.time.split(' - ');
        const startTime = timeParts[0]?.trim() || '09:00';
        const endTime = timeParts[1]?.trim() || '10:00';

        // Parse simple 12h or 24h format
        const parseTo24 = (t: string) => {
          const isPm = /pm/i.test(t);
          const isAm = /am/i.test(t);
          const numPart = t.replace(/[^\d:]/g, '');
          let [h, m] = numPart.split(':').map(Number);
          if (!m) m = 0;
          if (isPm && h < 12) h += 12;
          if (isAm && h === 12) h = 0;
          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        };

        const start24 = parseTo24(startTime);
        const end24 = parseTo24(endTime);
        const title = b.title || 'Focus Block';

        return {
          id: b.id || `sched-${dateStr}-${idx}-${Date.now().toString(36)}`,
          userId: params.userId,
          title,
          description: ensureDetailedTaskGuidance(title, b.details),
          startAt: createUtcIsoFromLocal(dateStr, start24, tz),
          endAt: createUtcIsoFromLocal(dateStr, end24, tz),
          timeZone: tz,
          status: (b.completed ? 'completed' : 'scheduled') as ScheduleItemStatus,
          priority: 'high' as const,
          sourceCoachId: 'guidance',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      this.saveStoredItems([...allItems, ...convertedItems]);
      return convertedItems.sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      );
    }

    // Otherwise generate clean, realistic default schedule
    const newItems = generateDefaultDaySchedule(params.userId, dateStr, tz);
    this.saveStoredItems([...allItems, ...newItems]);
    return newItems;
  }

  /**
   * Range query for monthly calendar view
   */
  public async getScheduleRange(params: {
    userId: string;
    rangeStart: string; // ISO string or YYYY-MM-DD
    rangeEnd: string;   // ISO string or YYYY-MM-DD
    timeZone?: string;
  }): Promise<ScheduleItem[]> {
    const allItems = this.getStoredItems();
    const startMs = new Date(params.rangeStart).getTime();
    const endMs = new Date(params.rangeEnd).getTime();

    return allItems
      .filter((item) => {
        if (item.userId && item.userId !== params.userId) return false;
        const itemStartMs = new Date(item.startAt).getTime();
        return itemStartMs >= startMs && itemStartMs <= endMs;
      })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }

  /**
   * Save or update a single schedule item
   */
  public async saveScheduleItem(item: ScheduleItem): Promise<ScheduleItem> {
    const allItems = this.getStoredItems();
    const existingIndex = allItems.findIndex((i) => i.id === item.id && i.userId === item.userId);
    const updatedItem = {
      ...item,
      description: ensureDetailedTaskGuidance(item.title, item.description),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      allItems[existingIndex] = updatedItem;
    } else {
      allItems.push(updatedItem);
    }

    this.saveStoredItems(allItems);
    this.syncWithDailyPlan(allItems, item.timeZone);
    return updatedItem;
  }

  /**
   * Update item status (in_progress, completed, skipped, rescheduled, etc.)
   */
  public async updateScheduleItemStatus(
    id: string,
    status: ScheduleItemStatus,
    userId: string
  ): Promise<ScheduleItem> {
    const allItems = this.getStoredItems();
    const item = allItems.find((i) => i.id === id && i.userId === userId);
    if (!item) {
      throw new Error(`Schedule item ${id} not found.`);
    }

    item.status = status;
    item.updatedAt = new Date().toISOString();
    this.saveStoredItems(allItems);
    this.syncWithDailyPlan(allItems, item.timeZone);
    return item;
  }

  /**
   * Batch update schedule (used after AI rerouting or reorganization)
   */
  public async batchUpdateSchedule(
    items: ScheduleItem[],
    userId: string
  ): Promise<ScheduleItem[]> {
    const allItems = this.getStoredItems();
    const nowIso = new Date().toISOString();

    const updatedItems = items.map((newItem) => {
      const withUpdate = {
        ...newItem,
        description: ensureDetailedTaskGuidance(newItem.title, newItem.description),
        userId,
        updatedAt: nowIso,
      };
      const idx = allItems.findIndex((i) => i.id === newItem.id && i.userId === userId);
      if (idx >= 0) {
        allItems[idx] = withUpdate;
      } else {
        allItems.push(withUpdate);
      }
      return withUpdate;
    });

    this.saveStoredItems(allItems);
    if (updatedItems.length > 0) {
      this.syncWithDailyPlan(allItems, updatedItems[0].timeZone);
    }
    return updatedItems;
  }

  /**
   * Delete schedule item
   */
  public async deleteScheduleItem(id: string, userId: string): Promise<void> {
    const allItems = this.getStoredItems();
    const filtered = allItems.filter((i) => i.id !== id || i.userId !== userId);
    this.saveStoredItems(filtered);
    this.syncWithDailyPlan(filtered);
  }

  /**
   * Helper to ensure existing DailyPlan state in localStorage remains synchronized
   */
  private syncWithDailyPlan(allItems: ScheduleItem[], timeZone?: string) {
    try {
      const tz = getEffectiveTimeZone(timeZone);
      const todayStr = getTodayDateString(tz);
      const todayItems = allItems.filter((i) => {
        const itemLocalDate = new Intl.DateTimeFormat('en-CA', {
          timeZone: tz,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date(i.startAt));
        return itemLocalDate === todayStr;
      });

      const currentPlan = storageService.getDailyPlan(todayStr);
      const updatedTimeBlocks = todayItems.map((item) => {
        const startStr = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }).format(new Date(item.startAt));
        const endStr = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }).format(new Date(item.endAt));

        return {
          id: item.id,
          time: `${startStr} - ${endStr}`,
          title: item.title,
          details: item.description || (item.sourceCoachId === 'health' ? 'Health & Recovery' : 'Core Focus'),
          completed: item.status === 'completed',
        };
      });

      storageService.saveDailyPlan({
        ...currentPlan,
        timeBlocks: updatedTimeBlocks,
      });
    } catch {
      // Non-blocking sync
    }
  }
}

export const scheduleRepository = new ScheduleRepository();
