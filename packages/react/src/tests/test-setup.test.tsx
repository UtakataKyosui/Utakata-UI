import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from '../components/Button.js';

// This ordered pair checks the test harness boundary, not component behavior.
// Without shared cleanup the element and its diagnostic observer survive test 1.
describe('shared React test cleanup', { concurrent: false }, () => {
  let element: HTMLElement;
  let released = false;

  it('mounts a diagnostic control without file-local cleanup hooks', () => {
    render(
      <Button
        ref={(value) => {
          if (value === null) released = true;
        }}
      >
        Cleanup sentinel
      </Button>,
    );
    element = screen.getByRole('button', { name: 'Cleanup sentinel' });
    expect(element.isConnected).toBe(true);
  });

  it('unmounts the previous control and releases its ref before the next test', () => {
    expect(element.isConnected).toBe(false);
    expect(released).toBe(true);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
