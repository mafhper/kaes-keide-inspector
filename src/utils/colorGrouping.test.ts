import { describe, expect, it } from 'vitest';
import { filterColorsByRole, summarizeColorSwatches } from './colorGrouping';

describe('color grouping utilities', () => {
  const colors = [
    { hex: '#111111', rgb: 'rgb(17,17,17)', count: 10, roles: ['text'], roleCounts: { text: 10, surface: 0, border: 0 } },
    { hex: '#ffffff', rgb: 'rgb(255,255,255)', count: 6, roles: ['surface'], roleCounts: { text: 0, surface: 6, border: 0 } },
    { hex: '#cccccc', rgb: 'rgb(204,204,204)', count: 2, roles: ['border'], roleCounts: { text: 0, surface: 0, border: 2 } },
  ] as const;

  it('filters colors by role', () => {
    expect(filterColorsByRole(colors as any, 'text')).toHaveLength(1);
    expect(filterColorsByRole(colors as any, 'surface')[0].hex).toBe('#ffffff');
  });

  it('returns most used swatches first', () => {
    const result = summarizeColorSwatches(colors as any, 2);
    expect(result).toHaveLength(2);
    expect(result[0].hex).toBe('#111111');
  });
});
