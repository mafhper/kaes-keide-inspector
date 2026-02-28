// content.ts - Enhanced CSS Inspector Content Script
// Auto-starts inspection mode. Shows hover tooltip with element info.
import { onLCP, onCLS, onINP, onTTFB, onFCP } from 'web-vitals';

const vitals: Record<string, number> = {};
onLCP((m: any) => vitals['LCP'] = Number(m.value.toFixed(2)), { reportAllChanges: true });
onCLS((m: any) => vitals['CLS'] = Number(m.value.toFixed(4)), { reportAllChanges: true });
onINP((m: any) => vitals['INP'] = Number(m.value.toFixed(2)), { reportAllChanges: true });
onTTFB((m: any) => vitals['TTFB'] = Number(m.value.toFixed(2)), { reportAllChanges: true });
onFCP((m: any) => vitals['FCP'] = Number(m.value.toFixed(2)), { reportAllChanges: true });

let overlayWrapper: HTMLElement | null = null;
let hoverBox: HTMLElement | null = null;
let tooltip: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let lastHoveredElement: HTMLElement | null = null;

// ---- Color Utility ----
function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return rgb;
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return parseFloat(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

function getRelativeLuminance(color: string): number {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return 0;
  const [r, g, b] = [parseInt(match[1]) / 255, parseInt(match[2]) / 255, parseInt(match[3]) / 255];
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getEffectiveBackgroundColor(el: HTMLElement): string {
  let current: HTMLElement | null = el;
  while (current) {
    const bg = window.getComputedStyle(current).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      return bg;
    }
    current = current.parentElement;
  }
  return 'rgb(255, 255, 255)';
}

// ---- Excluded Elements ----
const EXCLUDED_TAGS = new Set([
  'HTML', 'HEAD', 'META', 'SCRIPT', 'STYLE', 'LINK', 'NOSCRIPT',
  'BR', 'TITLE', 'PATH', 'DEFS', 'CLIPPATH', 'MASK',
]);

function isValidTarget(el: Element): boolean {
  if (EXCLUDED_TAGS.has(el.tagName)) return false;
  if (el.id === 'css-inspector-overlay-wrapper') return false;
  if (el.closest('#css-inspector-overlay-wrapper')) return false;
  return true;
}

// ---- Find deepest element under cursor ----
function getDeepestElementAtPoint(x: number, y: number): HTMLElement | null {
  // Temporarily hide overlay so elementFromPoint hits the page
  if (overlayWrapper) overlayWrapper.style.display = 'none';

  const el = document.elementFromPoint(x, y) as HTMLElement | null;

  if (overlayWrapper) overlayWrapper.style.display = '';

  if (!el || !isValidTarget(el)) return null;
  return el;
}

// ---- Extract comprehensive style data ----
function extractElementData(el: HTMLElement) {
  const cs = window.getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  const parentBg = getEffectiveBackgroundColor(el);
  const textColor = cs.color;
  const contrast = getContrastRatio(textColor, parentBg);

  return {
    tagName: el.tagName,
    id: el.id || '',
    classList: Array.from(el.classList).join('.'),
    textContent: (el.textContent || '').trim().substring(0, 80),

    // Typography
    fontFamily: cs.fontFamily,
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    lineHeight: cs.lineHeight,
    letterSpacing: cs.letterSpacing,
    textTransform: cs.textTransform,
    textDecoration: cs.textDecoration,
    textShadow: cs.textShadow,

    // Colors
    color: cs.color,
    colorHex: rgbToHex(cs.color),
    backgroundColor: cs.backgroundColor,
    backgroundColorHex: rgbToHex(cs.backgroundColor),
    parentBackground: parentBg,
    parentBackgroundHex: rgbToHex(parentBg),

    // Background (gradients, images)
    backgroundImage: cs.backgroundImage,
    backgroundSize: cs.backgroundSize,
    backgroundPosition: cs.backgroundPosition,
    backgroundRepeat: cs.backgroundRepeat,

    // Contrast
    contrast,
    contrastRating: contrast >= 7 ? 'AAA' : contrast >= 4.5 ? 'AA' : contrast >= 3 ? 'Poor' : 'Very Poor',

    // Box Model
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    paddingTop: cs.paddingTop,
    paddingRight: cs.paddingRight,
    paddingBottom: cs.paddingBottom,
    paddingLeft: cs.paddingLeft,
    marginTop: cs.marginTop,
    marginRight: cs.marginRight,
    marginBottom: cs.marginBottom,
    marginLeft: cs.marginLeft,

    // Borders (full details)
    borderTopWidth: cs.borderTopWidth,
    borderRightWidth: cs.borderRightWidth,
    borderBottomWidth: cs.borderBottomWidth,
    borderLeftWidth: cs.borderLeftWidth,
    borderRadius: cs.borderRadius,
    borderColor: cs.borderColor,
    borderTopColor: cs.borderTopColor,
    borderRightColor: cs.borderRightColor,
    borderBottomColor: cs.borderBottomColor,
    borderLeftColor: cs.borderLeftColor,
    borderStyle: cs.borderStyle,
    borderTopStyle: cs.borderTopStyle,
    borderRightStyle: cs.borderRightStyle,
    borderBottomStyle: cs.borderBottomStyle,
    borderLeftStyle: cs.borderLeftStyle,

    // Shadows & Effects
    boxShadow: cs.boxShadow,
    outline: cs.outline,
    outlineColor: cs.outlineColor,
    outlineStyle: cs.outlineStyle,
    outlineWidth: cs.outlineWidth,
    outlineOffset: cs.outlineOffset,

    // Layout
    display: cs.display,
    position: cs.position,
    overflow: cs.overflow,
    opacity: cs.opacity,

    // Grid
    gridTemplateColumns: cs.gridTemplateColumns,
    gridTemplateRows: cs.gridTemplateRows,
    gridAutoFlow: cs.gridAutoFlow,
    gridAutoColumns: cs.gridAutoColumns,
    gridAutoRows: cs.gridAutoRows,
    gridTemplateAreas: cs.gridTemplateAreas,
    gap: cs.gap,
    columnGap: cs.columnGap,
    rowGap: cs.rowGap,

    // Flexbox
    flexDirection: cs.flexDirection,
    flexWrap: cs.flexWrap,
    flexGrow: cs.flexGrow,
    flexShrink: cs.flexShrink,
    flexBasis: cs.flexBasis,
    alignSelf: cs.alignSelf,
    order: cs.order,

    // Alignment (shared by Grid & Flex)
    justifyItems: cs.justifyItems,
    alignItems: cs.alignItems,
    justifyContent: cs.justifyContent,
    alignContent: cs.alignContent,

    // Interactivity
    cursor: cs.cursor,
    transition: cs.transition,
    transform: cs.transform,
    filter: cs.filter,
    backdropFilter: (cs as any).backdropFilter || '',
    mixBlendMode: cs.mixBlendMode,

    // Position
    top: Math.round(rect.top),
    left: Math.round(rect.left),
    dpr: window.devicePixelRatio || 1,
  };
}

// ---- Scan entire page for colors ----
function scanPageColors(): Array<{ hex: string; rgb: string; count: number; category: string }> {
  const colorMap = new Map<string, { rgb: string; count: number; categories: Set<string> }>();

  const addColor = (rgb: string, category: string) => {
    if (rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') return;
    const hex = rgbToHex(rgb);
    if (!colorMap.has(hex)) {
      colorMap.set(hex, { rgb, count: 0, categories: new Set() });
    }
    const entry = colorMap.get(hex)!;
    entry.count++;
    entry.categories.add(category);
  };

  const allElements = document.querySelectorAll('*');
  allElements.forEach(el => {
    if (!isValidTarget(el)) return;
    const cs = window.getComputedStyle(el);
    addColor(cs.color, 'text');
    addColor(cs.backgroundColor, 'background');
    if (cs.borderColor && cs.borderWidth !== '0px') addColor(cs.borderColor, 'border');
  });

  return Array.from(colorMap.entries())
    .map(([hex, data]) => ({
      hex,
      rgb: data.rgb,
      count: data.count,
      category: Array.from(data.categories).join(', '),
    }))
    .sort((a, b) => b.count - a.count);
}

// ---- Scan page for typography styles ----
function scanPageTypography(): Array<{
  tag: string; fontFamily: string; fontSize: string; fontWeight: string;
  lineHeight: string; letterSpacing: string; color: string; colorHex: string;
  count: number; sample: string;
}> {
  const TEXT_TAGS = new Set(['P', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'A', 'STRONG', 'EM', 'B', 'I', 'SMALL', 'LABEL', 'LI', 'TD', 'TH', 'BLOCKQUOTE', 'FIGCAPTION', 'LEGEND', 'CAPTION']);
  const styleMap = new Map<string, any>();

  document.querySelectorAll('*').forEach(el => {
    if (!TEXT_TAGS.has(el.tagName)) return;
    if (!el.textContent?.trim()) return;
    const cs = window.getComputedStyle(el);
    const key = `${cs.fontFamily}|${cs.fontSize}|${cs.fontWeight}`;
    if (!styleMap.has(key)) {
      styleMap.set(key, {
        tag: el.tagName.toLowerCase(),
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        color: cs.color,
        colorHex: rgbToHex(cs.color),
        count: 0,
        sample: (el.textContent || '').trim().substring(0, 40),
      });
    }
    styleMap.get(key)!.count++;
  });

  return Array.from(styleMap.values()).sort((a, b) => {
    const sizeA = parseFloat(a.fontSize);
    const sizeB = parseFloat(b.fontSize);
    return sizeB - sizeA;
  });
}

// ---- Scan page for image assets ----
function scanPageAssets(): Array<{ src: string; alt: string; type: string; width: number; height: number; tagName: string }> {
  const assets: Array<{ src: string; alt: string; type: string; width: number; height: number; tagName: string }> = [];
  const seen = new Set<string>();

  // <img> tags
  document.querySelectorAll('img').forEach(img => {
    const src = img.src || img.getAttribute('data-src') || '';
    if (!src || seen.has(src)) return;
    seen.add(src);
    const ext = src.split('.').pop()?.split('?')[0]?.toLowerCase() || 'unknown';
    assets.push({
      src,
      alt: img.alt || img.title || '',
      type: ext,
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      tagName: 'IMG',
    });
  });

  // SVG elements
  document.querySelectorAll('svg').forEach((svg, i) => {
    const rect = svg.getBoundingClientRect();
    if (rect.width < 5 || rect.height < 5) return;
    const id = `svg-inline-${i}`;
    if (seen.has(id)) return;
    seen.add(id);
    assets.push({
      src: id,
      alt: svg.getAttribute('aria-label') || 'Inline SVG',
      type: 'svg',
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      tagName: 'SVG',
    });
  });

  // Background images
  document.querySelectorAll('*').forEach(el => {
    const cs = window.getComputedStyle(el);
    const bgImage = cs.backgroundImage;
    if (bgImage && bgImage !== 'none') {
      const urlMatch = bgImage.match(/url\(["']?(.+?)["']?\)/);
      if (urlMatch && urlMatch[1]) {
        const src = urlMatch[1];
        if (seen.has(src)) return;
        seen.add(src);
        const ext = src.split('.').pop()?.split('?')[0]?.toLowerCase() || 'unknown';
        assets.push({
          src,
          alt: 'Background image',
          type: ext,
          width: 0,
          height: 0,
          tagName: 'BG',
        });
      }
    }
  });

  return assets;
}

import { detectTechnologies, stackDB } from './utils/stackEngine';

// ---- Scan page for technologies ----
async function scanPageTechnologies(): Promise<Array<{ name: string; category: string; version?: string }>> {
  try {
    const tabData = await new Promise<any>((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_TAB_DATA' }, (res) => {
        if (chrome.runtime.lastError) resolve({ headers: {} });
        else resolve(res || { headers: {} });
      });
    });

    const scriptSrcs = Array.from(document.querySelectorAll('script')).map(s => s.src).filter(Boolean);
    const metaTags = Array.from(document.querySelectorAll('meta')).reduce((acc, m) => {
      const key = (m.getAttribute('name') || m.getAttribute('property') || '').toLowerCase();
      const val = m.getAttribute('content');
      if (key && val) {
        if (!acc[key]) acc[key] = [];
        acc[key].push(val);
      }
      return acc;
    }, {} as Record<string, string[]>);

    const cookies = document.cookie.split(';').reduce((acc, c) => {
      const [k, v] = c.split('=').map(x => x.trim());
      if (k) acc[k] = v || '';
      return acc;
    }, {} as Record<string, string>);

    const html = document.documentElement.outerHTML || '';

    // Collect JS globals and DOM selectors to check from stackDB
    const jsChains = new Set<string>();
    const domSelectors = new Set<string>();

    for (const tech of Object.values(stackDB.technologies) as any[]) {
      if (tech.js) {
        Object.keys(tech.js).forEach(chain => jsChains.add(chain));
      }
      if (tech.dom) {
        const rules = Array.isArray(tech.dom) ? tech.dom : [tech.dom];
        for (const rule of rules) {
          if (typeof rule === 'string') domSelectors.add(rule);
          else if (typeof rule === 'object') Object.keys(rule).forEach(s => domSelectors.add(s));
        }
      }
    }

    // 1. Check DOM selectors
    const domResults: Record<string, boolean> = {};
    domSelectors.forEach(selector => {
      try {
        if (document.querySelector(selector)) {
          domResults[selector] = true;
        }
      } catch { /* skip invalid selectors */ }
    });

    // 2. Check JS globals (via injection)
    let jsResults: Record<string, any> = {};
    if (jsChains.size > 0) {
      try {
        jsResults = await new Promise<Record<string, any>>((resolve) => {
          const timeout = setTimeout(() => resolve({}), 2000);
          const listener = (event: MessageEvent) => {
            if (event.source !== window || !event.data?.kaesKeidResult) return;
            window.removeEventListener('message', listener);
            clearTimeout(timeout);
            resolve(event.data.kaesKeidResult);
          };
          window.addEventListener('message', listener);

          const script = document.createElement('script');
          script.src = chrome.runtime.getURL('detect-globals.js');
          script.onload = () => {
            window.postMessage({ kaesKeid: { chains: Array.from(jsChains) } }, '*');
            script.remove();
          };
          script.onerror = () => { clearTimeout(timeout); resolve({}); };
          (document.head || document.documentElement).appendChild(script);
        });
      } catch { /* skip */ }
    }

    const results = detectTechnologies({
      url: window.location.href,
      html,
      headers: tabData.headers || {},
      scripts: scriptSrcs,
      meta: metaTags,
      cookies,
      js: jsResults,
      dom: domResults,
    });

    // Sort by confidence
    results.sort((a, b) => b.confidence - a.confidence);

    return results.map(r => ({
      name: r.name,
      category: r.categories[0]?.name || 'Other',
      version: r.version
    }));

  } catch (err) {
    console.error('Scan error:', err);
    return [];
  }
}

// ---- Create Overlay + Tooltip ----
function createOverlay() {
  if (overlayWrapper) return;

  overlayWrapper = document.createElement('div');
  overlayWrapper.id = 'css-inspector-overlay-wrapper';
  overlayWrapper.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    pointer-events: none; z-index: 2147483647;
  `;

  shadowRoot = overlayWrapper.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }

    #hover-box {
      position: absolute;
      border: 2px solid #7C3AED;
      background: rgba(124, 58, 237, 0.08);
      transition: all 0.08s ease-out;
      display: none;
      pointer-events: none;
      border-radius: 2px;
    }

    #tooltip {
      position: absolute;
      background: #1e1b2e;
      color: #e2e0ea;
      border-radius: 10px;
      padding: 10px 14px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 11px;
      line-height: 1.5;
      min-width: 200px;
      max-width: 320px;
      display: none;
      pointer-events: none;
      box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2);
      z-index: 99999;
      border: 1px solid rgba(255,255,255,0.08);
    }

    .tt-tag {
      color: #a78bfa;
      font-weight: 600;
      font-size: 12px;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .tt-tag .tt-class {
      color: #6d6a80;
      font-weight: 400;
      font-size: 10px;
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .tt-dim {
      color: #818097;
      font-size: 10px;
      margin-bottom: 8px;
    }

    .tt-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .tt-swatch {
      width: 14px;
      height: 14px;
      border-radius: 3px;
      border: 1px solid rgba(255,255,255,0.15);
      flex-shrink: 0;
    }

    .tt-label {
      color: #6d6a80;
      font-size: 10px;
      min-width: 30px;
    }
    .tt-value {
      color: #c4c0d8;
      font-size: 11px;
      font-weight: 500;
    }

    .tt-divider {
      border-top: 1px solid rgba(255,255,255,0.06);
      margin: 6px 0;
    }

    .tt-font {
      font-size: 10px;
      color: #818097;
    }
    .tt-font-name {
      color: #c4c0d8;
      font-weight: 500;
    }

    .tt-contrast-badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 600;
    }
    .tt-contrast-good { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
    .tt-contrast-poor { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
  `;

  hoverBox = document.createElement('div');
  hoverBox.id = 'hover-box';

  tooltip = document.createElement('div');
  tooltip.id = 'tooltip';

  shadowRoot.appendChild(style);
  shadowRoot.appendChild(hoverBox);
  shadowRoot.appendChild(tooltip);
  document.documentElement.appendChild(overlayWrapper);
}

function positionTooltip(mouseX: number, mouseY: number) {
  if (!tooltip) return;
  const gap = 16;
  const tw = 280;
  const th = 180;

  // Position tooltip below-right of cursor by default
  let x = mouseX + gap;
  let y = mouseY + gap;

  // If tooltip goes below viewport, put it above cursor
  if (y + th > window.innerHeight) {
    y = mouseY - th - gap;
    if (y < 0) y = 4;
  }
  // If tooltip goes off right edge, flip to left of cursor
  if (x + tw > window.innerWidth) {
    x = mouseX - tw - gap;
    if (x < 0) x = 4;
  }

  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
  tooltip.style.width = `${tw}px`;
}

function updateTooltipContent(data: ReturnType<typeof extractElementData>) {
  if (!tooltip) return;

  const classDisplay = data.classList ? `.${data.classList}` : '';
  const contrastClass = data.contrast >= 4.5 ? 'tt-contrast-good' : 'tt-contrast-poor';

  tooltip.innerHTML = `
    <div class="tt-tag">
      &lt;${data.tagName.toLowerCase()}&gt;
      ${classDisplay ? `<span class="tt-class">${classDisplay}</span>` : ''}
    </div>
    <div class="tt-dim">${data.width} x ${data.height}</div>
    <div class="tt-divider"></div>
    <div class="tt-row">
      <div class="tt-swatch" style="background:${data.color}"></div>
      <span class="tt-label">Text</span>
      <span class="tt-value">${data.colorHex}</span>
    </div>
    <div class="tt-row">
      <div class="tt-swatch" style="background:${data.parentBackground}"></div>
      <span class="tt-label">BG</span>
      <span class="tt-value">${data.parentBackgroundHex}</span>
    </div>
    <div class="tt-divider"></div>
    <div class="tt-row">
      <span class="tt-font"><span class="tt-font-name">${data.fontFamily.split(',')[0].replace(/['"]/g, '')}</span> ${data.fontSize} / ${data.fontWeight}</span>
    </div>
    <div class="tt-row" style="margin-top:4px;">
      <span class="tt-contrast-badge ${contrastClass}">${data.contrast}:1 ${data.contrastRating}</span>
    </div>
  `;
}

// ---- Event Handlers ----
function handleMouseMove(e: MouseEvent) {
  const target = getDeepestElementAtPoint(e.clientX, e.clientY);
  if (!target || !hoverBox || !tooltip) return;

  // Always update tooltip position to follow cursor
  positionTooltip(e.clientX, e.clientY);

  if (target === lastHoveredElement) return;
  lastHoveredElement = target;

  const rect = target.getBoundingClientRect();
  hoverBox.style.display = 'block';
  hoverBox.style.top = `${rect.top}px`;
  hoverBox.style.left = `${rect.left}px`;
  hoverBox.style.width = `${rect.width}px`;
  hoverBox.style.height = `${rect.height}px`;

  const data = extractElementData(target);
  updateTooltipContent(data);
  tooltip.style.display = 'block';
}

function handleClick(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  const target = getDeepestElementAtPoint(e.clientX, e.clientY);
  if (!target) return;

  const data = extractElementData(target);

  chrome.runtime.sendMessage({
    type: 'ELEMENT_SELECTED',
    payload: data,
  });
}

// ---- Start / Stop ----
function startInspector() {
  createOverlay();
  document.addEventListener('mousemove', handleMouseMove, true);
  document.addEventListener('click', handleClick, true);
}

function stopInspector() {
  document.removeEventListener('mousemove', handleMouseMove, true);
  document.removeEventListener('click', handleClick, true);
  if (overlayWrapper?.parentNode) {
    overlayWrapper.parentNode.removeChild(overlayWrapper);
  }
  overlayWrapper = null;
  hoverBox = null;
  tooltip = null;
  shadowRoot = null;
  lastHoveredElement = null;
}

// ---- Message Listener ----
chrome.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: any) => {
  if (message.type === 'TOGGLE_INSPECTION') {
    if (overlayWrapper) stopInspector();
    else startInspector();
    sendResponse({ success: true });
    return true;
  }
  if (message.type === 'START_INSPECTION') {
    if (!overlayWrapper) startInspector();
    sendResponse({ success: true });
    return true;
  }
  if (message.type === 'STOP_INSPECTION') {
    stopInspector();
    sendResponse({ success: true });
    return true;
  }
  if (message.type === 'SCAN_COLORS') {
    const colors = scanPageColors();
    sendResponse({ colors });
    return true;
  }
  if (message.type === 'SCAN_TYPOGRAPHY') {
    const typography = scanPageTypography();
    sendResponse({ typography });
    return true;
  }
  if (message.type === 'SCAN_ASSETS') {
    const assets = scanPageAssets();
    sendResponse({ assets });
    return true;
  }
  if (message.type === 'SCAN_VITALS') {
    sendResponse({ vitals });
    return true;
  }
  if (message.type === 'SCAN_TECHNOLOGIES') {
    scanPageTechnologies()
      .then(techs => {
        sendResponse({ techs });
      })
      .catch(err => {
        sendResponse({ techs: [], error: err.message });
      });
    return true;
  }
  if (message.type === 'PING') {
    sendResponse({ pong: true });
    return true;
  }
});

// Removed auto-start when loaded as per user request

