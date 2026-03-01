import { hexToHsl, hexToRgb, isTransparent } from '../../utils/color';
import { CopyIcon } from './icons';

export function PropGrid({ children }: { children: React.ReactNode }) {
  return <div className="p-3 grid grid-cols-2 gap-y-2.5 gap-x-4">{children}</div>;
}

function withRem(val: string) {
  if (!val || typeof val !== 'string') return val;
  return val.replace(/(-?\d+(?:\.\d+)?)\s*px/g, (_match, p1) => {
    const px = parseFloat(p1);
    if (px === 0) return '0px';
    const rem = +(px / 16).toFixed(3);
    return `${px}px (${rem}rem)`;
  });
}

export function PropRow({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  const displayValue = withRem(value);

  return (
    <div className="flex flex-col">
      <span className="text-[9px] font-medium uppercase tracking-wide" style={{ color: 'var(--kk-text-muted)' }}>{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium truncate" style={{ color: 'var(--kk-text-primary)' }} title={displayValue}>{displayValue}</span>
        {onCopy && (
          <button onClick={onCopy} className="hover:text-violet-500 transition-colors flex-shrink-0" style={{ color: 'var(--kk-text-muted)' }}>
            <CopyIcon />
          </button>
        )}
      </div>
    </div>
  );
}

export function ColorValueRow({
  label,
  color,
  hex,
  format,
  onToggleFormat,
  onCopy,
}: {
  label: string;
  color: string;
  hex: string;
  format: 'hex' | 'rgb' | 'hsl';
  onToggleFormat: () => void;
  onCopy: () => void;
}) {
  const displayColor = format === 'rgb' ? hexToRgb(hex) : format === 'hsl' ? hexToHsl(hex) : hex;

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 shadow-sm" style={{ border: '1px solid var(--kk-border)' }}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZTBlMGUwIiAvPgo8cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZTBlMGUwIiAvPgo8L3N2Zz4=')]" />
        <div className="absolute inset-0" style={{ backgroundColor: isTransparent(color) ? 'transparent' : color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-medium uppercase cursor-pointer hover:text-violet-500 inline-block transition-colors" style={{ color: 'var(--kk-text-muted)' }} onClick={onToggleFormat}>
          {label} · {format.toUpperCase()}
        </div>
        <div className="text-xs font-mono truncate" style={{ color: 'var(--kk-text-secondary)' }}>
          {isTransparent(color) ? 'transparent' : displayColor}
        </div>
      </div>
      {!isTransparent(color) && (
        <button onClick={onCopy} className="hover:text-violet-500 transition-colors p-1" style={{ color: 'var(--kk-text-muted)' }}>
          <CopyIcon />
        </button>
      )}
    </div>
  );
}
