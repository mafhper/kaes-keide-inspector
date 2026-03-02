import { useCallback } from 'react';
import type { ElementData, PageAsset, PageColor, PageTech, PageTypo, Tab } from '../types/ui';
import type { PanelToContentMessage } from '../types/messages';
import type { DesignReport, ReportFormat, ReportScope } from '../types/reports';
import type { StackDetectionMode } from '../types/preferences';
import { downloadText } from '../utils/download';

interface UseReportsOptions {
  selectedElement: ElementData | null;
  pageTechs: PageTech[];
  pageColors: PageColor[];
  pageTypography: PageTypo[];
  pageAssets: PageAsset[];
  pageVitals: Record<string, number> | null;
  stackDetectionMode: StackDetectionMode;
  sendMessageToActiveTab: (message: PanelToContentMessage, callback?: (response: any) => void) => void;
}

function scanFromActiveTab<T>(
  sendMessageToActiveTab: (message: PanelToContentMessage, callback?: (response: any) => void) => void,
  message: PanelToContentMessage,
  extract: (response: any) => T | undefined,
): Promise<T | undefined> {
  return new Promise((resolve) => {
    let settled = false;
    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(undefined);
    }, 3500);

    sendMessageToActiveTab(message, (response) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      resolve(extract(response));
    });
  });
}

export function buildReport(
  selectedElement: ElementData | null,
  pageTechs: PageTech[],
  pageColors: PageColor[],
  pageTypography: PageTypo[],
  pageAssets: PageAsset[],
  pageVitals: Record<string, number> | null,
  scope: ReportScope,
  tab: Tab,
): DesignReport {
  const element =
    selectedElement
      ? {
          tag: selectedElement.tagName,
          classes: selectedElement.classList,
          id: selectedElement.id,
        }
      : null;

  const typography =
    selectedElement
      ? {
          fontFamily: selectedElement.fontFamily,
          fontSize: selectedElement.fontSize,
          fontWeight: selectedElement.fontWeight,
          lineHeight: selectedElement.lineHeight,
          letterSpacing: selectedElement.letterSpacing,
        }
      : null;

  const colors =
    selectedElement
      ? {
          text: selectedElement.colorHex,
          background: selectedElement.parentBackgroundHex,
          contrastRatio: selectedElement.contrast,
        }
      : null;

  const layout =
    selectedElement
      ? {
          display: selectedElement.display,
          width: `${selectedElement.width}px`,
          height: `${selectedElement.height}px`,
          margin: `${selectedElement.marginTop} ${selectedElement.marginRight} ${selectedElement.marginBottom} ${selectedElement.marginLeft}`,
          padding: `${selectedElement.paddingTop} ${selectedElement.paddingRight} ${selectedElement.paddingBottom} ${selectedElement.paddingLeft}`,
        }
      : null;

  const categories = Array.from(new Set(pageTechs.map((tech) => tech.category).filter(Boolean))).sort((a, b) => a.localeCompare(b));

  return {
    generatedAt: new Date().toISOString(),
    scope,
    tab,
    element,
    typography,
    colors,
    layout,
    pageContext: {
      totalColorsDetected: pageColors.length,
      totalTypographyStyles: pageTypography.length,
      totalAssets: pageAssets.length,
      techStack: pageTechs.map((t) => t.name),
    },
    sections: {
      stack: {
        totalTechnologies: pageTechs.length,
        technologies: pageTechs,
        categories,
      },
      overview: {
        page: {
          totalColorsDetected: pageColors.length,
          totalTypographyStyles: pageTypography.length,
          totalAssets: pageAssets.length,
          totalTechnologies: pageTechs.length,
          vitals: pageVitals,
        },
        element: element && layout ? { ...element, layout } : null,
      },
      colors: {
        palette: pageColors,
        element: colors,
      },
      type: {
        styles: pageTypography,
        element: typography,
      },
      assets: {
        totalAssets: pageAssets.length,
        items: pageAssets,
      },
    },
  };
}

function escapeCell(input: string): string {
  return input.replace(/\|/g, '\\|').replace(/\n/g, ' ').trim();
}

function colorTokenName(color: PageColor, index: number): string {
  const rankedRoles = Object.entries(color.roleCounts)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([role]) => role);
  const role = rankedRoles[0] || color.roles[0] || 'palette';
  return `color/${role}/${String(index + 1).padStart(3, '0')}`;
}

function typographyTokenName(typo: PageTypo, index: number): string {
  const label = (typo.dominantTag || typo.tag || 'text').toLowerCase();
  return `font/${label}/${String(index + 1).padStart(3, '0')}`;
}

function formatTechLabel(tech: PageTech): string {
  const version = tech.version ? ` (v${tech.version})` : '';
  return `${tech.name}${version}`;
}

export function toMarkdown(report: DesignReport): string {
  const lines: string[] = [];
  const categories = new Map<string, PageTech[]>();

  report.sections.stack.technologies.forEach((tech) => {
    const category = tech.category || 'Uncategorized';
    const list = categories.get(category) || [];
    list.push(tech);
    categories.set(category, list);
  });

  const sortedColors = [...report.sections.colors.palette].sort((a, b) => b.count - a.count);
  const sortedTypography = [...report.sections.type.styles].sort((a, b) => b.count - a.count);
  const assets = report.sections.assets.items;

  lines.push(`# Kaes Keid Report (${report.scope})`);
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Tab: ${report.tab}`);
  lines.push('');

  lines.push('## Stack');
  lines.push(`- Total technologies: ${report.sections.stack.totalTechnologies}`);
  lines.push(`- Total categories: ${categories.size}`);
  lines.push('');

  if (categories.size === 0) {
    lines.push('- No technologies detected.');
    lines.push('');
  } else {
    Array.from(categories.keys())
      .sort((a, b) => a.localeCompare(b))
      .forEach((category) => {
        const list = categories.get(category) || [];
        lines.push(`### ${category}`);
        lines.push(list.map((tech) => `- ${formatTechLabel(tech)}`).join('\n'));
        lines.push('');
      });
  }

  lines.push('## Overview');
  lines.push(`- Total colors: ${report.sections.overview.page.totalColorsDetected}`);
  lines.push(`- Total typography styles: ${report.sections.overview.page.totalTypographyStyles}`);
  lines.push(`- Total assets: ${report.sections.overview.page.totalAssets}`);
  lines.push(`- Total technologies: ${report.sections.overview.page.totalTechnologies}`);
  if (report.sections.overview.page.vitals) {
    const vitals = report.sections.overview.page.vitals;
    const vitalsText = Object.entries(vitals)
      .map(([name, value]) => `${name}: ${value}`)
      .join(', ');
    lines.push(`- Core Web Vitals: ${vitalsText || 'none'}`);
  } else {
    lines.push('- Core Web Vitals: not available');
  }
  lines.push('');

  lines.push('### Selected Element');
  if (!report.sections.overview.element) {
    lines.push('- No selected element.');
  } else {
    const el = report.sections.overview.element;
    lines.push(`- Tag: ${el.tag}`);
    lines.push(`- Classes: ${el.classes || 'none'}`);
    lines.push(`- ID: ${el.id || 'none'}`);
    lines.push(`- Display: ${el.layout.display}`);
    lines.push(`- Size: ${el.layout.width} x ${el.layout.height}`);
    lines.push(`- Margin: ${el.layout.margin}`);
    lines.push(`- Padding: ${el.layout.padding}`);
  }
  lines.push('');

  lines.push('## Color Tokens');
  lines.push(`- Total tokens: ${report.sections.colors.palette.length}`);
  lines.push('');

  if (sortedColors.length === 0) {
    lines.push('- No colors detected.');
    lines.push('');
  } else {
    lines.push('| Token | HEX | RGB | Roles | Usage |');
    lines.push('| --- | --- | --- | --- | ---: |');
    sortedColors.forEach((color, index) => {
      lines.push(
        `| ${colorTokenName(color, index)} | ${color.hex} | ${escapeCell(color.rgb)} | ${color.roles.join(', ') || 'none'} | ${color.count} |`,
      );
    });
    lines.push('');
  }

  lines.push('### Selected Element Colors');
  if (!report.sections.colors.element) {
    lines.push('- No selected element colors.');
  } else {
    const color = report.sections.colors.element;
    lines.push(`- Text: ${color.text}`);
    lines.push(`- Background: ${color.background}`);
    lines.push(`- Contrast ratio: ${color.contrastRatio}`);
  }
  lines.push('');

  lines.push('## Typography Tokens');
  lines.push(`- Total tokens: ${report.sections.type.styles.length}`);
  lines.push('');

  if (sortedTypography.length === 0) {
    lines.push('- No typography styles detected.');
    lines.push('');
  } else {
    lines.push('| Token | Tag | Font Family | Size | Weight | Line Height | Letter Spacing | Color | Usage | Sample |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | ---: | --- |');
    sortedTypography.forEach((typo, index) => {
      lines.push(
        `| ${typographyTokenName(typo, index)} | ${typo.dominantTag || typo.tag} | ${escapeCell(typo.fontFamily)} | ${typo.fontSize} | ${typo.fontWeight} | ${typo.lineHeight} | ${typo.letterSpacing} | ${typo.colorHex} | ${typo.count} | ${escapeCell(typo.sample || '-')} |`,
      );
    });
    lines.push('');
  }

  lines.push('### Selected Element Typography');
  if (!report.sections.type.element) {
    lines.push('- No selected element typography.');
  } else {
    const typo = report.sections.type.element;
    lines.push(`- Font family: ${typo.fontFamily}`);
    lines.push(`- Font size: ${typo.fontSize}`);
    lines.push(`- Font weight: ${typo.fontWeight}`);
    lines.push(`- Line height: ${typo.lineHeight}`);
    lines.push(`- Letter spacing: ${typo.letterSpacing}`);
  }
  lines.push('');

  lines.push('## Assets');
  lines.push(`- Total assets: ${report.sections.assets.totalAssets}`);
  lines.push('');

  if (assets.length === 0) {
    lines.push('- No assets detected.');
    lines.push('');
  } else {
    lines.push('| Type | Source | Dimensions | Origin | Alt |');
    lines.push('| --- | --- | --- | --- | --- |');
    assets.forEach((asset) => {
      const dimensions = asset.width > 0 && asset.height > 0 ? `${asset.width}x${asset.height}` : '-';
      lines.push(
        `| ${asset.type || 'unknown'} | ${escapeCell(asset.filePath || asset.src)} | ${dimensions} | ${asset.sourceType} | ${escapeCell(asset.alt || '-')} |`,
      );
    });
    lines.push('');
  }

  return lines.join('\n');
}

export function useReports({
  selectedElement,
  pageTechs,
  pageColors,
  pageTypography,
  pageAssets,
  pageVitals,
  stackDetectionMode,
  sendMessageToActiveTab,
}: UseReportsOptions) {
  const exportReport = useCallback(
    async (scope: ReportScope, format: ReportFormat, tab: Tab) => {
      const [liveTechs, liveColors, liveTypography, liveAssets, liveVitals] = await Promise.all([
        scanFromActiveTab<PageTech[]>(
          sendMessageToActiveTab,
          { type: 'SCAN_TECHNOLOGIES', mode: stackDetectionMode },
          (response) => (Array.isArray(response?.techs) ? response.techs : undefined),
        ),
        scanFromActiveTab<PageColor[]>(
          sendMessageToActiveTab,
          { type: 'SCAN_COLORS' },
          (response) => (Array.isArray(response?.colors) ? response.colors : undefined),
        ),
        scanFromActiveTab<PageTypo[]>(
          sendMessageToActiveTab,
          { type: 'SCAN_TYPOGRAPHY' },
          (response) => (Array.isArray(response?.typography) ? response.typography : undefined),
        ),
        scanFromActiveTab<PageAsset[]>(
          sendMessageToActiveTab,
          { type: 'SCAN_ASSETS' },
          (response) => (Array.isArray(response?.assets) ? response.assets : undefined),
        ),
        scanFromActiveTab<Record<string, number>>(
          sendMessageToActiveTab,
          { type: 'SCAN_VITALS' },
          (response) => (response?.vitals && typeof response.vitals === 'object' ? response.vitals : undefined),
        ),
      ]);

      const report = buildReport(
        selectedElement,
        liveTechs ?? pageTechs,
        liveColors ?? pageColors,
        liveTypography ?? pageTypography,
        liveAssets ?? pageAssets,
        liveVitals ?? pageVitals,
        scope,
        tab,
      );

      if (format === 'json') {
        downloadText(JSON.stringify(report, null, 2), `kaes-keid-${scope}-report.json`, 'application/json');
      } else {
        downloadText(toMarkdown(report), `kaes-keid-${scope}-report.md`, 'text/markdown');
      }
    },
    [pageAssets, pageColors, pageTechs, pageTypography, pageVitals, selectedElement, sendMessageToActiveTab, stackDetectionMode],
  );

  return {
    exportReport,
  };
}
