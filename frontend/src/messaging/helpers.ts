import { AnvilMessage } from './types';

/**
 * Sends a message to the Chrome background service worker or active extension surfaces.
 */
function isRuntimeAvailable(): boolean {
  try {
    return typeof chrome !== 'undefined' && Boolean(chrome.runtime?.id);
  } catch {
    return false;
  }
}

/**
 * Sends a message to the Chrome background service worker or active extension surfaces.
 */
export async function sendRuntimeMessage<T extends AnvilMessage, R = any>(message: T): Promise<R | null> {
  if (isRuntimeAvailable() && chrome.runtime?.sendMessage) {
    try {
      return await chrome.runtime.sendMessage(message);
    } catch (err) {
      // Background worker might be sleeping or receiver not yet listening or context invalidated
      console.debug('[Anvil Messaging] sendMessage failed or no receiver:', err);
      return null;
    }
  }
  console.debug('[Anvil Messaging Fallback]', message);
  return null;
}

/**
 * Sends a message to a specific browser tab's content script.
 */
export async function sendTabMessage<T extends AnvilMessage, R = any>(tabId: number, message: T): Promise<R | null> {
  if (isRuntimeAvailable() && chrome.tabs?.sendMessage) {
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (err) {
      console.debug(`[Anvil Messaging] tab ${tabId} not reachable:`, err);
      return null;
    }
  }
  return null;
}

/**
 * Sends a message to the currently active browser tab.
 */
export async function sendActiveTabMessage<T extends AnvilMessage, R = any>(message: T): Promise<R | null> {
  if (isRuntimeAvailable() && chrome.tabs?.query) {
    try {
      let [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (!activeTab) {
        [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      }
      if (!activeTab) {
        [activeTab] = await chrome.tabs.query({ active: true });
      }
      if (activeTab?.id) {
        return await sendTabMessage<T, R>(activeTab.id, message);
      }
    } catch (err) {
      console.debug('[Anvil Messaging] active tab query failed:', err);
    }
  }
  return null;
}

/**
 * Typed listener wrapper for chrome.runtime.onMessage.
 * Returns an unsubscribe function.
 */
export function onRuntimeMessage(
  handler: (
    message: AnvilMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => boolean | void | Promise<any>
): () => void {
  if (!isRuntimeAvailable() || !chrome.runtime?.onMessage) {
    return () => {};
  }

  try {
    const listener = (
      msg: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      try {
        return handler(msg as AnvilMessage, sender, sendResponse);
      } catch (err) {
        console.debug('[Anvil Messaging] handler error:', err);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => {
      try {
        if (isRuntimeAvailable() && chrome.runtime?.onMessage) {
          chrome.runtime.onMessage.removeListener(listener);
        }
      } catch {
        // context invalidated
      }
    };
  } catch {
    return () => {};
  }
}

