import { cleanup, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  Breadcrumb,
  type BreadcrumbLinkProps,
  type BreadcrumbPageProps,
} from '../components/Breadcrumb.js';
import { breadcrumbQualityRules } from '../metadata/components/Breadcrumb.js';
import { breadcrumbChecks } from './quality/Breadcrumb.checks.js';
import { expectAutomatedQuality } from './quality-helpers.js';

// Checked by pnpm typecheck.
const hrefLink: BreadcrumbLinkProps = { href: '/' };
const routerLink: BreadcrumbLinkProps = { render: <a href="/docs">Docs</a> };
// @ts-expect-error A breadcrumb link needs href or a render element.
const noDestination: BreadcrumbLinkProps = { children: 'Home' };
// @ts-expect-error The current page always uses aria-current="page".
const wrongCurrent: BreadcrumbPageProps = { 'aria-current': 'step' };
const currentProps = { 'aria-current': 'step' as const };
// @ts-expect-error Spreads cannot change the current-page marker.
const spreadCurrent = <Breadcrumb.Page {...currentProps} />;
const visibleProps = { 'aria-hidden': false as const, role: 'presentation' };
// @ts-expect-error Spreads cannot expose decorative separators.
const spreadSeparator = <Breadcrumb.Separator {...visibleProps} />;
void [
  hrefLink,
  routerLink,
  noDestination,
  wrongCurrent,
  spreadCurrent,
  spreadSeparator,
];

afterEach(cleanup);

describe('Breadcrumb', () => {
  it('forwards refs and classNames and allows a custom label', () => {
    const nav = createRef<HTMLElement>();
    const link = createRef<HTMLAnchorElement>();
    const page = createRef<HTMLSpanElement>();
    render(
      <Breadcrumb.Root ref={nav} aria-label="Docs path" className="custom">
        <Breadcrumb.List className="list">
          <Breadcrumb.Item className="item">
            <Breadcrumb.Link ref={link} href="/" className="link">
              Home
            </Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator className="sep" />
          <Breadcrumb.Item>
            <Breadcrumb.Page ref={page} className="page">
              Guide
            </Breadcrumb.Page>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>,
    );
    expect(screen.getByRole('navigation', { name: 'Docs path' })).toBe(
      nav.current,
    );
    expect(nav.current).toHaveClass('ui-breadcrumb', 'custom');
    expect(screen.getByRole('list')).toHaveClass('ui-breadcrumb__list', 'list');
    expect(link.current).toHaveClass('ui-breadcrumb__link', 'link');
    expect(link.current).toHaveAttribute('href', '/');
    expect(page.current).toHaveClass('ui-breadcrumb__page', 'page');
    expect(document.querySelector('.ui-breadcrumb__separator')).toHaveClass(
      'sep',
    );
  });

  it('uses aria-labelledby instead of the default label', () => {
    render(
      <>
        <h2 id="trail">Location</h2>
        <Breadcrumb.Root aria-labelledby="trail" />
      </>,
    );
    const nav = screen.getByRole('navigation', { name: 'Location' });
    expect(nav).not.toHaveAttribute('aria-label');
  });

  it('composes router links through render', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Breadcrumb.Link
        ref={ref}
        className="extra"
        render={<a href="/docs" data-router="" />}
      >
        Docs
      </Breadcrumb.Link>,
    );
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).toBe(ref.current);
    expect(link).toHaveAttribute('href', '/docs');
    expect(link).toHaveAttribute('data-router');
    expect(link).toHaveClass('ui-breadcrumb__link', 'extra');
  });

  it('passes all automated quality rules', async () => {
    const report = await expectAutomatedQuality(
      breadcrumbQualityRules,
      breadcrumbChecks,
    );
    expect(report.complete).toBe(false);
  });
});
