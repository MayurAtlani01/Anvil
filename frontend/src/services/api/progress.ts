import { ProgressEntry, ProgressStats } from '@/types';

export interface ProgressService {
  getStats(): Promise<ProgressStats>;
  recordActivity(entry: Omit<ProgressEntry, 'id' | 'date'>): Promise<ProgressEntry>;
  resetStats(): Promise<void>;
}
