import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AccordionSection } from '../AccordionSection';

describe('AccordionSection', () => {
  it('toggles collapse and hidden state', () => {
    const onToggleCollapse = vi.fn();
    const onToggleHidden = vi.fn();

    render(
      <AccordionSection
        id="sec-1"
        title="Example"
        icon={<span>i</span>}
        collapsed={false}
        hidden={false}
        onToggleCollapse={onToggleCollapse}
        onToggleHidden={onToggleHidden}
      >
        <div>content</div>
      </AccordionSection>,
    );

    expect(screen.getByText('content')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Example'));
    expect(onToggleCollapse).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle('Hide section'));
    expect(onToggleHidden).toHaveBeenCalled();
  });
});
