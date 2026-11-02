import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Field } from '../components/Field.js';
import { Select, type SelectRootProps } from '../components/Select.js';
import { selectQualityRules } from '../metadata/components/Select.js';
import { selectChecks } from './quality/Select.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Checked by pnpm typecheck without rendering invalid JSX.
const single: SelectRootProps<string> = { defaultValue: 'system' };
// @ts-expect-error Select is single-selection only.
const multiple: SelectRootProps<string> = { multiple: true };
// @ts-expect-error A single Select does not accept an array value.
const arrayValue: SelectRootProps<string> = { value: ['a'] };
void [single, multiple, arrayValue];
// @ts-expect-error className must be a string, not a Base UI state callback.
void (<Select.Trigger className={() => 'x'} />);

describe('Select', () => {
  it('forwards className and refs to each DOM part', async () => {
    const triggerRef = createRef<HTMLButtonElement>();
    const popupRef = createRef<HTMLDivElement>();
    render(
      <Select.Root defaultOpen>
        <Select.Label className="label">Theme</Select.Label>
        <Select.Trigger ref={triggerRef} className="trigger">
          <Select.Value className="value" placeholder="Choose" />
          <Select.Icon className="icon" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className="positioner">
            <Select.Popup ref={popupRef} className="popup">
              <Select.List className="list">
                <Select.Group className="group">
                  <Select.GroupLabel className="group-label">
                    Basic
                  </Select.GroupLabel>
                  <Select.Item value="a" className="item">
                    <Select.ItemText className="item-text">A</Select.ItemText>
                  </Select.Item>
                </Select.Group>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );
    await screen.findByRole('listbox');
    const trigger = screen.getByRole('combobox', { name: 'Theme' });
    expect(triggerRef.current).toBe(trigger);
    expect(trigger).toHaveClass('ui-select__trigger', 'trigger');
    expect(popupRef.current).toHaveClass('ui-select__popup', 'popup');
    for (const [custom, base] of [
      ['label', 'ui-select__label'],
      ['value', 'ui-select__value'],
      ['icon', 'ui-select__icon'],
      ['positioner', 'ui-select__positioner'],
      ['list', 'ui-select__list'],
      ['group', 'ui-select__group'],
      ['group-label', 'ui-select__group-label'],
      ['item', 'ui-select__item'],
      ['item-text', 'ui-select__item-text'],
    ])
      expect(document.querySelector(`.${custom}`)).toHaveClass(base as string);
    expect(screen.getByRole('group', { name: 'Basic' })).toBeInTheDocument();
  });

  it('does not open when disabled', async () => {
    render(
      <Select.Root disabled>
        <Select.Trigger aria-label="Theme">
          <Select.Value placeholder="Choose" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.List>
                <Select.Item value="a">
                  <Select.ItemText>A</Select.ItemText>
                </Select.Item>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );
    const trigger = screen.getByRole('combobox', { name: 'Theme' });
    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    await settle();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('is named by Field.Label inside Field.Root without diagnostics', async () => {
    const warn = vi.spyOn(console, 'warn');
    render(
      <Field.Root>
        <Field.Label>Theme</Field.Label>
        <Select.Root defaultValue="system">
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
        </Select.Root>
      </Field.Root>,
    );
    await settle();
    expect(screen.getByRole('combobox', { name: 'Theme' })).toBeInTheDocument();
    expect(
      warn.mock.calls.filter(([message]) =>
        String(message).startsWith('[Utakata-UI a11y]'),
      ),
    ).toEqual([]);
  });

  it('passes all automated quality rules without diagnostics', async () => {
    await expectAutomatedQuality(selectQualityRules, selectChecks);
  });

  it('warns when the trigger is named only by its value and accepts a label', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const view = render(
      <Select.Root defaultValue="system">
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
      </Select.Root>,
    );
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] Select.Trigger: No accessible name source',
        ),
      ),
    );
    view.unmount();
    warn.mockClear();
    render(
      <>
        <Select.Root>
          <Select.Label>Theme</Select.Label>
          <Select.Trigger>
            <Select.Value placeholder="Choose" />
          </Select.Trigger>
        </Select.Root>
        <Select.Root>
          <Select.Trigger aria-label="Language">
            <Select.Value placeholder="Choose" />
          </Select.Trigger>
        </Select.Root>
      </>,
    );
    await settle();
    expect(warn).not.toHaveBeenCalled();
  });
});
