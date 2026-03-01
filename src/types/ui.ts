export type ColorFormat = 'hex' | 'rgb' | 'hsl';
export type Tab = 'tech' | 'overview' | 'colors' | 'typography' | 'assets';
export type ColorRole = 'text' | 'surface' | 'border';

export interface ElementData {
  tagName: string;
  id: string;
  classList: string;
  textContent: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  textTransform: string;
  textDecoration: string;
  textShadow: string;
  color: string;
  colorHex: string;
  backgroundColor: string;
  backgroundColorHex: string;
  parentBackground: string;
  parentBackgroundHex: string;
  backgroundImage: string;
  backgroundSize: string;
  backgroundPosition: string;
  backgroundRepeat: string;
  contrast: number;
  contrastRating: string;
  width: number;
  height: number;
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  marginTop: string;
  marginRight: string;
  marginBottom: string;
  marginLeft: string;
  borderTopWidth: string;
  borderRightWidth: string;
  borderBottomWidth: string;
  borderLeftWidth: string;
  borderRadius: string;
  borderColor: string;
  borderTopColor: string;
  borderRightColor: string;
  borderBottomColor: string;
  borderLeftColor: string;
  borderStyle: string;
  borderTopStyle: string;
  borderRightStyle: string;
  borderBottomStyle: string;
  borderLeftStyle: string;
  boxShadow: string;
  outline: string;
  outlineColor: string;
  outlineStyle: string;
  outlineWidth: string;
  outlineOffset: string;
  display: string;
  position: string;
  overflow: string;
  opacity: string;
  gridTemplateColumns: string;
  gridTemplateRows: string;
  gridAutoFlow: string;
  gap: string;
  gridAutoColumns: string;
  gridAutoRows: string;
  gridTemplateAreas: string;
  columnGap: string;
  rowGap: string;
  flexDirection: string;
  flexWrap: string;
  flexGrow: string;
  flexShrink: string;
  flexBasis: string;
  alignSelf: string;
  order: string;
  justifyItems: string;
  alignItems: string;
  justifyContent: string;
  alignContent: string;
  cursor: string;
  transition: string;
  transform: string;
  filter: string;
  backdropFilter: string;
  mixBlendMode: string;
  top: number;
  left: number;
  dpr: number;
  assetSrc?: string;
  assetKind?: 'img' | 'svg' | 'background' | 'none';
}

export interface PageTech {
  name: string;
  category: string;
  version?: string;
  confidence?: number;
  frequency?: number;
}

export interface PageColor {
  hex: string;
  rgb: string;
  count: number;
  roles: ColorRole[];
  roleCounts: Record<ColorRole, number>;
}

export interface PageTypo {
  tag: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  color: string;
  colorHex: string;
  count: number;
  sample: string;
  tagCounts: Record<string, number>;
  dominantTag: string;
}

export interface PageAsset {
  src: string;
  alt: string;
  type: string;
  width: number;
  height: number;
  tagName: string;
  sourceType: 'img' | 'svg-inline' | 'background';
  filePath?: string;
  downloadable?: boolean;
}
