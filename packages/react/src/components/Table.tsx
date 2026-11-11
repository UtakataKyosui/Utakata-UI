import { type ComponentPropsWithoutRef, forwardRef, type JSX } from 'react';
import { withClassName } from './classNames.js';
import { type WithLismProps, withLism } from './lism.js';

type TablePartProps<Tag extends keyof JSX.IntrinsicElements> = WithLismProps<
  Omit<ComponentPropsWithoutRef<Tag>, 'className'> & {
    className?: string;
  }
>;

export type TableContainerProps = WithLismProps<
  Omit<
    TablePartProps<'section'>,
    'role' | 'tabIndex' | 'aria-label' | 'aria-labelledby'
  > & {
    // Optional `never` members also reject these names when props arrive through a spread.
    role?: never;
    tabIndex?: never;
  } & (
      | { 'aria-label': string; 'aria-labelledby'?: never }
      | { 'aria-label'?: never; 'aria-labelledby': string }
    )
>;

/**
 * The only horizontal scroller. Any table can overflow at narrow widths or
 * high zoom, so the region is always named and focusable for keyboard
 * scrolling (Safari does not focus scroll containers by default).
 */
const Container = withLism(
  forwardRef<HTMLElement, TableContainerProps>(function TableContainer(
    { className, ...props },
    ref,
  ) {
    return (
      <section
        {...props}
        ref={ref}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be keyboard focusable to scroll it.
        tabIndex={0}
        className={withClassName('ui-table-container', className)}
      />
    );
  }),
);

const Root = withLism(
  forwardRef<HTMLTableElement, TablePartProps<'table'>>(function TableRoot(
    { className, children, ...props },
    ref,
  ) {
    return (
      <table
        {...props}
        ref={ref}
        className={withClassName('ui-table', className)}
      >
        {children}
      </table>
    );
  }),
);

const Caption = withLism(
  forwardRef<HTMLTableCaptionElement, TablePartProps<'caption'>>(
    function TableCaption({ className, ...props }, ref) {
      return (
        <caption
          {...props}
          ref={ref}
          className={withClassName('ui-table__caption', className)}
        />
      );
    },
  ),
);

const Header = withLism(
  forwardRef<HTMLTableSectionElement, TablePartProps<'thead'>>(
    function TableHeader({ className, children, ...props }, ref) {
      return (
        <thead
          {...props}
          ref={ref}
          className={withClassName('ui-table__header', className)}
        >
          {children}
        </thead>
      );
    },
  ),
);

const Body = withLism(
  forwardRef<HTMLTableSectionElement, TablePartProps<'tbody'>>(
    function TableBody({ className, children, ...props }, ref) {
      return (
        <tbody
          {...props}
          ref={ref}
          className={withClassName('ui-table__body', className)}
        >
          {children}
        </tbody>
      );
    },
  ),
);

const Footer = withLism(
  forwardRef<HTMLTableSectionElement, TablePartProps<'tfoot'>>(
    function TableFooter({ className, children, ...props }, ref) {
      return (
        <tfoot
          {...props}
          ref={ref}
          className={withClassName('ui-table__footer', className)}
        >
          {children}
        </tfoot>
      );
    },
  ),
);

const Row = withLism(
  forwardRef<HTMLTableRowElement, TablePartProps<'tr'>>(function TableRow(
    { className, children, ...props },
    ref,
  ) {
    return (
      <tr
        {...props}
        ref={ref}
        className={withClassName('ui-table__row', className)}
      >
        {children}
      </tr>
    );
  }),
);

/** A header cell; set scope="col" or scope="row". */
const Head = withLism(
  forwardRef<HTMLTableCellElement, TablePartProps<'th'>>(function TableHead(
    { className, ...props },
    ref,
  ) {
    return (
      <th
        {...props}
        ref={ref}
        className={withClassName('ui-table__head', className)}
      />
    );
  }),
);

const Cell = withLism(
  forwardRef<HTMLTableCellElement, TablePartProps<'td'>>(function TableCell(
    { className, ...props },
    ref,
  ) {
    return (
      <td
        {...props}
        ref={ref}
        className={withClassName('ui-table__cell', className)}
      />
    );
  }),
);

export type TableHeadProps = TablePartProps<'th'>;
export type TableCellProps = TablePartProps<'td'>;

export const Table = {
  Container,
  Root,
  Caption,
  Header,
  Body,
  Footer,
  Row,
  Head,
  Cell,
};
