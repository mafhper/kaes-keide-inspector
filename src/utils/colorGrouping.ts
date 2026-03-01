import type { PageColor, ColorRole } from '../types/ui';

export function filterColorsByRole(colors: PageColor[], role: ColorRole): PageColor[] {
  return colors.filter((color) => color.roles.includes(role));
}

export function summarizeColorSwatches(colors: PageColor[], max = 8): PageColor[] {
  return [...colors].sort((a, b) => b.count - a.count).slice(0, max);
}
