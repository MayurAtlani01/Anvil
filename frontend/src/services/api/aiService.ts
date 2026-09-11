import { AIService } from './ai';
import { AnswerFeedback, DictionaryEntry, TranslationResult } from '@/types';
import { storage } from '../storage/storage';

const API_CONFIG_KEY = 'anvil_api_config';

export interface APIConfig {
  backendUrl?: string;
  apiKey?: string;
  provider?: 'custom' | 'openai' | 'anthropic' | 'gemini';
}

export class RealAIService implements AIService {
  async getConfig(): Promise<APIConfig> {
    return await storage.get<APIConfig>(API_CONFIG_KEY, {});
  }

  async saveConfig(config: APIConfig): Promise<void> {
    await storage.set(API_CONFIG_KEY, config);
  }

  async summarize(
    text: string,
    title?: string
  ): Promise<{ summary: string; bulletPoints: string[]; keyEntities: string[]; readTimeMin: number }> {
    const config = await this.getConfig();

    if (!config.backendUrl && !config.apiKey) {
      throw new Error(
        'Backend AI service not configured. Please connect a backend API or API key in settings to enable real-time article synthesis.'
      );
    }

    // Real API fetch call to configured backend
    const endpoint = config.backendUrl ? `${config.backendUrl}/api/summarize` : '/api/summarize';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({ text, title }),
    });

    if (!response.ok) {
      throw new Error(`AI API request failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async explain(
    text: string,
    context?: string
  ): Promise<{ explanation: string; simplified: string; practicalExample: string; relatedConcepts: string[] }> {
    const config = await this.getConfig();

    if (!config.backendUrl && !config.apiKey) {
      throw new Error(
        'Backend AI service not configured. Please configure an API endpoint to generate concept explanations.'
      );
    }

    const endpoint = config.backendUrl ? `${config.backendUrl}/api/explain` : '/api/explain';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({ text, context }),
    });

    if (!response.ok) {
      throw new Error(`AI API request failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async translate(text: string, targetLang: string): Promise<TranslationResult> {
    const config = await this.getConfig();

    if (!config.backendUrl && !config.apiKey) {
      throw new Error('Translation service not configured.');
    }

    const endpoint = config.backendUrl ? `${config.backendUrl}/api/translate` : '/api/translate';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({ text, targetLang }),
    });

    if (!response.ok) {
      throw new Error(`Translation API failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Real Free Public Dictionary API call (No mock data)
   */
  async defineWord(word: string): Promise<DictionaryEntry | null> {
    const cleanWord = word.trim().toLowerCase().replace(/[^a-z]/g, '');
    if (!cleanWord) return null;

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
      if (!res.ok) return null;

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return null;

      const item = data[0];
      const meaning = item.meanings?.[0];
      const defObj = meaning?.definitions?.[0];

      return {
        word: item.word || cleanWord,
        phonetic: item.phonetic || item.phonetics?.[0]?.text || '',
        partOfSpeech: meaning?.partOfSpeech || 'noun',
        definition: defObj?.definition || '',
        example: defObj?.example || '',
        synonyms: defObj?.synonyms || [],
      };
    } catch {
      return null;
    }
  }

  async generateFlashcards(
    text: string,
    count: number = 2
  ): Promise<Array<{ front: string; back: string; difficulty: 'easy' | 'medium' | 'hard' }>> {
    const config = await this.getConfig();

    if (!config.backendUrl && !config.apiKey) {
      throw new Error('Backend AI service not configured for automatic flashcard extraction.');
    }

    const endpoint = config.backendUrl ? `${config.backendUrl}/api/flashcards/generate` : '/api/flashcards/generate';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({ text, count }),
    });

    if (!response.ok) {
      throw new Error(`Flashcard generation failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async evaluateAnswer(
    questionTitle: string,
    questionPrompt: string,
    answerText: string,
    rubrics?: string[]
  ): Promise<AnswerFeedback> {
    const config = await this.getConfig();

    if (!config.backendUrl && !config.apiKey) {
      throw new Error(
        'Backend AI service not configured. Connect your backend API to receive automated rubric evaluation.'
      );
    }

    const endpoint = config.backendUrl ? `${config.backendUrl}/api/interview/evaluate` : '/api/interview/evaluate';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({ questionTitle, questionPrompt, answerText, rubrics }),
    });

    if (!response.ok) {
      throw new Error(`Answer evaluation failed: ${response.statusText}`);
    }

    return await response.json();
  }
}
