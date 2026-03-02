import type { Tab } from './ui';
import type { PageAsset, PageColor, PageTech, PageTypo } from './ui';

export type ReportScope = 'element' | 'tab' | 'site';
export type ReportFormat = 'json' | 'markdown';

export interface ReportOptions {
  scope: ReportScope;
  format: ReportFormat;
  tab: Tab;
}

export interface DesignReport {
  generatedAt: string;
  scope: ReportScope;
  tab: Tab;
  element: {
    tag: string;
    classes: string;
    id: string;
  } | null;
  typography: {
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    letterSpacing: string;
  } | null;
  colors: {
    text: string;
    background: string;
    contrastRatio: number;
  } | null;
  layout: {
    display: string;
    width: string;
    height: string;
    margin: string;
    padding: string;
  } | null;
  pageContext: {
    totalColorsDetected: number;
    totalTypographyStyles: number;
    totalAssets: number;
    techStack: string[];
  };
  sections: {
    stack: {
      totalTechnologies: number;
      technologies: PageTech[];
      categories: string[];
    };
    overview: {
      page: {
        totalColorsDetected: number;
        totalTypographyStyles: number;
        totalAssets: number;
        totalTechnologies: number;
        vitals: Record<string, number> | null;
      };
      element: {
        tag: string;
        classes: string;
        id: string;
        layout: {
          display: string;
          width: string;
          height: string;
          margin: string;
          padding: string;
        };
      } | null;
    };
    colors: {
      palette: PageColor[];
      element: {
        text: string;
        background: string;
        contrastRatio: number;
      } | null;
    };
    type: {
      styles: PageTypo[];
      element: {
        fontFamily: string;
        fontSize: string;
        fontWeight: string;
        lineHeight: string;
        letterSpacing: string;
      } | null;
    };
    assets: {
      totalAssets: number;
      items: PageAsset[];
    };
  };
}
