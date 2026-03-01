import type { PageTech } from '../types/ui';

export function computeTechWeight(tech: PageTech): number {
  const confidence = tech.confidence ?? 70;
  const frequency = tech.frequency ?? 1;
  return Math.max(1, Math.round(confidence * 0.7 + frequency * 30));
}
