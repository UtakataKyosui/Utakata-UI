import { render, screen } from '@testing-library/react';
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
