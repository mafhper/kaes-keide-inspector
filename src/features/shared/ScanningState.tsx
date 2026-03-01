export function ScanningState({ label }: { label: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16">
      <div className="w-9 h-9 rounded-full animate-spin mb-3" style={{ border: '2px solid var(--kk-border)', borderTopColor: 'var(--kk-accent)' }} />
      <span className="text-xs" style={{ color: 'var(--kk-text-muted)' }}>{label}</span>
    </div>
  );
}
