import { useMemo, useState } from 'react';
import type { StackDetectionMode, StackViewMode } from '../../types/preferences';
import type { PageTech } from '../../types/ui';
import { computeTechWeight } from '../../utils/stackWeight';
import { downloadText } from '../../utils/download';
import { AccordionSection } from '../shared/AccordionSection';
import { ScanningState } from '../shared/ScanningState';
import { TechItem } from '../shared/DisplayBits';
import { TechIcon } from '../shared/icons';
import { reorder } from '../../utils/reorder';

interface StackTabProps {
  pageTechs: PageTech[];
  pageVitals: Record<string, number> | null;
  isScanning: boolean;
  actionBar: React.ReactNode;
  exportFormat: 'json' | 'markdown' | 'css' | 'scss' | 'json-tokens';
  setExportFormat: (value: 'json' | 'markdown' | 'css' | 'scss' | 'json-tokens') => void;
  stackViewMode: StackViewMode;
  setStackViewMode: (mode: StackViewMode) => void;
  stackDetectionMode: StackDetectionMode;
  setStackDetectionMode: (mode: StackDetectionMode) => void;
  stackCategoryOrder: string[];
  setStackCategoryOrder: (order: string[]) => void;
  hiddenStackCategories: string[];
  setHiddenStackCategories: (hidden: string[]) => void;
  getSectionLayout: (key: string) => { order: string[]; hidden: string[]; collapsed: string[] };
  setSectionLayout: (key: string, layout: { order: string[]; hidden: string[]; collapsed: string[] }) => void;
}

function TechCloudItem({ tech, size }: { tech: PageTech; size: number }) {
  return (
    <span
      className="group relative px-2.5 py-1 rounded-full"
      style={{
        fontSize: `${size}px`,
        background: 'var(--kk-bg-raised)',
        border: '1px solid var(--kk-border)',
        color: 'var(--kk-text-secondary)',
      }}
      title={techTooltip(tech)}
    >
      {tech.name}

      <div
        className="absolute left-0 top-full mt-1.5 w-[280px] rounded-xl p-2.5 z-50 opacity-0 pointer-events-none transition-opacity group-hover:opacity-100"
        style={{ background: 'var(--kk-bg-surface)', border: '1px solid var(--kk-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.25)' }}
      >
        <div className="text-[11px] font-semibold mb-1" style={{ color: 'var(--kk-text-primary)' }}>{tech.name}</div>
        <div className="text-[10px] mb-1" style={{ color: 'var(--kk-text-secondary)' }}>
          {tech.category || 'Other'}{typeof tech.confidence === 'number' ? ` · conf ${tech.confidence}%` : ''}
        </div>
        {tech.evidenceTypes && tech.evidenceTypes.length > 0 && (
          <div className="text-[9px] mb-1.5" style={{ color: 'var(--kk-text-muted)' }}>
            sinais: {tech.evidenceTypes.join(', ')}
          </div>
        )}
        {tech.evidence && tech.evidence.length > 0 ? (
          <ul className="text-[10px] leading-4 list-disc pl-4 space-y-0.5" style={{ color: 'var(--kk-text-secondary)' }}>
            {tech.evidence.slice(0, 6).map((item, index) => (
              <li key={`${tech.name}-evidence-${index}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <div className="text-[10px]" style={{ color: 'var(--kk-text-muted)' }}>No evidence details available.</div>
        )}
      </div>
    </span>
  );
}

function exportTech(pageTechs: PageTech[], format: 'json' | 'markdown') {
  if (format === 'json') {
    downloadText(JSON.stringify(pageTechs, null, 2), 'stack-export.json', 'application/json');
    return;
  }

  const markdown = '# Tech Stack\n\n' + pageTechs.map((t) => `- **${t.name}**${t.version ? ` (v${t.version})` : ''} - *${t.category}*`).join('\n');
  downloadText(markdown, 'stack-export.md', 'text/markdown');
}

function techTooltip(tech: PageTech): string {
  const header = `${tech.name}${tech.version ? ` v${tech.version}` : ''} · ${tech.category}`;
  const confidence = typeof tech.confidence === 'number' ? `Confidence: ${tech.confidence}%` : '';
  const evidence = tech.evidence && tech.evidence.length > 0
    ? `Evidence:\n- ${tech.evidence.slice(0, 5).join('\n- ')}`
    : '';
  return [header, confidence, evidence].filter(Boolean).join('\n');
}

function VitalsGrid({ pageVitals }: { pageVitals: Record<string, number> | null }) {
  const metrics = [
    { name: 'LCP', val: pageVitals?.LCP, unit: 's', g: 2500, p: 4000, desc: 'Largest Contentful Paint' },
    { name: 'INP', val: pageVitals?.INP, unit: 'ms', g: 200, p: 500, desc: 'Interaction to Next Paint' },
    { name: 'CLS', val: pageVitals?.CLS, unit: '', g: 0.1, p: 0.25, desc: 'Cumulative Layout Shift' },
    { name: 'FCP', val: pageVitals?.FCP, unit: 's', g: 1800, p: 3000, desc: 'First Contentful Paint' },
    { name: 'TTFB', val: pageVitals?.TTFB, unit: 's', g: 800, p: 1800, desc: 'Time to First Byte' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 px-1 pb-2">
      {metrics.map((v) => {
        let displayVal = v.val !== undefined ? v.val : '-';
        if (v.val !== undefined && v.unit === 's') displayVal = (v.val / 1000).toFixed(2);

        let color = 'var(--kk-text-muted)';
        let bg = 'var(--kk-bg-raised)';
        if (v.val !== undefined) {
          if (v.val <= v.g) {
            color = '#16a34a';
            bg = 'rgba(22,163,74,0.08)';
          } else if (v.val <= v.p) {
            color = '#d97706';
            bg = 'rgba(217,119,6,0.08)';
          } else {
            color = '#dc2626';
            bg = 'rgba(220,38,38,0.08)';
          }
        }

        return (
          <div key={v.name} className="flex flex-col p-2.5 rounded-xl" style={{ background: bg, border: '1px solid var(--kk-border)' }} title={v.desc}>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--kk-text-muted)' }}>{v.name}</span>
            <div className="mt-1 flex items-baseline gap-0.5">
              <span className="text-sm font-bold" style={{ color }}>{displayVal as string}</span>
              {v.val !== undefined && <span className="text-[9px] opacity-70" style={{ color }}>{v.unit}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StackTab({
  pageTechs,
  pageVitals,
  isScanning,
  actionBar,
  exportFormat,
  setExportFormat,
  stackViewMode,
  setStackViewMode,
  stackDetectionMode,
  setStackDetectionMode,
  stackCategoryOrder,
  setStackCategoryOrder,
  hiddenStackCategories,
  setHiddenStackCategories,
  getSectionLayout,
  setSectionLayout,
}: StackTabProps) {
  const [draggingCategory, setDraggingCategory] = useState<string | null>(null);
  const categoryLayout = getSectionLayout('stack.categories');
  const collapsedCategories = new Set(categoryLayout.collapsed);

  const categories = useMemo(() => {
    const set = new Set(pageTechs.map((t) => t.category));
    return [...set];
  }, [pageTechs]);

  const orderedCategories = useMemo(() => {
    const sourceOrder = stackCategoryOrder.length > 0 ? stackCategoryOrder : categoryLayout.order;
    const explicit = sourceOrder.filter((c) => categories.includes(c));
    const missing = categories.filter((c) => !explicit.includes(c));
    return [...explicit, ...missing];
  }, [categories, categoryLayout.order, stackCategoryOrder]);

  const exportStackFormat = exportFormat === 'markdown' ? 'markdown' : 'json';

  if (isScanning && pageTechs.length === 0) {
    return (
      <div className="p-3 flex flex-col gap-3">
        {actionBar}
        <ScanningState label="Scanning technologies..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      {actionBar}

      <div className="rounded-xl p-2.5 flex flex-wrap items-center gap-2" style={{ background: 'var(--kk-bg-surface)', border: '1px solid var(--kk-border)' }}>
        <span className="text-[10px] uppercase font-semibold" style={{ color: 'var(--kk-text-muted)' }}>View</span>
        <button
          onClick={() => setStackViewMode('categories')}
          className="text-[10px] px-2 py-1 rounded-lg border"
          style={{ color: stackViewMode === 'categories' ? 'var(--kk-accent)' : 'var(--kk-text-secondary)', borderColor: stackViewMode === 'categories' ? 'var(--kk-accent-glow)' : 'var(--kk-border)' }}
        >
          Categories
        </button>
        <button
          onClick={() => setStackViewMode('cloud')}
          className="text-[10px] px-2 py-1 rounded-lg border"
          style={{ color: stackViewMode === 'cloud' ? 'var(--kk-accent)' : 'var(--kk-text-secondary)', borderColor: stackViewMode === 'cloud' ? 'var(--kk-accent-glow)' : 'var(--kk-border)' }}
        >
          Cloud
        </button>

        <span className="text-[10px] uppercase font-semibold ml-1" style={{ color: 'var(--kk-text-muted)' }}>Detect</span>
        <button
          onClick={() => setStackDetectionMode('strict')}
          className="text-[10px] px-2 py-1 rounded-lg border"
          style={{ color: stackDetectionMode === 'strict' ? 'var(--kk-accent)' : 'var(--kk-text-secondary)', borderColor: stackDetectionMode === 'strict' ? 'var(--kk-accent-glow)' : 'var(--kk-border)' }}
          title="Use stricter evidence filters to reduce false positives"
        >
          Strict
        </button>
        <button
          onClick={() => setStackDetectionMode('compat')}
          className="text-[10px] px-2 py-1 rounded-lg border"
          style={{ color: stackDetectionMode === 'compat' ? 'var(--kk-accent)' : 'var(--kk-text-secondary)', borderColor: stackDetectionMode === 'compat' ? 'var(--kk-accent-glow)' : 'var(--kk-border)' }}
          title="More permissive matching (may include more false positives)"
        >
          Compat
        </button>

        <div className="ml-auto flex items-center gap-1.5">
          <select
            value={exportStackFormat}
            onChange={(e) => setExportFormat(e.target.value as StackTabProps['exportFormat'])}
            className="text-[10px] rounded-lg px-1.5 py-0.5 outline-none cursor-pointer"
            style={{ background: 'var(--kk-bg-raised)', border: '1px solid var(--kk-border)', color: 'var(--kk-text-secondary)' }}
          >
            <option value="json">JSON</option>
            <option value="markdown">Markdown</option>
          </select>
          <button
            onClick={() => exportTech(pageTechs, exportStackFormat)}
            className="text-[10px] font-medium px-2.5 py-1 rounded-lg transition-all cursor-pointer hover:opacity-90"
            style={{ color: 'var(--kk-accent)', border: '1px solid var(--kk-accent-glow)' }}
          >
            Download
          </button>
        </div>
      </div>

      {stackViewMode === 'categories' ? (
        <div className="flex flex-col gap-2">
          {orderedCategories.map((category) => {
            const hidden = hiddenStackCategories.includes(category);
            return (
              <AccordionSection
                key={category}
                id={category}
                title={category}
                icon={<TechIcon />}
                hidden={hidden}
                collapsed={collapsedCategories.has(category)}
                onToggleHidden={() => {
                  if (hidden) setHiddenStackCategories(hiddenStackCategories.filter((c) => c !== category));
                  else setHiddenStackCategories([...hiddenStackCategories, category]);
                }}
                onToggleCollapse={() => {
                  const nextCollapsed = collapsedCategories.has(category)
                    ? categoryLayout.collapsed.filter((item) => item !== category)
                    : [...categoryLayout.collapsed, category];
                  setSectionLayout('stack.categories', {
                    ...categoryLayout,
                    collapsed: nextCollapsed,
                  });
                }}
                onDragStart={(id) => setDraggingCategory(id)}
                onDragOver={() => {}}
                onDrop={(targetId) => {
                  if (!draggingCategory || draggingCategory === targetId) return;
                  const from = orderedCategories.indexOf(draggingCategory);
                  const to = orderedCategories.indexOf(targetId);
                  if (from < 0 || to < 0) return;
                  const nextOrder = reorder(orderedCategories, from, to);
                  setStackCategoryOrder(nextOrder);
                  setSectionLayout('stack.categories', {
                    ...categoryLayout,
                    order: nextOrder,
                  });
                }}
              >
                <div className="p-2.5 flex flex-wrap gap-1.5">
                  {pageTechs.filter((t) => t.category === category).map((tech, idx) => (
                    <TechItem
                      key={`${tech.name}-${idx}`}
                      techName={tech.name}
                      version={tech.version}
                      category={tech.category}
                      confidence={tech.confidence}
                      evidence={tech.evidence}
                      evidenceTypes={tech.evidenceTypes}
                    />
                  ))}
                </div>
              </AccordionSection>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl p-3" style={{ background: 'var(--kk-bg-surface)', border: '1px solid var(--kk-border)' }}>
          <div className="text-[9px] uppercase font-bold tracking-widest mb-3" style={{ color: 'var(--kk-text-muted)' }}>
            Technology cloud (confidence + frequency)
          </div>
          <div className="flex flex-wrap gap-2">
            {pageTechs.map((tech, index) => {
              const weight = computeTechWeight(tech);
              const size = Math.min(28, Math.max(11, Math.round(weight / 7)));
              return (
                <TechCloudItem key={`${tech.name}-${index}`} tech={tech} size={size} />
              );
            })}
          </div>
        </div>
      )}

      <div className="pt-2" style={{ borderTop: '1px solid var(--kk-border)' }}>
        <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3 px-1" style={{ color: 'var(--kk-text-muted)' }}>
          Core Web Vitals
        </h3>
        <VitalsGrid pageVitals={pageVitals} />
      </div>
    </div>
  );
}
