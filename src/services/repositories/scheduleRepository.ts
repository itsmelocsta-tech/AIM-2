import { ScheduleItem, ScheduleItemStatus, CoachId } from '../../types';
import { getEffectiveTimeZone, getTodayDateString, createUtcIsoFromLocal } from '../../utils/dateTimeUtils';
import { storageService } from '../storage';

const SCHEDULE_STORAGE_KEY = 'aim_canonical_schedule_items';

/**
 * Creates sensible default schedule items for a given day in the user's timezone
 */
export function generateDefaultDaySchedule(userId: string, dateStr: string, timeZone: string): ScheduleItem[] {
  const tz = getEffectiveTimeZone(timeZone);
  const nowUtc = new Date().toISOString();

  const blocks = [
    {
      title: 'Morning Alignment & Grounding Routine',
      description: 'Hydration, light movement, review daily priorities, and calibrate intention.',
      startTime: '08:00',
      endTime: '09:00',
      priority: 'high' as const,
      status: 'scheduled' as ScheduleItemStatus,
      sourceCoachId: 'guidance' as CoachId,
    },
    {
      title: 'High-Leverage Deep Work Sprint',
      description: 'Uninterrupted focus on primary breakthrough goal and revenue/career asset.',
      startTime: '09:30',
      endTime: '11:30',
      priority: 'critical' as const,
      status: 'scheduled' as ScheduleItemStatus,
      sourceCoachId: 'motivation' as CoachId,
    },
    {
      title: 'Vitality & Nourishment Break',
      description: 'Healthy meal, outdoor walking, mental decompression, and recovery.',
      startTime: '12:00',
      endTime: '13:00',
      priority: 'medium' as const,
      status: 'scheduled' as ScheduleItemStatus,
      sourceCoachId: 'health' as CoachId,
    },
    {
      title: 'Core Execution & Communication Block',
      description: 'Client outreach, administrative actions, correspondence, and team touchpoints.',
      startTime: '13:30',
      endTime: '15:30',
      priority: 'high' as const,
      status: 'scheduled' as ScheduleItemStatus,
      sourceCoachId: 'relationships' as CoachId,
    },
    {
      title: 'Inner Reflection & Evening Calibration',
      description: 'Review accomplishments, log insights into Memory Vault, and prepare tomorrow.',
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
      return dayItems.sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      );
    }

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

        return {
          id: b.id || `sched-${dateStr}-${idx}-${Date.now().toString(36)}`,
          userId: params.userId,
          title: b.title || 'Focus Block',
          description: b.details || 'Focus session',
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

    for (const newItem of items) {
      const idx = allItems.findIndex((i) => i.id === newItem.id);
      const withUpdate = { ...newItem, userId, updatedAt: nowIso };
      if (idx >= 0) {
        allItems[idx] = withUpdate;
      } else {
        allItems.push(withUpdate);
      }
    }

    this.saveStoredItems(allItems);
    if (items.length > 0) {
      this.syncWithDailyPlan(allItems, items[0].timeZone);
    }
    return items;
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
