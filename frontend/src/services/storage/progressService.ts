import { ProgressService } from '../api/progress';
import { ProgressEntry, ProgressStats } from '@/types';
import { storage } from './storage';

const PROGRESS_STORAGE_KEY = 'anvil_progress_data';

const INITIAL_PROGRESS_STATS: ProgressStats = {
  totalStudyTimeMinutes: 0,
  streakDays: 0,
  lastActiveDate: '',
  cardsReviewed: 0,
  cardsDueToday: 0,
  questionsSolved: 0,
  interviewsCompleted: 0,
  accuracyRate: 0,
  recentActivity: [],
  topicPerformance: [],
};

export class StorageProgressService implements ProgressService {
  async getStats(): Promise<ProgressStats> {
    return await storage.get<ProgressStats>(PROGRESS_STORAGE_KEY, INITIAL_PROGRESS_STATS);
  }

  async recordActivity(entry: Omit<ProgressEntry, 'id' | 'date'>): Promise<ProgressEntry> {
    const stats = await this.getStats();
    const newEntry: ProgressEntry = {
      ...entry,
      id: `act-${Date.now()}`,
      date: new Date().toISOString(),
    };

    stats.recentActivity.unshift(newEntry);
    stats.recentActivity = stats.recentActivity.slice(0, 50);

    if (entry.durationSec) {
      stats.totalStudyTimeMinutes += Math.round(entry.durationSec / 60);
    }
    if (entry.activityType === 'flashcard_reviewed') {
      stats.cardsReviewed += 1;
    }
    if (entry.activityType === 'interview_question_answered' || entry.activityType === 'pyq_solved') {
      stats.questionsSolved += 1;
    }
    if (entry.activityType === 'interview_session_completed') {
      stats.interviewsCompleted += 1;
    }

    // Update streak based on real dates
    const today = new Date().toISOString().split('T')[0];
    const lastActiveDay = stats.lastActiveDate ? stats.lastActiveDate.split('T')[0] : '';

    if (!lastActiveDay) {
      stats.streakDays = 1;
    } else if (lastActiveDay !== today) {
      const diffDays = Math.round(
        (new Date(today).getTime() - new Date(lastActiveDay).getTime()) / (1000 * 3600 * 24)
      );
      if (diffDays === 1) {
        stats.streakDays += 1;
      } else if (diffDays > 1) {
        stats.streakDays = 1;
      }
    }

    stats.lastActiveDate = new Date().toISOString();
    await storage.set(PROGRESS_STORAGE_KEY, stats);
    return newEntry;
  }

  async resetStats(): Promise<void> {
    await storage.set(PROGRESS_STORAGE_KEY, INITIAL_PROGRESS_STATS);
  }
}
