export function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3.5 py-1.5 rounded-xl transition-all duration-200 ${
        active
          ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 shadow-sm'
          : 'text-[var(--kk-text-muted)] hover:text-[var(--kk-text-secondary)] hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
      }`}
    >
      {icon}
      <span className="text-[9px] font-semibold tracking-wide">{label}</span>
    </button>
  );
}
