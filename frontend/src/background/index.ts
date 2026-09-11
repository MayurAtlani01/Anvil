import { AnvilMessage } from '@/messaging/types';

// Set panel behavior: Clicking extension action opens Popup (Popup provides quick actions & one-click Side Panel launch)
if (typeof chrome !== 'undefined' && chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch((err) => {
    console.debug('[Anvil ServiceWorker] setPanelBehavior error:', err);
  });
}

// Track side panel open state across extension lifecycle via Port connection
let isSidePanelOpen = false;

if (typeof chrome !== 'undefined' && chrome.runtime?.onConnect) {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'anvil_sidepanel_port') {
      isSidePanelOpen = true;
      chrome.storage.local.set({ anvil_sidepanel_open: true });
      port.onDisconnect.addListener(() => {
        isSidePanelOpen = false;
        chrome.storage.local.set({ anvil_sidepanel_open: false });
      });
    }
  });
}

// Register Context Menu Items on extension installation
chrome.runtime.onInstalled.addListener(() => {
  if (chrome.contextMenus) {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'anvil-explain-selection',
        title: 'Explain with Anvil',
        contexts: ['selection'],
      });

      chrome.contextMenus.create({
        id: 'anvil-create-flashcard',
        title: 'Create Flashcard from Selection',
        contexts: ['selection'],
      });

      chrome.contextMenus.create({
        id: 'anvil-summarize-page',
        title: 'Summarize Page in Anvil',
        contexts: ['page'],
      });
    });
  }
});

// Context Menu Click Handler
chrome.contextMenus?.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  // Open side panel for the active tab
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (err) {
    console.debug('[Anvil ServiceWorker] Failed to open side panel from context menu:', err);
  }

  // Forward action to Side Panel
  if (info.menuItemId === 'anvil-explain-selection' && info.selectionText) {
    setTimeout(() => {
      chrome.runtime.sendMessage({
        type: 'TOOLBAR_ACTION',
        action: 'explain',
        selection: {
          text: info.selectionText || '',
          url: tab.url || '',
          title: tab.title || '',
          rect: { top: 0, left: 0, width: 0, height: 0, bottom: 0, right: 0 },
        },
      });
    }, 400);
  } else if (info.menuItemId === 'anvil-create-flashcard' && info.selectionText) {
    setTimeout(() => {
      chrome.runtime.sendMessage({
        type: 'TOOLBAR_ACTION',
        action: 'flashcard',
        selection: {
          text: info.selectionText || '',
          url: tab.url || '',
          title: tab.title || '',
          rect: { top: 0, left: 0, width: 0, height: 0, bottom: 0, right: 0 },
        },
      });
    }, 400);
  } else if (info.menuItemId === 'anvil-summarize-page') {
    setTimeout(() => {
      chrome.runtime.sendMessage({
        type: 'NAVIGATE_MODE',
        mode: 'reading',
        subView: 'summary',
      });
    }, 400);
  }
});

function openFallbackPanel(tabId?: number, sendResponse?: (res: any) => void) {
  const panelUrl = chrome.runtime.getURL('src/sidepanel/index.html');
  if (typeof chrome !== 'undefined' && chrome.windows && chrome.windows.create) {
    chrome.windows.create({
      url: panelUrl,
      type: 'popup',
      width: 420,
      height: 740,
      top: 80,
      left: 80,
      focused: true,
    }).then(() => {
      isSidePanelOpen = true;
      chrome.storage.local.set({ anvil_sidepanel_open: true });
      if (sendResponse) sendResponse({ success: true, method: 'window', state: 'opened' });
    }).catch(() => {
      chrome.tabs.create({ url: panelUrl });
      isSidePanelOpen = true;
      chrome.storage.local.set({ anvil_sidepanel_open: true });
      if (sendResponse) sendResponse({ success: true, method: 'tab', state: 'opened' });
    });
  } else if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
    chrome.tabs.create({ url: panelUrl });
    isSidePanelOpen = true;
    chrome.storage.local.set({ anvil_sidepanel_open: true });
    if (sendResponse) sendResponse({ success: true, method: 'tab', state: 'opened' });
  }
}

function openSidePanelHelper(tabId?: number, windowId?: number, sendResponse?: (res: any) => void) {
  console.log('[Anvil Background] openSidePanelHelper called, tabId:', tabId, 'windowId:', windowId);
  if (typeof chrome !== 'undefined' && chrome.sidePanel && chrome.sidePanel.open) {
    if (tabId && chrome.sidePanel.setOptions) {
      chrome.sidePanel.setOptions({
        tabId,
        path: 'src/sidepanel/index.html',
        enabled: true,
      }).catch(() => {});
    }

    const targetOptions: any = tabId ? { tabId } : (windowId ? { windowId } : {});
    chrome.sidePanel.open(targetOptions)
      .then(() => {
        isSidePanelOpen = true;
        chrome.storage.local.set({ anvil_sidepanel_open: true });
        console.log('[Anvil Background] Successfully opened Chrome sidePanel');
        if (sendResponse) sendResponse({ success: true, method: 'sidePanel', state: 'opened' });
      })
      .catch((err) => {
        console.warn('[Anvil Background] Primary sidePanel.open failed:', err);
        if (windowId && targetOptions.tabId) {
          chrome.sidePanel.open({ windowId })
            .then(() => {
              isSidePanelOpen = true;
              chrome.storage.local.set({ anvil_sidepanel_open: true });
              console.log('[Anvil Background] Successfully opened Chrome sidePanel with windowId');
              if (sendResponse) sendResponse({ success: true, method: 'sidePanelWindow', state: 'opened' });
            })
            .catch((err2) => {
              console.warn('[Anvil Background] windowId sidePanel.open failed:', err2);
              openFallbackPanel(tabId, sendResponse);
            });
        } else {
          openFallbackPanel(tabId, sendResponse);
        }
      });
  } else {
    console.log('[Anvil Background] chrome.sidePanel not supported, opening companion panel');
    openFallbackPanel(tabId, sendResponse);
  }
}

function closeSidePanelHelper(sendResponse?: (res: any) => void) {
  console.log('[Anvil Background] closeSidePanelHelper called');
  isSidePanelOpen = false;
  chrome.storage.local.set({ anvil_sidepanel_open: false });
  // Send message to SidePanelShell so it invokes window.close()
  chrome.runtime.sendMessage({ type: 'CLOSE_SIDE_PANEL' }).catch(() => {});
  // Also try chrome.sidePanel.close if supported (Chrome 127+)
  if (typeof chrome !== 'undefined' && (chrome.sidePanel as any)?.close) {
    try {
      (chrome.sidePanel as any).close().catch(() => {});
    } catch {}
  }
  if (sendResponse) sendResponse({ success: true, closed: true, state: 'closed' });
}

function pingContentScript(tabId: number): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: 'PING' }, (response) => {
      resolve(!chrome.runtime.lastError && Boolean(response?.alive));
    });
  });
}

async function injectContentScript(tabId: number) {
  const manifest = chrome.runtime.getManifest();
  const file = manifest.content_scripts?.[0]?.js?.[0];
  if (!file) return;
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: [file] });
  } catch (err) {
    // Fails on internal chrome:// pages, webstore, etc. — expected
    console.warn('[Anvil Background] could not inject content script:', err);
  }
}

async function broadcastModeToAllTabs(mode: 'reading' | 'interview' | 'exam', readingFocus: boolean) {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
        chrome.tabs.sendMessage(tab.id, { type: 'SET_ACTIVE_MODE', mode }).catch(() => {});
        chrome.tabs.sendMessage(tab.id, { type: 'SET_READING_MODE', enabled: true }).catch(() => {});
        chrome.tabs.sendMessage(tab.id, {
          type: 'SET_READING_HOVER_MODE',
          enabled: mode === 'reading' && readingFocus,
        }).catch(() => {});
        chrome.tabs.sendMessage(tab.id, {
          type: 'SET_READING_FOCUS',
          enabled: mode === 'reading' && readingFocus,
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.debug('[Anvil Background] broadcast error:', err);
  }
}

async function activateMode(tabId: number | undefined, mode: 'reading' | 'interview' | 'exam') {
  const current = await chrome.storage.local.get(['anvil_reading_focus']);
  const readingFocus = current.anvil_reading_focus !== undefined ? Boolean(current.anvil_reading_focus) : true;

  const defaultSubView = mode === 'reading' ? 'summary' : mode === 'interview' ? 'rounds' : 'pyqs';

  await chrome.storage.local.set({
    anvil_mode: mode,
    anvil_active_mode: { mode, subView: defaultSubView },
    anvil_reading_mode: true,
    anvil_reading_hover: mode === 'reading' && readingFocus,
  });

  if (tabId != null) {
    const alive = await pingContentScript(tabId);
    if (!alive) {
      await injectContentScript(tabId);
      await new Promise((r) => setTimeout(r, 60));
    }
  }

  await broadcastModeToAllTabs(mode, readingFocus);
}

async function activateReadingMode(tabId: number) {
  return activateMode(tabId, 'reading');
}

// Central Runtime Relay Router
chrome.runtime.onMessage.addListener((message: AnvilMessage, sender, sendResponse) => {
  if (message.type === 'ACTIVATE_MODE') {
    const resolveTabId = async (): Promise<number | undefined> => {
      if (message.tabId) return message.tabId;
      if (sender.tab?.id) return sender.tab.id;
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (activeTab?.id) return activeTab.id;
        const [anyActive] = await chrome.tabs.query({ active: true });
        return anyActive?.id;
      } catch {
        return undefined;
      }
    };

    resolveTabId()
      .then(async (tid) => {
        await activateMode(tid, message.mode);
        sendResponse({ ok: true });
      })
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  if (message.type === 'ACTIVATE_READING_MODE') {
    const tabId = message.tabId || sender.tab?.id;
    if (tabId != null) {
      activateReadingMode(tabId)
        .then(() => sendResponse({ ok: true }))
        .catch((err) => sendResponse({ ok: false, error: String(err) }));
      return true;
    }
  }

  if (message.type === 'OPEN_SIDE_PANEL') {
    const tabId = message.tabId || sender.tab?.id;
    const windowId = sender.tab?.windowId;
    if (message.mode) {
      chrome.storage.local.set({ anvil_mode: message.mode });
      chrome.runtime.sendMessage({ type: 'NAVIGATE_MODE', mode: message.mode }).catch(() => {});
    }
    openSidePanelHelper(tabId, windowId, sendResponse);
    return true;
  }

  if (message.type === 'CLOSE_SIDE_PANEL') {
    closeSidePanelHelper(sendResponse);
    return true;
  }

  if (message.type === 'TOGGLE_SIDE_PANEL') {
    const tabId = message.tabId || sender.tab?.id;
    const windowId = sender.tab?.windowId;
    if (message.mode) {
      chrome.storage.local.set({ anvil_mode: message.mode });
      chrome.runtime.sendMessage({ type: 'NAVIGATE_MODE', mode: message.mode }).catch(() => {});
    }
    console.log('[Anvil Background] Received TOGGLE_SIDE_PANEL, isSidePanelOpen:', isSidePanelOpen);
    if (isSidePanelOpen) {
      closeSidePanelHelper(sendResponse);
    } else {
      openSidePanelHelper(tabId, windowId, sendResponse);
    }
    return true;
  }

  if (message.type === 'TOOLBAR_ACTION') {
    const tabId = sender.tab?.id;
    if (tabId && chrome.sidePanel && chrome.sidePanel.open) {
      chrome.sidePanel.open({ tabId }).then(() => {
        setTimeout(() => {
          chrome.runtime.sendMessage(message);
        }, 300);
      }).catch((err) => {
        console.debug('[Anvil ServiceWorker] open side panel from toolbar failed:', err);
        openFallbackPanel(tabId, () => {
          setTimeout(() => {
            chrome.runtime.sendMessage(message);
          }, 350);
        });
      });
    } else {
      openFallbackPanel(tabId, () => {
        setTimeout(() => {
          chrome.runtime.sendMessage(message);
        }, 350);
      });
    }
  }

  if (message.type === 'SCREEN_CAPTURE') {
    const tabId = message.tabId || sender.tab?.id;
    if (chrome.tabs && chrome.tabs.captureVisibleTab) {
      chrome.tabs.captureVisibleTab(undefined as any, { format: 'png' }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          console.debug('[Anvil ServiceWorker] capture error:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
          return;
        }

        if (tabId && chrome.sidePanel && chrome.sidePanel.open) {
          chrome.sidePanel.open({ tabId }).then(() => {
            setTimeout(() => {
              chrome.runtime.sendMessage({
                type: 'SCREEN_CAPTURE_READY',
                dataUrl,
              });
            }, 300);
          }).catch((err) => {
            console.debug('[Anvil ServiceWorker] open side panel on capture error:', err);
          });
        }
        sendResponse({ success: true, dataUrl });
      });
      return true; // async response
    }
  }

  if (message.type === 'SET_READING_MODE') {
    if (chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, message).catch(() => {});
            chrome.tabs.sendMessage(tab.id, { type: 'SET_READING_HOVER_MODE', enabled: message.enabled }).catch(() => {});
          }
        });
        sendResponse({ success: true });
      });
      return true;
    }
  }

  return false;
});
