export function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return rgb;
  const r = Number.parseInt(match[1], 10);
  const g = Number.parseInt(match[2], 10);
  const b = Number.parseInt(match[3], 10);
  return '#' + [r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return Number.parseFloat(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

function getRelativeLuminance(color: string): number {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return 0;

  const [r, g, b] = [
    Number.parseInt(match[1], 10) / 255,
    Number.parseInt(match[2], 10) / 255,
    Number.parseInt(match[3], 10) / 255,
  ];

  const toLinear = (channel: number) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function getEffectiveBackgroundColor(element: HTMLElement): string {
  let current: HTMLElement | null = element;
  while (current) {
    const bg = window.getComputedStyle(current).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      return bg;
    }
    current = current.parentElement;
  }

  return 'rgb(255, 255, 255)';
}
