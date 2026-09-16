import { storage } from '../storage/storage';
import { APIConfig } from './aiService';

const API_CONFIG_KEY = 'anvil_api_config';

export async function getAPIConfig(): Promise<APIConfig> {
  return await storage.get<APIConfig>(API_CONFIG_KEY, {});
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T | null> {
  // If running inside a webpage content script (http/https page), delegate to background service worker
  // to bypass Mixed Content (HTTPS -> HTTP localhost) and CORS restrictions
  const isContentScript =
    typeof window !== 'undefined' &&
    window.location &&
    (window.location.protocol === 'http:' || window.location.protocol === 'https:') &&
    typeof chrome !== 'undefined' &&
    Boolean(chrome.runtime?.sendMessage);

  if (isContentScript) {
    try {
      const response = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage(
          {
            type: 'FORWARD_API_REQUEST',
            path,
            options: {
              method: options.method,
              headers: options.headers,
              body: options.body,
            },
          },
          (res) => {
            if (chrome.runtime.lastError) {
              resolve(null);
            } else {
              resolve(res);
            }
          }
        );
      });

      if (response && response.success) {
        return response.data as T;
      }
    } catch (err) {
      console.warn('[Anvil API Client] Content script forwarded request failed:', err);
    }
  }

  const config = await getAPIConfig();
  const baseUrl = (config.backendUrl && config.backendUrl.trim())
    ? config.backendUrl.trim().replace(/\/+$/, '')
    : 'http://127.0.0.1:8000';

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${cleanPath}`;

  const token = await storage.get<string>('anvil_auth_token', '');
  const authHeader = token
    ? `Bearer ${token}`
    : config.apiKey
    ? `Bearer ${config.apiKey}`
    : '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authHeader ? { Authorization: authHeader } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`API ${response.status} ${response.statusText}: ${errText}`);
    }

    if (response.status === 204) {
      return null as T;
    }

    return (await response.json()) as T;
  } catch (err) {
    console.warn(`[Anvil API] Request to ${url} failed, using local storage fallback:`, err);
    return null;
  }
}

