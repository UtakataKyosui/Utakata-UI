import { fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { expect } from 'vitest';
import { Button } from '../../components/Button.js';
import { Item } from '../../components/Item.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';
import { settle } from '../quality-helpers.js';

const focusable =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]';

export const itemChecks: Record<string, QualityCheck> = {
  'item.structure': async () => {
    const root = createRef<HTMLElement>();
    const { container } = render(
      <>
        <Item.Group aria-label="Files" className="group">
          <Item.Root ref={root} className="row" data-testid="row">
            <Item.Icon data-testid="icon">
              <svg aria-hidden="true" viewBox="0 0 8 8" />
            </Item.Icon>
            <Item.Body>
              <Item.Title>Monthly report</Item.Title>
              <Item.Description>October 2026</Item.Description>
            </Item.Body>
            <Item.Meta>Updated Nov 1</Item.Meta>
          </Item.Root>
          <Item.Root>
            <Item.Body>
              <Item.Title>Second</Item.Title>
            </Item.Body>
          </Item.Root>
        </Item.Group>
        <Item.Root data-testid="standalone">
          <Item.Body>
            <Item.Title>Standalone</Item.Title>
          </Item.Body>
        </Item.Root>
      </>,
    );
    const list = screen.getByRole('list', { name: 'Files' });
    expect(list.tagName).toBe('UL');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(root.current?.tagName).toBe('LI');
    expect(root.current).toHaveClass('ui-item', 'row');
    expect(screen.getByTestId('standalone').tagName).toBe('DIV');
    expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('October 2026')).toHaveClass(
      'ui-item__description',
    );
    expect(screen.getByText('Updated Nov 1')).toHaveClass('ui-item__meta');
    expect((await audit(container)).violations).toEqual([]);
  },
  'item.semantics': () => {
    let opens = 0;
    const { container } = render(
      <>
        <Item.Root data-testid="static">
          <Item.Body>
            <Item.Title>Static row</Item.Title>
          </Item.Body>
        </Item.Root>
        <Item.Root data-testid="link-row">
          <Item.Body>
            <Item.Link href="/report">Report</Item.Link>
          </Item.Body>
        </Item.Root>
        <Item.Root data-testid="button-row">
          <Item.Body>
            <Item.Button onClick={() => opens++}>Open details</Item.Button>
          </Item.Body>
        </Item.Root>
      </>,
    );
    const staticRow = screen.getByTestId('static');
    expect(staticRow).not.toHaveAttribute('role');
    expect(staticRow).not.toHaveAttribute('tabindex');
    expect(staticRow.querySelector(focusable)).toBeNull();
    staticRow.focus();
    expect(staticRow).not.toHaveFocus();
    const link = screen.getByRole('link', { name: 'Report' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/report');
    const button = screen.getByRole('button', { name: 'Open details' });
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('type', 'button');
    button.focus();
    expect(button).toHaveFocus();
    fireEvent.click(button);
    expect(opens).toBe(1);
    for (const row of container.querySelectorAll('.ui-item')) {
      expect(row.querySelectorAll('.ui-item__link').length).toBeLessThanOrEqual(
        1,
      );
    }
  },
  'item.no-nested-interactive': async () => {
    const { container } = render(
      <Item.Group>
        <Item.Root>
          <Item.Body>
            <Item.Link href="/report">Report</Item.Link>
          </Item.Body>
          <Item.Actions>
            <Button iconOnly aria-label="Delete report">
              x
            </Button>
          </Item.Actions>
        </Item.Root>
        <Item.Root>
          <Item.Body>
            <Item.Button>Open</Item.Button>
          </Item.Body>
          <Item.Meta>Draft</Item.Meta>
        </Item.Root>
      </Item.Group>,
    );
    // The surrounding helper fails the check on any development diagnostic.
    await settle(0);
    expect(container.querySelector('.ui-item__link button')).toBeNull();
    expect(container.querySelector('.ui-item__link a')).toBeNull();
    expect((await audit(container)).violations).toEqual([]);
  },
  'item.focus-order': () => {
    const { container } = render(
      <Item.Root>
        <Item.Icon>i</Item.Icon>
        <Item.Body>
          <Item.Link href="/report">Report</Item.Link>
          <Item.Description>Long description</Item.Description>
        </Item.Body>
        <Item.Meta>Updated</Item.Meta>
        <Item.Actions>
          <Button>Edit</Button>
          <Button>Delete</Button>
        </Item.Actions>
      </Item.Root>,
    );
    const order = Array.from(
      container.querySelectorAll<HTMLElement>(focusable),
    );
    expect(order.map((node) => node.textContent)).toEqual([
      'Report',
      'Edit',
      'Delete',
    ]);
    for (const node of order) {
      expect(node.tabIndex).toBeGreaterThanOrEqual(0);
      node.focus();
      expect(node).toHaveFocus();
    }
    expect(
      container.querySelector('[tabindex]:not([tabindex="0"])'),
    ).toBeNull();
  },
};
