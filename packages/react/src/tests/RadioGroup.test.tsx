import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Field } from '../components/Field.js';
import {
  RadioGroup,
  type RadioGroupRootProps,
} from '../components/RadioGroup.js';
import {
  radioGroupManifest,
  radioGroupQualityRules,
} from '../metadata/components/RadioGroup.js';
import { radioGroupChecks } from './quality/RadioGroup.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Checked by pnpm typecheck without rendering invalid JSX.
const horizontal: RadioGroupRootProps = { orientation: 'horizontal' };
// @ts-expect-error Orientation is limited to the manifest values.
const diagonal: RadioGroupRootProps = { orientation: 'diagonal' };
// @ts-expect-error className must be a string, not a Base UI state callback.
const callbackClass: RadioGroupRootProps = { className: () => 'x' };
void [horizontal, diagonal, callbackClass];

describe('RadioGroup', () => {
  it('renders a vertical group by default and forwards className and refs', () => {
    const rootRef = createRef<HTMLDivElement>();
    const itemRef = createRef<HTMLElement>();
    render(
      <RadioGroup.Root ref={rootRef} className="custom" aria-label="Plan">
        <RadioGroup.Item ref={itemRef} value="free" className="item">
          Free
        </RadioGroup.Item>
      </RadioGroup.Root>,
    );
    const group = screen.getByRole('radiogroup', { name: 'Plan' });
    expect(group).toHaveClass(
      'ui-radio-group',
      'ui-radio-group--vertical',
      'custom',
    );
    expect(group).toHaveAttribute('data-orientation', 'vertical');
    expect(rootRef.current).toBe(group);
    expect(itemRef.current).toBe(screen.getByRole('radio', { name: 'Free' }));
    expect(itemRef.current).toHaveClass('ui-radio-group__item', 'item');
    expect(radioGroupManifest.props.orientation.default).toBe('vertical');
  });

  it('supports horizontal layout, an unselected state and the indicator', async () => {
    render(
      <RadioGroup.Root orientation="horizontal" aria-label="Size">
        <RadioGroup.Item value="s" aria-label="Small">
          <RadioGroup.Indicator className="dot" />
        </RadioGroup.Item>
      </RadioGroup.Root>,
    );
    expect(screen.getByRole('radiogroup')).toHaveClass(
      'ui-radio-group--horizontal',
    );
    const radio = screen.getByRole('radio', { name: 'Small' });
    expect(radio).toHaveAttribute('aria-checked', 'false');
    const dot = document.querySelector('.dot');
    expect(dot).toHaveClass('ui-radio-group__indicator');
    expect(dot).toHaveAttribute('data-unchecked');
    radio.click();
    await waitFor(() => expect(radio).toHaveAttribute('aria-checked', 'true'));
    expect(dot).toHaveAttribute('data-checked');
  });

  it('documents that Field.Label overrides item names (unsupported composition)', () => {
    render(
      <Field.Root name="plan">
        <Field.Label>Plan</Field.Label>
        <RadioGroup.Root defaultValue="free">
          <RadioGroup.Item value="free">
            <RadioGroup.Indicator />
            Free
          </RadioGroup.Item>
        </RadioGroup.Root>
      </Field.Root>,
    );
    // Base UI labels each radio with the field label; the manifest forbids this.
    expect(screen.getByRole('radio', { name: 'Plan' })).toBeInTheDocument();
    expect(
      screen.queryByRole('radio', { name: 'Free' }),
    ).not.toBeInTheDocument();
    expect(radioGroupManifest.avoid.join(' ')).toContain('Field.Label');
  });

  it('disables the whole group', () => {
    const onValueChange = vi.fn();
    render(
      <RadioGroup.Root disabled aria-label="Plan" onValueChange={onValueChange}>
        <RadioGroup.Item value="free">Free</RadioGroup.Item>
      </RadioGroup.Root>,
    );
    screen.getByRole('radio', { name: 'Free' }).click();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole('radiogroup')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('passes all automated quality rules without diagnostics', async () => {
    await expectAutomatedQuality(radioGroupQualityRules, radioGroupChecks);
  });

  it('warns when the group or an item has no name and accepts labelled usage', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const view = render(
      <RadioGroup.Root>
        <RadioGroup.Item value="a">
          <RadioGroup.Indicator />
        </RadioGroup.Item>
      </RadioGroup.Root>,
    );
    await waitFor(() => {
      for (const name of ['RadioGroup.Root', 'RadioGroup.Item'])
        expect(warn).toHaveBeenCalledWith(
          expect.stringContaining(
            `[Utakata-UI a11y] ${name}: No accessible name source`,
          ),
        );
    });
    view.unmount();
    warn.mockClear();
    render(
      <>
        <span id="plan-label">Plan</span>
        <RadioGroup.Root aria-labelledby="plan-label">
          <RadioGroup.Item value="a">
            <RadioGroup.Indicator />
            Free
          </RadioGroup.Item>
          <RadioGroup.Item value="b">Pro</RadioGroup.Item>
        </RadioGroup.Root>
      </>,
    );
    await settle();
    expect(warn).not.toHaveBeenCalled();
  });
});
