import { render, screen } from '@testing-library/react';
import { type CSSProperties, createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Separator } from '../components/Separator.js';

describe('Separator', () => {
  it('is decorative and horizontal by default', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Separator ref={ref} className="custom" />);
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    expect(ref.current).toHaveAttribute('aria-hidden', 'true');
    expect(ref.current).toHaveClass(
      'ui-separator',
      'ui-separator--horizontal',
      'custom',
    );
  });

  it('exposes semantics for each orientation when not decorative', () => {
    render(
      <>
        <Separator decorative={false} />
        <Separator
          decorative={false}
          orientation="vertical"
          style={{ '--ui-separator-size': '2px' } as CSSProperties}
        />
      </>,
    );
    const [horizontal, vertical] = screen.getAllByRole('separator');
    expect(horizontal).not.toHaveAttribute('aria-orientation');
    expect(horizontal).not.toHaveAttribute('aria-hidden');
    expect(vertical).toHaveAttribute('aria-orientation', 'vertical');
    expect(vertical).toHaveClass('ui-separator--vertical');
    expect(vertical?.style.getPropertyValue('--ui-separator-size')).toBe('2px');
  });
});
