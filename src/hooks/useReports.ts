import { useCallback } from 'react';
import type { ElementData, PageAsset, PageColor, PageTech, PageTypo, Tab } from '../types/ui';
import type { DesignReport, ReportFormat, ReportScope } from '../types/reports';
import { downloadText } from '../utils/download';

interface UseReportsOptions {
  selectedElement: ElementData | null;
  pageTechs: PageTech[];
  pageColors: PageColor[];
  pageTypography: PageTypo[];
  pageAssets: PageAsset[];
}

function buildReport(
  selectedElement: ElementData | null,
  pageTechs: PageTech[],
  pageColors: PageColor[],
  pageTypography: PageTypo[],
  pageAssets: PageAsset[],
  scope: ReportScope,
  tab: Tab,
): DesignReport {
  return {
    generatedAt: new Date().toISOString(),
    scope,
    tab,
    element: selectedElement
      ? {
          tag: selectedElement.tagName,
          classes: selectedElement.classList,
          id: selectedElement.id,
        }
      : null,
    typography: selectedElement
      ? {
          fontFamily: selectedElement.fontFamily,
          fontSize: selectedElement.fontSize,
          fontWeight: selectedElement.fontWeight,
          lineHeight: selectedElement.lineHeight,
          letterSpacing: selectedElement.letterSpacing,
        }
      : null,
    colors: selectedElement
      ? {
          text: selectedElement.colorHex,
          background: selectedElement.parentBackgroundHex,
          contrastRatio: selectedElement.contrast,
        }
      : null,
    layout: selectedElement
      ? {
          display: selectedElement.display,
          width: `${selectedElement.width}px`,
          height: `${selectedElement.height}px`,
          margin: `${selectedElement.marginTop} ${selectedElement.marginRight} ${selectedElement.marginBottom} ${selectedElement.marginLeft}`,
          padding: `${selectedElement.paddingTop} ${selectedElement.paddingRight} ${selectedElement.paddingBottom} ${selectedElement.paddingLeft}`,
        }
      : null,
    pageContext: {
      totalColorsDetected: pageColors.length,
      totalTypographyStyles: pageTypography.length,
      totalAssets: pageAssets.length,
      techStack: pageTechs.map((t) => t.name),
    },
  };
}

function toMarkdown(report: DesignReport): string {
  const element = report.element;

  return [
    `# Kaes Keid Report (${report.scope})`,
    '',
    `Generated: ${report.generatedAt}`,
    `Tab: ${report.tab}`,
    '',
    '## Element',
    element ? `- Tag: \`${element.tag}\`` : '- No selected element',
    element?.classes ? `- Classes: \`.${element.classes}\`` : '',
    element?.id ? `- ID: \`#${element.id}\`` : '',
    '',
    '## Page Context',
    `- Colors: ${report.pageContext.totalColorsDetected}`,
    `- Typography Styles: ${report.pageContext.totalTypographyStyles}`,
    `- Assets: ${report.pageContext.totalAssets}`,
    `- Stack: ${report.pageContext.techStack.join(', ') || 'none'}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function useReports({
  selectedElement,
  pageTechs,
  pageColors,
  pageTypography,
  pageAssets,
}: UseReportsOptions) {
  const exportReport = useCallback(
    (scope: ReportScope, format: ReportFormat, tab: Tab) => {
      const report = buildReport(selectedElement, pageTechs, pageColors, pageTypography, pageAssets, scope, tab);

      if (format === 'json') {
        downloadText(JSON.stringify(report, null, 2), `kaes-keid-${scope}-report.json`, 'application/json');
      } else {
        downloadText(toMarkdown(report), `kaes-keid-${scope}-report.md`, 'text/markdown');
      }
    },
    [pageAssets, pageColors, pageTechs, pageTypography, selectedElement],
  );

  return {
    exportReport,
  };
}
