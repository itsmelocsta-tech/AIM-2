import { CoachId, CoachMessage } from '../../types';

const COACH_CONVERSATIONS_KEY = 'aim_coach_conversations_v1';

export class CoachConversationRepository {
  private getStoredMessages(): CoachMessage[] {
    try {
      const raw = localStorage.getItem(COACH_CONVERSATIONS_KEY);
      if (!raw) return [];
      return JSON.parse(raw) || [];
    } catch {
      return [];
    }
  }

  private saveStoredMessages(messages: CoachMessage[]): void {
    try {
      localStorage.setItem(COACH_CONVERSATIONS_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save coach messages:', e);
    }
  }

  public async getMessages(coachId: CoachId, userId?: string): Promise<CoachMessage[]> {
    const all = this.getStoredMessages();
    return all.filter((m) => m.coachId === coachId && (!userId || !m.userId || m.userId === userId));
  }

  public async addMessage(message: CoachMessage): Promise<CoachMessage> {
    const all = this.getStoredMessages();
    all.push(message);
    this.saveStoredMessages(all);
    return message;
  }

  public async clearHistory(coachId: CoachId, userId?: string): Promise<void> {
    const all = this.getStoredMessages();
    const remaining = all.filter((m) => m.coachId !== coachId || (userId && m.userId && m.userId !== userId));
    this.saveStoredMessages(remaining);
  }
}

export const coachConversationRepository = new CoachConversationRepository();
