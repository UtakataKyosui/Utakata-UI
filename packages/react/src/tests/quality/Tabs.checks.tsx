import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { expect } from 'vitest';
import { Tabs } from '../../components/Tabs.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

const tabs = ['Profile', 'Security', 'Billing', 'Team'];

function Settings({
  orientation,
  keepMounted = false,
}: {
  orientation?: 'horizontal' | 'vertical';
  keepMounted?: boolean;
}) {
  return (
    <Tabs.Root defaultValue="Profile" orientation={orientation}>
      <Tabs.List aria-label="Settings">
        {tabs.map((tab) => (
          <Tabs.Tab key={tab} value={tab} disabled={tab === 'Billing'}>
            {tab}
          </Tabs.Tab>
        ))}
        <Tabs.Indicator />
      </Tabs.List>
      {tabs.map((tab) => (
        <Tabs.Panel key={tab} value={tab} keepMounted={keepMounted}>
          <a href={`#${tab}`}>{tab} help</a>
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  );
}

const tab = (name: string) => screen.getByRole('tab', { name });

function Controlled() {
  const [value, setValue] = useState('Security');
  return (
    <>
      <Settings />
      <Tabs.Root value={value} onValueChange={setValue}>
        <Tabs.List aria-label="Controlled">
          <Tabs.Tab value="Profile">Controlled profile</Tabs.Tab>
          <Tabs.Tab value="Security">Controlled security</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="Profile">Profile panel</Tabs.Panel>
        <Tabs.Panel value="Security">Security panel</Tabs.Panel>
      </Tabs.Root>
      <output>{value}</output>
    </>
  );
}

export const tabsChecks: Record<string, QualityCheck> = {
  'tabs.roles-relationships': async () => {
    const { container } = render(<Settings />);
    expect(screen.getByRole('tablist', { name: 'Settings' })).toBeVisible();
    expect(tab('Profile')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Security')).toHaveAttribute('aria-selected', 'false');
    const panel = screen.getByRole('tabpanel', { name: 'Profile' });
    expect(tab('Profile')).toHaveAttribute('aria-controls', panel.id);
    expect((await audit(container)).violations).toEqual([]);
  },
  'tabs.keyboard-navigation': async () => {
    const horizontal = render(<Settings />);
    tab('Profile').focus();
    fireEvent.keyDown(tab('Profile'), { key: 'ArrowRight' });
    await waitFor(() => expect(tab('Security')).toHaveFocus());
    expect(tab('Profile')).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(tab('Security'), { key: 'ArrowRight' });
    await waitFor(() => expect(tab('Billing')).toHaveFocus());
    expect(tab('Billing')).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(tab('Billing'));
    expect(tab('Billing')).toHaveAttribute('aria-selected', 'false');
    fireEvent.keyDown(tab('Billing'), { key: 'ArrowRight' });
    await waitFor(() => expect(tab('Team')).toHaveFocus());
    fireEvent.keyDown(tab('Team'), { key: 'Home' });
    await waitFor(() => expect(tab('Profile')).toHaveFocus());
    fireEvent.keyDown(tab('Profile'), { key: 'End' });
    await waitFor(() => expect(tab('Team')).toHaveFocus());
    expect(tab('Profile')).toHaveAttribute('aria-selected', 'true');
    horizontal.unmount();
    render(<Settings orientation="vertical" />);
    expect(screen.getByRole('tablist')).toHaveAttribute(
      'aria-orientation',
      'vertical',
    );
    tab('Profile').focus();
    fireEvent.keyDown(tab('Profile'), { key: 'ArrowDown' });
    await waitFor(() => expect(tab('Security')).toHaveFocus());
  },
  'tabs.selection-hidden-panels': async () => {
    const { container } = render(<Controlled />);
    expect(tab('Controlled security')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Security panel')).toBeVisible();
    expect(screen.queryByText('Profile panel')).toBeNull();
    fireEvent.click(tab('Controlled profile'));
    expect(screen.getByText('Profile', { selector: 'output' })).toBeVisible();
    expect(screen.getByText('Profile panel')).toBeVisible();
    expect(screen.getAllByRole('link')).toHaveLength(1);
    container.remove();
    const mounted = render(<Settings keepMounted />);
    expect(screen.getAllByRole('link')).toHaveLength(1);
    const hidden = mounted.container.querySelectorAll('a');
    expect(hidden).toHaveLength(4);
    for (const link of Array.from(hidden).slice(1))
      expect(link.closest('[hidden]')).not.toBeNull();
    expect((await audit(mounted.container)).violations).toEqual([]);
  },
};
