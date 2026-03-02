export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadText(content: string, filename: string, type: string): void {
  downloadBlob(new Blob([content], { type }), filename);
}

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
  'image/bmp': 'bmp',
  'image/tiff': 'tif',
};

function extensionFromMimeType(mimeType: string): string | undefined {
  const normalized = mimeType.toLowerCase().trim();
  const mapped = MIME_TO_EXTENSION[normalized];
  if (mapped) return mapped;

  if (!normalized.startsWith('image/')) return undefined;
  const subtype = normalized.slice('image/'.length).split('+')[0];
  if (!/^[a-z0-9.-]+$/.test(subtype)) return undefined;
  return subtype;
}

function extensionFromDataUrl(input: string): string | undefined {
  if (!input.startsWith('data:')) return undefined;
  const match = input.match(/^data:([^;,]+)[;,]/i);
  if (!match?.[1]) return undefined;
  return extensionFromMimeType(match[1]);
}

function extensionFromPath(input: string): string | undefined {
  try {
    const parsed = new URL(input, window.location.href);
    const name = parsed.pathname.split('/').filter(Boolean).at(-1);
    if (!name) return undefined;

    const dot = name.lastIndexOf('.');
    if (dot <= 0 || dot >= name.length - 1) return undefined;

    const ext = name.slice(dot + 1).toLowerCase();
    if (!/^[a-z0-9]{2,8}$/.test(ext)) return undefined;
    return ext;
  } catch {
    return undefined;
  }
}

export function inferImageExtension(input: string, fallback = 'png'): string {
  return extensionFromDataUrl(input) || extensionFromPath(input) || fallback.toLowerCase();
}

export function ensureFileExtension(filename: string, extension: string): string {
  const trimmed = filename.trim();
  const normalizedExtension = extension.replace(/^\./, '').toLowerCase();

  if (!trimmed) return `download.${normalizedExtension || 'bin'}`;
  if (!normalizedExtension) return trimmed;
  if (/\.[a-z0-9]{2,8}$/i.test(trimmed)) return trimmed;

  return `${trimmed}.${normalizedExtension}`;
}

export function isSafeDownloadUrl(input: string): boolean {
  try {
    if (input.startsWith('data:')) {
      return /^data:image\//i.test(input);
    }

    const parsed = new URL(input, window.location.href);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'blob:';
  } catch {
    return false;
  }
}

export function fileNameFromUrl(input: string, fallback: string): string {
  try {
    const parsed = new URL(input, window.location.href);
    const last = parsed.pathname.split('/').filter(Boolean).at(-1);
    return last || fallback;
  } catch {
    return fallback;
  }
}
