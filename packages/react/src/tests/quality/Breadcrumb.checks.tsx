import { render, screen } from '@testing-library/react';
import { expect } from 'vitest';
import { Breadcrumb } from '../../components/Breadcrumb.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

function SettingsBreadcrumb() {
  return (
    <Breadcrumb.Root>
      <Breadcrumb.List>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/">Home</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Separator />
        <Breadcrumb.Item>
          <Breadcrumb.Ellipsis data-testid="ellipsis" />
        </Breadcrumb.Item>
        <Breadcrumb.Separator data-testid="separator">›</Breadcrumb.Separator>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/account">Account</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Separator />
        <Breadcrumb.Item>
          <Breadcrumb.Page>Settings</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb.List>
    </Breadcrumb.Root>
  );
}

export const breadcrumbChecks: Record<string, QualityCheck> = {
  'breadcrumb.structure': async () => {
    const { container } = render(<SettingsBreadcrumb />);
    const nav = screen.getByRole('navigation', { name: 'パンくずリスト' });
    const list = nav.querySelector(':scope > ol');
    expect(list).not.toBeNull();
    for (const child of list?.children ?? []) expect(child.tagName).toBe('LI');
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(screen.getByText('Settings')).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(screen.getByRole('link', { name: 'Account' })).toHaveAttribute(
      'href',
      '/account',
    );
    expect((await audit(container)).violations).toEqual([]);
  },
  'breadcrumb.decorations-hidden': async () => {
    const { container } = render(<SettingsBreadcrumb />);
    for (const id of ['separator', 'ellipsis']) {
      const element = screen.getByTestId(id);
      expect(element).toHaveAttribute('aria-hidden', 'true');
      expect(element).not.toHaveAttribute('tabindex');
    }
    // Hidden separators are excluded from the accessible list items.
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    for (const link of screen.getAllByRole('link'))
      expect(link.tabIndex).toBe(0);
    expect((await audit(container)).violations).toEqual([]);
  },
};
