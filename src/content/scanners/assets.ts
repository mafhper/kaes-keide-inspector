import type { ScannedAssets } from '../shared/types';

function isDownloadable(src: string): boolean {
  if (!src) return false;
  if (src.startsWith('data:')) return /^data:image\//i.test(src);

  try {
    const url = new URL(src, window.location.href);
    return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'blob:';
  } catch {
    return false;
  }
}

function toFilePath(src: string): string {
  if (src.startsWith('data:')) return 'inline/data-image';

  try {
    const url = new URL(src, window.location.href);
    return `${url.host}${url.pathname}`;
  } catch {
    return src;
  }
}

export function scanPageAssets(): ScannedAssets {
  const assets: ScannedAssets = [];
  const seen = new Set<string>();

  document.querySelectorAll('img').forEach((img) => {
    const src = img.currentSrc || img.src || img.getAttribute('data-src') || '';
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
      sourceType: 'img',
      filePath: toFilePath(src),
      downloadable: isDownloadable(src),
    });
  });

  document.querySelectorAll('svg').forEach((svg, index) => {
    const rect = svg.getBoundingClientRect();
    if (rect.width < 5 || rect.height < 5) return;

    const serializer = new XMLSerializer();
    const raw = serializer.serializeToString(svg);
    const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(raw)}`;
    const id = `svg-inline-${index}`;

    if (seen.has(id)) return;
    seen.add(id);

    assets.push({
      src,
      alt: svg.getAttribute('aria-label') || 'Inline SVG',
      type: 'svg',
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      tagName: 'SVG',
      sourceType: 'svg-inline',
      filePath: `inline/${id}.svg`,
      downloadable: true,
    });
  });

  document.querySelectorAll('*').forEach((element) => {
    const cs = window.getComputedStyle(element);
    const bgImage = cs.backgroundImage;
    if (!bgImage || bgImage === 'none') return;

    const urlMatch = bgImage.match(/url\(["']?(.+?)["']?\)/);
    if (!urlMatch?.[1]) return;

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
      sourceType: 'background',
      filePath: toFilePath(src),
      downloadable: isDownloadable(src),
    });
  });

  return assets;
}
