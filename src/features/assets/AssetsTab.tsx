import { useMemo, useState } from 'react';
import type { AssetBackgroundMode } from '../../types/preferences';
import type { PageAsset } from '../../types/ui';
import { ensureFileExtension, fileNameFromUrl, inferImageExtension, isSafeDownloadUrl } from '../../utils/download';
import { useSectionLayout } from '../../hooks/useSectionLayout';
import { AccordionSection } from '../shared/AccordionSection';
import { ScanningState } from '../shared/ScanningState';
import { ImageIcon } from '../shared/icons';

interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[];
  asset?: PageAsset;
}

interface AssetsTabProps {
  pageAssets: PageAsset[];
  isScanning: boolean;
  actionBar: React.ReactNode;
  backgroundMode: AssetBackgroundMode;
  setBackgroundMode: (mode: AssetBackgroundMode) => void;
  assetViewMode: 'gallery' | 'tree';
  setAssetViewMode: (mode: 'gallery' | 'tree') => void;
  getSectionLayout: (key: string) => { order: string[]; hidden: string[]; collapsed: string[] };
  setSectionLayout: (key: string, layout: { order: string[]; hidden: string[]; collapsed: string[] }) => void;
}

const PREVIEW_BG_STYLE: Record<AssetBackgroundMode, string> = {
  checker: "bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+CjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNlNWU3ZWIiIC8+CjxyZWN0IHg9IjgiIHk9IjgiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNlNWU3ZWIiIC8+Cjwvc3ZnPg==')]",
  light: 'bg-slate-100',
  dark: 'bg-slate-800',
  grid: "bg-[radial-gradient(circle,rgba(148,163,184,0.28)_1px,transparent_1px)] [background-size:8px_8px]",
};

function assetPath(asset: PageAsset): string {
  if (asset.filePath) return asset.filePath;
  if (asset.src.startsWith('data:')) return `inline/${asset.tagName.toLowerCase()}-${asset.type}.${asset.type}`;

  try {
    const url = new URL(asset.src, window.location.href);
    return `${url.host}${url.pathname}`;
  } catch {
    return asset.src;
  }
}

function buildTree(assets: PageAsset[]): TreeNode[] {
  const roots: TreeNode[] = [];

  const upsert = (parts: string[], asset?: PageAsset) => {
    let current = roots;
    let pathAcc = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i] || 'unknown';
      pathAcc = pathAcc ? `${pathAcc}/${part}` : part;

      let node = current.find((item) => item.name === part);
      if (!node) {
        node = { name: part, path: pathAcc, children: [] };
        current.push(node);
      }

      if (i === parts.length - 1 && asset) {
        node.asset = asset;
      }

      current = node.children;
    }
  };

  assets.forEach((asset) => {
    const parts = assetPath(asset).split('/').filter(Boolean);
    upsert(parts, asset);
  });

  return roots;
}

function downloadAsset(asset: PageAsset) {
  if (!isSafeDownloadUrl(asset.src)) return;

  const fallbackType = asset.type && asset.type !== 'unknown' ? asset.type : 'png';
  const extension = inferImageExtension(asset.src, fallbackType);
  const fallbackName = `${asset.tagName.toLowerCase()}-asset.${extension}`;

  const a = document.createElement('a');
  a.href = asset.src;
  a.download = ensureFileExtension(fileNameFromUrl(asset.src, fallbackName), extension);
  a.rel = 'noreferrer';
  a.target = '_blank';
  a.click();
}

function TreeNodeView({ node }: { node: TreeNode }) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div className="ml-3">
      <div className="flex items-center gap-1.5 py-1">
        {hasChildren ? (
          <button onClick={() => setOpen((v) => !v)} className="text-[10px]" style={{ color: 'var(--kk-text-muted)' }}>
            {open ? '▾' : '▸'}
          </button>
        ) : (
          <span className="text-[10px]" style={{ color: 'var(--kk-text-muted)' }}>•</span>
        )}

        <span className="text-[11px]" style={{ color: node.asset ? 'var(--kk-text-secondary)' : 'var(--kk-text-muted)' }}>{node.name}</span>
        {node.asset && isSafeDownloadUrl(node.asset.src) && (
          <button
            onClick={() => downloadAsset(node.asset!)}
            className="text-[10px] px-2 py-0.5 rounded border"
            style={{ color: 'var(--kk-accent)', borderColor: 'var(--kk-accent-glow)' }}
          >
            download
          </button>
        )}
      </div>

      {hasChildren && open && (
        <div>
          {node.children.map((child) => (
            <TreeNodeView key={child.path} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AssetsTab({
  pageAssets,
  isScanning,
  actionBar,
  backgroundMode,
  setBackgroundMode,
  assetViewMode,
  setAssetViewMode,
  getSectionLayout,
  setSectionLayout,
}: AssetsTabProps) {
  const imageAssets = useMemo(
    () => pageAssets.filter((a) => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'ico'].includes(a.type) || a.tagName === 'SVG'),
    [pageAssets],
  );

  const tree = useMemo(() => buildTree(imageAssets), [imageAssets]);

  const sectionLayout = useSectionLayout({
    scopeKey: 'assets.sections',
    sections: [
      { id: 'controls', title: 'Controls' },
      { id: 'content', title: 'Assets' },
    ],
    getSectionLayout,
    setSectionLayout,
  });

  if (isScanning) {
    return (
      <div className="p-3 flex flex-col gap-3">
        {actionBar}
        <ScanningState label="Scanning assets..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      {actionBar}

      {sectionLayout.orderedSections.map((section) => {
        if (section.id === 'controls') {
          return (
            <AccordionSection
              key={section.id}
              id={section.id}
              title="Preview controls"
              icon={<ImageIcon />}
              hidden={sectionLayout.hidden.has(section.id)}
              collapsed={sectionLayout.collapsed.has(section.id)}
              onToggleHidden={() => sectionLayout.toggleHidden(section.id)}
              onToggleCollapse={() => sectionLayout.toggleCollapsed(section.id)}
              onDragStart={sectionLayout.onDragStart}
              onDragOver={sectionLayout.onDragOver}
              onDrop={sectionLayout.onDrop}
            >
              <div className="p-3 flex flex-wrap items-center gap-2">
                <label className="text-[10px] uppercase font-semibold" style={{ color: 'var(--kk-text-muted)' }}>Background</label>
                {(['checker', 'light', 'dark', 'grid'] as AssetBackgroundMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setBackgroundMode(mode)}
                    className="text-[10px] px-2 py-1 rounded-lg border"
                    style={{
                      color: backgroundMode === mode ? 'var(--kk-accent)' : 'var(--kk-text-secondary)',
                      borderColor: backgroundMode === mode ? 'var(--kk-accent-glow)' : 'var(--kk-border)',
                      background: backgroundMode === mode ? 'var(--kk-accent-glow)' : 'transparent',
                    }}
                  >
                    {mode}
                  </button>
                ))}

                <div className="ml-auto flex items-center gap-2">
                  <label className="text-[10px] uppercase font-semibold" style={{ color: 'var(--kk-text-muted)' }}>View</label>
                  <button
                    onClick={() => setAssetViewMode('gallery')}
                    className="text-[10px] px-2 py-1 rounded-lg border"
                    style={{ color: assetViewMode === 'gallery' ? 'var(--kk-accent)' : 'var(--kk-text-secondary)', borderColor: assetViewMode === 'gallery' ? 'var(--kk-accent-glow)' : 'var(--kk-border)' }}
                  >
                    Gallery
                  </button>
                  <button
                    onClick={() => setAssetViewMode('tree')}
                    className="text-[10px] px-2 py-1 rounded-lg border"
                    style={{ color: assetViewMode === 'tree' ? 'var(--kk-accent)' : 'var(--kk-text-secondary)', borderColor: assetViewMode === 'tree' ? 'var(--kk-accent-glow)' : 'var(--kk-border)' }}
                  >
                    Tree
                  </button>
                </div>
              </div>
            </AccordionSection>
          );
        }

        return (
          <AccordionSection
            key={section.id}
            id={section.id}
            title="Assets"
            icon={<ImageIcon />}
            hidden={sectionLayout.hidden.has(section.id)}
            collapsed={sectionLayout.collapsed.has(section.id)}
            onToggleHidden={() => sectionLayout.toggleHidden(section.id)}
            onToggleCollapse={() => sectionLayout.toggleCollapsed(section.id)}
            onDragStart={sectionLayout.onDragStart}
            onDragOver={sectionLayout.onDragOver}
            onDrop={sectionLayout.onDrop}
          >
            {assetViewMode === 'gallery' ? (
              <div className="grid grid-cols-2 gap-2 p-3">
                {imageAssets.map((asset, i) => (
                  <div key={`${asset.src}-${i}`} className="group relative rounded-xl overflow-hidden transition-all hover:shadow-lg" style={{ background: 'var(--kk-bg-surface)', border: '1px solid var(--kk-border)' }}>
                    <div className={`aspect-square ${PREVIEW_BG_STYLE[backgroundMode]} flex items-center justify-center p-2`}>
                      {asset.sourceType !== 'svg-inline' ? (
                        <img src={asset.src} alt={asset.alt} className="max-w-full max-h-full object-contain" loading="lazy" />
                      ) : (
                        <img src={asset.src} alt={asset.alt} className="max-w-full max-h-full object-contain" loading="lazy" />
                      )}
                    </div>

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-xl">
                      {isSafeDownloadUrl(asset.src) && (
                        <button
                          onClick={() => downloadAsset(asset)}
                          className="text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:opacity-90"
                          style={{ background: 'var(--kk-accent)' }}
                        >
                          Download
                        </button>
                      )}
                      <span className="text-white/70 text-[10px] mt-1.5">.{asset.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3">
                {tree.map((node) => (
                  <TreeNodeView key={node.path} node={node} />
                ))}
              </div>
            )}
          </AccordionSection>
        );
      })}
    </div>
  );
}
