import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Toggle, type ToggleProps } from '../components/Toggle.js';
import {
  toggleManifest,
  toggleQualityRules,
} from '../metadata/components/Toggle.js';
import { toggleChecks } from './quality/Toggle.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Type fixtures checked by pnpm typecheck without rendering invalid JSX.
const namedIcon: ToggleProps = { iconOnly: true, 'aria-label': 'Bold' };
const referencedIcon: ToggleProps = {
  iconOnly: true,
  'aria-labelledby': 'bold-label',
};
// @ts-expect-error Icon-only toggles require an explicit name source.
const unnamedIcon: ToggleProps = { iconOnly: true };
// @ts-expect-error Variants are limited to the manifest.
const unsupportedVariant: ToggleProps = { variant: 'solid' };
// @ts-expect-error Sizes are limited to the manifest.
const unsupportedSize: ToggleProps = { size: 'xl' };
void [
  namedIcon,
  referencedIcon,
  unnamedIcon,
  unsupportedVariant,
  unsupportedSize,
];

function Controlled() {
  const [pressed, setPressed] = useState(true);
  return (
    <>
      <Toggle pressed={pressed} onPressedChange={setPressed}>
        Bold
      </Toggle>
      <output>{pressed ? 'on' : 'off'}</output>
    </>
  );
}

describe('Toggle', () => {
  it('applies defaults, className and ref', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Toggle ref={ref} className="custom">
        Bold
      </Toggle>,
    );
    const toggle = screen.getByRole('button', { name: 'Bold' });
    expect(toggle).toHaveClass(
      'ui-toggle',
      'ui-toggle--ghost',
      'ui-toggle--md',
      'custom',
    );
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).not.toHaveAttribute('iconOnly');
    expect(ref.current).toBe(toggle);
    expect(toggleManifest.props.variant.default).toBe('ghost');
    expect(toggleManifest.props.size.default).toBe('md');
  });

  it('supports controlled and defaultPressed state', () => {
    render(
      <>
        <Controlled />
        <Toggle defaultPressed variant="outline" size="lg">
          Italic
        </Toggle>
      </>,
    );
    const bold = screen.getByRole('button', { name: 'Bold' });
    expect(bold).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(bold);
    expect(bold).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('off')).toBeInTheDocument();
    const italic = screen.getByRole('button', { name: 'Italic' });
    expect(italic).toHaveAttribute('aria-pressed', 'true');
    expect(italic).toHaveClass('ui-toggle--outline', 'ui-toggle--lg');
  });

  it('ignores clicks while controlled state is not updated', () => {
    const onPressedChange = vi.fn();
    render(
      <Toggle pressed={false} onPressedChange={onPressedChange}>
        Bold
      </Toggle>,
    );
    const toggle = screen.getByRole('button', { name: 'Bold' });
    fireEvent.click(toggle);
    expect(onPressedChange).toHaveBeenCalledTimes(1);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('passes the automated quality rules', async () => {
    const report = await expectAutomatedQuality(
      toggleQualityRules,
      toggleChecks,
    );
    expect(report.complete).toBe(false);
  });

  it('warns in development for unnamed toggles only', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const view = render(
      <>
        <Toggle>Bold</Toggle>
        <Toggle iconOnly aria-label="Italic">
          <span aria-hidden="true">I</span>
        </Toggle>
      </>,
    );
    await settle();
    expect(warn).not.toHaveBeenCalled();
    view.rerender(
      <Toggle>
        <span aria-hidden="true">B</span>
      </Toggle>,
    );
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] Toggle: No accessible name source',
        ),
      ),
    );
  });
});
