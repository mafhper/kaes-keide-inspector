import type { ScannedColors } from '../shared/types';
import type { ColorRole } from '../../types/ui';
import { rgbToHex } from '../shared/colorUtils';
import { isValidTarget } from '../shared/target';

export function scanPageColors(): ScannedColors {
  const colorMap = new Map<string, { rgb: string; count: number; roleCounts: Record<ColorRole, number> }>();

  const addColor = (rgb: string, role: ColorRole) => {
    if (!rgb || rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') return;

    const hex = rgbToHex(rgb);
    if (!colorMap.has(hex)) {
      colorMap.set(hex, {
        rgb,
        count: 0,
        roleCounts: { text: 0, surface: 0, border: 0 },
      });
    }

    const entry = colorMap.get(hex)!;
    entry.count += 1;
    entry.roleCounts[role] += 1;
  };

  const allElements = document.querySelectorAll('*');
  allElements.forEach((element) => {
    if (!isValidTarget(element)) return;

    const cs = window.getComputedStyle(element);
    addColor(cs.color, 'text');
    addColor(cs.backgroundColor, 'surface');

    if (cs.borderColor && cs.borderColor !== 'transparent') {
      const widths = [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth];
      if (widths.some((width) => width !== '0px')) {
        addColor(cs.borderColor, 'border');
      }
    }
  });

  return Array.from(colorMap.entries())
    .map(([hex, data]) => {
      const roles = (Object.keys(data.roleCounts) as ColorRole[]).filter((role) => data.roleCounts[role] > 0);
      return {
        hex,
        rgb: data.rgb,
        count: data.count,
        roles,
        roleCounts: data.roleCounts,
      };
    })
    .sort((a, b) => b.count - a.count);
}
