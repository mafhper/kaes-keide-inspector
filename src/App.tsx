import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ElementData } from './types/ui';
import { hexToHsl, hexToRgb } from './utils/color';
import { fileNameFromUrl, isSafeDownloadUrl } from './utils/download';
import { usePreferences } from './hooks/usePreferences';
import { useInspectorControl } from './hooks/useInspectorControl';
import { useScanData } from './hooks/useScanData';
import { useReports } from './hooks/useReports';
import { StackTab } from './features/stack/StackTab';
import { OverviewTab } from './features/overview/OverviewTab';
import { ColorsTab } from './features/colors/ColorsTab';
import { TypographyTab } from './features/typography/TypographyTab';
import { AssetsTab } from './features/assets/AssetsTab';
import { TabButton } from './features/shared/TabButton';
import { InspectionActionBar } from './features/shared/InspectionActionBar';
import { AlertIcon, DropletIcon, GridIcon, ImageIcon, MoonIcon, SunIcon, TechIcon, TypeIcon } from './features/shared/icons';

function App() {
  const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);
  const [colorFormat, setColorFormat] = useState<'hex' | 'rgb' | 'hsl'>('hex');

  const {
    prefs,
    ready,
    patchPreferences,
    getSectionLayout,
    setSectionLayout,
  } = usePreferences();

  const {
    isInspecting,
    portError,
    toggleInspection,
    sendMessageToActiveTab,
  } = useInspectorControl({
    activeTab: prefs.activeTab,
    onInspectionStopped: () => setSelectedElement(null),
  });

  const {
    isScanning,
    pageTechs,
    pageColors,
    pageTypography,
    pageAssets,
    pageVitals,
  } = useScanData({
    activeTab: prefs.activeTab,
    portError,
    sendMessageToActiveTab,
  });

  const { exportReport } = useReports({
    selectedElement,
    pageTechs,
    pageColors,
    pageTypography,
    pageAssets,
  });

  const formatColor = useCallback(
    (hex: string) => {
      if (colorFormat === 'rgb') return hexToRgb(hex);
      if (colorFormat === 'hsl') return hexToHsl(hex);
      return hex;
    },
    [colorFormat],
  );

  const cycleColorFormat = useCallback(() => {
    setColorFormat((value) => {
      if (value === 'hex') return 'rgb';
      if (value === 'rgb') return 'hsl';
      return 'hex';
    });
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const handleMessage = (message: unknown) => {
      const payload = message as { type?: string; payload?: ElementData };
      if (payload.type === 'ELEMENT_SELECTED' && payload.payload) {
        setSelectedElement(payload.payload);
        patchPreferences({ activeTab: 'overview' });
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [patchPreferences, ready]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

      switch (event.key) {
        case '1':
          patchPreferences({ activeTab: 'tech' });
          break;
        case '2':
          patchPreferences({ activeTab: 'overview' });
          break;
        case '3':
          patchPreferences({ activeTab: 'colors' });
          break;
        case '4':
          patchPreferences({ activeTab: 'typography' });
          break;
        case '5':
          patchPreferences({ activeTab: 'assets' });
          break;
        case 'Escape':
          if (isInspecting) toggleInspection();
          else patchPreferences({ activeTab: 'tech' });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInspecting, patchPreferences, toggleInspection]);

  const onDownloadSmart = useCallback(async (el: ElementData) => {
    if (el.assetSrc && isSafeDownloadUrl(el.assetSrc) && el.assetKind !== 'none') {
      const a = document.createElement('a');
      a.href = el.assetSrc;
      a.download = fileNameFromUrl(el.assetSrc, `${el.tagName.toLowerCase()}-asset.${el.assetKind === 'svg' ? 'svg' : 'png'}`);
      a.rel = 'noreferrer';
      a.target = '_blank';
      a.click();
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.windowId) return;

      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement('canvas');
        const dpr = el.dpr || 1;
        canvas.width = el.width * dpr;
        canvas.height = el.height * dpr;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(image, el.left * dpr, el.top * dpr, el.width * dpr, el.height * dpr, 0, 0, el.width * dpr, el.height * dpr);

        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `${el.tagName.toLowerCase()}-screenshot.png`;
        a.click();
      };

      image.src = dataUrl;
    } catch {
      // Ignore capture errors in panel context.
    }
  }, []);

  const sidebarAutoBackground = useMemo(() => {
    if (selectedElement?.parentBackgroundHex) return selectedElement.parentBackgroundHex;

    const topSurface = pageColors
      .filter((color) => color.roles.includes('surface'))
      .sort((a, b) => b.count - a.count)[0];

    return topSurface?.hex || (prefs.isDark ? '#0a0a0f' : '#f8fafc');
  }, [pageColors, prefs.isDark, selectedElement?.parentBackgroundHex]);

  const sidebarBackground = prefs.sidebarBackgroundMode === 'manual' ? prefs.sidebarBackgroundColor : sidebarAutoBackground;

  const actionBar = (
    <InspectionActionBar
      isInspecting={isInspecting}
      showInspectionToggle={prefs.activeTab !== 'tech'}
      onToggleInspection={toggleInspection}
      reportScope={prefs.reportScope}
      reportFormat={prefs.reportFormat}
      onReportScopeChange={(scope) => patchPreferences({ reportScope: scope })}
      onReportFormatChange={(format) => patchPreferences({ reportFormat: format })}
      onExportReport={() => exportReport(prefs.reportScope, prefs.reportFormat, prefs.activeTab)}
    />
  );

  if (!ready) {
    return null;
  }

  return (
    <div className={`w-full h-screen flex flex-col ${prefs.isDark ? 'dark' : ''}`} style={{ background: sidebarBackground, color: 'var(--kk-text-primary)' }}>
      {portError && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
          <div className="text-rose-500 mb-4"><AlertIcon /></div>
          <h2 className="text-lg font-bold text-white mb-2">Page needs refresh</h2>
          <p className="text-slate-300 text-xs max-w-[240px] leading-relaxed mb-6">
            The extension was just installed or updated. Please refresh the page to reconnect the inspector.
          </p>
          <button
            onClick={() => {
              chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.id) chrome.tabs.reload(tabs[0].id);
                window.close();
              });
            }}
            className="bg-white text-slate-900 px-4 py-2 rounded-md text-xs font-semibold hover:bg-slate-200 transition-colors w-full"
          >
            Refresh now
          </button>
        </div>
      )}

      <header className="px-3 py-2.5 flex items-center gap-2" style={{ background: 'var(--kk-bg-surface)', borderBottom: '1px solid var(--kk-border)' }}>
        <button
          onClick={() => patchPreferences({ isDark: !prefs.isDark })}
          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
          title={prefs.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{ color: 'var(--kk-text-muted)' }}
        >
          {prefs.isDark ? <SunIcon /> : <MoonIcon />}
        </button>

        <label className="text-[9px] uppercase font-semibold" style={{ color: 'var(--kk-text-muted)' }}>Sidebar</label>
        <button
          onClick={() => patchPreferences({ sidebarBackgroundMode: prefs.sidebarBackgroundMode === 'auto' ? 'manual' : 'auto' })}
          className="text-[10px] px-2 py-0.5 rounded-lg border"
          style={{
            color: prefs.sidebarBackgroundMode === 'auto' ? 'var(--kk-accent)' : 'var(--kk-text-secondary)',
            borderColor: prefs.sidebarBackgroundMode === 'auto' ? 'var(--kk-accent-glow)' : 'var(--kk-border)',
          }}
        >
          {prefs.sidebarBackgroundMode === 'auto' ? 'Auto' : 'Manual'}
        </button>

        {prefs.sidebarBackgroundMode === 'manual' && (
          <input
            type="color"
            value={prefs.sidebarBackgroundColor}
            onChange={(e) => patchPreferences({ sidebarBackgroundColor: e.target.value })}
            className="ml-1 w-7 h-6 p-0 border rounded"
            style={{ borderColor: 'var(--kk-border)' }}
          />
        )}
      </header>

      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--kk-bg-base)' }}>
        {prefs.activeTab === 'tech' && (
          <StackTab
            pageTechs={pageTechs}
            pageVitals={pageVitals}
            isScanning={isScanning}
            actionBar={actionBar}
            exportFormat={prefs.exportFormat}
            setExportFormat={(value) => patchPreferences({ exportFormat: value })}
            stackViewMode={prefs.stackViewMode}
            setStackViewMode={(mode) => patchPreferences({ stackViewMode: mode })}
            stackCategoryOrder={prefs.stackCategoryOrder}
            setStackCategoryOrder={(order) => patchPreferences({ stackCategoryOrder: order })}
            hiddenStackCategories={prefs.hiddenStackCategories}
            setHiddenStackCategories={(hidden) => patchPreferences({ hiddenStackCategories: hidden })}
            getSectionLayout={getSectionLayout}
            setSectionLayout={setSectionLayout}
          />
        )}

        {prefs.activeTab === 'overview' && (
          <OverviewTab
            selectedElement={selectedElement}
            isInspecting={isInspecting}
            actionBar={actionBar}
            colorFormat={colorFormat}
            formatColor={formatColor}
            cycleColorFormat={cycleColorFormat}
            copyToClipboard={copyToClipboard}
            onDownloadSmart={onDownloadSmart}
            getSectionLayout={getSectionLayout}
            setSectionLayout={setSectionLayout}
          />
        )}

        {prefs.activeTab === 'colors' && (
          <ColorsTab
            pageColors={pageColors}
            isScanning={isScanning}
            actionBar={actionBar}
            colorFormat={colorFormat}
            formatColor={formatColor}
            cycleColorFormat={cycleColorFormat}
            copyToClipboard={copyToClipboard}
            exportFormat={prefs.exportFormat}
            setExportFormat={(value) => patchPreferences({ exportFormat: value })}
            getSectionLayout={getSectionLayout}
            setSectionLayout={setSectionLayout}
          />
        )}

        {prefs.activeTab === 'typography' && (
          <TypographyTab
            pageTypography={pageTypography}
            isScanning={isScanning}
            actionBar={actionBar}
            colorFormat={colorFormat}
            formatColor={formatColor}
            cycleColorFormat={cycleColorFormat}
            copyToClipboard={copyToClipboard}
            getSectionLayout={getSectionLayout}
            setSectionLayout={setSectionLayout}
          />
        )}

        {prefs.activeTab === 'assets' && (
          <AssetsTab
            pageAssets={pageAssets}
            isScanning={isScanning}
            actionBar={actionBar}
            backgroundMode={prefs.assetBackground}
            setBackgroundMode={(mode) => patchPreferences({ assetBackground: mode })}
            assetViewMode={prefs.assetViewMode}
            setAssetViewMode={(mode) => patchPreferences({ assetViewMode: mode })}
            getSectionLayout={getSectionLayout}
            setSectionLayout={setSectionLayout}
          />
        )}
      </main>

      <nav
        className="flex items-center justify-around py-2.5 flex-shrink-0"
        style={{
          background: 'var(--kk-bg-surface)',
          borderTop: '1px solid var(--kk-border)',
          boxShadow: prefs.isDark ? '0 -4px 20px rgba(0,0,0,0.3)' : '0 -2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <TabButton icon={<TechIcon />} label="Stack" active={prefs.activeTab === 'tech'} onClick={() => patchPreferences({ activeTab: 'tech' })} />
        <TabButton icon={<GridIcon />} label="Overview" active={prefs.activeTab === 'overview'} onClick={() => patchPreferences({ activeTab: 'overview' })} />
        <TabButton icon={<DropletIcon />} label="Colors" active={prefs.activeTab === 'colors'} onClick={() => patchPreferences({ activeTab: 'colors' })} />
        <TabButton icon={<TypeIcon />} label="Type" active={prefs.activeTab === 'typography'} onClick={() => patchPreferences({ activeTab: 'typography' })} />
        <TabButton icon={<ImageIcon />} label="Assets" active={prefs.activeTab === 'assets'} onClick={() => patchPreferences({ activeTab: 'assets' })} />
      </nav>
    </div>
  );
}

export default App;
