import { useState } from 'react';
import type { ElementData } from '../../types/ui';
import { TechIcon } from './icons';

export function TechItem({ techName, version }: { techName: string; version?: string }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium"
      style={{
        background: isHovered ? 'var(--kk-bg-base)' : 'var(--kk-bg-raised)',
        border: '1px solid var(--kk-border)',
        color: 'var(--kk-text-secondary)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span style={{ color: 'var(--kk-text-muted)' }}><TechIcon /></span>
      <span>{techName}</span>
      {version && (
        <span className="text-[9px] font-mono ml-0.5 px-1 rounded" style={{ color: 'var(--kk-text-muted)', background: 'var(--kk-bg-base)' }} title="Version">
          v{version}
        </span>
      )}
    </div>
  );
}

export function SelectedElementIdentity({ element }: { element: ElementData }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--kk-bg-surface)', border: '1px solid var(--kk-border)' }}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono px-2 py-0.5 rounded font-semibold" style={{ background: 'var(--kk-accent-glow)', color: 'var(--kk-accent)' }}>
          {element.tagName.toLowerCase()}
        </span>
        {element.classList && (
          <span className="text-[10px] font-mono truncate" style={{ color: 'var(--kk-text-muted)' }}>
            .{element.classList}
          </span>
        )}
      </div>
      {element.id && (
        <div className="mt-1 text-[10px] font-mono" style={{ color: 'var(--kk-text-muted)' }}>
          #{element.id}
        </div>
      )}
      {element.textContent && (
        <div className="mt-2 text-[10px]" style={{ color: 'var(--kk-text-secondary)' }}>
          {element.textContent}
        </div>
      )}
    </div>
  );
}
