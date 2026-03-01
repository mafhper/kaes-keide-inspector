import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InspectionActionBar } from '../InspectionActionBar';

describe('InspectionActionBar', () => {
  it('emits changes and export action', () => {
    const onToggleInspection = vi.fn();
    const onReportScopeChange = vi.fn();
    const onReportFormatChange = vi.fn();
    const onExportReport = vi.fn();

    render(
      <InspectionActionBar
        isInspecting={true}
        showInspectionToggle={true}
        onToggleInspection={onToggleInspection}
        reportScope="element"
        reportFormat="json"
        onReportScopeChange={onReportScopeChange}
        onReportFormatChange={onReportFormatChange}
        onExportReport={onExportReport}
      />,
    );

    fireEvent.click(screen.getByText('Stop inspection'));
    expect(onToggleInspection).toHaveBeenCalled();

    fireEvent.change(screen.getByDisplayValue('Element'), { target: { value: 'site' } });
    expect(onReportScopeChange).toHaveBeenCalledWith('site');

    fireEvent.change(screen.getByDisplayValue('JSON'), { target: { value: 'markdown' } });
    expect(onReportFormatChange).toHaveBeenCalledWith('markdown');

    fireEvent.click(screen.getByText('Download report'));
    expect(onExportReport).toHaveBeenCalled();
  });
});
