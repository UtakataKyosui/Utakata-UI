import { DirectionProvider } from '@base-ui/react/direction-provider';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Accordion,
  Card,
  Checkbox,
  Field,
  Heading,
  Input,
  RadioGroup,
  Tabs,
  Text,
} from '../index.js';
import { audit } from './audit.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function Outline({ children }: { children?: ReactNode }) {
  return (
    <main>
      <Heading level="1">Account settings</Heading>
      <Text>Choose levels from the outline.</Text>
      <section aria-labelledby="profile-heading">
        <Heading level="2" id="profile-heading">
          Profile
        </Heading>
        <Card.Root>
          <Card.Title level="3">Display name</Card.Title>
        </Card.Root>
        {children}
      </section>
    </main>
  );
}

function Tabset({ rtl, provider }: { rtl: boolean; provider: boolean }) {
  const tabs = (
    <Tabs.Root defaultValue="a">
      <Tabs.List aria-label="Sections" activateOnFocus>
        <Tabs.Tab value="a">A</Tabs.Tab>
        <Tabs.Tab value="b">B</Tabs.Tab>
        <Tabs.Tab value="c">C</Tabs.Tab>
      </Tabs.List>
    </Tabs.Root>
  );
  return (
    <div dir={rtl ? 'rtl' : 'ltr'} lang={rtl ? 'ar' : 'en'}>
      {provider ? (
        <DirectionProvider direction={rtl ? 'rtl' : 'ltr'}>
          {tabs}
        </DirectionProvider>
      ) : (
        tabs
      )}
    </div>
  );
}

async function selectedAfter(
  props: { rtl: boolean; provider: boolean },
  key: 'ArrowLeft' | 'ArrowRight',
) {
  render(<Tabset {...props} />);
  const first = screen.getByRole('tab', { name: 'A' });
  first.focus();
  fireEvent.keyDown(first, { key });
  let selected = '';
  await waitFor(() => {
    selected =
      screen
        .getAllByRole('tab')
        .find((tab) => tab.getAttribute('aria-selected') === 'true')
        ?.textContent ?? '';
    expect(selected).not.toBe('A');
  });
  cleanup();
  return selected;
}

// Decision record for #121: Label, Typography and Direction are compositions
// of existing parts and web standards, not separate components.
describe('Label responsibility (Field.Label)', () => {
  it('names an input from its visible label', async () => {
    const { container } = render(
      <Field.Root name="name">
        <Field.Label>Full name</Field.Label>
        <Input autoComplete="name" />
        <Field.Description>As shown on your ID.</Field.Description>
      </Field.Root>,
    );
    const input = screen.getByRole('textbox', { name: 'Full name' });
    expect(input).toHaveAccessibleDescription('As shown on your ID.');
    // jsdom does not move focus on label activation; assert the native
    // label-for association that browsers use to do so.
    expect(screen.getByLabelText('Full name')).toBe(input);
    expect(screen.getByText('Full name')).toHaveAttribute('for', input.id);
    expect((await audit(container)).violations).toEqual([]);
  });

  it('does not accept a placeholder as the name', () => {
    render(
      <Field.Root name="q">
        <Input placeholder="Search" />
      </Field.Root>,
    );
    expect(screen.getByRole('textbox')).toHaveAccessibleName('');
  });

  it('names a checkbox with Field.Label and a radio group by reference', async () => {
    const { container } = render(
      <div>
        <Field.Root name="terms">
          <Checkbox.Root value="accepted">
            <Checkbox.Indicator />
          </Checkbox.Root>
          <Field.Label>I agree</Field.Label>
        </Field.Root>
        <Text id="plan-label">Plan</Text>
        <RadioGroup.Root aria-labelledby="plan-label" defaultValue="free">
          <RadioGroup.Item value="free">
            <RadioGroup.Indicator />
            Free
          </RadioGroup.Item>
        </RadioGroup.Root>
      </div>,
    );
    expect(screen.getByRole('checkbox', { name: 'I agree' })).toBeVisible();
    expect(screen.getByRole('radiogroup', { name: 'Plan' })).toBeVisible();
    expect(screen.getByRole('radio', { name: 'Free' })).toBeVisible();
    expect((await audit(container)).violations).toEqual([]);
  });

  it('warns in development when a field control has no name source', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Input />);
    await waitFor(() => expect(warn).toHaveBeenCalled());
  });
});

describe('Typography responsibility (Heading, Text, level props)', () => {
  it('keeps a contiguous heading outline across Heading and part levels', async () => {
    const { container } = render(
      <Outline>
        <Accordion.Root>
          <Accordion.Item value="a">
            <Accordion.Header level={3}>Advanced</Accordion.Header>
          </Accordion.Item>
        </Accordion.Root>
      </Outline>,
    );
    const levels = screen
      .getAllByRole('heading')
      .map((heading) => Number(heading.tagName.slice(1)));
    expect(levels).toEqual([1, 2, 3, 3]);
    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i] as number).toBeLessThanOrEqual(
        (levels[i - 1] as number) + 1,
      );
    }
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('region', { name: 'Profile' })).toBeVisible();
    expect((await audit(container)).violations).toEqual([]);
  });

  it('chooses the semantic element from level, not from style Props', () => {
    render(
      <Heading level="2" fz="4xl">
        Large but second level
      </Heading>,
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Large but second level' }),
    ).toBeVisible();
  });
});

describe('Direction responsibility (dir, logical CSS, DirectionProvider)', () => {
  it('moves with ArrowRight to the next tab in left-to-right', async () => {
    expect(
      await selectedAfter({ rtl: false, provider: true }, 'ArrowRight'),
    ).toBe('B');
  });

  it('mirrors arrow keys in right-to-left when DirectionProvider is used', async () => {
    expect(
      await selectedAfter({ rtl: true, provider: true }, 'ArrowLeft'),
    ).toBe('B');
    expect(
      await selectedAfter({ rtl: true, provider: true }, 'ArrowRight'),
    ).toBe('C');
  });

  it('does not mirror arrow keys from the dir attribute alone', async () => {
    // Documents the consumer responsibility: dir without DirectionProvider.
    expect(
      await selectedAfter({ rtl: true, provider: false }, 'ArrowRight'),
    ).toBe('B');
  });

  it('keeps a right-to-left form named and free of axe violations', async () => {
    const { container } = render(
      <div dir="rtl" lang="ar">
        <Field.Root name="email">
          <Field.Label>البريد الإلكتروني</Field.Label>
          <Input type="email" autoComplete="email" />
        </Field.Root>
      </div>,
    );
    expect(
      screen.getByRole('textbox', { name: 'البريد الإلكتروني' }),
    ).toBeVisible();
    expect((await audit(container)).violations).toEqual([]);
  });
});
