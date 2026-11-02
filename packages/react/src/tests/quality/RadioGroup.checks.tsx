import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useState } from 'react';
import { expect } from 'vitest';
import { RadioGroup } from '../../components/RadioGroup.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

function PlanGroup(props: {
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <RadioGroup.Root
      name="plan"
      defaultValue={props.value === undefined ? 'free' : undefined}
      value={props.value}
      onValueChange={(value) => props.onValueChange?.(value as string)}
      aria-label="Plan"
    >
      {['free', 'team', 'pro'].map((value) => (
        <RadioGroup.Item key={value} value={value} disabled={value === 'team'}>
          <RadioGroup.Indicator />
          {value}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}

function ControlledPlan() {
  const [value, setValue] = useState('pro');
  return (
    <form onReset={() => setValue('pro')}>
      <PlanGroup value={value} onValueChange={setValue} />
      <button type="reset">Reset</button>
    </form>
  );
}

const checked = () =>
  screen
    .getAllByRole('radio')
    .filter((radio) => radio.getAttribute('aria-checked') === 'true')
    .map((radio) => radio.textContent);

export const radioGroupChecks: Record<string, QualityCheck> = {
  'radio-group.names': async () => {
    const { container } = render(
      <main>
        <PlanGroup />
      </main>,
    );
    expect(screen.getByRole('radiogroup', { name: 'Plan' })).toBeVisible();
    for (const name of ['free', 'team', 'pro'])
      expect(screen.getByRole('radio', { name })).toBeInTheDocument();
    expect((await audit(container)).violations).toEqual([]);
  },
  'radio-group.single-selection': async () => {
    const changes: string[] = [];
    render(<PlanGroup value="free" onValueChange={(v) => changes.push(v)} />);
    expect(checked()).toEqual(['free']);
    fireEvent.click(screen.getByRole('radio', { name: 'pro' }));
    expect(changes).toEqual(['pro']);
    // Controlled: the selection follows the value prop, not the click.
    expect(checked()).toEqual(['free']);
  },
  'radio-group.form': async () => {
    render(<ControlledPlan />);
    const form = document.querySelector('form') as HTMLFormElement;
    expect([...new FormData(form).entries()]).toEqual([['plan', 'pro']]);
    fireEvent.click(screen.getByRole('radio', { name: 'team' }));
    expect([...new FormData(form).entries()]).toEqual([['plan', 'pro']]);
    fireEvent.click(screen.getByRole('radio', { name: 'free' }));
    await waitFor(() => expect(checked()).toEqual(['free']));
    expect([...new FormData(form).entries()]).toEqual([['plan', 'free']]);
    act(() => form.reset());
    await waitFor(() => expect(checked()).toEqual(['pro']));
    expect([...new FormData(form).entries()]).toEqual([['plan', 'pro']]);
    cleanup();

    // Uncontrolled groups return to defaultValue on form reset.
    render(
      <form>
        <PlanGroup />
      </form>,
    );
    const uncontrolled = document.querySelector('form') as HTMLFormElement;
    fireEvent.click(screen.getByRole('radio', { name: 'pro' }));
    await waitFor(() => expect(checked()).toEqual(['pro']));
    act(() => uncontrolled.reset());
    // Reset remounts the group, so checked() re-queries the new elements.
    await waitFor(() => expect(checked()).toEqual(['free']));
    expect([...new FormData(uncontrolled).entries()]).toEqual([
      ['plan', 'free'],
    ]);
  },
};
