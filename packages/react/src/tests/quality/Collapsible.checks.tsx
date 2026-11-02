import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { expect } from 'vitest';
import { Collapsible } from '../../components/Collapsible.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

function Details({ keepMounted = false }: { keepMounted?: boolean }) {
  return (
    <Collapsible.Root>
      <Collapsible.Trigger>Advanced settings</Collapsible.Trigger>
      <Collapsible.Panel keepMounted={keepMounted}>
        <a href="#options">Options</a>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

function Controlled() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Collapsible.Root open={open} onOpenChange={setOpen}>
        <Collapsible.Trigger>Controlled</Collapsible.Trigger>
        <Collapsible.Panel>Controlled content</Collapsible.Panel>
      </Collapsible.Root>
      <output>{open ? 'open' : 'closed'}</output>
    </>
  );
}

export const collapsibleChecks: Record<string, QualityCheck> = {
  'collapsible.trigger-state': async () => {
    const { container } = render(<Details />);
    const trigger = screen.getByRole('button', { name: 'Advanced settings' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect((await audit(container)).violations).toEqual([]);
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const panel = screen.getByRole('link', { name: 'Options' }).parentElement;
    expect(trigger).toHaveAttribute('aria-controls', panel?.id);
    expect((await audit(container)).violations).toEqual([]);
  },
  'collapsible.closed-content': async () => {
    const { container } = render(
      <>
        <Details />
        <Details keepMounted />
      </>,
    );
    expect(screen.queryByRole('link', { name: 'Options' })).toBeNull();
    const hidden = container.querySelector('a');
    expect(hidden?.closest('[hidden]')).not.toBeNull();
    const first = screen.getAllByRole('button', {
      name: 'Advanced settings',
    })[0] as HTMLElement;
    fireEvent.click(first);
    fireEvent.click(first);
    expect(screen.queryByRole('link', { name: 'Options' })).toBeNull();
    expect((await audit(container)).violations).toEqual([]);
  },
  'collapsible.controlled-disabled': () => {
    render(
      <>
        <Controlled />
        <Collapsible.Root defaultOpen disabled>
          <Collapsible.Trigger>Locked</Collapsible.Trigger>
          <Collapsible.Panel>Locked content</Collapsible.Panel>
        </Collapsible.Root>
      </>,
    );
    const controlled = screen.getByRole('button', { name: 'Controlled' });
    expect(controlled).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Controlled content')).toBeVisible();
    fireEvent.click(controlled);
    expect(controlled).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('closed')).toBeInTheDocument();
    const locked = screen.getByRole('button', { name: 'Locked' });
    fireEvent.click(locked);
    expect(locked).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Locked content')).toBeVisible();
  },
};
