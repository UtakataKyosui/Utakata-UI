import { Pagination as UtakataPagination } from '@utakata-ui/react';

interface PageLink {
  route: string;
  label: string;
}

export interface PaginationProps {
  prev: PageLink | null;
  next: PageLink | null;
  strings?: { previous?: string; next?: string; pagination?: string };
}

function PagerLink({
  direction,
  page,
  label,
}: {
  direction: 'previous' | 'next';
  page: PageLink;
  label: string;
}) {
  const Link =
    direction === 'next' ? UtakataPagination.Next : UtakataPagination.Previous;
  return (
    <UtakataPagination.Item className={`utakata-docs-pager-${direction}`}>
      <Link href={page.route}>
        <span className="utakata-docs-pager-label">{label}</span>
        <span className="utakata-docs-pager-title">{page.label}</span>
      </Link>
    </UtakataPagination.Item>
  );
}

/** Blume's prev/next layout slot, rendered with Utakata Pagination. */
export default function Pagination({ prev, next, strings }: PaginationProps) {
  if (!(prev || next)) return null;
  const t = {
    pagination: 'Pagination',
    previous: 'Previous',
    next: 'Next',
    ...strings,
  };
  return (
    <UtakataPagination.Root
      aria-label={t.pagination}
      className="utakata-docs-pager mx-auto mt-12 max-w-content"
    >
      <UtakataPagination.List>
        {prev && (
          <PagerLink direction="previous" page={prev} label={t.previous} />
        )}
        {next && <PagerLink direction="next" page={next} label={t.next} />}
      </UtakataPagination.List>
    </UtakataPagination.Root>
  );
}
