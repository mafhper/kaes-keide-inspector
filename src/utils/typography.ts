import type { PageTypo } from '../types/ui';

const TAG_PRIORITY: Record<string, number> = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
  h6: 6,
  p: 7,
};

export function typographyPriority(tag: string): number {
  return TAG_PRIORITY[tag.toLowerCase()] ?? 100;
}

export function sortTypographyByImportance(items: PageTypo[]): PageTypo[] {
  return [...items].sort((a, b) => {
    const pa = typographyPriority(a.dominantTag || a.tag);
    const pb = typographyPriority(b.dominantTag || b.tag);
    if (pa !== pb) return pa - pb;

    const sizeA = Number.parseFloat(a.fontSize) || 0;
    const sizeB = Number.parseFloat(b.fontSize) || 0;
    if (sizeA !== sizeB) return sizeB - sizeA;

    return b.count - a.count;
  });
}

export function typeLabel(tag: string): string {
  const normalized = tag.toLowerCase();
  if (/^h[1-6]$/.test(normalized)) {
    return `Heading ${normalized.slice(1)}`;
  }

  if (normalized === 'p') return 'Paragraph';
  if (normalized === 'span') return 'Inline';
  if (normalized === 'a') return 'Link';
  return normalized;
}
