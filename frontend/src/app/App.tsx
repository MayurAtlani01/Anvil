import React, { useEffect } from 'react';
import { SurfaceType } from '@/types';
import { useModeStore } from '@/store/useModeStore';
import { useReadingStore } from '@/store/useReadingStore';
import { useToastStore } from '@/store/useToastStore';
import { onRuntimeMessage } from '@/messaging/helpers';
import { SidePanelShell } from '@/components/SidePanelShell';
import { PopupShell } from '@/components/PopupShell';
import { ToastContainer } from '@/components/Toast';
import { ReadingView } from '@/modes/reading/ReadingView';
import { InterviewView } from '@/modes/interview/InterviewView';
import { ExamView } from '@/modes/exam/ExamView';

import { useThemeStore } from '@/store/useThemeStore';

interface AppProps {
  surface: SurfaceType;
}

export const App: React.FC<AppProps> = ({ surface }) => {
  const { mode, hydrate, setMode, setTabContext } = useModeStore();
  const { explainSelection, startTTS, setPageContext } = useReadingStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    hydrate();
    useThemeStore.getState().hydrate();

    // Query active tab information on mount
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab) {
          setTabContext({
            id: activeTab.id,
            url: activeTab.url || '',
            title: activeTab.title || '',
          });
          setPageContext(activeTab.title || 'Web Page', activeTab.url || '', '');
        }
      });
    }

    // Listen for runtime messages from content script or background
    const unsubscribe = onRuntimeMessage((message) => {
      if (message.type === 'TOOLBAR_ACTION') {
        const { action, selection } = message;
        setPageContext(selection.title, selection.url, selection.text);

        if (action === 'explain') {
          setMode('reading', 'explanation');
          explainSelection(selection.text);
          addToast({ type: 'info', message: 'Analyzing selected text...' });
        } else if (action === 'read') {
          setMode('reading', 'summary');
          startTTS(selection.text);
          addToast({ type: 'info', message: 'Reading text aloud (TTS)' });
        } else if (action === 'note') {
          setMode('reading', 'notes');
        } else if (action === 'flashcard') {
          setMode('reading', 'summary');
        }
      } else if (message.type === 'NAVIGATE_MODE') {
        setMode(message.mode, message.subView);
      }
    });

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.anvil_mode?.newValue) {
        setMode(changes.anvil_mode.newValue as any);
      }
      if (changes.anvil_accent_color?.newValue) {
        useThemeStore.getState().setAccentColor(changes.anvil_accent_color.newValue, false);
      }
      if (changes.anvil_theme?.newValue) {
        useThemeStore.getState().setTheme(changes.anvil_theme.newValue as any, false);
      }
    };
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    return () => {
      unsubscribe();
      if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    };
  }, [hydrate, setMode, setTabContext, setPageContext, explainSelection, startTTS, addToast]);

  if (surface === 'popup') {
    return (
      <>
        <PopupShell />
        <ToastContainer />
      </>
    );
  }

  // Side Panel Surface
  return (
    <>
      <SidePanelShell />
      <ToastContainer />
    </>
  );
};
