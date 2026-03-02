import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { ElementData } from './types/ui';
import { hexToHsl, hexToRgb } from './utils/color';
import { ensureFileExtension, fileNameFromUrl, inferImageExtension, isSafeDownloadUrl } from './utils/download';
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

function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.trim().replace(/^#/, '');
  const normalized = clean.length === 3 ? clean.split('').map((c) => `${c}${c}`).join('') : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function toHex({ r, g, b }: { r: number; g: number; b: number }): string {
  return `#${[r, g, b]
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
    .join('')}`;
}

function mixHex(baseHex: string, targetHex: string, amount: number): string {
  const base = parseHexColor(baseHex);
  const target = parseHexColor(targetHex);
  if (!base || !target) return baseHex;

  const clamped = Math.max(0, Math.min(1, amount));
  return toHex({
    r: base.r + (target.r - base.r) * clamped,
    g: base.g + (target.g - base.g) * clamped,
    b: base.b + (target.b - base.b) * clamped,
  });
}

function sidebarPalette(baseColor: string, isDark: boolean): { base: string; surface: string; raised: string } {
  if (isDark) {
    const base = mixHex(baseColor, '#090c12', 0.35);
    return {
      base,
      surface: mixHex(base, '#121826', 0.28),
      raised: mixHex(base, '#1f2937', 0.4),
    };
  }

  const base = mixHex(baseColor, '#f8fafc', 0.2);
  return {
    base,
    surface: mixHex(base, '#ffffff', 0.45),
    raised: mixHex(base, '#eef2f7', 0.35),
  };
}

function App() {
  const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);
  const [colorFormat, setColorFormat] = useState<'hex' | 'rgb' | 'hsl'>('hex');
  const [browserPrefersDark, setBrowserPrefersDark] = useState(false);

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
    stackDetectionMode: prefs.stackDetectionMode,
    portError,
    sendMessageToActiveTab,
  });

  const { exportReport } = useReports({
    selectedElement,
    pageTechs,
    pageColors,
    pageTypography,
    pageAssets,
    pageVitals,
    stackDetectionMode: prefs.stackDetectionMode,
    sendMessageToActiveTab,
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

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => setBrowserPrefersDark(media.matches);
    sync();

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', sync);
      return () => media.removeEventListener('change', sync);
    }

    media.addListener(sync);
    return () => media.removeListener(sync);
  }, []);

  const onDownloadSmart = useCallback(async (el: ElementData) => {
    if (el.assetSrc && isSafeDownloadUrl(el.assetSrc) && el.assetKind !== 'none') {
      const extension = inferImageExtension(el.assetSrc, el.assetKind === 'svg' ? 'svg' : 'png');
      const fallbackName = `${el.tagName.toLowerCase()}-asset.${extension}`;

      const a = document.createElement('a');
      a.href = el.assetSrc;
      a.download = ensureFileExtension(fileNameFromUrl(el.assetSrc, fallbackName), extension);
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

  const effectiveIsDark = prefs.themeMode === 'auto' ? browserPrefersDark : prefs.themeMode === 'dark';
  const sidebarAutoBackground = effectiveIsDark ? '#0a0a0f' : '#f8fafc';
  const activeSidebarBackground = prefs.sidebarBackgroundMode === 'manual' ? prefs.sidebarBackgroundColor : sidebarAutoBackground;
  const resolvedPalette = useMemo(() => sidebarPalette(activeSidebarBackground, effectiveIsDark), [activeSidebarBackground, effectiveIsDark]);
  const rootStyle = useMemo(
    () =>
      ({
        background: resolvedPalette.base,
        color: 'var(--kk-text-primary)',
        '--kk-bg-base': resolvedPalette.base,
        '--kk-bg-surface': resolvedPalette.surface,
        '--kk-bg-raised': resolvedPalette.raised,
      }) as CSSProperties,
    [resolvedPalette],
  );

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
    <div className={`w-full h-screen flex flex-col ${effectiveIsDark ? 'dark' : ''}`} style={rootStyle}>
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
        <div className="flex items-center gap-1">
          <button
            onClick={() => patchPreferences({ themeMode: 'auto' })}
            className="text-[10px] px-2 py-0.5 rounded-lg border"
            style={{
              color: prefs.themeMode === 'auto' ? 'var(--kk-accent)' : 'var(--kk-text-secondary)',
              borderColor: prefs.themeMode === 'auto' ? 'var(--kk-accent-glow)' : 'var(--kk-border)',
            }}
            title="Follow browser theme"
          >
            Auto
          </button>
          <button
            onClick={() => patchPreferences({ themeMode: 'light' })}
            className="p-1.5 rounded-md border"
            title="Switch to Light Mode"
            style={{
              color: prefs.themeMode === 'light' ? 'var(--kk-accent)' : 'var(--kk-text-muted)',
              borderColor: prefs.themeMode === 'light' ? 'var(--kk-accent-glow)' : 'var(--kk-border)',
            }}
          >
            <SunIcon />
          </button>
          <button
            onClick={() => patchPreferences({ themeMode: 'dark' })}
            className="p-1.5 rounded-md border"
            title="Switch to Dark Mode"
            style={{
              color: prefs.themeMode === 'dark' ? 'var(--kk-accent)' : 'var(--kk-text-muted)',
              borderColor: prefs.themeMode === 'dark' ? 'var(--kk-accent-glow)' : 'var(--kk-border)',
            }}
          >
            <MoonIcon />
          </button>
        </div>

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
            stackDetectionMode={prefs.stackDetectionMode}
            setStackDetectionMode={(mode) => patchPreferences({ stackDetectionMode: mode })}
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
          boxShadow: effectiveIsDark ? '0 -4px 20px rgba(0,0,0,0.3)' : '0 -2px 8px rgba(0,0,0,0.04)',
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
