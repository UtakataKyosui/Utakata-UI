import { fireEvent, render, screen } from '@testing-library/react';
import { expect } from 'vitest';
import { Button } from '../../components/Button.js';
import { Card } from '../../components/Card.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

export const cardChecks: Record<string, QualityCheck> = {
  'card.structure': async () => {
    const { container } = render(
      <>
        <Card.Root data-testid="full">
          <Card.Header>
            <Card.Title>Profile</Card.Title>
            <Card.Description>Edit public details.</Card.Description>
          </Card.Header>
          <Card.Content>Content</Card.Content>
          <Card.Footer>Footer</Card.Footer>
        </Card.Root>
        <Card.Root>
          <Card.Title level="2">Usage</Card.Title>
        </Card.Root>
        <Card.Root>
          <Card.Content>Body only</Card.Content>
        </Card.Root>
      </>,
    );
    expect(
      screen.getByRole('heading', { level: 3, name: 'Profile' }),
    ).toHaveClass('ui-card__title');
    expect(
      screen.getByRole('heading', { level: 2, name: 'Usage' }),
    ).toBeVisible();
    expect(screen.getByTestId('full')).toHaveClass('ui-card');
    expect(screen.getByText('Body only')).toHaveClass('ui-card__content');
    expect((await audit(container)).violations).toEqual([]);
  },
  'card.not-interactive': () => {
    let saves = 0;
    const { container } = render(
      <Card.Root>
        <Card.Content>Settings</Card.Content>
        <Card.Footer>
          <Button onClick={() => saves++}>Save</Button>
        </Card.Footer>
      </Card.Root>,
    );
    for (const part of container.querySelectorAll<HTMLElement>(
      '.ui-card, .ui-card__content, .ui-card__footer',
    )) {
      expect(part).not.toHaveAttribute('tabindex');
      expect(part).not.toHaveAttribute('role');
      part.focus();
      expect(part).not.toHaveFocus();
    }
    const button = screen.getByRole('button', { name: 'Save' });
    button.focus();
    expect(button).toHaveFocus();
    fireEvent.click(button);
    expect(saves).toBe(1);
  },
};
