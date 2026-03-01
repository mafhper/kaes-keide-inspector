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
