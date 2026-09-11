import { Annotation } from '@/types';

export interface CreateAnnotationInput {
  url: string;
  text: string;
  noteId?: string;
  color?: 'yellow' | 'green' | 'blue' | 'purple' | 'pink';
  rangeInfo?: {
    startOffset: number;
    endOffset: number;
    textSnippet: string;
  };
}

export interface AnnotationsService {
  list(url?: string): Promise<Annotation[]>;
  create(input: CreateAnnotationInput): Promise<Annotation>;
  remove(id: string): Promise<void>;
  clearForUrl(url: string): Promise<void>;
}
