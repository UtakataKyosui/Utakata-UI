import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Kbd, KbdGroup } from '../components/Kbd.js';
import { componentManifest } from '../metadata/manifest.js';

describe('Kbd', () => {
  it('renders a kbd element with the default size, className and ref', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Kbd ref={ref} className="custom">
        K
      </Kbd>,
    );
    const key = screen.getByText('K');
    expect(key.tagName).toBe('KBD');
    expect(key).toHaveClass('ui-kbd', 'ui-kbd--md', 'custom');
    expect(ref.current).toBe(key);
    expect(componentManifest.components.Kbd.props.size.default).toBe('md');
  });

  it('groups combinations and forwards group props', () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <KbdGroup ref={ref} className="combo" aria-label="Command and K">
        <Kbd size="sm">⌘</Kbd>
        <Kbd size="sm">K</Kbd>
      </KbdGroup>,
    );
    const group = screen.getByRole('group', { name: 'Command and K' });
    expect(group).toHaveClass('ui-kbd-group', 'combo');
    expect(ref.current).toBe(group);
    expect(screen.getByText('⌘')).toHaveClass('ui-kbd--sm');
  });
});
