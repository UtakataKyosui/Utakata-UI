import { cleanup, render, screen } from '@testing-library/react';
import { createRef, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from '../components/Button.js';
import {
  Item,
  type ItemButtonProps,
  type ItemIconProps,
  type ItemLinkProps,
  type ItemRootProps,
} from '../components/Item.js';
import { itemManifest, itemQualityRules } from '../metadata/components/Item.js';
import { audit } from './audit.js';
import { itemChecks } from './quality/Item.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

// Type fixtures checked by pnpm typecheck without rendering invalid JSX.
const hrefLink: ItemLinkProps = { href: '/', children: 'Report' };
const routerLink: ItemLinkProps = {
  render: <a href="/docs">Docs</a>,
  children: 'Docs',
};
const plainButton: ItemButtonProps = { children: 'Open' };
// @ts-expect-error A link needs href or a render element.
const noDestination: ItemLinkProps = { children: 'Report' };
// @ts-expect-error A link needs children as its accessible name.
const noName: ItemLinkProps = { href: '/' };
// @ts-expect-error A link cannot change its role.
const linkRole: ItemLinkProps = { href: '/', children: 'x', role: 'button' };
// @ts-expect-error The button is always type="button".
const submit: ItemButtonProps = { children: 'Go', type: 'submit' };
// @ts-expect-error A button has no href; use Item.Link to navigate.
const buttonHref: ItemButtonProps = { children: 'Go', href: '/' };
// @ts-expect-error A button needs children as its accessible name.
const buttonNoName: ItemButtonProps = {};
// @ts-expect-error The row itself cannot be made clickable.
const rootClick: ItemRootProps = { onClick: () => {} };
// @ts-expect-error The row itself cannot be a tab stop.
const rootTabIndex: ItemRootProps = { tabIndex: 0 };
// @ts-expect-error The row itself cannot take an interactive role.
const rootRole: ItemRootProps = { role: 'button' };
// @ts-expect-error The icon is decorative and cannot be exposed.
const iconVisible: ItemIconProps = { 'aria-hidden': false };
// @ts-expect-error The icon is decorative and cannot be named.
const iconLabel: ItemIconProps = { 'aria-label': 'File' };
const rowProps = { tabIndex: 0 as const };
// @ts-expect-error Spreads cannot make the row focusable.
const rootSpread = <Item.Root {...rowProps} />;
const linkProps = { children: 'Report' };
// @ts-expect-error Spreads cannot remove the destination.
const linkSpread = <Item.Link {...linkProps} />;
// @ts-expect-error A className must be a string.
const functionClass = <Item.Root className={() => 'x'} />;
void [
  hrefLink,
  routerLink,
  plainButton,
  noDestination,
  noName,
  linkRole,
  submit,
  buttonHref,
  buttonNoName,
  rootClick,
  rootTabIndex,
  rootRole,
  iconVisible,
  iconLabel,
  rootSpread,
  linkSpread,
  functionClass,
];

afterEach(cleanup);

async function diagnostics(ui: ReactElement) {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    render(ui);
    await settle(0);
    return warn.mock.calls
      .map(([message]) => String(message))
      .filter((message) => message.startsWith('[Utakata-UI a11y] Item:'))
      .join(' ');
  } finally {
    warn.mockRestore();
    cleanup();
  }
}

describe('Item', () => {
  it('forwards className, ref and attributes on every part', () => {
    const refs = {
      Group: createRef<HTMLUListElement>(),
      Root: createRef<HTMLElement>(),
      Icon: createRef<HTMLDivElement>(),
      Body: createRef<HTMLDivElement>(),
      Title: createRef<HTMLDivElement>(),
      Description: createRef<HTMLParagraphElement>(),
      Meta: createRef<HTMLDivElement>(),
      Actions: createRef<HTMLDivElement>(),
      Link: createRef<HTMLAnchorElement>(),
      Button: createRef<HTMLButtonElement>(),
    };
    render(
      <Item.Group ref={refs.Group} className="group">
        <Item.Root ref={refs.Root} className="root" data-testid="root">
          <Item.Icon ref={refs.Icon} className="icon">
            i
          </Item.Icon>
          <Item.Body ref={refs.Body} className="body">
            <Item.Title ref={refs.Title} className="title">
              Title
            </Item.Title>
            <Item.Description ref={refs.Description} className="description">
              Description
            </Item.Description>
          </Item.Body>
          <Item.Meta ref={refs.Meta} className="meta">
            Meta
          </Item.Meta>
          <Item.Actions ref={refs.Actions} className="actions">
            <Button>Act</Button>
          </Item.Actions>
        </Item.Root>
        <Item.Root>
          <Item.Link ref={refs.Link} href="/x" className="link" id="link">
            Link
          </Item.Link>
        </Item.Root>
        <Item.Root>
          <Item.Button ref={refs.Button} className="button" id="button">
            Button
          </Item.Button>
        </Item.Root>
      </Item.Group>,
    );
    expect(refs.Group.current).toHaveClass('ui-item-group', 'group');
    expect(refs.Root.current).toHaveClass('ui-item', 'root');
    expect(refs.Root.current).toHaveAttribute('data-testid', 'root');
    expect(refs.Icon.current).toHaveClass('ui-item__icon', 'icon');
    expect(refs.Body.current).toHaveClass('ui-item__body', 'body');
    expect(refs.Title.current).toHaveClass('ui-item__title', 'title');
    expect(refs.Description.current?.tagName).toBe('P');
    expect(refs.Meta.current).toHaveClass('ui-item__meta', 'meta');
    expect(refs.Actions.current).toHaveClass('ui-item__actions', 'actions');
    expect(refs.Link.current).toHaveClass(
      'ui-item__title',
      'ui-item__link',
      'link',
    );
    expect(refs.Link.current).toHaveAttribute('id', 'link');
    expect(refs.Button.current).toHaveClass('ui-item__button', 'button');
    expect(itemManifest.defaults.Button).toBe('type="button"');
  });

  it('renders a router link through render', () => {
    render(
      <Item.Root>
        <Item.Link render={<a href="/docs" />}>Docs</Item.Link>
      </Item.Root>,
    );
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute(
      'href',
      '/docs',
    );
  });

  it('does not nest a list item in an outer group item', () => {
    render(
      <Item.Group aria-label="Outer">
        <Item.Root>
          <Item.Body>
            <Item.Group aria-label="Inner">
              <Item.Root>
                <Item.Title>Nested</Item.Title>
              </Item.Root>
            </Item.Group>
          </Item.Body>
        </Item.Root>
      </Item.Group>,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('audits long text, several actions and an icon', async () => {
    const long = 'Unbroken_text_'.repeat(20);
    const { container } = render(
      <Item.Group aria-label="Files">
        <Item.Root>
          <Item.Icon>
            <svg aria-hidden="true" viewBox="0 0 8 8" />
          </Item.Icon>
          <Item.Body>
            <Item.Link href="/report">{long}</Item.Link>
            <Item.Description>{long}</Item.Description>
          </Item.Body>
          <Item.Meta>{long}</Item.Meta>
          <Item.Actions>
            <Button iconOnly aria-label="Edit report">
              e
            </Button>
            <Button iconOnly aria-label="Delete report">
              d
            </Button>
            <Button variant="outline">Share</Button>
          </Item.Actions>
        </Item.Root>
      </Item.Group>,
    );
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect((await audit(container)).violations).toEqual([]);
  });

  describe('development diagnostics', () => {
    it('stays silent for valid compositions', async () => {
      expect(
        await diagnostics(
          <Item.Root>
            <Item.Body>
              <Item.Link href="/a">A</Item.Link>
            </Item.Body>
            <Item.Actions>
              <Button>Edit</Button>
            </Item.Actions>
          </Item.Root>,
        ),
      ).toBe('');
    });

    it('warns when a button or link is nested in the primary control', async () => {
      expect(
        await diagnostics(
          <Item.Root>
            <Item.Link href="/a">
              A <Button>Nested</Button>
            </Item.Link>
          </Item.Root>,
        ),
      ).toMatch(/must not be nested/);
      expect(
        await diagnostics(
          <Item.Root>
            <Item.Button>
              B <a href="/x">inner</a>
            </Item.Button>
          </Item.Root>,
        ),
      ).toMatch(/must not be nested/);
    });

    it('warns when the primary control is in Actions, Meta or Icon', async () => {
      for (const Part of [Item.Actions, Item.Meta, Item.Icon]) {
        expect(
          await diagnostics(
            <Item.Root>
              <Part>
                <Item.Link href="/a">A</Item.Link>
              </Part>
            </Item.Root>,
          ),
        ).toMatch(/must be inside Item.Title/);
      }
    });

    it('warns about several primary controls and an interactive wrapper', async () => {
      expect(
        await diagnostics(
          <Item.Root>
            <Item.Link href="/a">A</Item.Link>
            <Item.Button>B</Item.Button>
          </Item.Root>,
        ),
      ).toMatch(/2 primary links or buttons/);
      expect(
        await diagnostics(
          <a href="/outer">
            <Item.Root>
              <Item.Title>Wrapped</Item.Title>
            </Item.Root>
          </a>,
        ),
      ).toMatch(/inside an interactive element/);
    });
  });

  it('passes every automated quality rule', async () => {
    await expectAutomatedQuality(itemQualityRules, itemChecks);
  });
});
