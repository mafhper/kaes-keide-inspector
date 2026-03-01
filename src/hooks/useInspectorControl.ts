import { useCallback, useEffect, useState } from 'react';
import type { Tab } from '../types/ui';
import type { PanelToContentMessage } from '../types/messages';

interface UseInspectorControlOptions {
  activeTab: Tab;
  onInspectionStopped?: () => void;
}

export function useInspectorControl({ activeTab, onInspectionStopped }: UseInspectorControlOptions) {
  const [isInspecting, setIsInspecting] = useState(false);
  const [portError, setPortError] = useState(false);

  useEffect(() => {
    let port: chrome.runtime.Port | null = null;
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      port = chrome.runtime.connect({ name: 'kaes-keid-panel' });
    }

    return () => {
      if (port) port.disconnect();
    };
  }, []);

  const sendMessageToActiveTab = useCallback(
    (message: PanelToContentMessage, callback?: (response: any) => void) => {
      if (typeof chrome === 'undefined' || !chrome.tabs) return;

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab?.id) return;

        chrome.tabs.sendMessage(tab.id, message, (response) => {
          if (chrome.runtime.lastError) {
            setPortError(true);
            setIsInspecting(false);
            return;
          }

          callback?.(response);
        });
      });
    },
    [],
  );

  const stopInspection = useCallback(() => {
    sendMessageToActiveTab({ type: 'STOP_INSPECTION' });
    setIsInspecting(false);
    onInspectionStopped?.();
  }, [onInspectionStopped, sendMessageToActiveTab]);

  const startInspection = useCallback(() => {
    sendMessageToActiveTab({ type: 'START_INSPECTION' });
    setIsInspecting(true);
  }, [sendMessageToActiveTab]);

  const toggleInspection = useCallback(() => {
    if (portError) return;
    if (isInspecting) stopInspection();
    else startInspection();
  }, [isInspecting, portError, startInspection, stopInspection]);

  useEffect(() => {
    if (portError) return;

    if (activeTab === 'tech' && isInspecting) {
      stopInspection();
      return;
    }

    if (activeTab !== 'tech' && !isInspecting) {
      startInspection();
    }
  }, [activeTab, isInspecting, portError, startInspection, stopInspection]);

  return {
    isInspecting,
    portError,
    setPortError,
    toggleInspection,
    startInspection,
    stopInspection,
    sendMessageToActiveTab,
  };
}
