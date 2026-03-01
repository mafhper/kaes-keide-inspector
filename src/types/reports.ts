import type { Tab } from './ui';

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
}
