import { describe, expect, it } from 'vitest';
import { sortTypographyByImportance, typeLabel } from './typography';

describe('typography ordering', () => {
  it('prioritizes semantic hierarchy before size', () => {
    const input = [
      {
        tag: 'p',
        dominantTag: 'p',
        fontFamily: 'Inter',
        fontSize: '24px',
        fontWeight: '400',
        lineHeight: '1.4',
        letterSpacing: '0px',
        color: 'rgb(0,0,0)',
        colorHex: '#000000',
        count: 10,
        sample: 'Body',
        tagCounts: { p: 10 },
      },
      {
        tag: 'h2',
        dominantTag: 'h2',
        fontFamily: 'Inter',
        fontSize: '18px',
        fontWeight: '700',
        lineHeight: '1.2',
        letterSpacing: '0px',
        color: 'rgb(0,0,0)',
        colorHex: '#000000',
        count: 2,
        sample: 'Heading',
        tagCounts: { h2: 2 },
      },
    ] as any;

    const result = sortTypographyByImportance(input);
    expect(result[0].dominantTag).toBe('h2');
    expect(result[1].dominantTag).toBe('p');
  });

  it('creates human-friendly labels', () => {
    expect(typeLabel('h1')).toBe('Heading 1');
    expect(typeLabel('p')).toBe('Paragraph');
    expect(typeLabel('a')).toBe('Link');
  });
});
