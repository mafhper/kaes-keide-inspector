import { useState } from 'react';
import type { ElementData } from '../../types/ui';
import { TechIcon } from './icons';

export function TechItem({
  techName,
  version,
  category,
  confidence,
  evidence,
  evidenceTypes,
}: {
  techName: string;
  version?: string;
  category?: string;
  confidence?: number;
  evidence?: string[];
  evidenceTypes?: string[];
}) {
  const [isHovered, setIsHovered] = useState(false);
  const details = evidence?.slice(0, 6) || [];

  return (
    <div
      className="relative flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium"
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

      {isHovered && (
        <div
          className="absolute left-0 top-full mt-1.5 w-[280px] rounded-xl p-2.5 z-50 pointer-events-none"
          style={{ background: 'var(--kk-bg-surface)', border: '1px solid var(--kk-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.25)' }}
        >
          <div className="text-[11px] font-semibold mb-1" style={{ color: 'var(--kk-text-primary)' }}>{techName}</div>
          <div className="text-[10px] mb-1" style={{ color: 'var(--kk-text-secondary)' }}>
            {category || 'Other'}{typeof confidence === 'number' ? ` · conf ${confidence}%` : ''}
          </div>
          {evidenceTypes && evidenceTypes.length > 0 && (
            <div className="text-[9px] mb-1.5" style={{ color: 'var(--kk-text-muted)' }}>
              sinais: {evidenceTypes.join(', ')}
            </div>
          )}
          {details.length > 0 ? (
            <ul className="text-[10px] leading-4 list-disc pl-4 space-y-0.5" style={{ color: 'var(--kk-text-secondary)' }}>
              {details.map((item, index) => (
                <li key={`${index}-${item}`}>{item}</li>
              ))}
            </ul>
          ) : (
            <div className="text-[10px]" style={{ color: 'var(--kk-text-muted)' }}>No evidence details available.</div>
          )}
        </div>
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
