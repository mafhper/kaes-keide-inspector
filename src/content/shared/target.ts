const EXCLUDED_TAGS = new Set([
  'HTML',
  'HEAD',
  'META',
  'SCRIPT',
  'STYLE',
  'LINK',
  'NOSCRIPT',
  'BR',
  'TITLE',
  'PATH',
  'DEFS',
  'CLIPPATH',
  'MASK',
]);

export function isValidTarget(element: Element): boolean {
  if (EXCLUDED_TAGS.has(element.tagName)) return false;
  if (element.id === 'css-inspector-overlay-wrapper') return false;
  if (element.closest('#css-inspector-overlay-wrapper')) return false;
  return true;
}

export function getDeepestElementAtPoint(x: number, y: number, overlayWrapper: HTMLElement | null): HTMLElement | null {
  if (overlayWrapper) overlayWrapper.style.display = 'none';
  const element = document.elementFromPoint(x, y) as HTMLElement | null;
  if (overlayWrapper) overlayWrapper.style.display = '';

  if (!element || !isValidTarget(element)) return null;
  return element;
}
