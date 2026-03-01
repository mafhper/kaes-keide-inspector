import { ChevronIcon, EyeIcon, EyeOffIcon, GripIcon, IconWrap } from './icons';

interface AccordionSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  collapsed: boolean;
  hidden: boolean;
  draggable?: boolean;
  onToggleCollapse: () => void;
  onToggleHidden: () => void;
  onDragStart?: (id: string) => void;
  onDragOver?: (id: string) => void;
  onDrop?: (id: string) => void;
  children: React.ReactNode;
}

export function AccordionSection({
  id,
  title,
  icon,
  collapsed,
  hidden,
  draggable = true,
  onToggleCollapse,
  onToggleHidden,
  onDragStart,
  onDragOver,
  onDrop,
  children,
}: AccordionSectionProps) {
  return (
    <div
      className={`rounded-xl overflow-hidden transition-opacity ${hidden ? 'opacity-55' : 'opacity-100'}`}
      style={{ background: 'var(--kk-bg-surface)', border: '1px solid var(--kk-border)' }}
      draggable={draggable}
      onDragStart={() => onDragStart?.(id)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.(id);
      }}
      onDrop={() => onDrop?.(id)}
    >
      <div className="px-3 py-2.5 flex items-center gap-2" style={{ background: 'var(--kk-bg-raised)', borderBottom: collapsed ? 'none' : '1px solid var(--kk-border-subtle)' }}>
        <button className="cursor-grab active:cursor-grabbing p-1 rounded" style={{ color: 'var(--kk-text-muted)' }} title="Drag to reorder">
          <GripIcon />
        </button>

        <IconWrap>{icon}</IconWrap>
        <button onClick={onToggleCollapse} className="flex-1 flex items-center justify-between text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--kk-text-muted)' }}>
          <span>{title}</span>
          <ChevronIcon open={!collapsed} />
        </button>

        <button onClick={onToggleHidden} className="p-1 rounded hover:text-violet-500" style={{ color: 'var(--kk-text-muted)' }} title={hidden ? 'Show section' : 'Hide section'}>
          {hidden ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>

      {!collapsed && !hidden && children}
    </div>
  );
}
