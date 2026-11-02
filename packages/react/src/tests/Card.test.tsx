import { cleanup, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { Button } from '../components/Button.js';
import { Card, type CardTitleProps } from '../components/Card.js';
import { cardManifest, cardQualityRules } from '../metadata/components/Card.js';
import { audit } from './audit.js';
import { cardChecks } from './quality/Card.checks.js';
import { expectAutomatedQuality } from './quality-helpers.js';

afterEach(cleanup);

// Type fixtures checked by pnpm typecheck without rendering invalid JSX.
const title: CardTitleProps = { level: '2', children: 'Profile' };
// @ts-expect-error Heading levels are limited to 1-6, as in Lism Heading.
const invalidLevel: CardTitleProps = { level: '7', children: 'Profile' };
// @ts-expect-error Card.Title requires heading text.
const emptyTitle: CardTitleProps = { level: '2' };
void [title, invalidLevel, emptyTitle];

describe('Card', () => {
  it('forwards className, ref and attributes on every part', () => {
    const refs = {
      Root: createRef<HTMLDivElement>(),
      Header: createRef<HTMLDivElement>(),
      Title: createRef<HTMLHeadingElement>(),
      Description: createRef<HTMLParagraphElement>(),
      Content: createRef<HTMLDivElement>(),
      Footer: createRef<HTMLDivElement>(),
    };
    render(
      <Card.Root ref={refs.Root} className="root" data-testid="card">
        <Card.Header ref={refs.Header} className="header">
          <Card.Title ref={refs.Title} className="title" id="card-title">
            Profile
          </Card.Title>
          <Card.Description ref={refs.Description} className="description">
            Edit public details.
          </Card.Description>
        </Card.Header>
        <Card.Content ref={refs.Content} className="content">
          Content
        </Card.Content>
        <Card.Footer ref={refs.Footer} className="footer">
          Footer
        </Card.Footer>
      </Card.Root>,
    );
    expect(refs.Root.current).toHaveClass('ui-card', 'root');
    expect(refs.Root.current).toHaveAttribute('data-testid', 'card');
    expect(refs.Header.current).toHaveClass('ui-card__header', 'header');
    expect(refs.Title.current?.tagName).toBe('H3');
    expect(refs.Title.current).toHaveAttribute('id', 'card-title');
    expect(refs.Description.current?.tagName).toBe('P');
    expect(refs.Content.current).toHaveClass('ui-card__content', 'content');
    expect(refs.Footer.current).toHaveClass('ui-card__footer', 'footer');
    expect(cardManifest.defaults.level).toBe('3');
  });

  it('renders every heading level', () => {
    for (const level of cardManifest.headingLevels) {
      const { unmount } = render(<Card.Title level={level}>Title</Card.Title>);
      expect(
        screen.getByRole('heading', { level: Number(level), name: 'Title' }),
      ).toBeInTheDocument();
      unmount();
    }
  });

  it('audits a card containing a form and long text', async () => {
    const { container } = render(
      <Card.Root>
        <Card.Header>
          <Card.Title level="2">Newsletter</Card.Title>
          <Card.Description>
            A long description that explains how often messages are sent and how
            to unsubscribe at any time from the account settings page.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <label htmlFor="card-email">Email</label>
          <input id="card-email" type="email" />
        </Card.Content>
        <Card.Footer>
          <Button>Subscribe</Button>
        </Card.Footer>
      </Card.Root>,
    );
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument();
    expect((await audit(container)).violations).toEqual([]);
  });

  it('passes every automated quality rule', async () => {
    await expectAutomatedQuality(cardQualityRules, cardChecks);
  });
});
