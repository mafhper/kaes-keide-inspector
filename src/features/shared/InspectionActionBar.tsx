import type { ReportFormat, ReportScope } from '../../types/reports';

interface InspectionActionBarProps {
  isInspecting: boolean;
  showInspectionToggle?: boolean;
  onToggleInspection?: () => void;
  reportScope: ReportScope;
  reportFormat: ReportFormat;
  onReportScopeChange: (scope: ReportScope) => void;
  onReportFormatChange: (format: ReportFormat) => void;
  onExportReport: () => void;
}

export function InspectionActionBar({
  isInspecting,
  showInspectionToggle = true,
  onToggleInspection,
  reportScope,
  reportFormat,
  onReportScopeChange,
  onReportFormatChange,
  onExportReport,
}: InspectionActionBarProps) {
  return (
    <div className="rounded-xl p-2.5 flex flex-col gap-2" style={{ background: 'var(--kk-bg-surface)', border: '1px solid var(--kk-border)' }}>
      <div className="flex items-center gap-2">
        {showInspectionToggle && (
          <button
            onClick={onToggleInspection}
            className="text-[10px] font-medium px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
            style={{
              color: isInspecting ? '#dc2626' : 'var(--kk-accent)',
              border: `1px solid ${isInspecting ? 'rgba(220,38,38,0.25)' : 'var(--kk-accent-glow)'}`,
              background: isInspecting ? 'rgba(220,38,38,0.08)' : 'transparent',
            }}
          >
            {isInspecting ? 'Stop inspection' : 'Start inspection'}
          </button>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <label className="text-[9px] uppercase font-semibold" style={{ color: 'var(--kk-text-muted)' }}>Scope</label>
          <select
            value={reportScope}
            onChange={(e) => onReportScopeChange(e.target.value as ReportScope)}
            className="text-[10px] rounded-lg px-1.5 py-0.5 outline-none cursor-pointer"
            style={{ background: 'var(--kk-bg-raised)', border: '1px solid var(--kk-border)', color: 'var(--kk-text-secondary)' }}
          >
            <option value="element">Element</option>
            <option value="tab">Tab</option>
            <option value="site">Site</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-[9px] uppercase font-semibold" style={{ color: 'var(--kk-text-muted)' }}>Format</label>
        <select
          value={reportFormat}
          onChange={(e) => onReportFormatChange(e.target.value as ReportFormat)}
          className="text-[10px] rounded-lg px-1.5 py-0.5 outline-none cursor-pointer"
          style={{ background: 'var(--kk-bg-raised)', border: '1px solid var(--kk-border)', color: 'var(--kk-text-secondary)' }}
        >
          <option value="json">JSON</option>
          <option value="markdown">Markdown</option>
        </select>

        <button
          onClick={onExportReport}
          className="text-[10px] font-medium px-2.5 py-1 rounded-lg transition-all cursor-pointer hover:opacity-90"
          style={{ color: 'var(--kk-accent)', border: '1px solid var(--kk-accent-glow)' }}
        >
          Download report
        </button>
      </div>
    </div>
  );
}
