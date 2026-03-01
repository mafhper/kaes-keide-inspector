import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import type { Metric } from 'web-vitals';
import { createInspectorOverlay } from './overlay/overlay';
import { scanPageAssets } from './scanners/assets';
import { scanPageColors } from './scanners/colors';
import { scanPageTypography } from './scanners/typography';
import { scanPageTechnologies } from './tech/scanTechnologies';

const vitals: Record<string, number> = {};
onLCP((metric: Metric) => (vitals.LCP = Number(metric.value.toFixed(2))), { reportAllChanges: true });
onCLS((metric: Metric) => (vitals.CLS = Number(metric.value.toFixed(4))), { reportAllChanges: true });
onINP((metric: Metric) => (vitals.INP = Number(metric.value.toFixed(2))), { reportAllChanges: true });
onTTFB((metric: Metric) => (vitals.TTFB = Number(metric.value.toFixed(2))), { reportAllChanges: true });
onFCP((metric: Metric) => (vitals.FCP = Number(metric.value.toFixed(2))), { reportAllChanges: true });

const overlay = createInspectorOverlay({
  onSelect: (payload) => {
    chrome.runtime.sendMessage({
      type: 'ELEMENT_SELECTED',
      payload,
    });
  },
});

chrome.runtime.onMessage.addListener((message: { type?: string }, _sender, sendResponse) => {
  if (message.type === 'TOGGLE_INSPECTION') {
    if (overlay.isActive()) overlay.stop();
    else overlay.start();
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'START_INSPECTION') {
    if (!overlay.isActive()) overlay.start();
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'STOP_INSPECTION') {
    overlay.stop();
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'SCAN_COLORS') {
    sendResponse({ colors: scanPageColors() });
    return true;
  }

  if (message.type === 'SCAN_TYPOGRAPHY') {
    sendResponse({ typography: scanPageTypography() });
    return true;
  }

  if (message.type === 'SCAN_ASSETS') {
    sendResponse({ assets: scanPageAssets() });
    return true;
  }

  if (message.type === 'SCAN_VITALS') {
    sendResponse({ vitals });
    return true;
  }

  if (message.type === 'SCAN_TECHNOLOGIES') {
    scanPageTechnologies()
      .then((techs) => sendResponse({ techs }))
      .catch((error) => sendResponse({ techs: [], error: String(error?.message || 'scan-failed') }));
    return true;
  }

  if (message.type === 'PING') {
    sendResponse({ pong: true });
    return true;
  }

  return false;
});
