import { fireEvent, render, screen } from '@testing-library/react';
import { expect } from 'vitest';
import { Pagination } from '../../components/Pagination.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

function ResultsPagination({ onClick }: { onClick?: () => void }) {
  return (
    <Pagination.Root aria-label="Search result pages">
      <Pagination.List>
        <Pagination.Item>
          <Pagination.Previous disabled onClick={onClick}>
            Previous
          </Pagination.Previous>
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Link href="?page=1" active>
            1
          </Pagination.Link>
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Link href="?page=2">2</Pagination.Link>
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Ellipsis label="More pages" />
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Link href="?page=9">9</Pagination.Link>
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Next href="?page=2">Next</Pagination.Next>
        </Pagination.Item>
      </Pagination.List>
    </Pagination.Root>
  );
}

export const paginationChecks: Record<string, QualityCheck> = {
  'pagination.structure': async () => {
    const { container } = render(<ResultsPagination />);
    const nav = screen.getByRole('navigation', {
      name: 'Search result pages',
    });
    expect(nav.querySelector(':scope > ul > li')).not.toBeNull();
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(screen.getByRole('link', { name: '1' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute(
      'href',
      '?page=2',
    );
    expect(screen.getByRole('link', { name: '2' })).not.toHaveAttribute(
      'aria-current',
    );
    expect((await audit(container)).violations).toEqual([]);
  },
  'pagination.disabled-direction': async () => {
    let clicks = 0;
    const { container } = render(
      <ResultsPagination onClick={() => clicks++} />,
    );
    const previous = screen.getByRole('link', { name: 'Previous' });
    expect(previous).toHaveAttribute('aria-disabled', 'true');
    expect(previous).not.toHaveAttribute('href');
    // Without href and tabindex an anchor is not focusable; jsdom reports
    // tabIndex 0 here, so real Tab order is checked in the browser suite.
    expect(previous).not.toHaveAttribute('tabindex');
    previous.focus();
    expect(previous).not.toHaveFocus();
    fireEvent.click(previous);
    fireEvent.keyDown(previous, { key: 'Enter' });
    expect(clicks).toBe(0);
    const next = screen.getByRole('link', { name: 'Next' });
    expect(next).toHaveAttribute('href', '?page=2');
    expect(next).not.toHaveAttribute('aria-disabled');
    expect(next.tabIndex).toBe(0);
    expect((await audit(container)).violations).toEqual([]);
  },
  'pagination.ellipsis': async () => {
    const { container } = render(<ResultsPagination />);
    const ellipsis = screen.getByText('More pages').parentElement;
    expect(ellipsis).toHaveClass('ui-pagination__ellipsis');
    expect(ellipsis).not.toHaveAttribute('tabindex');
    expect(ellipsis?.querySelector('[aria-hidden="true"]')).toHaveTextContent(
      '…',
    );
    expect(ellipsis?.closest('a, button')).toBeNull();
    expect((await audit(container)).violations).toEqual([]);
  },
};
