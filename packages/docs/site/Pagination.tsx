import { Pagination as UtakataPagination } from '@utakata-ui/react';
import { mountBase } from './base-path.js';

interface PageLink {
  route: string;
  label: string;
}

export interface PaginationProps {
  prev: PageLink | null;
  next: PageLink | null;
  strings?: { previous?: string; next?: string; pagination?: string };
  /** Deployment base (`import.meta.env.BASE_URL`), passed by the Astro wrapper. */
  base?: string;
}

function PagerLink({
  direction,
  page,
  label,
  base,
}: {
  direction: 'previous' | 'next';
  page: PageLink;
  label: string;
  base: string | undefined;
}) {
  const Link =
    direction === 'next' ? UtakataPagination.Next : UtakataPagination.Previous;
  return (
    <UtakataPagination.Item className={`utakata-docs-pager-${direction}`}>
      <Link href={mountBase(base, page.route)}>
        <span className="utakata-docs-pager-label">{label}</span>
        <span className="utakata-docs-pager-title">{page.label}</span>
      </Link>
    </UtakataPagination.Item>
  );
}

/** Blume's prev/next layout slot, rendered with Utakata Pagination. */
export default function Pagination({
  prev,
  next,
  strings,
  base,
}: PaginationProps) {
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
          <PagerLink
            direction="previous"
            page={prev}
            label={t.previous}
            base={base}
          />
        )}
        {next && (
          <PagerLink direction="next" page={next} label={t.next} base={base} />
        )}
      </UtakataPagination.List>
    </UtakataPagination.Root>
  );
}
