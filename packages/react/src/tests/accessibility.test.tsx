import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import axe from 'axe-core';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type MockInstance,
  vi,
} from 'vitest';
import { Button } from '../components/Button.js';
import { Dialog } from '../components/Dialog.js';
import { Field } from '../components/Field.js';
import { componentManifest } from '../metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
  type QualityCheck,
  type QualityRule,
} from '../metadata/quality.js';

async function audit(element: HTMLElement) {
  // jsdom has no layout engine; verify contrast in a real browser manually.
  return axe.run(element, {
    rules: { 'color-contrast': { enabled: false } },
  });
}

describe('accessibility regression checks', () => {
  let warnings: MockInstance<typeof console.warn>;
  beforeEach(() => {
    warnings = vi.spyOn(console, 'warn');
  });
  afterEach(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    const diagnostics = warnings.mock.calls.filter(([message]) =>
      String(message).startsWith('[Utakata-UI a11y]'),
    );
    warnings.mockRestore();
    expect(
      diagnostics,
      'Valid accessibility fixtures must not emit development diagnostics',
    ).toEqual([]);
  });

  it('audits explicitly named icon-only buttons', async () => {
    const { container } = render(
      <Button iconOnly aria-label="Close">
        <span aria-hidden="true">×</span>
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Close' })).toBeVisible();
    expect((await audit(container)).violations).toEqual([]);
  });
  it('enforces all registered automatic quality rules and reports pending reviews', async () => {
    const checks: Record<string, QualityCheck> = {
      'button.accessible-name': async () => {
        for (const variant of componentManifest.components.Button.variants) {
          const { container, unmount } = render(
            <Button variant={variant}>Save</Button>,
          );
          expect(screen.getByRole('button', { name: 'Save' })).toBeVisible();
          expect((await audit(container)).violations).toEqual([]);
          unmount();
        }
      },
      'button.disabled': () => {
        let activations = 0;
        render(
          <Button disabled onClick={() => activations++}>
            Save
          </Button>,
        );
        const button = screen.getByRole('button', { name: 'Save' });
        expect(button).toBeDisabled();
        fireEvent.click(button);
        expect(activations).toBe(0);
      },
      'field.label-description': async () => {
        const { container } = render(
          <Field.Root>
            <Field.Label>Email</Field.Label>
            <Field.Control type="email" />
            <Field.Description>Contact email.</Field.Description>
          </Field.Root>,
        );
        expect(
          screen.getByRole('textbox', { name: 'Email' }),
        ).toHaveAccessibleDescription('Contact email.');
        expect((await audit(container)).violations).toEqual([]);
      },
      'dialog.accessible-name': async () => {
        await openQualityDialog();
        expect(
          screen.getByRole('dialog', { name: 'Settings' }),
        ).toHaveAccessibleDescription('Update preferences.');
        expect((await audit(document.body)).violations).toEqual([]);
      },
      'dialog.escape-focus-return': async () => {
        const trigger = await openQualityDialog();
        await waitFor(() =>
          expect(screen.getByRole('dialog')).toContainElement(
            document.activeElement as HTMLElement,
          ),
        );
        fireEvent.keyDown(document.activeElement ?? document.body, {
          key: 'Escape',
        });
        await waitFor(() =>
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
        await waitFor(() => expect(trigger).toHaveFocus());
      },
    };
    const isolatedChecks = Object.fromEntries(
      Object.entries(checks).map(([id, check]) => [
        id,
        async () => {
          try {
            await check();
          } finally {
            cleanup();
          }
        },
      ]),
    );
    const rules = [
      ...Object.values(componentManifest.components).flatMap<QualityRule>(
        (component) => component.qualityRules,
      ),
      ...componentManifest.sharedQualityRules,
    ];
    const report = await evaluateQuality(rules, isolatedChecks);
    const output = formatQualityReport(report.results);
    console.info(output);
    expect(report.automatedPassed, output).toBe(true);
    expect(report.complete).toBe(false);
  });

  it('detects an unnamed button (audit harness control)', async () => {
    const { container } = render(<button type="button" />);
    const result = await audit(container);
    expect(result.violations.map(({ id }) => id)).toContain('button-name');
  });

  it.each(['solid', 'outline', 'ghost'] as const)(
    'audits the %s button',
    async (variant) => {
      const { container } = render(<Button variant={variant}>Save</Button>);
      expect((await audit(container)).violations).toEqual([]);
    },
  );

  it('preserves field naming and instructions', async () => {
    const { container } = render(
      <Field.Root>
        <Field.Label>Email</Field.Label>
        <Field.Control type="email" required />
        <Field.Description>Enter your contact email.</Field.Description>
      </Field.Root>,
    );
    expect(
      screen.getByRole('textbox', { name: 'Email' }),
    ).toHaveAccessibleDescription('Enter your contact email.');
    expect((await audit(container)).violations).toEqual([]);
  });

  it('audits an open dialog including its portal', async () => {
    render(
      <Dialog.Root>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup>
            <Dialog.Title>Settings</Dialog.Title>
            <Dialog.Description>Update preferences.</Dialog.Description>
            <Dialog.Close>Close</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = await screen.findByRole('dialog', { name: 'Settings' });
    expect(dialog).toHaveAccessibleDescription('Update preferences.');
    expect((await audit(document.body)).violations).toEqual([]);
  });
});

async function openQualityDialog() {
  render(
    <Dialog.Root>
      <Dialog.Trigger>Open settings</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup>
          <Dialog.Title>Settings</Dialog.Title>
          <Dialog.Description>Update preferences.</Dialog.Description>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>,
  );
  const trigger = screen.getByRole('button', { name: 'Open settings' });
  trigger.focus();
  fireEvent.click(trigger);
  await screen.findByRole('dialog', { name: 'Settings' });
  return trigger;
}
