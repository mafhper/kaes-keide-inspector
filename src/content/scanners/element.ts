import type { ExtractedElementData } from '../shared/types';
import { getContrastRatio, getEffectiveBackgroundColor, rgbToHex } from '../shared/colorUtils';

function getAssetMetadata(el: HTMLElement, computed: CSSStyleDeclaration): { assetSrc?: string; assetKind: 'img' | 'svg' | 'background' | 'none' } {
  if (el.tagName === 'IMG') {
    const image = el as HTMLImageElement;
    const src = image.currentSrc || image.src;
    if (src) {
      return { assetSrc: src, assetKind: 'img' };
    }
  }

  if (el.tagName === 'SVG') {
    const serializer = new XMLSerializer();
    const raw = serializer.serializeToString(el);
    const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(raw)}`;
    return { assetSrc: encoded, assetKind: 'svg' };
  }

  const bg = computed.backgroundImage;
  if (bg && bg !== 'none') {
    const match = bg.match(/url\(["']?(.+?)["']?\)/);
    if (match?.[1]) {
      return { assetSrc: match[1], assetKind: 'background' };
    }
  }

  return { assetKind: 'none' };
}

export function extractElementData(el: HTMLElement): ExtractedElementData {
  const cs = window.getComputedStyle(el);
  const cssWithBackdrop = cs as CSSStyleDeclaration & { backdropFilter?: string };
  const rect = el.getBoundingClientRect();
  const parentBg = getEffectiveBackgroundColor(el);
  const textColor = cs.color;
  const contrast = getContrastRatio(textColor, parentBg);
  const asset = getAssetMetadata(el, cs);

  return {
    tagName: el.tagName,
    id: el.id || '',
    classList: Array.from(el.classList).join('.'),
    textContent: (el.textContent || '').trim().substring(0, 80),

    fontFamily: cs.fontFamily,
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    lineHeight: cs.lineHeight,
    letterSpacing: cs.letterSpacing,
    textTransform: cs.textTransform,
    textDecoration: cs.textDecoration,
    textShadow: cs.textShadow,

    color: cs.color,
    colorHex: rgbToHex(cs.color),
    backgroundColor: cs.backgroundColor,
    backgroundColorHex: rgbToHex(cs.backgroundColor),
    parentBackground: parentBg,
    parentBackgroundHex: rgbToHex(parentBg),

    backgroundImage: cs.backgroundImage,
    backgroundSize: cs.backgroundSize,
    backgroundPosition: cs.backgroundPosition,
    backgroundRepeat: cs.backgroundRepeat,

    contrast,
    contrastRating: contrast >= 7 ? 'AAA' : contrast >= 4.5 ? 'AA' : contrast >= 3 ? 'Poor' : 'Very Poor',

    width: Math.round(rect.width),
    height: Math.round(rect.height),
    paddingTop: cs.paddingTop,
    paddingRight: cs.paddingRight,
    paddingBottom: cs.paddingBottom,
    paddingLeft: cs.paddingLeft,
    marginTop: cs.marginTop,
    marginRight: cs.marginRight,
    marginBottom: cs.marginBottom,
    marginLeft: cs.marginLeft,

    borderTopWidth: cs.borderTopWidth,
    borderRightWidth: cs.borderRightWidth,
    borderBottomWidth: cs.borderBottomWidth,
    borderLeftWidth: cs.borderLeftWidth,
    borderRadius: cs.borderRadius,
    borderColor: cs.borderColor,
    borderTopColor: cs.borderTopColor,
    borderRightColor: cs.borderRightColor,
    borderBottomColor: cs.borderBottomColor,
    borderLeftColor: cs.borderLeftColor,
    borderStyle: cs.borderStyle,
    borderTopStyle: cs.borderTopStyle,
    borderRightStyle: cs.borderRightStyle,
    borderBottomStyle: cs.borderBottomStyle,
    borderLeftStyle: cs.borderLeftStyle,

    boxShadow: cs.boxShadow,
    outline: cs.outline,
    outlineColor: cs.outlineColor,
    outlineStyle: cs.outlineStyle,
    outlineWidth: cs.outlineWidth,
    outlineOffset: cs.outlineOffset,

    display: cs.display,
    position: cs.position,
    overflow: cs.overflow,
    opacity: cs.opacity,

    gridTemplateColumns: cs.gridTemplateColumns,
    gridTemplateRows: cs.gridTemplateRows,
    gridAutoFlow: cs.gridAutoFlow,
    gridAutoColumns: cs.gridAutoColumns,
    gridAutoRows: cs.gridAutoRows,
    gridTemplateAreas: cs.gridTemplateAreas,
    gap: cs.gap,
    columnGap: cs.columnGap,
    rowGap: cs.rowGap,

    flexDirection: cs.flexDirection,
    flexWrap: cs.flexWrap,
    flexGrow: cs.flexGrow,
    flexShrink: cs.flexShrink,
    flexBasis: cs.flexBasis,
    alignSelf: cs.alignSelf,
    order: cs.order,

    justifyItems: cs.justifyItems,
    alignItems: cs.alignItems,
    justifyContent: cs.justifyContent,
    alignContent: cs.alignContent,

    cursor: cs.cursor,
    transition: cs.transition,
    transform: cs.transform,
    filter: cs.filter,
    backdropFilter: cssWithBackdrop.backdropFilter || '',
    mixBlendMode: cs.mixBlendMode,

    top: Math.round(rect.top),
    left: Math.round(rect.left),
    dpr: window.devicePixelRatio || 1,

    assetSrc: asset.assetSrc,
    assetKind: asset.assetKind,
  };
}
