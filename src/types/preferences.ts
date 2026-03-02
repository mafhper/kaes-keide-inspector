import type { ReportFormat, ReportScope } from './reports';
import type { Tab } from './ui';

export type StackViewMode = 'categories' | 'cloud';
export type StackDetectionMode = 'strict' | 'compat';
export type AssetBackgroundMode = 'checker' | 'light' | 'dark' | 'grid';
export type AssetViewMode = 'gallery' | 'tree';
export type SidebarBackgroundMode = 'auto' | 'manual';
export type ThemeMode = 'auto' | 'light' | 'dark';

export interface SectionLayoutState {
  order: string[];
  hidden: string[];
  collapsed: string[];
}

export interface UserPreferencesV1 {
  version: 1;
  themeMode: ThemeMode;
  activeTab: Tab;
  exportFormat: 'json' | 'markdown' | 'css' | 'scss' | 'json-tokens';
  reportFormat: ReportFormat;
  reportScope: ReportScope;
  stackViewMode: StackViewMode;
  stackDetectionMode: StackDetectionMode;
  assetBackground: AssetBackgroundMode;
  assetViewMode: AssetViewMode;
  sidebarBackgroundMode: SidebarBackgroundMode;
  sidebarBackgroundColor: string;
  sectionLayouts: Record<string, SectionLayoutState>;
  stackCategoryOrder: string[];
  hiddenStackCategories: string[];
}

export const PREFERENCES_STORAGE_KEY = 'kk.preferences.v1';

export const DEFAULT_PREFERENCES: UserPreferencesV1 = {
  version: 1,
  themeMode: 'auto',
  activeTab: 'tech',
  exportFormat: 'json',
  reportFormat: 'json',
  reportScope: 'element',
  stackViewMode: 'categories',
  stackDetectionMode: 'strict',
  assetBackground: 'checker',
  assetViewMode: 'gallery',
  sidebarBackgroundMode: 'auto',
  sidebarBackgroundColor: '#111827',
  sectionLayouts: {},
  stackCategoryOrder: [],
  hiddenStackCategories: [],
};
