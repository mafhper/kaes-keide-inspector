import { useMemo } from 'react';
import type { PageColor } from '../../types/ui';
import { filterColorsByRole, summarizeColorSwatches } from '../../utils/colorGrouping';
import { getTextColorOnBg } from '../../utils/color';
import { downloadText } from '../../utils/download';
import { useSectionLayout } from '../../hooks/useSectionLayout';
import { AccordionSection } from '../shared/AccordionSection';
import { ScanningState } from '../shared/ScanningState';
import { DropletIcon } from '../shared/icons';

interface ColorsTabProps {
  pageColors: PageColor[];
  isScanning: boolean;
  actionBar: React.ReactNode;
  colorFormat: 'hex' | 'rgb' | 'hsl';
  formatColor: (hex: string) => string;
  cycleColorFormat: () => void;
  copyToClipboard: (value: string) => void;
  exportFormat: 'json' | 'markdown' | 'css' | 'scss' | 'json-tokens';
  setExportFormat: (value: 'json' | 'markdown' | 'css' | 'scss' | 'json-tokens') => void;
  getSectionLayout: (key: string) => { order: string[]; hidden: string[]; collapsed: string[] };
  setSectionLayout: (key: string, layout: { order: string[]; hidden: string[]; collapsed: string[] }) => void;
}

function exportPalette(pageColors: PageColor[], exportFormat: ColorsTabProps['exportFormat']) {
  let content = '';
  let filename = 'palette';
  let mime = 'text/plain';

  if (exportFormat === 'css') {
    content = ':root {\n' + pageColors.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join('\n') + '\n}';
    filename += '.css';
    mime = 'text/css';
  } else if (exportFormat === 'scss') {
    content = pageColors.map((c, i) => `$color-${i + 1}: ${c.hex};`).join('\n');
    filename += '.scss';
    mime = 'text/x-scss';
  } else {
    const obj: Record<string, string> = {};
    pageColors.forEach((c, i) => {
      obj[`color-${i + 1}`] = c.hex;
    });

    content = JSON.stringify(exportFormat === 'json-tokens' ? { colors: obj } : obj, null, 2);
    filename += '.json';
    mime = 'application/json';
  }

  downloadText(content, filename, mime);
}

function ColorSummary({ colors }: { colors: PageColor[] }) {
  const swatches = summarizeColorSwatches(colors, 12);

  return (
    <div className="px-3 pt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] uppercase font-bold tracking-widest" style={{ color: 'var(--kk-text-muted)' }}>Summary</span>
        <span className="text-[10px]" style={{ color: 'var(--kk-text-muted)' }}>{colors.length} colors</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {swatches.map((color) => (
          <div key={color.hex} title={`${color.hex} (${color.count})`} className="w-5 h-5 rounded-sm" style={{ backgroundColor: color.hex, border: '1px solid var(--kk-border)' }} />
        ))}
      </div>
    </div>
  );
}

function ColorCards({ colors, formatColor, onToggleFormat, onCopy }: {
  colors: PageColor[];
  formatColor: (hex: string) => string;
  onToggleFormat: () => void;
  onCopy: (value: string) => void;
}) {
  return (
    <div className="p-3 flex flex-col gap-2">
      {colors.map((color) => (
        <div
          key={color.hex}
          className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer relative group"
          style={{ backgroundColor: color.hex, border: '1px solid var(--kk-border)' }}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('.format-tag')) {
              onToggleFormat();
              return;
            }
            onCopy(formatColor(color.hex));
          }}
        >
          <div className="absolute top-2 right-2 format-tag bg-black/20 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
            format
          </div>
          <div className="px-4 py-5">
            <div className="font-mono font-bold text-sm" style={{ color: getTextColorOnBg(color.hex) }}>
              {formatColor(color.hex)}
            </div>
            <div className="text-[10px] mt-0.5 opacity-70" style={{ color: getTextColorOnBg(color.hex) }}>
              {color.count} instances · roles: {color.roles.join(', ')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ColorsTab({
  pageColors,
  isScanning,
  actionBar,
  formatColor,
  cycleColorFormat,
  copyToClipboard,
  exportFormat,
  setExportFormat,
  getSectionLayout,
  setSectionLayout,
}: ColorsTabProps) {
  const textColors = useMemo(() => filterColorsByRole(pageColors, 'text'), [pageColors]);
  const surfaceColors = useMemo(
    () => pageColors.filter((c) => c.roles.includes('surface') || c.roles.includes('border')),
    [pageColors],
  );

  const sectionLayout = useSectionLayout({
    scopeKey: 'colors.sections',
    sections: [
      { id: 'text', title: 'Text Colors' },
      { id: 'surface', title: 'Surface Colors' },
    ],
    getSectionLayout,
    setSectionLayout,
  });

  if (isScanning) {
    return (
      <div className="p-3 flex flex-col gap-3">
        {actionBar}
        <ScanningState label="Scanning colors..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      {actionBar}

      <div className="rounded-xl p-2.5 flex items-center gap-2" style={{ background: 'var(--kk-bg-surface)', border: '1px solid var(--kk-border)' }}>
        <span className="text-[10px] uppercase font-semibold" style={{ color: 'var(--kk-text-muted)' }}>Palette export</span>
        <select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as ColorsTabProps['exportFormat'])}
          className="text-[10px] rounded-lg px-1.5 py-0.5 outline-none cursor-pointer"
          style={{ background: 'var(--kk-bg-raised)', border: '1px solid var(--kk-border)', color: 'var(--kk-text-secondary)' }}
        >
          <option value="css">CSS Vars</option>
          <option value="scss">SCSS</option>
          <option value="json">JSON</option>
          <option value="json-tokens">Design Tokens</option>
        </select>
        <button
          onClick={() => exportPalette(pageColors, exportFormat)}
          className="ml-auto text-[10px] font-medium px-2.5 py-1 rounded-lg transition-all cursor-pointer hover:opacity-90"
          style={{ color: 'var(--kk-accent)', border: '1px solid var(--kk-accent-glow)' }}
        >
          Download palette
        </button>
      </div>

      {sectionLayout.orderedSections.map((section) => {
        const isText = section.id === 'text';
        const colors = isText ? textColors : surfaceColors;

        return (
          <AccordionSection
            key={section.id}
            id={section.id}
            title={isText ? 'Text Colors' : 'Surface Colors'}
            icon={<DropletIcon />}
            hidden={sectionLayout.hidden.has(section.id)}
            collapsed={sectionLayout.collapsed.has(section.id)}
            onToggleHidden={() => sectionLayout.toggleHidden(section.id)}
            onToggleCollapse={() => sectionLayout.toggleCollapsed(section.id)}
            onDragStart={sectionLayout.onDragStart}
            onDragOver={sectionLayout.onDragOver}
            onDrop={sectionLayout.onDrop}
          >
            <ColorSummary colors={colors} />
            <ColorCards colors={colors} formatColor={formatColor} onToggleFormat={cycleColorFormat} onCopy={copyToClipboard} />
          </AccordionSection>
        );
      })}
    </div>
  );
}
