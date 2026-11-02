import { render, screen } from '@testing-library/react';
import { expect } from 'vitest';
import { Button } from '../../components/Button.js';
import { Spinner } from '../../components/Spinner.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

export const spinnerChecks: Record<string, QualityCheck> = {
  'spinner.status-name': async () => {
    const { container } = render(
      <>
        <Spinner />
        <Spinner size="lg" label="Uploading file" />
      </>,
    );
    const [standard, custom] = screen.getAllByRole('status');
    expect(standard).toHaveTextContent('読み込み中');
    expect(custom).toHaveTextContent('Uploading file');
    for (const ring of container.querySelectorAll('.ui-spinner__ring'))
      expect(ring).toHaveAttribute('aria-hidden', 'true');
    expect((await audit(container)).violations).toEqual([]);
  },
  'spinner.decorative': async () => {
    const { container } = render(
      <Button disabled>
        <Spinner size="sm" decorative />
        保存中
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAccessibleName('保存中');
    expect(button).toBeDisabled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(container.querySelector('.ui-spinner')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(container.querySelector('.ui-spinner__label')).toBeNull();
    expect((await audit(container)).violations).toEqual([]);
  },
};
