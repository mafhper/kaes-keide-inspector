import type { ScannedTypography } from '../shared/types';
import { rgbToHex } from '../shared/colorUtils';

const TEXT_TAGS = new Set([
  'P',
  'SPAN',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'A',
  'STRONG',
  'EM',
  'B',
  'I',
  'SMALL',
  'LABEL',
  'LI',
  'TD',
  'TH',
  'BLOCKQUOTE',
  'FIGCAPTION',
  'LEGEND',
  'CAPTION',
]);

export function scanPageTypography(): ScannedTypography {
  const styleMap = new Map<string, ScannedTypography[number]>();

  document.querySelectorAll('*').forEach((el) => {
    if (!TEXT_TAGS.has(el.tagName)) return;
    if (!el.textContent?.trim()) return;

    const cs = window.getComputedStyle(el);
    const key = `${cs.fontFamily}|${cs.fontSize}|${cs.fontWeight}|${cs.lineHeight}|${cs.letterSpacing}`;

    if (!styleMap.has(key)) {
      styleMap.set(key, {
        tag: el.tagName.toLowerCase(),
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        color: cs.color,
        colorHex: rgbToHex(cs.color),
        count: 0,
        sample: (el.textContent || '').trim().substring(0, 40),
        tagCounts: {} as Record<string, number>,
        dominantTag: el.tagName.toLowerCase(),
      });
    }

    const entry = styleMap.get(key)!;
    entry.count += 1;
    const tag = el.tagName.toLowerCase();
    entry.tagCounts[tag] = (entry.tagCounts[tag] ?? 0) + 1;

    entry.dominantTag = Object.entries(entry.tagCounts).sort((a, b) => b[1] - a[1])[0][0];
  });

  return Array.from(styleMap.values()).sort((a, b) => {
    const dominantTagRank = (tag: string) => {
      const map: Record<string, number> = { h1: 1, h2: 2, h3: 3, h4: 4, h5: 5, h6: 6, p: 7 };
      return map[tag] ?? 100;
    };

    const tagDiff = dominantTagRank(a.dominantTag) - dominantTagRank(b.dominantTag);
    if (tagDiff !== 0) return tagDiff;

    const sizeDiff = (Number.parseFloat(b.fontSize) || 0) - (Number.parseFloat(a.fontSize) || 0);
    if (sizeDiff !== 0) return sizeDiff;

    return b.count - a.count;
  });
}
