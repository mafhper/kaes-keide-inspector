// detect-globals.js
// Injected into page main world via <script src="chrome-extension://...">
// Walks window object chains and posts results back with correlation id.
;(function () {
  try {
    const SOURCE = 'kaes-keid-inspector';

    const onMessage = ({ data }) => {
      const payload = data && data.kaesKeid;
      if (!payload || payload.source !== SOURCE) return;
      if (!Array.isArray(payload.chains) || !payload.requestId) return;

      window.removeEventListener('message', onMessage);

      const results = {};
      for (const chain of payload.chains) {
        try {
          const value = chain.split('.').reduce(
            (obj, key) =>
              obj && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, key)
                ? obj[key]
                : '__UNDEF__',
            window
          );

          if (value !== '__UNDEF__') {
            results[chain] = typeof value === 'string' || typeof value === 'number' ? value : !!value;
          }
        } catch {
          // ignore inaccessible properties
        }
      }

      window.postMessage(
        {
          kaesKeidResult: {
            source: SOURCE,
            requestId: payload.requestId,
            results,
          },
        },
        '*'
      );
    };

    window.addEventListener('message', onMessage);
  } catch {
    // fail silently
  }
})();
