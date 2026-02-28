import { useState, useEffect, useCallback } from 'react'
import BoxModel from './components/BoxModel'
import { contrastRating, getTextColorOnBg, isTransparent, rgbToHex as rgbToHexLocal, hexToRgb, hexToHsl } from './utils/color'

// ---- Types ----
type ColorFormat = 'hex' | 'rgb' | 'hsl';
interface ElementData {
  tagName: string; id: string; classList: string; textContent: string;
  fontFamily: string; fontSize: string; fontWeight: string; lineHeight: string;
  letterSpacing: string; textTransform: string; textDecoration: string; textShadow: string;
  color: string; colorHex: string; backgroundColor: string; backgroundColorHex: string;
  parentBackground: string; parentBackgroundHex: string;
  backgroundImage: string; backgroundSize: string; backgroundPosition: string; backgroundRepeat: string;
  contrast: number; contrastRating: string;
  width: number; height: number;
  paddingTop: string; paddingRight: string; paddingBottom: string; paddingLeft: string;
  marginTop: string; marginRight: string; marginBottom: string; marginLeft: string;
  borderTopWidth: string; borderRightWidth: string; borderBottomWidth: string; borderLeftWidth: string;
  borderRadius: string; borderColor: string;
  borderTopColor: string; borderRightColor: string; borderBottomColor: string; borderLeftColor: string;
  borderStyle: string; borderTopStyle: string; borderRightStyle: string; borderBottomStyle: string; borderLeftStyle: string;
  boxShadow: string; outline: string; outlineColor: string; outlineStyle: string; outlineWidth: string; outlineOffset: string;
  display: string; position: string; overflow: string; opacity: string;
  gridTemplateColumns: string; gridTemplateRows: string; gridAutoFlow: string; gap: string;
  gridAutoColumns: string; gridAutoRows: string; gridTemplateAreas: string;
  columnGap: string; rowGap: string;
  flexDirection: string; flexWrap: string; flexGrow: string; flexShrink: string;
  flexBasis: string; alignSelf: string; order: string;
  justifyItems: string; alignItems: string; justifyContent: string; alignContent: string;
  cursor: string; transition: string; transform: string; filter: string; backdropFilter: string; mixBlendMode: string;
  top: number; left: number; dpr: number;
}

interface PageTech { name: string; category: string; version?: string; }
interface PageColor { hex: string; rgb: string; count: number; category: string; }
interface PageTypo {
  tag: string; fontFamily: string; fontSize: string; fontWeight: string;
  lineHeight: string; letterSpacing: string; color: string; colorHex: string;
  count: number; sample: string;
}
interface PageAsset { src: string; alt: string; type: string; width: number; height: number; tagName: string; }

type Tab = 'tech' | 'overview' | 'colors' | 'typography' | 'assets'

// ---- Icons (inline SVG to avoid dep issues) ----
const TechIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
const GridIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
const DropletIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>
const TypeIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></svg>
const ImageIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
const DownloadIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
const CopyIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
const CheckIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
const XCircleIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
const SunIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
const MoonIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
const AlertIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>

const TechItem = ({ tech, isDark }: { tech: PageTech, isDark: boolean }) => {
  const [imgError, setImgError] = useState(false);
  const slug = tech.name.toLowerCase()
    .replace(/\.js|-js/g, 'dotjs')
    .replace(/\./g, 'dot')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');

  const url = `https://cdn.simpleicons.org/${slug}/${isDark ? 'e2e8f0' : '475569'}`;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium" style={{ background: 'var(--kk-bg-raised)', border: '1px solid var(--kk-border)', color: 'var(--kk-text-secondary)' }}>
      {!imgError ? (
        <img
          src={url}
          alt=""
          onError={() => setImgError(true)}
          className="w-3.5 h-3.5 object-contain opacity-80"
        />
      ) : (
        <div style={{ color: 'var(--kk-text-muted)' }}><TechIcon /></div>
      )}
      <span>{tech.name}</span>
      {tech.version && (
        <span className="text-[9px] font-mono ml-0.5 px-1 rounded" style={{ color: 'var(--kk-text-muted)', background: 'var(--kk-bg-base)' }} title="Version">v{tech.version}</span>
      )}
    </div>
  )
}

function App() {
  const [selectedElement, setSelectedElement] = useState<ElementData | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('tech')
  const [pageTechs, setPageTechs] = useState<PageTech[]>([])
  const [pageColors, setPageColors] = useState<PageColor[]>([])
  const [pageTypography, setPageTypography] = useState<PageTypo[]>([])
  const [pageAssets, setPageAssets] = useState<PageAsset[]>([])
  const [pageVitals, setPageVitals] = useState<Record<string, number> | null>(null)
  const [, setCopiedValue] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isInspecting, setIsInspecting] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [portError, setPortError] = useState(false)
  const [exportFormat, setExportFormat] = useState<'json' | 'markdown' | 'css' | 'scss' | 'json-tokens'>('json')
  const [exportDesignFormat, setExportDesignFormat] = useState<'json' | 'markdown'>('json')
  const [colorFormat, setColorFormat] = useState<ColorFormat>('hex')

  const formatColor = useCallback((hex: string) => {
    if (colorFormat === 'rgb') return hexToRgb(hex);
    if (colorFormat === 'hsl') return hexToHsl(hex);
    return hex;
  }, [colorFormat]);

  const cycleColorFormat = useCallback(() => {
    setColorFormat(f => f === 'hex' ? 'rgb' : f === 'rgb' ? 'hsl' : 'hex');
  }, []);

  // Load preferences
  useEffect(() => {
    chrome.storage?.local.get(['isDark', 'activeTab', 'exportFormat'], (res) => {
      if (res.isDark !== undefined) {
        setIsDark(!!res.isDark);
      } else {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDark(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
        mq.addEventListener('change', handler);
      }
      if (res.activeTab) setActiveTab(res.activeTab as Tab);
      if (res.exportFormat) setExportFormat(res.exportFormat as any);
    });
  }, []);

  // Save dynamic preferences
  useEffect(() => {
    chrome.storage?.local.set({ activeTab, exportFormat });
  }, [activeTab, exportFormat]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    chrome.storage?.local.set({ isDark: newTheme });
  };

  const safeSendMessage = (tabId: number, msg: any, callback?: (res: any) => void) => {
    try {
      chrome.tabs.sendMessage(tabId, msg, (response) => {
        if (chrome.runtime.lastError) {
          setPortError(true);
          setIsScanning(false);
          setIsInspecting(false);
        } else if (callback) {
          callback(response);
        }
      });
    } catch {
      setPortError(true);
      setIsScanning(false);
      setIsInspecting(false);
    }
  };

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedValue(text)
    setTimeout(() => setCopiedValue(null), 1500)
  }, [])

  // Ensure port stays open to detect panel close
  useEffect(() => {
    let port: chrome.runtime.Port | null = null;
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      port = chrome.runtime.connect({ name: 'kaes-keid-panel' });
    }

    return () => {
      if (port) port.disconnect();
    }
  }, [])

  const toggleInspection = async () => {
    if (typeof chrome === 'undefined' || !chrome.tabs || portError) return;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab.id) {
        const nextState = !isInspecting;
        safeSendMessage(tab.id, { type: nextState ? 'START_INSPECTION' : 'STOP_INSPECTION' });
        setIsInspecting(nextState)
        if (!nextState) {
          setSelectedElement(null) // clear selection when stopping
        }
      }
    } catch { /* ignore */ }
  }

  // Auto-start and stop inspection based on currently active tab
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.tabs || portError) return;
    const handleInspectionState = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.id) return;

        if (activeTab === 'tech') {
          if (isInspecting) {
            safeSendMessage(tab.id, { type: 'STOP_INSPECTION' });
            setIsInspecting(false);
            setSelectedElement(null);
          }
        } else {
          if (!isInspecting) { // Ensures it starts when moving off tech
            safeSendMessage(tab.id, { type: 'START_INSPECTION' });
            setIsInspecting(true);
          }
        }
      } catch { }
    };
    handleInspectionState();
  }, [activeTab, isInspecting, portError]);

  // Listen for element selection messages
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime) return

    const handleMessage = (message: any) => {
      if (message.type === 'ELEMENT_SELECTED') {
        setSelectedElement(message.payload)
        setActiveTab('overview')
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)
    return () => chrome.runtime.onMessage.removeListener(handleMessage)
  }, [])

  // Scan page data when switching to tabs
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.tabs || portError) return

    const scanData = async () => {
      setIsScanning(true)
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (!tab.id) return

        if (activeTab === 'tech') {
          safeSendMessage(tab.id, { type: 'SCAN_VITALS' }, (response: any) => {
            if (response?.vitals) setPageVitals(response.vitals)
          });
          if (pageTechs.length === 0) {
            safeSendMessage(tab.id, { type: 'SCAN_TECHNOLOGIES' }, (response: any) => {
              if (response?.techs) setPageTechs(response.techs)
              setIsScanning(false)
            })
          } else {
            setIsScanning(false)
          }
        } else if (activeTab === 'colors' && pageColors.length === 0) {
          safeSendMessage(tab.id, { type: 'SCAN_COLORS' }, (response: any) => {
            if (response?.colors) setPageColors(response.colors)
            setIsScanning(false)
          })
        } else if (activeTab === 'typography' && pageTypography.length === 0) {
          safeSendMessage(tab.id, { type: 'SCAN_TYPOGRAPHY' }, (response: any) => {
            if (response?.typography) setPageTypography(response.typography)
            setIsScanning(false)
          })
        } else if (activeTab === 'assets' && pageAssets.length === 0) {
          safeSendMessage(tab.id, { type: 'SCAN_ASSETS' }, (response: any) => {
            if (response?.assets) setPageAssets(response.assets)
            setIsScanning(false)
          })
        } else {
          setIsScanning(false)
        }
      } catch {
        setIsScanning(false)
      }
    }
    scanData()
  }, [activeTab, portError])

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case '1': setActiveTab('tech'); break;
        case '2': setActiveTab('overview'); break;
        case '3': setActiveTab('colors'); break;
        case '4': setActiveTab('typography'); break;
        case '5': setActiveTab('assets'); break;
        case 'Escape':
          if (isInspecting) toggleInspection();
          else setActiveTab('tech');
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInspecting, toggleInspection]);

  const fontWeightName = (w: string) => {
    const map: Record<string, string> = {
      '100': 'Thin', '200': 'Extra Light', '300': 'Light', '400': 'Regular',
      '500': 'Medium', '600': 'Semi Bold', '700': 'Bold', '800': 'Extra Bold', '900': 'Black',
    }
    return map[w] || w
  }

  // File Download Utility
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generate Unified Design Report
  const exportDesignReport = () => {
    if (!selectedElement) return;

    const reportData = {
      element: {
        tag: selectedElement.tagName,
        classes: selectedElement.classList,
        id: selectedElement.id,
      },
      typography: {
        fontFamily: selectedElement.fontFamily,
        fontSize: selectedElement.fontSize,
        fontWeight: fontWeightName(selectedElement.fontWeight),
        lineHeight: selectedElement.lineHeight,
        letterSpacing: selectedElement.letterSpacing,
      },
      colors: {
        text: selectedElement.colorHex,
        background: selectedElement.parentBackgroundHex,
        contrastRatio: selectedElement.contrast,
      },
      layout: {
        display: selectedElement.display,
        width: `${selectedElement.width}px`,
        height: `${selectedElement.height}px`,
        margin: `${selectedElement.marginTop} ${selectedElement.marginRight} ${selectedElement.marginBottom} ${selectedElement.marginLeft}`,
        padding: `${selectedElement.paddingTop} ${selectedElement.paddingRight} ${selectedElement.paddingBottom} ${selectedElement.paddingLeft}`,
      },
      pageContext: {
        totalColorsDetected: pageColors.length,
        totalTypographyStyles: pageTypography.length,
        techStack: pageTechs.map(t => t.name),
      }
    };

    if (exportDesignFormat === 'json') {
      downloadFile(JSON.stringify(reportData, null, 2), `${selectedElement.tagName.toLowerCase()}-design-report.json`, 'application/json');
    } else {
      const md = `# Design Report: <${reportData.element.tag}>
${reportData.element.classes ? `\n**Classes:** \`.${reportData.element.classes}\`` : ''}
${reportData.element.id ? `\n**ID:** \`#${reportData.element.id}\`` : ''}

## 🎨 Colors
- **Text:** \`${reportData.colors.text}\`
- **Background:** \`${reportData.colors.background}\`
- **Contrast Ratio:** ${reportData.colors.contrastRatio}:1

## 📝 Typography
- **Font Family:** \`${reportData.typography.fontFamily}\`
- **Size:** ${reportData.typography.fontSize}
- **Weight:** ${reportData.typography.fontWeight}
- **Line Height:** ${reportData.typography.lineHeight}
- **Letter Spacing:** ${reportData.typography.letterSpacing}

## 📐 Layout & Spacing
- **Display:** \`${reportData.layout.display}\`
- **Dimensions:** ${reportData.layout.width} × ${reportData.layout.height}
- **Margin:** ${reportData.layout.margin}
- **Padding:** ${reportData.layout.padding}

---
*Generated by Kaes Keid Inspector*
`;
      downloadFile(md, `${selectedElement.tagName.toLowerCase()}-design-report.md`, 'text/markdown');
    }
  };

  // Copy utility already used inline via CopyIcon in PropRow and ColorRow

  // ---- TAB: Overview ----
  const renderOverview = () => {
    if (!selectedElement) {
      return (
        <div className="flex-1 p-3">
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all ${isInspecting ? 'bg-violet-50 dark:bg-violet-500/10' : ''}`} style={!isInspecting ? { background: 'var(--kk-bg-raised)' } : {}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isInspecting ? "var(--kk-accent)" : "var(--kk-text-muted)"} strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </div>
            <h2 className="text-sm font-bold mb-1" style={{ color: 'var(--kk-text-primary)' }}>{isInspecting ? 'Inspection Active' : 'Ready to Inspect'}</h2>
            <p className="text-xs leading-relaxed mb-6" style={{ color: 'var(--kk-text-muted)' }}>
              {isInspecting ? 'Hover over elements on the page to preview their styles. Click any element to inspect it in detail.' : 'Click the button below to start inspecting elements on the page.'}
            </p>
            <button
              onClick={toggleInspection}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${isInspecting
                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'
                : 'text-white hover:opacity-90 shadow-md'
                }`}
              style={!isInspecting ? { background: 'var(--kk-accent)', boxShadow: '0 4px 14px var(--kk-accent-glow)' } : {}}
            >
              {isInspecting ? 'Stop Inspecting' : 'Start Inspecting'}
            </button>
          </div>
        </div>
      )
    }

    const el = selectedElement
    const cr = contrastRating(el.contrast)

    return (
      <div className="flex flex-col gap-3 p-3">
        <div className="flex justify-between items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-xs">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 px-2 py-0.5 rounded font-semibold">
                {el.tagName.toLowerCase()}
              </span>
              {el.classList && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate max-w-[150px]">.{el.classList}</span>
              )}
            </div>
            {el.id && (
              <span className="mt-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono block">#{el.id}</span>
            )}
          </div>
          <div className="flex flex-col gap-2 items-end">
            <button
              onClick={async () => {
                try {
                  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                  if (!tab.windowId) return;
                  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });

                  const img = new Image();
                  img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const sdpr = el.dpr || 1;
                    canvas.width = el.width * sdpr;
                    canvas.height = el.height * sdpr;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.drawImage(
                        img,
                        el.left * sdpr, el.top * sdpr, el.width * sdpr, el.height * sdpr,
                        0, 0, el.width * sdpr, el.height * sdpr
                      );
                      const a = document.createElement('a');
                      a.href = canvas.toDataURL('image/png');
                      a.download = `${el.tagName.toLowerCase()}-screenshot.png`;
                      a.click();
                    }
                  };
                  img.src = dataUrl;
                } catch (e) {
                  console.error("Screenshot failed:", e);
                }
              }}
              className="text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-600 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              title="Save a screenshot of this element"
            >
              <ImageIcon />
            </button>
            <div className="flex items-center rounded border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 p-0.5">
              <select
                value={exportDesignFormat}
                onChange={e => setExportDesignFormat(e.target.value as 'json' | 'markdown')}
                className="text-[9px] bg-transparent text-slate-600 dark:text-slate-300 outline-none cursor-pointer pl-1 font-medium select-none"
              >
                <option value="json">JSON</option>
                <option value="markdown">MD</option>
              </select>
              <button
                onClick={exportDesignReport}
                className="text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 p-1 cursor-pointer transition-colors"
                title="Download Design Report"
              >
                <DownloadIcon />
              </button>
            </div>
            <button
              onClick={toggleInspection}
              className={`text-[10px] font-medium px-2 py-1 ml-1 rounded transition-colors cursor-pointer ${isInspecting ? 'text-red-600 hover:text-red-800 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-violet-600 hover:text-violet-800 border border-violet-200 dark:border-violet-900/50 hover:bg-violet-50 dark:hover:bg-violet-900/20'}`}
            >
              {isInspecting ? 'Stop' : 'Start Inspecting'}
            </button>
          </div>
        </div>

        {/* Typography Section */}
        <Section title="Typography" icon={<TypeIcon />}>
          <PropGrid>
            <PropRow label="Font Family" value={el.fontFamily.split(',')[0].replace(/['"]/g, '')} onCopy={() => copyToClipboard(el.fontFamily.split(',')[0].replace(/['"]/g, ''))} />
            <PropRow label="Font Size" value={el.fontSize} />
            <PropRow label="Font Weight" value={fontWeightName(el.fontWeight)} />
            <PropRow label="Line Height" value={el.lineHeight} />
            <PropRow label="Letter Spacing" value={el.letterSpacing} />
          </PropGrid>
        </Section>

        {/* Colors Section */}
        <Section title="Colors" icon={<DropletIcon />}>
          <div className="flex flex-col gap-2 px-3 pb-3">
            <ColorRow label="Text Color" color={el.color} hex={el.colorHex} format={colorFormat} onToggleFormat={cycleColorFormat} onCopy={() => copyToClipboard(formatColor(el.colorHex))} />
            <ColorRow label="Background" color={el.parentBackground} hex={el.parentBackgroundHex} format={colorFormat} onToggleFormat={cycleColorFormat} onCopy={() => copyToClipboard(formatColor(el.parentBackgroundHex))} />
            {/* Contrast */}
            <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center" style={{ background: el.parentBackground, color: el.color }}>
                  Aa
                </div>
                <span className="text-xs text-slate-600 font-medium">{el.contrast} : 1</span>
              </div>
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cr.pass ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                {cr.pass ? <CheckIcon /> : <XCircleIcon />}
                {cr.label}
              </span>
            </div>
          </div>
        </Section>

        {/* Box Model Section */}
        <Section title="Box Model" icon={<GridIcon />}>
          <div className="px-3 pb-3">
            <BoxModel
              width={el.width}
              height={el.height}
              marginTop={el.marginTop}
              marginRight={el.marginRight}
              marginBottom={el.marginBottom}
              marginLeft={el.marginLeft}
              paddingTop={el.paddingTop}
              paddingRight={el.paddingRight}
              paddingBottom={el.paddingBottom}
              paddingLeft={el.paddingLeft}
              borderTopWidth={el.borderTopWidth}
              borderRightWidth={el.borderRightWidth}
              borderBottomWidth={el.borderBottomWidth}
              borderLeftWidth={el.borderLeftWidth}
            />
          </div>
        </Section>

        {/* Borders Section -- Always show if there's any border info */}
        {(el.borderStyle !== 'none' || el.borderRadius !== '0px') && (
          <Section title="Borders" icon={<GridIcon />}>
            {/* Visual Border Preview */}
            {el.borderStyle !== 'none' && (
              <div className="px-3 pt-3 flex justify-center">
                <div
                  className="w-20 h-14 rounded-sm"
                  style={{
                    borderTop: `${el.borderTopWidth} ${el.borderTopStyle} ${el.borderTopColor}`,
                    borderRight: `${el.borderRightWidth} ${el.borderRightStyle} ${el.borderRightColor}`,
                    borderBottom: `${el.borderBottomWidth} ${el.borderBottomStyle} ${el.borderBottomColor}`,
                    borderLeft: `${el.borderLeftWidth} ${el.borderLeftStyle} ${el.borderLeftColor}`,
                    borderRadius: el.borderRadius,
                    background: 'var(--kk-bg-raised)',
                  }}
                />
              </div>
            )}
            <PropGrid>
              <PropRow label="Radius" value={el.borderRadius} />
              {el.borderStyle !== 'none' && <PropRow label="Style" value={el.borderStyle} />}
              {el.borderTopWidth !== '0px' && (
                <>
                  <PropRow label="Top" value={`${el.borderTopWidth} ${el.borderTopStyle}`} />
                  <ColorRow label="Top Color" color={el.borderTopColor} hex={rgbToHexLocal(el.borderTopColor)} format={colorFormat} onToggleFormat={cycleColorFormat} onCopy={() => copyToClipboard(formatColor(rgbToHexLocal(el.borderTopColor)))} />
                </>
              )}
              {el.borderBottomWidth !== '0px' && (
                <>
                  <PropRow label="Bottom" value={`${el.borderBottomWidth} ${el.borderBottomStyle}`} />
                  <ColorRow label="Bottom Color" color={el.borderBottomColor} hex={rgbToHexLocal(el.borderBottomColor)} format={colorFormat} onToggleFormat={cycleColorFormat} onCopy={() => copyToClipboard(formatColor(rgbToHexLocal(el.borderBottomColor)))} />
                </>
              )}
              {el.borderLeftWidth !== '0px' && (
                <>
                  <PropRow label="Left" value={`${el.borderLeftWidth} ${el.borderLeftStyle}`} />
                  <ColorRow label="Left Color" color={el.borderLeftColor} hex={rgbToHexLocal(el.borderLeftColor)} format={colorFormat} onToggleFormat={cycleColorFormat} onCopy={() => copyToClipboard(formatColor(rgbToHexLocal(el.borderLeftColor)))} />
                </>
              )}
              {el.borderRightWidth !== '0px' && (
                <>
                  <PropRow label="Right" value={`${el.borderRightWidth} ${el.borderRightStyle}`} />
                  <ColorRow label="Right Color" color={el.borderRightColor} hex={rgbToHexLocal(el.borderRightColor)} format={colorFormat} onToggleFormat={cycleColorFormat} onCopy={() => copyToClipboard(formatColor(rgbToHexLocal(el.borderRightColor)))} />
                </>
              )}
            </PropGrid>
          </Section>
        )}

        {/* Shadows & Effects */}
        {(el.boxShadow !== 'none' || el.textShadow !== 'none' || el.outlineStyle !== 'none') && (() => {
          // Parse box-shadow: offset-x offset-y blur spread color
          const parseShadow = (raw: string) => {
            const shadows: Array<{ offsetX: string; offsetY: string; blur: string; spread?: string; color: string; inset: boolean }> = [];
            // Split multiple shadows
            const parts = raw.split(/,(?![^(]*\))/);
            for (const part of parts) {
              const trimmed = part.trim();
              const isInset = trimmed.includes('inset');
              const cleaned = trimmed.replace('inset', '').trim();
              // Extract color (rgb/rgba/hex/named) and numeric values
              const colorMatch = cleaned.match(/(rgba?\([^)]+\)|hsla?\([^)]+\)|#[a-f0-9]{3,8})/i);
              const color = colorMatch ? colorMatch[1] : '';
              const withoutColor = cleaned.replace(color, '').trim();
              const nums = withoutColor.match(/-?\d+(?:\.\d+)?px/g) || [];
              if (nums.length >= 2) {
                shadows.push({
                  offsetX: nums[0] || '0px', offsetY: nums[1] || '0px',
                  blur: nums[2] || '0px', spread: nums[3],
                  color, inset: isInset,
                });
              }
            }
            return shadows;
          };

          const boxShadows = el.boxShadow !== 'none' ? parseShadow(el.boxShadow) : [];
          const textShadows = el.textShadow !== 'none' ? parseShadow(el.textShadow) : [];

          return (
            <Section title="Shadows & Effects" icon={<DropletIcon />}>
              <div className="p-3 flex flex-col gap-3">
                {/* Box Shadow */}
                {boxShadows.length > 0 && (
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--kk-text-muted)' }}>Box Shadow ({boxShadows.length})</div>
                    {/* Preview */}
                    <div className="flex justify-center mb-3">
                      <div className="w-20 h-14 rounded-lg" style={{ background: 'var(--kk-bg-raised)', boxShadow: el.boxShadow }} />
                    </div>
                    {boxShadows.map((s, i) => (
                      <div key={i} className="p-2 rounded-lg mb-1.5" style={{ background: 'var(--kk-bg-raised)' }}>
                        <div className="flex items-center gap-2 mb-1.5">
                          {s.color && <div className="w-4 h-4 rounded-md flex-shrink-0" style={{ backgroundColor: s.color, border: '1px solid var(--kk-border)' }} />}
                          <span className="text-[10px] font-mono" style={{ color: 'var(--kk-text-secondary)' }}>{s.color}</span>
                          {s.inset && <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ background: 'var(--kk-accent-glow)', color: 'var(--kk-accent)' }}>INSET</span>}
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          <div><span className="text-[8px] uppercase" style={{ color: 'var(--kk-text-muted)' }}>X</span><div className="text-[10px] font-mono" style={{ color: 'var(--kk-text-primary)' }}>{s.offsetX}</div></div>
                          <div><span className="text-[8px] uppercase" style={{ color: 'var(--kk-text-muted)' }}>Y</span><div className="text-[10px] font-mono" style={{ color: 'var(--kk-text-primary)' }}>{s.offsetY}</div></div>
                          <div><span className="text-[8px] uppercase" style={{ color: 'var(--kk-text-muted)' }}>Blur</span><div className="text-[10px] font-mono" style={{ color: 'var(--kk-text-primary)' }}>{s.blur}</div></div>
                          {s.spread && <div><span className="text-[8px] uppercase" style={{ color: 'var(--kk-text-muted)' }}>Spread</span><div className="text-[10px] font-mono" style={{ color: 'var(--kk-text-primary)' }}>{s.spread}</div></div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Text Shadow */}
                {textShadows.length > 0 && (
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--kk-text-muted)' }}>Text Shadow ({textShadows.length})</div>
                    {textShadows.map((s, i) => (
                      <div key={i} className="p-2 rounded-lg mb-1.5" style={{ background: 'var(--kk-bg-raised)' }}>
                        <div className="flex items-center gap-2 mb-1.5">
                          {s.color && <div className="w-4 h-4 rounded-md flex-shrink-0" style={{ backgroundColor: s.color, border: '1px solid var(--kk-border)' }} />}
                          <span className="text-[10px] font-mono" style={{ color: 'var(--kk-text-secondary)' }}>{s.color}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <div><span className="text-[8px] uppercase" style={{ color: 'var(--kk-text-muted)' }}>X</span><div className="text-[10px] font-mono" style={{ color: 'var(--kk-text-primary)' }}>{s.offsetX}</div></div>
                          <div><span className="text-[8px] uppercase" style={{ color: 'var(--kk-text-muted)' }}>Y</span><div className="text-[10px] font-mono" style={{ color: 'var(--kk-text-primary)' }}>{s.offsetY}</div></div>
                          <div><span className="text-[8px] uppercase" style={{ color: 'var(--kk-text-muted)' }}>Blur</span><div className="text-[10px] font-mono" style={{ color: 'var(--kk-text-primary)' }}>{s.blur}</div></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Outline */}
                {el.outlineStyle !== 'none' && (
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--kk-text-muted)' }}>Outline</div>
                    <PropGrid>
                      <PropRow label="Width" value={el.outlineWidth} />
                      <PropRow label="Style" value={el.outlineStyle} />
                      <ColorRow label="Color" color={el.outlineColor} hex={rgbToHexLocal(el.outlineColor)} format={colorFormat} onToggleFormat={cycleColorFormat} onCopy={() => copyToClipboard(formatColor(rgbToHexLocal(el.outlineColor)))} />
                      {el.outlineOffset !== '0px' && <PropRow label="Offset" value={el.outlineOffset} />}
                    </PropGrid>
                  </div>
                )}
              </div>
            </Section>
          );
        })()}

        {/* CSS Grid Section */}
        {
          (el.display === 'grid' || el.display === 'inline-grid') && (
            <Section title="CSS Grid" icon={<GridIcon />}>
              <PropGrid>
                <PropRow label="Display" value={el.display} />
                {el.gridTemplateColumns && el.gridTemplateColumns !== 'none' && (
                  <div className="col-span-2">
                    <span className="text-[9px] font-medium uppercase tracking-wide" style={{ color: 'var(--kk-text-muted)' }}>Columns</span>
                    <div className="text-xs font-mono mt-0.5 break-all" style={{ color: 'var(--kk-text-primary)' }}>{el.gridTemplateColumns}</div>
                  </div>
                )}
                {el.gridTemplateRows && el.gridTemplateRows !== 'none' && (
                  <div className="col-span-2">
                    <span className="text-[9px] font-medium uppercase tracking-wide" style={{ color: 'var(--kk-text-muted)' }}>Rows</span>
                    <div className="text-xs font-mono mt-0.5 break-all" style={{ color: 'var(--kk-text-primary)' }}>{el.gridTemplateRows}</div>
                  </div>
                )}
                {el.gridTemplateAreas && el.gridTemplateAreas !== 'none' && (
                  <div className="col-span-2">
                    <span className="text-[9px] font-medium uppercase tracking-wide" style={{ color: 'var(--kk-text-muted)' }}>Template Areas</span>
                    <pre className="text-[10px] font-mono mt-0.5 p-2 rounded-lg whitespace-pre-wrap" style={{ background: 'var(--kk-bg-raised)', color: 'var(--kk-text-secondary)' }}>{el.gridTemplateAreas.replace(/"/g, '')}</pre>
                  </div>
                )}
                {el.gridAutoFlow && el.gridAutoFlow !== 'row' && <PropRow label="Auto Flow" value={el.gridAutoFlow} />}
                {el.gridAutoColumns && el.gridAutoColumns !== 'auto' && <PropRow label="Auto Columns" value={el.gridAutoColumns} />}
                {el.gridAutoRows && el.gridAutoRows !== 'auto' && <PropRow label="Auto Rows" value={el.gridAutoRows} />}
                {el.columnGap && el.columnGap !== 'normal' && el.columnGap !== '0px' && <PropRow label="Column Gap" value={el.columnGap} />}
                {el.rowGap && el.rowGap !== 'normal' && el.rowGap !== '0px' && <PropRow label="Row Gap" value={el.rowGap} />}
                {el.gap && el.gap !== 'normal' && el.gap !== '0px' && <PropRow label="Gap" value={el.gap} />}
                {el.justifyItems && el.justifyItems !== 'normal' && el.justifyItems !== 'legacy' && <PropRow label="Justify Items" value={el.justifyItems} />}
                {el.alignItems && el.alignItems !== 'normal' && <PropRow label="Align Items" value={el.alignItems} />}
                {el.justifyContent && el.justifyContent !== 'normal' && <PropRow label="Justify Content" value={el.justifyContent} />}
                {el.alignContent && el.alignContent !== 'normal' && <PropRow label="Align Content" value={el.alignContent} />}
              </PropGrid>
            </Section>
          )
        }

        {/* Flexbox Section */}
        {
          (el.display === 'flex' || el.display === 'inline-flex') && (
            <Section title="Flexbox" icon={<GridIcon />}>
              <PropGrid>
                <PropRow label="Display" value={el.display} />
                <PropRow label="Direction" value={el.flexDirection} />
                {el.flexWrap !== 'nowrap' && <PropRow label="Wrap" value={el.flexWrap} />}
                {el.justifyContent && el.justifyContent !== 'normal' && <PropRow label="Justify Content" value={el.justifyContent} />}
                {el.alignItems && el.alignItems !== 'normal' && <PropRow label="Align Items" value={el.alignItems} />}
                {el.alignContent && el.alignContent !== 'normal' && <PropRow label="Align Content" value={el.alignContent} />}
                {el.gap && el.gap !== 'normal' && el.gap !== '0px' && <PropRow label="Gap" value={el.gap} />}
                {el.columnGap && el.columnGap !== 'normal' && el.columnGap !== '0px' && <PropRow label="Column Gap" value={el.columnGap} />}
                {el.rowGap && el.rowGap !== 'normal' && el.rowGap !== '0px' && <PropRow label="Row Gap" value={el.rowGap} />}
              </PropGrid>
              {/* Child-specific flex props */}
              {(el.flexGrow !== '0' || el.flexShrink !== '1' || el.flexBasis !== 'auto' || el.order !== '0' || el.alignSelf !== 'auto') && (
                <div className="p-3 pt-0">
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--kk-text-muted)' }}>Flex Item Properties</div>
                  <PropGrid>
                    {el.flexGrow !== '0' && <PropRow label="Grow" value={el.flexGrow} />}
                    {el.flexShrink !== '1' && <PropRow label="Shrink" value={el.flexShrink} />}
                    {el.flexBasis !== 'auto' && <PropRow label="Basis" value={el.flexBasis} />}
                    {el.order !== '0' && <PropRow label="Order" value={el.order} />}
                    {el.alignSelf !== 'auto' && <PropRow label="Align Self" value={el.alignSelf} />}
                  </PropGrid>
                </div>
              )}
            </Section>
          )
        }

        {/* Background & Gradients */}
        {
          el.backgroundImage !== 'none' && (() => {
            // Parse gradient details
            const gradientMatch = el.backgroundImage.match(/(linear|radial|conic)-gradient\((.+)\)/);
            let gradientType = '';
            let gradientDirection = '';
            let gradientStops: Array<{ color: string; position: string }> = [];

            if (gradientMatch) {
              gradientType = gradientMatch[1];
              const inner = gradientMatch[2];

              // Extract direction (first argument before first color)
              const parts = inner.split(/,(?![^(]*\))/);
              const firstPart = parts[0].trim();

              // Check if first part is a direction/angle
              if (/^(to\s|\d+deg|\d+turn|circle|ellipse|at\s|from\s)/.test(firstPart)) {
                gradientDirection = firstPart;
                parts.shift();
              } else if (gradientType === 'linear') {
                gradientDirection = '180deg (default)';
              }

              // Parse color stops
              parts.forEach(part => {
                const trimmed = part.trim();
                const stopMatch = trimmed.match(/^((?:rgba?|hsla?|#)[^)]*\)|#[a-f0-9]{3,8}|\w+)\s*(.*)?$/i);
                if (stopMatch) {
                  gradientStops.push({ color: stopMatch[1], position: (stopMatch[2] || '').trim() });
                }
              });
            }

            return (
              <Section title="Background" icon={<ImageIcon />}>
                <div className="p-3 flex flex-col gap-3">
                  {/* Gradient Preview */}
                  {el.backgroundImage.includes('gradient') && (
                    <div className="w-full relative rounded-xl overflow-hidden shadow-sm h-14 flex-shrink-0" style={{ border: '1px solid var(--kk-border)' }}>
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZTBlMGUwIiAvPgo8cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZTBlMGUwIiAvPgo8L3N2Zz4=')]"></div>
                      <div className="absolute inset-0" style={{ backgroundImage: el.backgroundImage }}></div>
                    </div>
                  )}

                  {/* Gradient Details */}
                  {gradientType && (
                    <div className="flex flex-col gap-2">
                      <PropGrid>
                        <PropRow label="Type" value={`${gradientType}-gradient`} />
                        {gradientDirection && <PropRow label="Direction" value={gradientDirection} />}
                      </PropGrid>

                      {/* Color Stops */}
                      {gradientStops.length > 0 && (
                        <div>
                          <span className="text-[9px] font-medium uppercase tracking-wide" style={{ color: 'var(--kk-text-muted)' }}>Color Stops ({gradientStops.length})</span>
                          <div className="mt-1.5 flex flex-col gap-1">
                            {gradientStops.map((stop, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-1.5 rounded-lg" style={{ background: 'var(--kk-bg-raised)' }}>
                                <div className="w-5 h-5 rounded-md flex-shrink-0 shadow-sm" style={{ backgroundColor: stop.color, border: '1px solid var(--kk-border)' }} />
                                <span className="text-[10px] font-mono flex-1 truncate" style={{ color: 'var(--kk-text-secondary)' }}>{stop.color}</span>
                                {stop.position && <span className="text-[9px] font-mono" style={{ color: 'var(--kk-text-muted)' }}>{stop.position}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Raw CSS */}
                  {!gradientType && (
                    <div>
                      <span className="text-[9px] font-medium uppercase tracking-wide" style={{ color: 'var(--kk-text-muted)' }}>Background Image</span>
                      <div className="text-[11px] font-mono mt-0.5 break-all leading-relaxed p-2 rounded-lg" style={{ background: 'var(--kk-bg-raised)', color: 'var(--kk-text-secondary)' }}>
                        {el.backgroundImage}
                      </div>
                    </div>
                  )}

                  <PropGrid>
                    <PropRow label="Size" value={el.backgroundSize} />
                    <PropRow label="Position" value={el.backgroundPosition} />
                    <PropRow label="Repeat" value={el.backgroundRepeat} />
                  </PropGrid>
                </div>
              </Section>
            );
          })()
        }

        {/* Element Properties / Layout */}
        <Section title="Element Properties" icon={<GridIcon />}>
          <PropGrid>
            <PropRow label="Width" value={`${el.width}px`} />
            <PropRow label="Height" value={`${el.height}px`} />
            <PropRow label="Display" value={el.display} />
            <PropRow label="Position" value={el.position} />
            <PropRow label="Border Radius" value={el.borderRadius} />
            <PropRow label="Opacity" value={el.opacity} />
            {el.cursor !== 'auto' && <PropRow label="Cursor" value={el.cursor} />}
            {el.overflow !== 'visible' && <PropRow label="Overflow" value={el.overflow} />}
          </PropGrid>
        </Section>

        {/* Interactivity & Effects */}
        {
          (el.transition !== 'all 0s ease 0s' && el.transition !== 'none 0s ease 0s' || el.transform !== 'none' || el.filter !== 'none' || el.backdropFilter) && (
            <Section title="Interactivity" icon={<TypeIcon />}>
              <PropGrid>
                {el.transition !== 'all 0s ease 0s' && el.transition !== 'none 0s ease 0s' && (
                  <div className="col-span-2">
                    <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Transition</span>
                    <div className="text-xs font-mono text-slate-600 mt-0.5 break-all">{el.transition}</div>
                  </div>
                )}
                {el.transform !== 'none' && <PropRow label="Transform" value={el.transform} />}
                {el.filter !== 'none' && <PropRow label="Filter" value={el.filter} />}
                {el.backdropFilter && el.backdropFilter !== 'none' && <PropRow label="Backdrop Filter" value={el.backdropFilter} />}
                {el.mixBlendMode !== 'normal' && <PropRow label="Blend Mode" value={el.mixBlendMode} />}
              </PropGrid>
            </Section>
          )
        }
      </div >
    )
  }

  // ---- TAB: Technologies ----
  const renderTech = () => {
    const KKLogo = () => (
      <svg width="40" height="40" viewBox="0 0 104 101" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="104" height="101" rx="16" className="fill-slate-900 dark:fill-slate-100" />
        <path d="M65.5511 64.2443L65.6364 50.267H67.1705L75.0966 39.2727H88.3068L75.0114 56.4034H71.6875L65.5511 64.2443ZM54.983 72V28.3636H66.7443V72H54.983ZM75.1818 72L67.6818 59.0455L75.3523 50.6932L88.6477 72H75.1818Z" className="fill-white dark:fill-slate-900" />
        <path d="M38.4489 64.2443L38.3636 50.267H36.8295L28.9034 39.2727H15.6932L28.9886 56.4034H32.3125L38.4489 64.2443ZM49.017 72V28.3636H37.2557V72H49.017ZM28.8182 72L36.3182 59.0455L28.6477 50.6932L15.3523 72H28.8182Z" className="fill-white dark:fill-slate-900" />
      </svg>
    );

    const featureCards = [
      { label: 'Overview', desc: 'CSS & Box Model', tab: 'overview' as Tab, icon: <GridIcon /> },
      { label: 'Colors', desc: 'Palette & Export', tab: 'colors' as Tab, icon: <DropletIcon /> },
      { label: 'Typography', desc: 'Fonts & Styles', tab: 'typography' as Tab, icon: <TypeIcon /> },
      { label: 'Assets', desc: 'Images & SVGs', tab: 'assets' as Tab, icon: <ImageIcon /> },
    ];

    return (
      <div className="flex-1 p-3 overflow-y-auto relative">
        {/* Top-right actions */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>

        {/* Hero / Welcome */}
        <div className="text-center mt-3 mb-5">
          <div className="flex justify-center mb-3"><KKLogo /></div>
          <h1 className="text-base font-bold" style={{ color: 'var(--kk-text-primary)' }}>Kaes Keid Inspector</h1>
          <p className="text-[11px] mt-1 leading-relaxed max-w-[220px] mx-auto" style={{ color: 'var(--kk-text-muted)' }}>
            Inspect design properties, colors, typography, assets, and discover the technology stack of any website.
          </p>
        </div>

        {/* Feature shortcut cards */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {featureCards.map(f => (
            <button
              key={f.tab}
              onClick={() => setActiveTab(f.tab)}
              className="kk-hover-lift flex items-center gap-2.5 p-3 rounded-xl text-left group cursor-pointer"
              style={{ background: 'var(--kk-bg-surface)', border: '1px solid var(--kk-border)' }}
            >
              <div className="transition-colors group-hover:text-violet-500" style={{ color: 'var(--kk-text-muted)' }}>{f.icon}</div>
              <div>
                <div className="text-[11px] font-semibold" style={{ color: 'var(--kk-text-primary)' }}>{f.label}</div>
                <div className="text-[9px]" style={{ color: 'var(--kk-text-muted)' }}>{f.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Tech Stack Results */}
        <div className="pt-4" style={{ borderTop: '1px solid var(--kk-border)' }}>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--kk-text-muted)' }}>
              Technology Stack
              {isScanning && (
                <span className="flex items-center gap-1" style={{ color: 'var(--kk-accent)' }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--kk-accent)' }} />
                  <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--kk-accent)', opacity: 0.7, animationDelay: '150ms' }} />
                  <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--kk-accent)', opacity: 0.4, animationDelay: '300ms' }} />
                  <span className="text-[9px] font-medium ml-0.5">Scanning</span>
                </span>
              )}
              {!isScanning && pageTechs.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'var(--kk-accent-glow)', color: 'var(--kk-accent)' }}>{pageTechs.length}</span>
              )}
            </h3>

            {!isScanning && pageTechs.length > 0 && (
              <div className="flex gap-2 items-center">
                <select
                  value={exportFormat}
                  onChange={e => setExportFormat(e.target.value as 'json' | 'markdown')}
                  className="text-[10px] rounded-lg px-1.5 py-0.5 outline-none cursor-pointer"
                  style={{ background: 'var(--kk-bg-raised)', border: '1px solid var(--kk-border)', color: 'var(--kk-text-secondary)' }}
                >
                  <option value="json">JSON</option>
                  <option value="markdown">Markdown</option>
                </select>
                <button
                  onClick={() => {
                    let res = '';
                    if (exportFormat === 'json') {
                      res = JSON.stringify(pageTechs, null, 2);
                    } else {
                      res = '# Tech Stack\n\n' + pageTechs.map((t: any) => `- **${t.name}**${t.version ? ` (v${t.version})` : ''} - *${t.category}*`).join('\n');
                    }
                    const blob = new Blob([res], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `stack-export.${exportFormat === 'json' ? 'json' : 'md'}`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="text-[10px] font-medium px-2.5 py-1 rounded-lg transition-all cursor-pointer hover:opacity-90"
                  style={{ color: 'var(--kk-accent)', border: '1px solid var(--kk-accent-glow)' }}
                >
                  Download
                </button>
              </div>
            )}
          </div>

          {pageTechs.length === 0 && !isScanning ? (
            <div className="text-center py-6">
              <p className="text-xs" style={{ color: 'var(--kk-text-muted)' }}>No technologies detected on this page.</p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--kk-text-muted)', opacity: 0.6 }}>Try refreshing the page or navigating to a different site.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {Array.from(new Set(pageTechs.map(t => t.category))).map(category => (
                <Section key={category} title={category} icon={<TechIcon />}>
                  <div className="p-2.5 flex flex-wrap gap-1.5">
                    {pageTechs.filter(t => t.category === category).map(tech => (
                      <TechItem key={tech.name} tech={tech} isDark={isDark} />
                    ))}
                  </div>
                </Section>
              ))}
            </div>
          )}
        </div>

        {/* Core Web Vitals */}
        <div className="pt-4 mt-4" style={{ borderTop: '1px solid var(--kk-border)' }}>
          <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3 px-1 flex items-center gap-2" style={{ color: 'var(--kk-text-muted)' }}>
            Core Web Vitals
          </h3>
          <div className="grid grid-cols-3 gap-2 px-1 pb-2">
            {[
              { name: 'LCP', val: pageVitals?.LCP, unit: 's', g: 2500, p: 4000, desc: 'Largest Contentful Paint' },
              { name: 'INP', val: pageVitals?.INP, unit: 'ms', g: 200, p: 500, desc: 'Interaction to Next Paint' },
              { name: 'CLS', val: pageVitals?.CLS, unit: '', g: 0.1, p: 0.25, desc: 'Cumulative Layout Shift' },
              { name: 'FCP', val: pageVitals?.FCP, unit: 's', g: 1800, p: 3000, desc: 'First Contentful Paint' },
              { name: 'TTFB', val: pageVitals?.TTFB, unit: 's', g: 800, p: 1800, desc: 'Time to First Byte' }
            ].map(v => {
              let displayVal = v.val !== undefined ? v.val : '-';
              if (v.val !== undefined && v.unit === 's') displayVal = (v.val / 1000).toFixed(2);

              let color = 'var(--kk-text-muted)';
              let bg = 'var(--kk-bg-raised)';
              if (v.val !== undefined) {
                if (v.val <= v.g) { color = '#16a34a'; bg = 'rgba(22,163,74,0.08)'; }
                else if (v.val <= v.p) { color = '#d97706'; bg = 'rgba(217,119,6,0.08)'; }
                else { color = '#dc2626'; bg = 'rgba(220,38,38,0.08)'; }
              }
              return (
                <div key={v.name} className="flex flex-col p-2.5 rounded-xl" style={{ background: bg, border: '1px solid var(--kk-border)' }} title={v.desc}>
                  <span className="text-[10px] font-semibold" style={{ color: 'var(--kk-text-muted)' }}>{v.name}</span>
                  <div className="mt-1 flex items-baseline gap-0.5">
                    <span className="text-sm font-bold" style={{ color }}>{displayVal}</span>
                    {v.val !== undefined && <span className="text-[9px] opacity-70" style={{ color }}>{v.unit}</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[9px] text-center mt-2 pb-2 px-2 leading-relaxed" style={{ color: 'var(--kk-text-muted)' }}>
            Values are measured directly from your brower's real page load via the PerformanceObserver API. Blank values mean the event hasn't fired yet.
          </p>
        </div>
      </div>
    )
  }

  // ---- TAB: Colors ----
  const renderColors = () => {
    if (isScanning) return <ScanningState label="Scanning colors..." />
    return (
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--kk-text-primary)' }}>
            Colors <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'var(--kk-bg-raised)', color: 'var(--kk-text-muted)' }}>{pageColors.length}</span>
          </h2>
          {pageColors.length > 0 && (
            <div className="flex gap-2 items-center">
              <select
                value={exportFormat}
                onChange={e => setExportFormat(e.target.value as any)}
                className="text-[10px] rounded-lg px-1.5 py-0.5 outline-none cursor-pointer"
                style={{ background: 'var(--kk-bg-raised)', border: '1px solid var(--kk-border)', color: 'var(--kk-text-secondary)' }}
              >
                <option value="css">CSS Vars</option>
                <option value="scss">SCSS</option>
                <option value="json">JSON</option>
                <option value="json-tokens">Design Tokens</option>
              </select>
              <button
                onClick={() => {
                  let res = '';
                  let filename = 'palette';
                  let mime = 'text/plain';
                  if (exportFormat === 'css') {
                    res = ':root {\n' + pageColors.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join('\n') + '\n}';
                    filename += '.css';
                    mime = 'text/css';
                  } else if (exportFormat === 'scss') {
                    res = pageColors.map((c, i) => `$color-${i + 1}: ${c.hex};`).join('\n');
                    filename += '.scss';
                    mime = 'text/x-scss';
                  } else {
                    const obj: any = {};
                    pageColors.forEach((c, i) => { obj[`color-${i + 1}`] = c.hex; });
                    res = JSON.stringify(exportFormat === 'json-tokens' ? { colors: obj } : obj, null, 2);
                    filename += '.json';
                    mime = 'application/json';
                  }
                  downloadFile(res, filename, mime);
                }}
                className="text-[10px] font-medium px-2.5 py-1 rounded-lg transition-all cursor-pointer hover:opacity-90 flex items-center gap-1"
                style={{ color: 'var(--kk-accent)', border: '1px solid var(--kk-accent-glow)' }}
              >
                <DownloadIcon /> Download
              </button>
            </div>
          )}
        </div>

        {pageColors.map((color, i) => (
          <div
            key={i}
            className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer relative group"
            style={{ backgroundColor: color.hex, border: '1px solid var(--kk-border)' }}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('.format-tag')) {
                cycleColorFormat();
              } else {
                copyToClipboard(formatColor(color.hex));
              }
            }}
          >
            <div className="absolute top-2 right-2 format-tag bg-black/20 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
              {colorFormat.toUpperCase()}
            </div>
            <div className="px-4 py-5">
              <div className="font-mono font-bold text-sm" style={{ color: getTextColorOnBg(color.hex) }}>
                {formatColor(color.hex)}
              </div>
              <div className="text-[10px] mt-0.5 opacity-70" style={{ color: getTextColorOnBg(color.hex) }}>
                {color.count} instances  --  {color.category}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ---- TAB: Typography ----
  const renderTypography = () => {
    if (isScanning) return <ScanningState label="Scanning typography..." />
    return (
      <div className="flex flex-col gap-3 p-3">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--kk-text-primary)' }}>
          Typography <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'var(--kk-bg-raised)', color: 'var(--kk-text-muted)' }}>{pageTypography.length}</span>
        </h2>
        {pageTypography.map((typo, i) => (
          <div key={i} className="rounded-xl overflow-hidden" style={{ background: 'var(--kk-bg-surface)', border: '1px solid var(--kk-border)' }}>
            <div className="p-3" style={{ borderBottom: '1px solid var(--kk-border-subtle)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold capitalize" style={{ color: 'var(--kk-text-secondary)' }}>
                  {typo.tag === 'h1' ? 'Heading 1' :
                    typo.tag === 'h2' ? 'Heading 2' :
                      typo.tag === 'h3' ? 'Heading 3' :
                        typo.tag === 'h4' ? 'Heading 4' :
                          typo.tag === 'p' ? 'Body' :
                            typo.tag === 'span' ? 'Inline' :
                              typo.tag === 'a' ? 'Link' : typo.tag}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--kk-text-muted)' }}>{typo.count} instances</span>
              </div>

              {/* Typography Preview */}
              <div
                className="mt-2 overflow-hidden whitespace-nowrap text-ellipsis"
                style={{
                  fontFamily: typo.fontFamily,
                  fontSize: Math.min(parseFloat(typo.fontSize), 32) + 'px',
                  fontWeight: typo.fontWeight,
                  lineHeight: '1.3',
                  color: 'var(--kk-text-primary)',
                }}
              >
                AaBbCcDdEeFfGg
              </div>
            </div>

            <div className="p-3">
              <PropGrid>
                <PropRow label="Font Family" value={typo.fontFamily.split(',')[0].replace(/['"]/g, '')} onCopy={() => copyToClipboard(typo.fontFamily.split(',')[0].replace(/['"]/g, ''))} />
                <PropRow label="Font Size" value={typo.fontSize} />
                <PropRow label="Weight" value={fontWeightName(typo.fontWeight)} />
                <PropRow label="Line Height" value={typo.lineHeight} />
                <PropRow label="Letter Spacing" value={typo.letterSpacing} />
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: typo.color }}></div>
                  <span className="text-[10px]" style={{ color: 'var(--kk-text-muted)' }}>Color</span>
                  <span className="text-xs font-mono ml-auto cursor-pointer hover:text-violet-500 transition-colors" style={{ color: 'var(--kk-text-secondary)' }} onClick={cycleColorFormat}>
                    {formatColor(typo.colorHex)}
                  </span>
                </div>
              </PropGrid>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ---- TAB: Assets ----
  const renderAssets = () => {
    if (isScanning) return <ScanningState label="Scanning assets..." />
    const imageAssets = pageAssets.filter(a => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'ico'].includes(a.type) || a.tagName === 'SVG')
    return (
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--kk-text-primary)' }}>
            Assets <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'var(--kk-bg-raised)', color: 'var(--kk-text-muted)' }}>{imageAssets.length}</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {imageAssets.map((asset, i) => (
            <div key={i} className="group relative rounded-xl overflow-hidden transition-all hover:shadow-lg" style={{ background: 'var(--kk-bg-surface)', border: '1px solid var(--kk-border)' }}>
              <div className="aspect-square bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+CjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNmMGYwZjAiIC8+CjxyZWN0IHg9IjgiIHk9IjgiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNmMGYwZjAiIC8+Cjwvc3ZnPg==')] flex items-center justify-center p-2">
                {asset.tagName !== 'SVG' ? (
                  <img src={asset.src} alt={asset.alt} className="max-w-full max-h-full object-contain" loading="lazy" />
                ) : (
                  <div className="text-xs" style={{ color: 'var(--kk-text-muted)' }}>SVG</div>
                )}
              </div>

              {/* Download overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-xl">
                {asset.tagName !== 'SVG' && (
                  <a
                    href={asset.src}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:opacity-90"
                    style={{ background: 'var(--kk-accent)' }}
                  >
                    Download
                  </a>
                )}
                <span className="text-white/70 text-[10px] mt-1.5">.{asset.type}</span>
              </div>
            </div>
          ))}
        </div>

        {imageAssets.length === 0 && (
          <div className="text-center py-8 text-xs" style={{ color: 'var(--kk-text-muted)' }}>
            No image assets found on this page.
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`w-full h-screen flex flex-col ${isDark ? 'dark' : ''}`} style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", background: 'var(--kk-bg-base)', color: 'var(--kk-text-primary)' }}>

      {/* Error Overlay */}
      {portError && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
          <div className="text-rose-500 mb-4"><AlertIcon /></div>
          <h2 className="text-lg font-bold text-white mb-2">Page Needs Refresh</h2>
          <p className="text-slate-300 text-xs max-w-[240px] leading-relaxed mb-6">
            The extension was just installed or updated. Please refresh the web page to connect to Kaes Keid Inspector.
          </p>
          <button
            onClick={() => {
              chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.id) chrome.tabs.reload(tabs[0].id);
                window.close(); // close panel to force fresh state on reopen
              });
            }}
            className="bg-white text-slate-900 px-4 py-2 rounded-md text-xs font-semibold hover:bg-slate-200 transition-colors w-full"
          >
            Refresh Page Now
          </button>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'tech' && renderTech()}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'colors' && renderColors()}
        {activeTab === 'typography' && renderTypography()}
        {activeTab === 'assets' && renderAssets()}
      </main>

      {/* Bottom Tab Bar */}
      {/* Bottom Tab Bar - Glassmorphism in dark mode */}
      <nav
        className="flex items-center justify-around py-2.5 flex-shrink-0"
        style={{
          background: 'var(--kk-bg-surface)',
          borderTop: '1px solid var(--kk-border)',
          boxShadow: isDark ? '0 -4px 20px rgba(0,0,0,0.3)' : '0 -2px 8px rgba(0,0,0,0.04)'
        }}
      >
        <TabButton icon={<TechIcon />} label="Stack" active={activeTab === 'tech'} onClick={() => setActiveTab('tech')} />
        <TabButton icon={<GridIcon />} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
        <TabButton icon={<DropletIcon />} label="Colors" active={activeTab === 'colors'} onClick={() => setActiveTab('colors')} />
        <TabButton icon={<TypeIcon />} label="Type" active={activeTab === 'typography'} onClick={() => setActiveTab('typography')} />
        <TabButton icon={<ImageIcon />} label="Assets" active={activeTab === 'assets'} onClick={() => setActiveTab('assets')} />
      </nav>
    </div>
  )
}

// ---- Reusable UI Components ----

function TabButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3.5 py-1.5 rounded-xl transition-all duration-200 ${active
        ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 shadow-sm'
        : 'text-[var(--kk-text-muted)] hover:text-[var(--kk-text-secondary)] hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
        }`}
    >
      {icon}
      <span className="text-[9px] font-semibold tracking-wide">{label}</span>
    </button>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--kk-bg-surface)', border: '1px solid var(--kk-border)' }}>
      <div className="px-3 py-2.5 flex items-center gap-2" style={{ background: 'var(--kk-bg-raised)', borderBottom: '1px solid var(--kk-border-subtle)' }}>
        <span style={{ color: 'var(--kk-text-muted)' }}>{icon}</span>
        <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--kk-text-muted)' }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

function PropGrid({ children }: { children: React.ReactNode }) {
  return <div className="p-3 grid grid-cols-2 gap-y-2.5 gap-x-4">{children}</div>
}

function withRem(val: string) {
  if (!val || typeof val !== 'string') return val;
  // Match number followed by px, with optional space
  return val.replace(/(-?\d+(?:\.\d+)?)\s*px/g, (_match, p1) => {
    const px = parseFloat(p1);
    if (px === 0) return '0px';
    const rem = +(px / 16).toFixed(3);
    return `${px}px (${rem}rem)`;
  });
}

function PropRow({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  const displayValue = withRem(value);
  return (
    <div className="flex flex-col">
      <span className="text-[9px] font-medium uppercase tracking-wide" style={{ color: 'var(--kk-text-muted)' }}>{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium truncate" style={{ color: 'var(--kk-text-primary)' }} title={displayValue}>{displayValue}</span>
        {onCopy && (
          <button onClick={onCopy} className="hover:text-violet-500 transition-colors flex-shrink-0" style={{ color: 'var(--kk-text-muted)' }}>
            <CopyIcon />
          </button>
        )}
      </div>
    </div>
  )
}

function ColorRow({ label, color, hex, format, onToggleFormat, onCopy }: { label: string; color: string; hex: string; format: ColorFormat; onToggleFormat: () => void; onCopy: () => void }) {
  const displayColor = format === 'rgb' ? hexToRgb(hex) : format === 'hsl' ? hexToHsl(hex) : hex;
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 shadow-sm" style={{ border: '1px solid var(--kk-border)' }}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZTBlMGUwIiAvPgo8cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZTBlMGUwIiAvPgo8L3N2Zz4=')]"></div>
        <div className="absolute inset-0" style={{ backgroundColor: isTransparent(color) ? 'transparent' : color }}></div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-medium uppercase cursor-pointer hover:text-violet-500 dark:hover:text-violet-400 inline-block transition-colors" style={{ color: 'var(--kk-text-muted)' }} onClick={onToggleFormat}>
          {label} &middot; {format.toUpperCase()}
        </div>
        <div className="text-xs font-mono truncate" style={{ color: 'var(--kk-text-secondary)' }}>{isTransparent(color) ? 'transparent' : displayColor}</div>
      </div>
      {!isTransparent(color) && (
        <button onClick={onCopy} className="hover:text-violet-500 dark:hover:text-violet-400 transition-colors p-1" style={{ color: 'var(--kk-text-muted)' }}>
          <CopyIcon />
        </button>
      )}
    </div>
  )
}

function ScanningState({ label }: { label: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16">
      <div className="w-9 h-9 rounded-full animate-spin mb-3" style={{ border: '2px solid var(--kk-border)', borderTopColor: 'var(--kk-accent)' }}></div>
      <span className="text-xs" style={{ color: 'var(--kk-text-muted)' }}>{label}</span>
    </div>
  )
}

export default App
