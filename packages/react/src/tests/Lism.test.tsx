import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import {
  Button,
  type ButtonProps,
  Card,
  Dialog,
  Field,
  Frame,
  Input,
  Popover,
  Textarea,
} from '../index.js';
import { audit } from './audit.js';

afterEach(cleanup);

const styled: ButtonProps = {
  p: '1rem',
  w: { base: '100%', md: 'auto' },
  children: 'Save',
};
// @ts-expect-error Lism props do not relax icon-only names.
const unnamed: ButtonProps = { iconOnly: true, p: '1rem' };
// @ts-expect-error Component size retains its public enum.
const wrongSize: ButtonProps = { size: 20, p: '1rem' };
// @ts-expect-error Style props do not bypass the ref used for diagnostics.
const bypassRef: ButtonProps = { forwardedRef: createRef() };
void [styled, unnamed, wrongSize, bypassRef];

it('translates responsive Lism styling on the same Button and preserves its ref and action', () => {
  const ref = createRef<HTMLElement>();
  const onClick = vi.fn();
  const { container } = render(
    <Button
      {...styled}
      ref={ref}
      onClick={onClick}
      className="custom"
      style={{ color: 'red' }}
    />,
  );
  const button = screen.getByRole('button', { name: 'Save' });
  expect(container.children).toHaveLength(1);
  expect(button).toBe(ref.current);
  expect(button).toHaveClass('ui-button', 'custom', '-p', '-w:100%', '-w_md');
  expect(button.style.getPropertyValue('--p')).toBe('1rem');
  expect(button.style.getPropertyValue('--w_md')).toBe('auto');
  expect(button.style.color).toBe('red');
  for (const prop of ['p', 'w', 'forwardedRef'])
    expect(button).not.toHaveAttribute(prop);
  fireEvent.click(button);
  expect(onClick).toHaveBeenCalledTimes(1);
});

it('keeps native textarea dimensions when names overlap Lism grid props', () => {
  render(<Textarea aria-label="Biography" rows={6} cols={40} p="1rem" />);
  const textarea = screen.getByRole('textbox', { name: 'Biography' });
  expect(textarea).toHaveAttribute('rows', '6');
  expect(textarea).toHaveAttribute('cols', '40');
  expect(textarea.style.getPropertyValue('--rows')).toBe('');
  expect(textarea).toHaveClass('-p');
});

it('preserves Base UI state callbacks on previously unwrapped parts', () => {
  render(
    <Dialog.Root>
      <Dialog.Trigger
        p="1rem"
        className={(state) => (state.open ? 'open' : 'closed')}
        style={(state) => ({ opacity: state.open ? 0.5 : 1 })}
      >
        Details
      </Dialog.Trigger>
    </Dialog.Root>,
  );
  const trigger = screen.getByRole('button', { name: 'Details' });
  expect(trigger).toHaveClass('closed', '-p');
  expect(trigger.style.opacity).toBe('1');
  expect(trigger.style.getPropertyValue('--p')).toBe('1rem');
});

it('supports static, form and factory-produced parts without leaking styling props', () => {
  render(
    <>
      <Card.Root p="2rem">
        <Card.Title>Account</Card.Title>
        <Field.Root g={20}>
          <Field.Label>Email</Field.Label>
          <Input w="100%" />
        </Field.Root>
      </Card.Root>
      <Popover.Root>
        <Popover.Trigger p="1rem">Details</Popover.Trigger>
      </Popover.Root>
    </>,
  );
  const title = screen.getByRole('heading', { name: 'Account' });
  expect(title.closest('.ui-card')).toHaveClass('-p');
  const input = screen.getByRole('textbox', { name: 'Email' });
  expect(input).toHaveClass('-w:100%');
  expect(input).not.toHaveAttribute('w');
  const trigger = screen.getByRole('button', { name: 'Details' });
  expect(trigger).toHaveClass('-p');
  expect(trigger).not.toHaveAttribute('p');
});

it('composes aspect ratio frames from the Lism Frame without a wrapper component', async () => {
  const { container } = render(
    <figure>
      <Frame ar="16/9" w={{ base: '100%', md: '20rem' }} data-testid="frame">
        <img alt="Quarterly revenue chart" src="chart.png" />
      </Frame>
      <figcaption>Revenue</figcaption>
      <Frame ar={{ base: '1/1', md: '4/3' }} data-testid="small">
        <video title="Demo" controls>
          <track kind="captions" src="demo.vtt" srcLang="en" label="English" />
        </video>
      </Frame>
    </figure>,
  );
  const frame = screen.getByTestId('frame');
  expect(frame).toHaveClass('l--frame', '-ar:16/9', '-w:100%', '-w_md');
  expect(frame.style.getPropertyValue('--w_md')).toBe('20rem');
  expect(frame).not.toHaveAttribute('ar');
  // The image remains the direct, named child; no extra DOM is introduced.
  expect(frame.children).toHaveLength(1);
  expect(
    screen.getByRole('img', { name: 'Quarterly revenue chart' }).parentElement,
  ).toBe(frame);
  const responsive = screen.getByTestId('small');
  expect(responsive).toHaveClass('l--frame', '-ar:1/1', '-ar_md');
  expect(responsive.style.getPropertyValue('--ar_md')).toBe('4/3');
  expect((await audit(container)).violations).toEqual([]);
});

it('does not compute a ratio for invalid strings, which only CSS can reject', () => {
  render(<Frame ar="wide" data-testid="bad" />);
  // Lism's `ar` is typed as unknown: the string is forwarded to CSS as-is.
  expect(screen.getByTestId('bad').style.getPropertyValue('--ar')).toBe('wide');
});
