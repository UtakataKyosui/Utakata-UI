import { cleanup, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { Table, type TableContainerProps } from '../components/Table.js';
import { tableQualityRules } from '../metadata/components/Table.js';
import { tableChecks } from './quality/Table.checks.js';
import { expectAutomatedQuality } from './quality-helpers.js';

// Checked by pnpm typecheck: the focusable scroll region needs a name.
const labelled: TableContainerProps = { 'aria-labelledby': 'caption' };
const named: TableContainerProps = { 'aria-label': 'Invoices' };
// @ts-expect-error Table.Container requires aria-label or aria-labelledby.
const unnamed: TableContainerProps = {};
// @ts-expect-error Container focusability is fixed for keyboard scrolling.
const untabbable: TableContainerProps = { 'aria-label': 'x', tabIndex: -1 };
// @ts-expect-error The region role is fixed.
const roleOverride: TableContainerProps = { 'aria-label': 'x', role: 'none' };
void [labelled, named, unnamed, untabbable, roleOverride];

afterEach(cleanup);

describe('Table', () => {
  it('forwards refs and merges classNames on every part', () => {
    const refs = {
      container: createRef<HTMLElement>(),
      root: createRef<HTMLTableElement>(),
      caption: createRef<HTMLTableCaptionElement>(),
      header: createRef<HTMLTableSectionElement>(),
      body: createRef<HTMLTableSectionElement>(),
      footer: createRef<HTMLTableSectionElement>(),
      row: createRef<HTMLTableRowElement>(),
      head: createRef<HTMLTableCellElement>(),
      cell: createRef<HTMLTableCellElement>(),
    };
    render(
      <Table.Container ref={refs.container} aria-label="Data" className="c">
        <Table.Root ref={refs.root} className="c">
          <Table.Caption ref={refs.caption} className="c">
            Data
          </Table.Caption>
          <Table.Header ref={refs.header} className="c">
            <Table.Row ref={refs.row} className="c">
              <Table.Head ref={refs.head} scope="col" className="c">
                Name
              </Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body ref={refs.body} className="c">
            <Table.Row>
              <Table.Cell ref={refs.cell} className="c">
                A
              </Table.Cell>
            </Table.Row>
          </Table.Body>
          <Table.Footer ref={refs.footer} className="c">
            <Table.Row>
              <Table.Cell>Total</Table.Cell>
            </Table.Row>
          </Table.Footer>
        </Table.Root>
      </Table.Container>,
    );
    const expected = {
      container: ['SECTION', 'ui-table-container'],
      root: ['TABLE', 'ui-table'],
      caption: ['CAPTION', 'ui-table__caption'],
      header: ['THEAD', 'ui-table__header'],
      body: ['TBODY', 'ui-table__body'],
      footer: ['TFOOT', 'ui-table__footer'],
      row: ['TR', 'ui-table__row'],
      head: ['TH', 'ui-table__head'],
      cell: ['TD', 'ui-table__cell'],
    } as const;
    for (const [key, [tag, className]] of Object.entries(expected)) {
      const element = refs[key as keyof typeof refs].current;
      expect(element?.tagName).toBe(tag);
      expect(element).toHaveClass(className, 'c');
    }
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'scope',
      'col',
    );
  });

  it('passes all automated quality rules', async () => {
    const report = await expectAutomatedQuality(tableQualityRules, tableChecks);
    expect(report.complete).toBe(false);
  });
});
