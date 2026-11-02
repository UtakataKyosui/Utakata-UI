import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Accordion,
  type AccordionHeaderProps,
} from '../components/Accordion.js';
import { accordionQualityRules } from '../metadata/components/Accordion.js';
import { accordionChecks } from './quality/Accordion.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Type fixtures checked by pnpm typecheck without rendering invalid JSX.
const validLevel: AccordionHeaderProps = { level: 2 };
// @ts-expect-error Heading levels are limited to 2-6.
const pageTitleLevel: AccordionHeaderProps = { level: 1 };
void [validLevel, pageTitleLevel];

describe('Accordion', () => {
  it('forwards className and refs, and renders the chosen heading level', () => {
    const root = createRef<HTMLDivElement>();
    const item = createRef<HTMLDivElement>();
    const header = createRef<HTMLHeadingElement>();
    const trigger = createRef<HTMLButtonElement>();
    const panel = createRef<HTMLDivElement>();
    render(
      <Accordion.Root ref={root} className="r" defaultValue={['a']}>
        <Accordion.Item ref={item} className="i" value="a">
          <Accordion.Header ref={header} className="h" level={2}>
            <Accordion.Trigger ref={trigger} className="t">
              Shipping
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel ref={panel} className="p">
            Body
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );
    expect(root.current).toHaveClass('ui-accordion', 'r');
    expect(item.current).toHaveClass('ui-accordion__item', 'i');
    expect(header.current?.tagName).toBe('H2');
    expect(header.current).toHaveClass('ui-accordion__header', 'h');
    expect(screen.getByRole('heading', { level: 2, name: 'Shipping' })).toBe(
      header.current,
    );
    expect(trigger.current).toHaveClass('ui-accordion__trigger', 't');
    expect(panel.current).toHaveClass('ui-accordion__panel', 'p');
    expect(panel.current).toBe(
      screen.getByRole('region', { name: 'Shipping' }),
    );
  });

  it('notifies value changes with arrays', () => {
    const onValueChange = vi.fn();
    render(
      <Accordion.Root onValueChange={onValueChange}>
        <Accordion.Item value="a">
          <Accordion.Header>
            <Accordion.Trigger>Shipping</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Body</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Shipping' }));
    expect(onValueChange.mock.calls[0]?.[0]).toEqual(['a']);
  });

  it('passes the automated quality rules', async () => {
    const report = await expectAutomatedQuality(
      accordionQualityRules,
      accordionChecks,
    );
    expect(report.complete).toBe(false);
  });

  it('warns in development for unnamed triggers only', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const view = render(
      <Accordion.Root>
        <Accordion.Item value="a">
          <Accordion.Header>
            <Accordion.Trigger>Shipping</Accordion.Trigger>
          </Accordion.Header>
        </Accordion.Item>
      </Accordion.Root>,
    );
    await settle();
    expect(warn).not.toHaveBeenCalled();
    view.rerender(
      <Accordion.Root>
        <Accordion.Item value="a">
          <Accordion.Header>
            <Accordion.Trigger>
              <span aria-hidden="true">▾</span>
            </Accordion.Trigger>
          </Accordion.Header>
        </Accordion.Item>
      </Accordion.Root>,
    );
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] Accordion.Trigger: No accessible name source',
        ),
      ),
    );
  });
});
