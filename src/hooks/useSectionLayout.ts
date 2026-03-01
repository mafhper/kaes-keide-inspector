import { useMemo, useState } from 'react';
import type { SectionLayoutState } from '../types/preferences';
import { reorder } from '../utils/reorder';

export interface SectionDefinition {
  id: string;
  title: string;
}

interface UseSectionLayoutOptions {
  scopeKey: string;
  sections: SectionDefinition[];
  getSectionLayout: (key: string) => SectionLayoutState;
  setSectionLayout: (key: string, layout: SectionLayoutState) => void;
}

export function useSectionLayout({ scopeKey, sections, getSectionLayout, setSectionLayout }: UseSectionLayoutOptions) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const layout = getSectionLayout(scopeKey);

  const orderedIds = useMemo(() => {
    const baseIds = sections.map((s) => s.id);
    const explicit = layout.order.filter((id) => baseIds.includes(id));
    const missing = baseIds.filter((id) => !explicit.includes(id));
    return [...explicit, ...missing];
  }, [layout.order, sections]);

  const orderedSections = useMemo(() => {
    const byId = new Map(sections.map((s) => [s.id, s]));
    return orderedIds.map((id) => byId.get(id)).filter((item): item is SectionDefinition => Boolean(item));
  }, [orderedIds, sections]);

  const hidden = new Set(layout.hidden);
  const collapsed = new Set(layout.collapsed);

  const saveLayout = (next: Partial<SectionLayoutState>) => {
    setSectionLayout(scopeKey, {
      ...layout,
      ...next,
    });
  };

  const toggleHidden = (id: string) => {
    const next = hidden.has(id) ? [...layout.hidden.filter((v) => v !== id)] : [...layout.hidden, id];
    saveLayout({ hidden: next });
  };

  const toggleCollapsed = (id: string) => {
    const next = collapsed.has(id) ? [...layout.collapsed.filter((v) => v !== id)] : [...layout.collapsed, id];
    saveLayout({ collapsed: next });
  };

  const onDragStart = (id: string) => {
    setDraggingId(id);
  };

  const onDragOver = (id: string) => {
    setDragOverId(id);
  };

  const onDrop = (id: string) => {
    if (!draggingId || draggingId === id) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }

    const from = orderedIds.indexOf(draggingId);
    const to = orderedIds.indexOf(id);
    if (from < 0 || to < 0) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }

    const nextOrder = reorder(orderedIds, from, to);
    saveLayout({ order: nextOrder });
    setDraggingId(null);
    setDragOverId(null);
  };

  return {
    orderedSections,
    hidden,
    collapsed,
    draggingId,
    dragOverId,
    toggleHidden,
    toggleCollapsed,
    onDragStart,
    onDragOver,
    onDrop,
  };
}
