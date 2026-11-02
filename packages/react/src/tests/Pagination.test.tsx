import { cleanup, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  Pagination,
  type PaginationDirectionProps,
  type PaginationLinkProps,
} from '../components/Pagination.js';
import { paginationQualityRules } from '../metadata/components/Pagination.js';
import { paginationChecks } from './quality/Pagination.checks.js';
import { expectAutomatedQuality } from './quality-helpers.js';

// Checked by pnpm typecheck.
const page: PaginationLinkProps = { href: '?page=2', active: true };
const enabled: PaginationDirectionProps = { href: '?page=2' };
const disabled: PaginationDirectionProps = { disabled: true };
// @ts-expect-error Page links need a URL.
const pageWithoutHref: PaginationLinkProps = { children: '2' };
// @ts-expect-error An enabled Previous/Next needs a URL.
const enabledWithoutHref: PaginationDirectionProps = {};
// @ts-expect-error A disabled Previous/Next must not keep its URL.
const disabledWithHref: PaginationDirectionProps = {
  disabled: true,
  href: '?',
};
// @ts-expect-error The current page is set with active, not aria-current.
const rawCurrent: PaginationLinkProps = { href: '?', 'aria-current': 'page' };
void [page, enabled, disabled, pageWithoutHref, enabledWithoutHref];
void [disabledWithHref, rawCurrent];

afterEach(cleanup);

describe('Pagination', () => {
  it('uses default names, refs and classNames', () => {
    const nav = createRef<HTMLElement>();
    const link = createRef<HTMLAnchorElement>();
    const next = createRef<HTMLAnchorElement>();
    render(
      <Pagination.Root ref={nav} className="custom">
        <Pagination.List className="list">
          <Pagination.Item className="item">
            <Pagination.Previous href="?page=1" />
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Link ref={link} href="?page=2" className="page">
              2
            </Pagination.Link>
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Next ref={next} disabled className="next" />
          </Pagination.Item>
        </Pagination.List>
      </Pagination.Root>,
    );
    expect(screen.getByRole('navigation', { name: 'ページ送り' })).toBe(
      nav.current,
    );
    expect(nav.current).toHaveClass('ui-pagination', 'custom');
    expect(screen.getByRole('list')).toHaveClass('ui-pagination__list', 'list');
    expect(link.current).toHaveClass('ui-pagination__link', 'page');
    expect(link.current).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: '前のページ' })).toHaveAttribute(
      'href',
      '?page=1',
    );
    expect(screen.getByRole('link', { name: '次のページ' })).toBe(next.current);
    expect(next.current).toHaveClass('ui-pagination__next', 'next');
    expect(next.current).toHaveAttribute('aria-disabled', 'true');
  });

  it('uses aria-labelledby instead of the default label', () => {
    render(
      <>
        <h2 id="results">Results</h2>
        <Pagination.Root aria-labelledby="results" />
      </>,
    );
    expect(
      screen.getByRole('navigation', { name: 'Results' }),
    ).not.toHaveAttribute('aria-label');
  });

  it('removes a URL passed to a disabled direction at runtime', () => {
    const untyped = { disabled: true, href: '?page=0' } as unknown as {
      disabled: true;
    };
    render(<Pagination.Previous {...untyped} />);
    expect(screen.getByRole('link')).not.toHaveAttribute('href');
  });

  it('passes all automated quality rules', async () => {
    const report = await expectAutomatedQuality(
      paginationQualityRules,
      paginationChecks,
    );
    expect(report.complete).toBe(false);
  });
});
