import { useMemo } from 'react';
import type { PageTypo } from '../../types/ui';
import { sortTypographyByImportance, typeLabel } from '../../utils/typography';
import { useSectionLayout } from '../../hooks/useSectionLayout';
import { AccordionSection } from '../shared/AccordionSection';
import { PropGrid, PropRow } from '../shared/FieldRows';
import { ScanningState } from '../shared/ScanningState';
import { TypeIcon } from '../shared/icons';

interface TypographyTabProps {
  pageTypography: PageTypo[];
  isScanning: boolean;
  actionBar: React.ReactNode;
  colorFormat: 'hex' | 'rgb' | 'hsl';
  formatColor: (hex: string) => string;
  cycleColorFormat: () => void;
  copyToClipboard: (value: string) => void;
  getSectionLayout: (key: string) => { order: string[]; hidden: string[]; collapsed: string[] };
  setSectionLayout: (key: string, layout: { order: string[]; hidden: string[]; collapsed: string[] }) => void;
}

function TypographySummary({ items }: { items: PageTypo[] }) {
  const hierarchyTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'];

  const byTag = hierarchyTags
    .map((tag) => {
      const matches = items.filter((item) => item.dominantTag === tag || item.tag === tag);
      if (matches.length === 0) return null;

      const best = [...matches].sort((a, b) => b.count - a.count)[0];
      return { tag, style: best };
    })
    .filter((entry): entry is { tag: string; style: PageTypo } => Boolean(entry));

  return (
    <div className="p-3">
      <div className="text-[9px] uppercase font-bold tracking-widest mb-2" style={{ color: 'var(--kk-text-muted)' }}>Hierarchy summary</div>
      <div className="flex flex-col gap-2">
        {byTag.map(({ tag, style }) => (
          <div key={tag} className="rounded-lg p-2.5" style={{ background: 'var(--kk-bg-raised)', border: '1px solid var(--kk-border-subtle)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold" style={{ color: 'var(--kk-text-secondary)' }}>{typeLabel(tag)}</span>
              <span className="text-[9px]" style={{ color: 'var(--kk-text-muted)' }}>{style.fontSize} · {style.fontWeight}</span>
            </div>
            <div
              className="mt-1.5 overflow-hidden whitespace-nowrap text-ellipsis"
              style={{
                fontFamily: style.fontFamily,
                fontSize: Math.min(Number.parseFloat(style.fontSize), 28),
                fontWeight: style.fontWeight,
                lineHeight: '1.3',
                color: 'var(--kk-text-primary)',
              }}
            >
              AaBbCcDdEeFfGg
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypographyExtendedList({
  items,
  formatColor,
  cycleColorFormat,
  copyToClipboard,
}: {
  items: PageTypo[];
  formatColor: (hex: string) => string;
  cycleColorFormat: () => void;
  copyToClipboard: (value: string) => void;
}) {
  return (
    <div className="p-3 flex flex-col gap-2">
      {items.map((typo, i) => (
        <div key={`${typo.fontFamily}-${typo.fontSize}-${i}`} className="rounded-xl overflow-hidden" style={{ background: 'var(--kk-bg-surface)', border: '1px solid var(--kk-border)' }}>
          <div className="p-3" style={{ borderBottom: '1px solid var(--kk-border-subtle)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: 'var(--kk-text-secondary)' }}>
                {typeLabel(typo.dominantTag || typo.tag)}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--kk-text-muted)' }}>{typo.count} instances</span>
            </div>
            <div
              className="mt-2 overflow-hidden whitespace-nowrap text-ellipsis"
              style={{
                fontFamily: typo.fontFamily,
                fontSize: Math.min(parseFloat(typo.fontSize), 32) + 'px',
                fontWeight: typo.fontWeight,
                lineHeight: '1.3',
                color: 'var(--kk-text-primary)',
              }}
            >
              AaBbCcDdEeFfGg
            </div>
          </div>
          <div className="p-3">
            <PropGrid>
              <PropRow label="Font Family" value={typo.fontFamily.split(',')[0].replace(/['"]/g, '')} onCopy={() => copyToClipboard(typo.fontFamily.split(',')[0].replace(/['"]/g, ''))} />
              <PropRow label="Font Size" value={typo.fontSize} />
              <PropRow label="Weight" value={typo.fontWeight} />
              <PropRow label="Line Height" value={typo.lineHeight} />
              <PropRow label="Letter Spacing" value={typo.letterSpacing} />
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: typo.color }} />
                <span className="text-[10px]" style={{ color: 'var(--kk-text-muted)' }}>Color</span>
                <span className="text-xs font-mono ml-auto cursor-pointer hover:text-violet-500 transition-colors" style={{ color: 'var(--kk-text-secondary)' }} onClick={cycleColorFormat}>
                  {formatColor(typo.colorHex)}
                </span>
              </div>
            </PropGrid>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TypographyTab({
  pageTypography,
  isScanning,
  actionBar,
  formatColor,
  cycleColorFormat,
  copyToClipboard,
  getSectionLayout,
  setSectionLayout,
}: TypographyTabProps) {
  const sortedTypography = useMemo(() => sortTypographyByImportance(pageTypography), [pageTypography]);

  const sectionLayout = useSectionLayout({
    scopeKey: 'typography.sections',
    sections: [
      { id: 'summary', title: 'Summary' },
      { id: 'extended', title: 'Extended' },
    ],
    getSectionLayout,
    setSectionLayout,
  });

  if (isScanning) {
    return (
      <div className="p-3 flex flex-col gap-3">
        {actionBar}
        <ScanningState label="Scanning typography..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      {actionBar}

      {sectionLayout.orderedSections.map((section) => {
        if (section.id === 'summary') {
          return (
            <AccordionSection
              key={section.id}
              id={section.id}
              title="Hierarchy Summary"
              icon={<TypeIcon />}
              hidden={sectionLayout.hidden.has(section.id)}
              collapsed={sectionLayout.collapsed.has(section.id)}
              onToggleHidden={() => sectionLayout.toggleHidden(section.id)}
              onToggleCollapse={() => sectionLayout.toggleCollapsed(section.id)}
              onDragStart={sectionLayout.onDragStart}
              onDragOver={sectionLayout.onDragOver}
              onDrop={sectionLayout.onDrop}
            >
              <TypographySummary items={sortedTypography} />
            </AccordionSection>
          );
        }

        return (
          <AccordionSection
            key={section.id}
            id={section.id}
            title="Extended Styles"
            icon={<TypeIcon />}
            hidden={sectionLayout.hidden.has(section.id)}
            collapsed={sectionLayout.collapsed.has(section.id)}
            onToggleHidden={() => sectionLayout.toggleHidden(section.id)}
            onToggleCollapse={() => sectionLayout.toggleCollapsed(section.id)}
            onDragStart={sectionLayout.onDragStart}
            onDragOver={sectionLayout.onDragOver}
            onDrop={sectionLayout.onDrop}
          >
            <TypographyExtendedList
              items={sortedTypography}
              formatColor={formatColor}
              cycleColorFormat={cycleColorFormat}
              copyToClipboard={copyToClipboard}
            />
          </AccordionSection>
        );
      })}
    </div>
  );
}
