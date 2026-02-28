// background.ts - Kaes Keid Service Worker

// Use the built-in behavior: clicking the action icon opens the side panel
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err: Error) => console.error('setPanelBehavior error:', err));

// Track when side panel connects and disconnects
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'kaes-keid-panel') {
    // When the panel is closed (or tab changed), the port disconnects
    port.onDisconnect.addListener(() => {
      // Send STOP command to all tabs just to be safe, ensuring no ghost inspectors
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { type: 'STOP_INSPECTION' }).catch(() => { });
          }
        });
      });
    });
  }
});

interface TabData {
  headers: Record<string, string[]>;
}

const tabDataCache = new Map<number, TabData>();

chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.type === 'main_frame') {
      const headers: Record<string, string[]> = {};
      details.responseHeaders?.forEach(h => {
        const name = h.name.toLowerCase();
        if (!headers[name]) headers[name] = [];
        if (h.value !== undefined) {
          headers[name].push(h.value);
        }
      });
      tabDataCache.set(details.tabId, { headers });
    }
    return undefined;
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders']
);

chrome.tabs.onRemoved.addListener((tabId) => {
  tabDataCache.delete(tabId);
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_TAB_DATA' && sender.tab?.id) {
    sendResponse(tabDataCache.get(sender.tab.id) || { headers: {} });
    return true;
  }
});
