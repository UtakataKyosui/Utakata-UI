import { render, screen } from '@testing-library/react';
import { expect } from 'vitest';
import { Button } from '../../components/Button.js';
import { Empty } from '../../components/Empty.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

export const emptyChecks: Record<string, QualityCheck> = {
  'empty.structure': async () => {
    const { container } = render(
      <Empty.Root data-testid="empty">
        <Empty.Title level="2">No files</Empty.Title>
        <Empty.Description>Upload files to see them here.</Empty.Description>
        <Empty.Actions>
          <Button>Upload files</Button>
        </Empty.Actions>
      </Empty.Root>,
    );
    const root = screen.getByTestId('empty');
    expect(root).not.toHaveAttribute('role');
    expect(root).not.toHaveAttribute('aria-live');
    expect(root).not.toHaveAttribute('tabindex');
    expect(
      screen.getByRole('heading', { level: 2, name: 'No files' }),
    ).toBeVisible();
    expect(screen.getByText('Upload files to see them here.').tagName).toBe(
      'P',
    );
    expect(screen.getByRole('button', { name: 'Upload files' })).toBeVisible();
    expect((await audit(container)).violations).toEqual([]);
  },
};
