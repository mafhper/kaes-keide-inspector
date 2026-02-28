// detect-globals.js
// Injected into page main world via <script src="chrome-extension://...">
// Walks window object chains and posts results back to the content script.
; (function () {
  try {
    const onMessage = ({ data }) => {
      if (!data.kaesKeid || !data.kaesKeid.chains) return;
      window.removeEventListener('message', onMessage);

      const results = {};
      for (const chain of data.kaesKeid.chains) {
        try {
          const value = chain.split('.').reduce(
            (obj, key) =>
              obj && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, key)
                ? obj[key]
                : '__UNDEF__',
            window
          );
          if (value !== '__UNDEF__') {
            results[chain] = typeof value === 'string' || typeof value === 'number'
              ? value
              : !!value;
          }
        } catch {
          // skip inaccessible properties
        }
      }

      window.postMessage({ kaesKeidResult: results }, '*');
    };

    window.addEventListener('message', onMessage);
  } catch {
    // fail silently
  }
})();
