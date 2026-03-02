import { useEffect, useState } from 'react';
import type { PageAsset, PageColor, PageTech, PageTypo, Tab } from '../types/ui';
import type { PanelToContentMessage } from '../types/messages';
import type { StackDetectionMode } from '../types/preferences';

interface UseScanDataOptions {
  activeTab: Tab;
  stackDetectionMode: StackDetectionMode;
  portError: boolean;
  sendMessageToActiveTab: (message: PanelToContentMessage, callback?: (response: any) => void) => void;
}

export function useScanData({ activeTab, stackDetectionMode, portError, sendMessageToActiveTab }: UseScanDataOptions) {
  const [isScanning, setIsScanning] = useState(false);
  const [pageTechs, setPageTechs] = useState<PageTech[]>([]);
  const [lastTechScanMode, setLastTechScanMode] = useState<StackDetectionMode | null>(null);
  const [pageColors, setPageColors] = useState<PageColor[]>([]);
  const [pageTypography, setPageTypography] = useState<PageTypo[]>([]);
  const [pageAssets, setPageAssets] = useState<PageAsset[]>([]);
  const [pageVitals, setPageVitals] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    if (portError) return;

    setIsScanning(true);

    if (activeTab === 'tech') {
      sendMessageToActiveTab({ type: 'SCAN_VITALS' }, (response) => {
        if (response?.vitals) setPageVitals(response.vitals);
      });

      if (pageTechs.length === 0 || lastTechScanMode !== stackDetectionMode) {
        sendMessageToActiveTab({ type: 'SCAN_TECHNOLOGIES', mode: stackDetectionMode }, (response) => {
          setPageTechs(response?.techs ?? []);
          setLastTechScanMode(stackDetectionMode);
          setIsScanning(false);
        });
      } else {
        setIsScanning(false);
      }

      return;
    }

    if (activeTab === 'colors' && pageColors.length === 0) {
      sendMessageToActiveTab({ type: 'SCAN_COLORS' }, (response) => {
        setPageColors(response?.colors ?? []);
        setIsScanning(false);
      });
      return;
    }

    if (activeTab === 'typography' && pageTypography.length === 0) {
      sendMessageToActiveTab({ type: 'SCAN_TYPOGRAPHY' }, (response) => {
        setPageTypography(response?.typography ?? []);
        setIsScanning(false);
      });
      return;
    }

    if (activeTab === 'assets' && pageAssets.length === 0) {
      sendMessageToActiveTab({ type: 'SCAN_ASSETS' }, (response) => {
        setPageAssets(response?.assets ?? []);
        setIsScanning(false);
      });
      return;
    }

    setIsScanning(false);
  }, [
    activeTab,
    pageAssets.length,
    pageColors.length,
    pageTechs.length,
    pageTypography.length,
    lastTechScanMode,
    portError,
    stackDetectionMode,
    sendMessageToActiveTab,
  ]);

  return {
    isScanning,
    pageTechs,
    setPageTechs,
    pageColors,
    setPageColors,
    pageTypography,
    setPageTypography,
    pageAssets,
    setPageAssets,
    pageVitals,
  };
}
