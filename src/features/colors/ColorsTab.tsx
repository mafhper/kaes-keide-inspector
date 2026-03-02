import { useMemo } from 'react';
import type { PageColor } from '../../types/ui';
import { filterColorsByRole, summarizeColorSwatches } from '../../utils/colorGrouping';
import { getContrastRatio, getTextColorOnBg, hexToRgb } from '../../utils/color';
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

interface ContrastPair {
  text: PageColor;
  surface: PageColor;
  ratio: number;
  score: number;
  status: 'Bom' | 'Regular' | 'Ruim' | 'Péssimo';
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

function contrastStatus(ratio: number): ContrastPair['status'] {
  if (ratio >= 4.5) return 'Bom';
  if (ratio >= 3) return 'Regular';
  if (ratio >= 2) return 'Ruim';
  return 'Péssimo';
}

function buildContrastPairs(textColors: PageColor[], surfaceColors: PageColor[]): ContrastPair[] {
  const textCandidates = [...textColors].sort((a, b) => b.count - a.count).slice(0, 10);
  const surfaceCandidates = [...surfaceColors].sort((a, b) => b.count - a.count).slice(0, 10);
  const pairs: ContrastPair[] = [];

  textCandidates.forEach((text) => {
    surfaceCandidates.forEach((surface) => {
      if (text.hex === surface.hex) return;
      const ratio = getContrastRatio(hexToRgb(text.hex), hexToRgb(surface.hex));
      pairs.push({
        text,
        surface,
        ratio,
        score: text.count * surface.count,
        status: contrastStatus(ratio),
      });
    });
  });

  return pairs
    .sort((a, b) => b.score - a.score || b.ratio - a.ratio)
    .slice(0, 20);
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

function ContrastBadge({ status }: { status: ContrastPair['status'] }) {
  const map = {
    Bom: { bg: 'rgba(34,197,94,0.18)', fg: '#16a34a' },
    Regular: { bg: 'rgba(245,158,11,0.18)', fg: '#d97706' },
    Ruim: { bg: 'rgba(249,115,22,0.18)', fg: '#ea580c' },
    Péssimo: { bg: 'rgba(239,68,68,0.18)', fg: '#dc2626' },
  } as const;

  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
      style={{ background: map[status].bg, color: map[status].fg }}
    >
      {status}
    </span>
  );
}

function wcagNormal(ratio: number): string {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  return 'Fail';
}

function wcagLarge(ratio: number): string {
  if (ratio >= 4.5) return 'AAA';
  if (ratio >= 3) return 'AA';
  return 'Fail';
}

function ContrastSummary({ pairs }: { pairs: ContrastPair[] }) {
  const counts = pairs.reduce(
    (acc, pair) => {
      acc[pair.status] += 1;
      return acc;
    },
    { Bom: 0, Regular: 0, Ruim: 0, Péssimo: 0 } as Record<ContrastPair['status'], number>,
  );

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {(Object.keys(counts) as ContrastPair['status'][]).map((status) => (
        <div
          key={status}
          className="rounded-lg px-1.5 py-1 text-center"
          style={{ background: 'var(--kk-bg-raised)', border: '1px solid var(--kk-border-subtle)' }}
        >
          <div className="text-[9px] font-semibold" style={{ color: 'var(--kk-text-muted)' }}>{status}</div>
          <div className="text-[11px] font-bold" style={{ color: 'var(--kk-text-primary)' }}>{counts[status]}</div>
        </div>
      ))}
    </div>
  );
}

function ContrastMetric({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-md px-2 py-1"
      style={{ background: 'var(--kk-bg-raised)', border: '1px solid var(--kk-border-subtle)' }}
    >
      <div className="text-[9px] uppercase" style={{ color: 'var(--kk-text-muted)' }}>{label}</div>
      <div className="text-[11px] font-semibold" style={{ color: 'var(--kk-text-primary)' }}>{value}</div>
    </div>
  );
}

function ContrastSection({ pairs }: { pairs: ContrastPair[] }) {
  if (pairs.length === 0) {
    return (
      <div className="p-3 text-[11px]" style={{ color: 'var(--kk-text-muted)' }}>
        Need at least one text color and one surface color to run contrast checks.
      </div>
    );
  }

  return (
    <div className="p-3 flex flex-col gap-2">
      <div className="text-[10px]" style={{ color: 'var(--kk-text-muted)' }}>
        WCAG (texto normal e grande) para combinações texto x superfície.
      </div>
      <ContrastSummary pairs={pairs} />

      {pairs.map((pair) => (
        <div
          key={`${pair.text.hex}-${pair.surface.hex}`}
          className="rounded-xl p-2.5 flex flex-col gap-2"
          style={{ background: 'var(--kk-bg-surface)', border: '1px solid var(--kk-border)' }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-1 text-[10px] font-mono min-w-0" style={{ color: 'var(--kk-text-secondary)' }}>
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: pair.text.hex, border: '1px solid var(--kk-border)' }} />
                <span className="truncate">{pair.text.hex}</span>
              </div>
              <span className="text-[9px]" style={{ color: 'var(--kk-text-muted)' }}>on</span>
              <div className="flex items-center gap-1 text-[10px] font-mono min-w-0" style={{ color: 'var(--kk-text-secondary)' }}>
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: pair.surface.hex, border: '1px solid var(--kk-border)' }} />
                <span className="truncate">{pair.surface.hex}</span>
              </div>
            </div>
            <ContrastBadge status={pair.status} />
          </div>

          <div
            className="rounded-lg px-2.5 py-2"
            style={{ background: pair.surface.hex, border: '1px solid var(--kk-border)' }}
          >
            <div className="text-xs font-semibold" style={{ color: pair.text.hex }}>Aa Example Text</div>
            <div className="text-[10px] opacity-80" style={{ color: pair.text.hex }}>
              Contraste visual da combinação.
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <ContrastMetric label="Ratio" value={`${pair.ratio.toFixed(2)}:1`} />
            <ContrastMetric label="WCAG N" value={wcagNormal(pair.ratio)} />
            <ContrastMetric label="WCAG L" value={wcagLarge(pair.ratio)} />
          </div>

          <div className="text-[9px]" style={{ color: 'var(--kk-text-muted)' }}>
            frequência relativa: {pair.text.count} x {pair.surface.count}
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
  const contrastPairs = useMemo(() => buildContrastPairs(textColors, surfaceColors), [surfaceColors, textColors]);

  const sectionLayout = useSectionLayout({
    scopeKey: 'colors.sections',
    sections: [
      { id: 'text', title: 'Text Colors' },
      { id: 'surface', title: 'Surface Colors' },
      { id: 'contrast', title: 'Contrast' },
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
        if (section.id === 'contrast') {
          return (
            <AccordionSection
              key={section.id}
              id={section.id}
              title="Contrast"
              icon={<DropletIcon />}
              hidden={sectionLayout.hidden.has(section.id)}
              collapsed={sectionLayout.collapsed.has(section.id)}
              onToggleHidden={() => sectionLayout.toggleHidden(section.id)}
              onToggleCollapse={() => sectionLayout.toggleCollapsed(section.id)}
              onDragStart={sectionLayout.onDragStart}
              onDragOver={sectionLayout.onDragOver}
              onDrop={sectionLayout.onDrop}
            >
              <ContrastSection pairs={contrastPairs} />
            </AccordionSection>
          );
        }

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
