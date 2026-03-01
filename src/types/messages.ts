import type { ElementData, PageAsset, PageColor, PageTech, PageTypo } from './ui';

export type PanelToContentMessage =
  | { type: 'START_INSPECTION' }
  | { type: 'STOP_INSPECTION' }
  | { type: 'SCAN_COLORS' }
  | { type: 'SCAN_TYPOGRAPHY' }
  | { type: 'SCAN_ASSETS' }
  | { type: 'SCAN_VITALS' }
  | { type: 'SCAN_TECHNOLOGIES' }
  | { type: 'PING' };

export type ContentToPanelMessage =
  | { type: 'ELEMENT_SELECTED'; payload: ElementData }
  | { type: 'PORT_ERROR'; payload: { reason: string } };

export interface ScanColorsResponse { colors: PageColor[] }
export interface ScanTypographyResponse { typography: PageTypo[] }
export interface ScanAssetsResponse { assets: PageAsset[] }
export interface ScanTechResponse { techs: PageTech[]; error?: string }
export interface ScanVitalsResponse { vitals: Record<string, number> }
