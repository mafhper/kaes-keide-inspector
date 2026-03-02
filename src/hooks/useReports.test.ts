import { describe, expect, it } from 'vitest';
import type { ElementData, PageAsset, PageColor, PageTech, PageTypo } from '../types/ui';
import { buildReport, toMarkdown } from './useReports';

describe('buildReport', () => {
  const pageTechs: PageTech[] = [{ name: 'React', category: 'JavaScript frameworks', version: '19.2.0' }];
  const pageColors: PageColor[] = [{ hex: '#111111', rgb: 'rgb(17,17,17)', count: 12, roles: ['text'], roleCounts: { text: 12, surface: 0, border: 0 } }];
  const pageTypography: PageTypo[] = [{
    tag: 'H1',
    fontFamily: 'Inter',
    fontSize: '32px',
    fontWeight: '700',
    lineHeight: '40px',
    letterSpacing: '0px',
    color: 'rgb(17,17,17)',
    colorHex: '#111111',
    count: 1,
    sample: 'Heading',
    tagCounts: { H1: 1 },
    dominantTag: 'H1',
  }];
  const pageAssets: PageAsset[] = [{
    src: 'https://example.com/logo.svg',
    alt: 'Logo',
    type: 'svg',
    width: 128,
    height: 128,
    tagName: 'IMG',
    sourceType: 'img',
  }];

  it('always includes complete sections even without selected element', () => {
    const report = buildReport(null, pageTechs, pageColors, pageTypography, pageAssets, { LCP: 1.7 }, 'site', 'tech');

    expect(report.sections.stack.totalTechnologies).toBe(1);
    expect(report.sections.overview.page.totalColorsDetected).toBe(1);
    expect(report.sections.colors.palette).toHaveLength(1);
    expect(report.sections.type.styles).toHaveLength(1);
    expect(report.sections.overview.element).toBeNull();
    expect(report.sections.colors.element).toBeNull();
    expect(report.sections.type.element).toBeNull();
  });

  it('adds selected element details to overview, colors, and type', () => {
    const selectedElement = {
      tagName: 'BUTTON',
      classList: 'cta.primary',
      id: 'buy-now',
      fontFamily: 'Inter',
      fontSize: '14px',
      fontWeight: '600',
      lineHeight: '20px',
      letterSpacing: '0.2px',
      colorHex: '#ffffff',
      parentBackgroundHex: '#111111',
      contrast: 12.3,
      display: 'inline-flex',
      width: 160,
      height: 44,
      marginTop: '0px',
      marginRight: '0px',
      marginBottom: '0px',
      marginLeft: '0px',
      paddingTop: '10px',
      paddingRight: '16px',
      paddingBottom: '10px',
      paddingLeft: '16px',
    } as ElementData;

    const report = buildReport(selectedElement, pageTechs, pageColors, pageTypography, pageAssets, null, 'site', 'overview');

    expect(report.sections.overview.element?.tag).toBe('BUTTON');
    expect(report.sections.colors.element?.text).toBe('#ffffff');
    expect(report.sections.type.element?.fontFamily).toBe('Inter');
  });

  it('renders human-readable markdown without embedded json blocks', () => {
    const report = buildReport(null, pageTechs, pageColors, pageTypography, pageAssets, { LCP: 1.7 }, 'site', 'tech');
    const markdown = toMarkdown(report);

    expect(markdown).toContain('## Color Tokens');
    expect(markdown).toContain('## Typography Tokens');
    expect(markdown).toContain('| Token | HEX | RGB | Roles | Usage |');
    expect(markdown).not.toContain('```json');
  });
});
