import BoxModel from '../../components/BoxModel';
import type { ElementData } from '../../types/ui';
import { contrastRating } from '../../utils/color';
import { useSectionLayout } from '../../hooks/useSectionLayout';
import { AccordionSection } from '../shared/AccordionSection';
import { ColorValueRow, PropGrid, PropRow } from '../shared/FieldRows';
import { DropletIcon, GridIcon, ImageIcon, TypeIcon } from '../shared/icons';

interface OverviewTabProps {
  selectedElement: ElementData | null;
  isInspecting: boolean;
  actionBar: React.ReactNode;
  colorFormat: 'hex' | 'rgb' | 'hsl';
  formatColor: (hex: string) => string;
  cycleColorFormat: () => void;
  copyToClipboard: (value: string) => void;
  onDownloadSmart: (el: ElementData) => void;
  getSectionLayout: (key: string) => { order: string[]; hidden: string[]; collapsed: string[] };
  setSectionLayout: (key: string, layout: { order: string[]; hidden: string[]; collapsed: string[] }) => void;
}

export function OverviewTab({
  selectedElement,
  isInspecting,
  actionBar,
  colorFormat,
  formatColor,
  cycleColorFormat,
  copyToClipboard,
  onDownloadSmart,
  getSectionLayout,
  setSectionLayout,
}: OverviewTabProps) {
  const sectionLayout = useSectionLayout({
    scopeKey: 'overview.sections',
    sections: [
      { id: 'identity', title: 'Identity' },
      { id: 'download', title: 'Download' },
      { id: 'typography', title: 'Typography' },
      { id: 'colors', title: 'Colors' },
      { id: 'boxModel', title: 'Box Model' },
      { id: 'layout', title: 'Element Properties' },
      { id: 'background', title: 'Background' },
    ],
    getSectionLayout,
    setSectionLayout,
  });

  if (!selectedElement) {
    return (
      <div className="flex-1 p-3 flex flex-col gap-3">
        {actionBar}
        <div className="rounded-xl p-4 text-center" style={{ background: 'var(--kk-bg-surface)', border: '1px solid var(--kk-border)' }}>
          <h2 className="text-sm font-bold mb-1" style={{ color: 'var(--kk-text-primary)' }}>
            {isInspecting ? 'Inspection active' : 'Ready to inspect'}
          </h2>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--kk-text-muted)' }}>
            {isInspecting
              ? 'Hover and click any element on the page to inspect it in detail.'
              : 'Use the action bar above to start inspecting elements.'}
          </p>
        </div>
      </div>
    );
  }

  const el = selectedElement;
  const cr = contrastRating(el.contrast);

  return (
    <div className="flex flex-col gap-3 p-3">
      {actionBar}

      {sectionLayout.orderedSections.map((section) => {
        if (section.id === 'identity') {
          return (
            <AccordionSection
              key={section.id}
              id={section.id}
              title="Identity"
              icon={<GridIcon />}
              hidden={sectionLayout.hidden.has(section.id)}
              collapsed={sectionLayout.collapsed.has(section.id)}
              onToggleHidden={() => sectionLayout.toggleHidden(section.id)}
              onToggleCollapse={() => sectionLayout.toggleCollapsed(section.id)}
              onDragStart={sectionLayout.onDragStart}
              onDragOver={sectionLayout.onDragOver}
              onDrop={sectionLayout.onDrop}
            >
              <div className="p-3">
                <div className="rounded-xl p-3" style={{ background: 'var(--kk-bg-raised)', border: '1px solid var(--kk-border-subtle)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded font-semibold" style={{ background: 'var(--kk-accent-glow)', color: 'var(--kk-accent)' }}>
                      {el.tagName.toLowerCase()}
                    </span>
                    {el.classList && (
                      <span className="text-[10px] font-mono truncate" style={{ color: 'var(--kk-text-muted)' }}>
                        .{el.classList}
                      </span>
                    )}
                  </div>
                  {el.id && (
                    <div className="mt-1 text-[10px] font-mono" style={{ color: 'var(--kk-text-muted)' }}>
                      #{el.id}
                    </div>
                  )}
                  {el.textContent && (
                    <div className="mt-2 text-[10px]" style={{ color: 'var(--kk-text-secondary)' }}>
                      {el.textContent}
                    </div>
                  )}
                </div>
              </div>
            </AccordionSection>
          );
        }

        if (section.id === 'download') {
          return (
            <AccordionSection
              key={section.id}
              id={section.id}
              title="Download"
              icon={<ImageIcon />}
              hidden={sectionLayout.hidden.has(section.id)}
              collapsed={sectionLayout.collapsed.has(section.id)}
              onToggleHidden={() => sectionLayout.toggleHidden(section.id)}
              onToggleCollapse={() => sectionLayout.toggleCollapsed(section.id)}
              onDragStart={sectionLayout.onDragStart}
              onDragOver={sectionLayout.onDragOver}
              onDrop={sectionLayout.onDrop}
            >
              <div className="p-3 flex items-center gap-2">
                <button
                  onClick={() => onDownloadSmart(el)}
                  className="text-[10px] font-medium px-2.5 py-1 rounded-lg transition-all cursor-pointer hover:opacity-90"
                  style={{ color: 'var(--kk-accent)', border: '1px solid var(--kk-accent-glow)' }}
                >
                  Download image/file
                </button>
                <span className="text-[10px]" style={{ color: 'var(--kk-text-muted)' }}>
                  Smart mode: source file when available, screenshot otherwise.
                </span>
              </div>
            </AccordionSection>
          );
        }

        if (section.id === 'typography') {
          return (
            <AccordionSection
              key={section.id}
              id={section.id}
              title="Typography"
              icon={<TypeIcon />}
              hidden={sectionLayout.hidden.has(section.id)}
              collapsed={sectionLayout.collapsed.has(section.id)}
              onToggleHidden={() => sectionLayout.toggleHidden(section.id)}
              onToggleCollapse={() => sectionLayout.toggleCollapsed(section.id)}
              onDragStart={sectionLayout.onDragStart}
              onDragOver={sectionLayout.onDragOver}
              onDrop={sectionLayout.onDrop}
            >
              <PropGrid>
                <PropRow label="Font Family" value={el.fontFamily.split(',')[0].replace(/['"]/g, '')} onCopy={() => copyToClipboard(el.fontFamily.split(',')[0].replace(/['"]/g, ''))} />
                <PropRow label="Font Size" value={el.fontSize} />
                <PropRow label="Font Weight" value={el.fontWeight} />
                <PropRow label="Line Height" value={el.lineHeight} />
                <PropRow label="Letter Spacing" value={el.letterSpacing} />
              </PropGrid>
            </AccordionSection>
          );
        }

        if (section.id === 'colors') {
          return (
            <AccordionSection
              key={section.id}
              id={section.id}
              title="Colors"
              icon={<DropletIcon />}
              hidden={sectionLayout.hidden.has(section.id)}
              collapsed={sectionLayout.collapsed.has(section.id)}
              onToggleHidden={() => sectionLayout.toggleHidden(section.id)}
              onToggleCollapse={() => sectionLayout.toggleCollapsed(section.id)}
              onDragStart={sectionLayout.onDragStart}
              onDragOver={sectionLayout.onDragOver}
              onDrop={sectionLayout.onDrop}
            >
              <div className="p-3 flex flex-col gap-2">
                <ColorValueRow label="Text" color={el.color} hex={el.colorHex} format={colorFormat} onToggleFormat={cycleColorFormat} onCopy={() => copyToClipboard(formatColor(el.colorHex))} />
                <ColorValueRow label="Background" color={el.parentBackground} hex={el.parentBackgroundHex} format={colorFormat} onToggleFormat={cycleColorFormat} onCopy={() => copyToClipboard(formatColor(el.parentBackgroundHex))} />
                <div className="flex items-center justify-between mt-1 pt-2" style={{ borderTop: '1px solid var(--kk-border-subtle)' }}>
                  <span className="text-xs font-medium" style={{ color: 'var(--kk-text-secondary)' }}>{el.contrast}:1</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cr.pass ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                    {cr.label}
                  </span>
                </div>
              </div>
            </AccordionSection>
          );
        }

        if (section.id === 'boxModel') {
          return (
            <AccordionSection
              key={section.id}
              id={section.id}
              title="Box Model"
              icon={<GridIcon />}
              hidden={sectionLayout.hidden.has(section.id)}
              collapsed={sectionLayout.collapsed.has(section.id)}
              onToggleHidden={() => sectionLayout.toggleHidden(section.id)}
              onToggleCollapse={() => sectionLayout.toggleCollapsed(section.id)}
              onDragStart={sectionLayout.onDragStart}
              onDragOver={sectionLayout.onDragOver}
              onDrop={sectionLayout.onDrop}
            >
              <div className="px-3 pb-3">
                <BoxModel
                  width={el.width}
                  height={el.height}
                  marginTop={el.marginTop}
                  marginRight={el.marginRight}
                  marginBottom={el.marginBottom}
                  marginLeft={el.marginLeft}
                  paddingTop={el.paddingTop}
                  paddingRight={el.paddingRight}
                  paddingBottom={el.paddingBottom}
                  paddingLeft={el.paddingLeft}
                  borderTopWidth={el.borderTopWidth}
                  borderRightWidth={el.borderRightWidth}
                  borderBottomWidth={el.borderBottomWidth}
                  borderLeftWidth={el.borderLeftWidth}
                />
              </div>
            </AccordionSection>
          );
        }

        if (section.id === 'layout') {
          return (
            <AccordionSection
              key={section.id}
              id={section.id}
              title="Element Properties"
              icon={<GridIcon />}
              hidden={sectionLayout.hidden.has(section.id)}
              collapsed={sectionLayout.collapsed.has(section.id)}
              onToggleHidden={() => sectionLayout.toggleHidden(section.id)}
              onToggleCollapse={() => sectionLayout.toggleCollapsed(section.id)}
              onDragStart={sectionLayout.onDragStart}
              onDragOver={sectionLayout.onDragOver}
              onDrop={sectionLayout.onDrop}
            >
              <PropGrid>
                <PropRow label="Width" value={`${el.width}px`} />
                <PropRow label="Height" value={`${el.height}px`} />
                <PropRow label="Display" value={el.display} />
                <PropRow label="Position" value={el.position} />
                <PropRow label="Opacity" value={el.opacity} />
                <PropRow label="Border Radius" value={el.borderRadius} />
              </PropGrid>
            </AccordionSection>
          );
        }

        if (section.id === 'background') {
          return (
            <AccordionSection
              key={section.id}
              id={section.id}
              title="Background"
              icon={<ImageIcon />}
              hidden={sectionLayout.hidden.has(section.id)}
              collapsed={sectionLayout.collapsed.has(section.id)}
              onToggleHidden={() => sectionLayout.toggleHidden(section.id)}
              onToggleCollapse={() => sectionLayout.toggleCollapsed(section.id)}
              onDragStart={sectionLayout.onDragStart}
              onDragOver={sectionLayout.onDragOver}
              onDrop={sectionLayout.onDrop}
            >
              <PropGrid>
                <PropRow label="Image" value={el.backgroundImage} />
                <PropRow label="Size" value={el.backgroundSize} />
                <PropRow label="Position" value={el.backgroundPosition} />
                <PropRow label="Repeat" value={el.backgroundRepeat} />
              </PropGrid>
            </AccordionSection>
          );
        }

        return null;
      })}
    </div>
  );
}
