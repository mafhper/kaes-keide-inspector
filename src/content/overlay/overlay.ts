import { extractElementData } from '../scanners/element';
import { getDeepestElementAtPoint } from '../shared/target';

interface OverlayController {
  start: () => void;
  stop: () => void;
  isActive: () => boolean;
}

interface CreateOverlayOptions {
  onSelect: (payload: ReturnType<typeof extractElementData>) => void;
}

export function createInspectorOverlay({ onSelect }: CreateOverlayOptions): OverlayController {
  let overlayWrapper: HTMLElement | null = null;
  let hoverBox: HTMLElement | null = null;
  let tooltip: HTMLElement | null = null;
  let lastHoveredElement: HTMLElement | null = null;

  function createOverlay() {
    if (overlayWrapper) return;

    overlayWrapper = document.createElement('div');
    overlayWrapper.id = 'css-inspector-overlay-wrapper';
    overlayWrapper.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      pointer-events: none; z-index: 2147483647;
    `;

    const shadowRoot = overlayWrapper.attachShadow({ mode: 'open' });

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
        background: #111827;
        color: #e5e7eb;
        border-radius: 10px;
        padding: 10px 12px;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 11px;
        line-height: 1.5;
        min-width: 220px;
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
      }

      .tt-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
      }

      .tt-swatch {
        width: 12px;
        height: 12px;
        border-radius: 3px;
        border: 1px solid rgba(255,255,255,0.15);
        flex-shrink: 0;
      }

      .tt-muted {
        color: #9ca3af;
        font-size: 10px;
      }

      .tt-divider {
        border-top: 1px solid rgba(255,255,255,0.08);
        margin: 6px 0;
      }
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

    let x = mouseX + gap;
    let y = mouseY + gap;

    if (y + th > window.innerHeight) {
      y = mouseY - th - gap;
      if (y < 0) y = 4;
    }

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
    tooltip.innerHTML = `
      <div class="tt-tag">&lt;${data.tagName.toLowerCase()}&gt; ${classDisplay}</div>
      <div class="tt-muted">${data.width} × ${data.height}</div>
      <div class="tt-divider"></div>
      <div class="tt-row">
        <div class="tt-swatch" style="background:${data.color}"></div>
        <span class="tt-muted">Text</span>
        <span>${data.colorHex}</span>
      </div>
      <div class="tt-row">
        <div class="tt-swatch" style="background:${data.parentBackground}"></div>
        <span class="tt-muted">BG</span>
        <span>${data.parentBackgroundHex}</span>
      </div>
      <div class="tt-divider"></div>
      <div class="tt-muted">${data.fontFamily.split(',')[0].replace(/['"]/g, '')} · ${data.fontSize} · ${data.fontWeight}</div>
      <div class="tt-muted">Contrast: ${data.contrast}:1 (${data.contrastRating})</div>
    `;
  }

  function handleMouseMove(event: MouseEvent) {
    const target = getDeepestElementAtPoint(event.clientX, event.clientY, overlayWrapper);
    if (!target || !hoverBox || !tooltip) return;

    positionTooltip(event.clientX, event.clientY);

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

  function handleClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const target = getDeepestElementAtPoint(event.clientX, event.clientY, overlayWrapper);
    if (!target) return;

    onSelect(extractElementData(target));
  }

  function start() {
    createOverlay();
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);
  }

  function stop() {
    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('click', handleClick, true);

    if (overlayWrapper?.parentNode) {
      overlayWrapper.parentNode.removeChild(overlayWrapper);
    }

    overlayWrapper = null;
    hoverBox = null;
    tooltip = null;
    lastHoveredElement = null;
  }

  return {
    start,
    stop,
    isActive: () => Boolean(overlayWrapper),
  };
}
