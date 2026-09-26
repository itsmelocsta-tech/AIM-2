import { ScheduleItem, ScheduleItemStatus, CoachId, DailyPlan } from '../../types';
import { getEffectiveTimeZone, getTodayDateString, createUtcIsoFromLocal } from '../../utils/dateTimeUtils';
import { ensureDetailedTaskGuidance, isVagueGuidance } from '../../utils/taskGuidance';
import { storageService } from '../storage';

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
      title: 'Morning Alignment & Grounding Routine',
      description: `1. Drink 500ml of water immediately to rehydrate after sleep.
2. Complete 5–10 minutes of light dynamic mobility (neck rolls, thoracic rotations, hip openers) with natural outdoor daylight exposure.
3. Open AIM to review today's top 3 priority tasks and define your single non-negotiable breakthrough outcome.
4. Record a 1-sentence grounding intention before opening notifications, inbox, or social feeds.`,
      startTime: '08:00',
      endTime: '09:00',
      priority: 'high' as const,
      status: 'scheduled' as ScheduleItemStatus,
      sourceCoachId: 'guidance' as CoachId,
    },
    {
      title: 'High-Leverage Deep Work Sprint',
      description: `1. Close all communication apps (Slack, Discord, Email) and place your phone on silent in another room.
2. Open the primary document, codebase, or software tool needed and set an uninterrupted 90-minute timer.
3. Focus exclusively on producing concrete output (draft the proposal, write the core module, or design the asset) with zero context switching.
4. Stop promptly at the timer, save your progress, and log your milestone checkpoint in AIM before taking a 5-minute breathing break.`,
      startTime: '09:30',
      endTime: '11:30',
      priority: 'critical' as const,
      status: 'scheduled' as ScheduleItemStatus,
      sourceCoachId: 'motivation' as CoachId,
    },
    {
      title: 'Vitality & Nourishment Break',
      description: `1. Fully step away from your computer screen, workstation, and phone.
2. Eat a balanced whole-food meal with clean protein, complex carbohydrates, and water to sustain cognitive focus.
3. Take a brisk 15–20 minute outdoor walk in fresh air without listening to work calls or checking email.
4. Practice 3 minutes of slow diaphragmatic nasal breathing (4s inhale, 6s exhale) to downregulate cortisol and reset nervous system tone.`,
      startTime: '12:00',
      endTime: '13:00',
      priority: 'medium' as const,
      status: 'scheduled' as ScheduleItemStatus,
      sourceCoachId: 'health' as CoachId,
    },
    {
      title: 'Core Execution & Communication Block',
      description: `1. Open your pipeline and review your top 3 prospective clients, stakeholders, or collaborators.
2. Craft and dispatch 3 personalized messages offering a concrete solution to their primary bottleneck with a clear booking link or next step.
3. Process pending operational emails, slack messages, and administrative invoices in a focused 30-minute batch.
4. Verify tomorrow's calendar appointments and clear any pending scheduling blockers.`,
      startTime: '13:30',
      endTime: '15:30',
      priority: 'high' as const,
      status: 'scheduled' as ScheduleItemStatus,
      sourceCoachId: 'relationships' as CoachId,
    },
    {
      title: 'Inner Reflection & Evening Calibration',
      description: `1. Review today's schedule items in AIM: mark completed tasks and migrate unfinished items to tomorrow without self-criticism.
2. Open the Memory Vault to record 2 specific wins and 1 key lesson or insight learned from today's execution.
3. Identify the single first physical task you will tackle tomorrow morning, prepare the required tabs or materials, and tidy your workspace so you wake up to zero starting friction.`,
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
      const endAt = createUtcIsoFromLocal(plan.date, parseClock(end), tz);
      if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
        throw new Error('AIM returned a time block that ends before it starts. Your plan was not changed.');
      }
      const prior = byId.get(block.id);
      return {
        id: block.id, userId, title: block.title,
        description: block.details,
        startAt, endAt, timeZone: tz,
        status: block.completed ? 'completed' : 'scheduled',
        priority: prior?.priority || 'medium',
        sourceCoachId: prior?.sourceCoachId || 'guidance',
        createdAt: prior?.createdAt || now,
        updatedAt: now,
      } as ScheduleItem;
    });
    if (validateOnly) return;
    const kept = existing.filter(item => {
      if (item.userId !== userId) return true;
      const localDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(new Date(item.startAt));
      return localDate !== plan.date;
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
    const existingDailyPlan = storageService.getDailyPlan();
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
    const existingIndex = allItems.findIndex((i) => i.id === item.id);
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
    const item = allItems.find((i) => i.id === id);
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
      const idx = allItems.findIndex((i) => i.id === newItem.id);
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
    const filtered = allItems.filter((i) => i.id !== id);
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

      const currentPlan = storageService.getDailyPlan();
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
