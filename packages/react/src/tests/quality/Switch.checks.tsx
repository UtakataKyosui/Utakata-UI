import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { expect } from 'vitest';
import { Field } from '../../components/Field.js';
import { Switch } from '../../components/Switch.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';
import { pressSpace } from '../quality-helpers.js';

function ControlledSwitch() {
  const [checked, setChecked] = useState(false);
  return (
    <>
      <label>
        <Switch.Root checked={checked} onCheckedChange={setChecked}>
          <Switch.Thumb />
        </Switch.Root>
        Dark mode
      </label>
      <button type="button" onClick={() => setChecked(true)}>
        Turn on from outside
      </button>
    </>
  );
}

export const switchChecks: Record<string, QualityCheck> = {
  'switch.name-state': async () => {
    const { container } = render(
      <Field.Root name="notifications">
        <Switch.Root>
          <Switch.Thumb />
        </Switch.Root>
        <Field.Label>Enable notifications</Field.Label>
      </Field.Root>,
    );
    const control = screen.getByRole('switch', {
      name: 'Enable notifications',
    });
    const thumb = control.querySelector('.ui-switch__thumb');
    expect(control).toHaveAttribute('aria-checked', 'false');
    expect(thumb).toHaveAttribute('data-unchecked');
    fireEvent.click(control);
    expect(control).toHaveAttribute('aria-checked', 'true');
    expect(thumb).toHaveAttribute('data-checked');
    expect(screen.getByRole('switch', { name: 'Enable notifications' })).toBe(
      control,
    );
    expect((await audit(container)).violations).toEqual([]);
  },
  'switch.keyboard-pointer': () => {
    const changes: boolean[] = [];
    render(
      <>
        <Field.Root>
          <Switch.Root onCheckedChange={(checked) => changes.push(checked)}>
            <Switch.Thumb />
          </Switch.Root>
          <Field.Label>Wi-Fi</Field.Label>
        </Field.Root>
        <label>
          <Switch.Root disabled onCheckedChange={() => changes.push(false)} />
          Disabled
        </label>
        <label>
          <Switch.Root readOnly onCheckedChange={() => changes.push(false)} />
          Read only
        </label>
      </>,
    );
    const control = screen.getByRole('switch', { name: 'Wi-Fi' });
    pressSpace(control);
    expect(control).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(control);
    expect(control).toHaveAttribute('aria-checked', 'false');
    expect(changes).toEqual([true, false]);
    for (const name of ['Disabled', 'Read only']) {
      const locked = screen.getByRole('switch', { name });
      pressSpace(locked);
      fireEvent.click(locked);
      expect(locked).toHaveAttribute('aria-checked', 'false');
    }
    expect(changes).toEqual([true, false]);
  },
  'switch.form': async () => {
    const { container } = render(
      <form>
        <label>
          <Switch.Root name="alerts" value="enabled" defaultChecked>
            <Switch.Thumb />
          </Switch.Root>
          Alerts
        </label>
        <ControlledSwitch />
      </form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;
    expect(new FormData(form).get('alerts')).toBe('enabled');
    const alerts = screen.getByRole('switch', { name: 'Alerts' });
    fireEvent.click(alerts);
    expect(new FormData(form).has('alerts')).toBe(false);
    form.reset();
    expect(new FormData(form).get('alerts')).toBe('enabled');
    await waitFor(() =>
      // Reset remounts the control, so query the new element.
      expect(screen.getByRole('switch', { name: 'Alerts' })).toHaveAttribute(
        'aria-checked',
        'true',
      ),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Turn on from outside' }),
    );
    expect(screen.getByRole('switch', { name: 'Dark mode' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  },
};
