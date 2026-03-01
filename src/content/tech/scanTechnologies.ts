import type { ScannedTech } from '../shared/types';

interface GlobalProbeResult {
  [chain: string]: string | number | boolean;
}

function makeRequestId() {
  const random = Math.random().toString(36).slice(2);
  return `kk-${Date.now()}-${random}`;
}

async function detectGlobalsWithHandshake(chains: string[]): Promise<GlobalProbeResult> {
  if (chains.length === 0) return {};

  return new Promise<GlobalProbeResult>((resolve) => {
    const requestId = makeRequestId();
    const timeout = window.setTimeout(() => {
      window.removeEventListener('message', listener);
      resolve({});
    }, 2000);

    const listener = (event: MessageEvent) => {
      if (event.source !== window) return;
      const payload = event.data?.kaesKeidResult;
      if (!payload) return;
      if (payload.source !== 'kaes-keid-inspector') return;
      if (payload.requestId !== requestId) return;

      window.removeEventListener('message', listener);
      window.clearTimeout(timeout);
      resolve(payload.results || {});
    };

    window.addEventListener('message', listener);

    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('detect-globals.js');
    script.onload = () => {
      window.postMessage(
        {
          kaesKeid: {
            source: 'kaes-keid-inspector',
            requestId,
            chains,
          },
        },
        '*',
      );
      script.remove();
    };
    script.onerror = () => {
      window.clearTimeout(timeout);
      window.removeEventListener('message', listener);
      resolve({});
    };

    (document.head || document.documentElement).appendChild(script);
  });
}

export async function scanPageTechnologies(): Promise<ScannedTech> {
  try {
    type TabData = { headers: Record<string, string[]> };
    const [{ detectTechnologies, stackDB }, tabData] = await Promise.all([
      import('../../utils/stackEngine'),
      new Promise<TabData>((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_TAB_DATA' }, (res) => {
          if (chrome.runtime.lastError) resolve({ headers: {} });
          else resolve((res as TabData) || { headers: {} });
        });
      }),
    ]);

    const scriptSrcs = Array.from(document.querySelectorAll('script')).map((s) => s.src).filter(Boolean);

    const metaTags = Array.from(document.querySelectorAll('meta')).reduce((acc, meta) => {
      const key = (meta.getAttribute('name') || meta.getAttribute('property') || '').toLowerCase();
      const value = meta.getAttribute('content');
      if (key && value) {
        if (!acc[key]) acc[key] = [];
        acc[key].push(value);
      }
      return acc;
    }, {} as Record<string, string[]>);

    const cookies = document.cookie.split(';').reduce((acc, chunk) => {
      const [key, value] = chunk.split('=').map((part) => part.trim());
      if (key) acc[key] = value || '';
      return acc;
    }, {} as Record<string, string>);

    const html = document.documentElement.outerHTML || '';
    const jsChains = new Set<string>();
    const domSelectors = new Set<string>();

    for (const tech of Object.values(stackDB.technologies) as Array<Record<string, unknown>>) {
      if (tech.js) {
        Object.keys(tech.js).forEach((chain) => jsChains.add(chain));
      }

      if (tech.dom) {
        const rules = Array.isArray(tech.dom) ? tech.dom : [tech.dom];
        for (const rule of rules) {
          if (typeof rule === 'string') domSelectors.add(rule);
          else if (typeof rule === 'object') Object.keys(rule).forEach((selector) => domSelectors.add(selector));
        }
      }
    }

    const domResults: Record<string, boolean> = {};
    domSelectors.forEach((selector) => {
      try {
        if (document.querySelector(selector)) {
          domResults[selector] = true;
        }
      } catch {
        // Ignore invalid selectors from data source.
      }
    });

    const jsResults = await detectGlobalsWithHandshake(Array.from(jsChains));

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

    results.sort((a, b) => b.confidence - a.confidence);

    return results.map((result) => ({
      name: result.name,
      category: result.categories[0]?.name || 'Other',
      version: result.version,
      confidence: result.confidence,
      frequency: 1,
    }));
  } catch {
    return [];
  }
}
