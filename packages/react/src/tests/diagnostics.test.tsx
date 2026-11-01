import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { createRef, StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button, type ButtonProps } from '../components/Button.js';
import { Dialog } from '../components/Dialog.js';
import { Field } from '../components/Field.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

// These fixtures are checked by pnpm typecheck, without rendering invalid JSX.
const namedIcon: ButtonProps = { iconOnly: true, 'aria-label': 'Save' };
const referencedIcon: ButtonProps = {
  iconOnly: true,
  'aria-labelledby': 'save',
};
// @ts-expect-error Icon-only buttons require an explicit name source.
const unnamedIcon: ButtonProps = { iconOnly: true };
void [namedIcon, referencedIcon, unnamedIcon];

describe('development accessibility diagnostics', () => {
  it('warns for missing names on each public control without crashing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <>
        <Button />
        <Field.Root>
          <Field.Control />
        </Field.Root>
        <Dialog.Root defaultOpen>
          <Dialog.Portal>
            <Dialog.Popup />
          </Dialog.Portal>
        </Dialog.Root>
      </>,
    );
    await waitFor(() => {
      for (const name of ['Button', 'Field.Control', 'Dialog.Popup'])
        expect(warn).toHaveBeenCalledWith(
          expect.stringContaining(
            `[Utakata-UI a11y] ${name}: No accessible name source`,
          ),
        );
    });
  });

  it('accepts visible labels, explicit names, external references and portalled titles', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const ref = createRef<HTMLElement>();
    render(
      <StrictMode>
        <Button ref={ref}>Save</Button>
        <Button iconOnly aria-label="Close">
          <span aria-hidden="true">×</span>
        </Button>
        <Button iconOnly aria-labelledby="external">
          <span aria-hidden="true">+</span>
        </Button>
        <span id="external">Add</span>
        <Field.Root>
          <Field.Label>Email</Field.Label>
          <Field.Control />
        </Field.Root>
        <Dialog.Root defaultOpen>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Title>Settings</Dialog.Title>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </StrictMode>,
    );
    await settle();
    expect(warn).not.toHaveBeenCalled();
    expect(ref.current).toBe(screen.getByText('Save'));
    expect(document.querySelector('[aria-label="Close"]')).not.toHaveAttribute(
      'iconOnly',
    );
  });

  it('detects empty names and ignores decorative children', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Button iconOnly aria-label="   ">
        <span aria-hidden="true">Save</span>
      </Button>,
    );
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('No accessible name source'),
      ),
    );
  });

  it('detects dangling references and rechecks independently updated external labels', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const view = render(
      <>
        <Button aria-labelledby="external" aria-describedby="missing" />
        <span id="external">Save</span>
      </>,
    );
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'aria-describedby must reference existing elements',
        ),
      ),
    );
    view.rerender(
      <>
        <Button aria-labelledby="external" />
        <span id="external">Save</span>
      </>,
    );
    await settle();
    warn.mockClear();
    act(() => {
      screen.getByText('Save').textContent = '';
    });
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('No accessible name source'),
      ),
    );
    await settle();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('cleans up refs and pending diagnostics on unmount', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const release = vi.fn();
    const ref = vi.fn(() => release);
    const view = render(<Button ref={ref} />);
    view.unmount();
    await settle();
    expect(warn).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('does not observe or warn in production and is safe to render on the server', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const observe = vi.spyOn(MutationObserver.prototype, 'observe');
    expect(renderToString(<Button>Save</Button>)).toContain('Save');
    render(<Button />);
    await settle();
    expect(warn).not.toHaveBeenCalled();
    expect(observe).not.toHaveBeenCalled();
  });
});
