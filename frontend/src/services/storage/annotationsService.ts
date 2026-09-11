import { CreateAnnotationInput, AnnotationsService } from '../api/annotations';
import { Annotation } from '@/types';
import { storage } from './storage';

const ANNOTATIONS_STORAGE_KEY = 'anvil_annotations_data';

export class StorageAnnotationsService implements AnnotationsService {
  private async getStored(): Promise<Annotation[]> {
    return await storage.get<Annotation[]>(ANNOTATIONS_STORAGE_KEY, []);
  }

  private async save(annotations: Annotation[]): Promise<void> {
    await storage.set(ANNOTATIONS_STORAGE_KEY, annotations);
  }

  async list(url?: string): Promise<Annotation[]> {
    const list = await this.getStored();
    if (!url) return list;
    const cleanUrl = url.split('#')[0].split('?')[0];
    return list.filter((a) => a.url.includes(cleanUrl) || cleanUrl.includes(a.url));
  }

  async create(input: CreateAnnotationInput): Promise<Annotation> {
    const list = await this.getStored();
    const newAnnotation: Annotation = {
      id: `ann-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      url: input.url,
      text: input.text,
      noteId: input.noteId,
      color: input.color || 'yellow',
      createdAt: new Date().toISOString(),
      rangeInfo: input.rangeInfo,
    };

    list.unshift(newAnnotation);
    await this.save(list);
    return newAnnotation;
  }

  async remove(id: string): Promise<void> {
    const list = await this.getStored();
    const filtered = list.filter((a) => a.id !== id);
    await this.save(filtered);
  }

  async clearForUrl(url: string): Promise<void> {
    const list = await this.getStored();
    const cleanUrl = url.split('#')[0].split('?')[0];
    const filtered = list.filter((a) => !a.url.includes(cleanUrl) && !cleanUrl.includes(a.url));
    await this.save(filtered);
  }
}
