import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { expect } from 'vitest';
import { Slider } from '../../components/Slider.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

function Volume(props: ComponentProps<typeof Slider.Root>) {
  return (
    <main>
      <form>
        <Slider.Root name="volume" defaultValue={50} {...props}>
          <Slider.Label>Volume</Slider.Label>
          <Slider.Value />
          <Slider.Control>
            <Slider.Track>
              <Slider.Indicator />
              <Slider.Thumb getAriaValueText={(value) => `${value} percent`} />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </form>
    </main>
  );
}

const slider = () => screen.getByRole('slider', { name: 'Volume' });
const formValue = () =>
  [...new FormData(document.querySelector('form') as HTMLFormElement)].at(0);

async function press(key: string, expected: string) {
  fireEvent.keyDown(slider(), { key });
  await waitFor(() =>
    expect(slider()).toHaveAttribute('aria-valuenow', expected),
  );
}

export const sliderChecks: Record<string, QualityCheck> = {
  'slider.thumb-name-value': async () => {
    const { container } = render(<Volume />);
    const thumb = slider();
    expect(thumb).toHaveAttribute('aria-valuenow', '50');
    expect(thumb).toHaveAttribute('aria-valuetext', '50 percent');
    expect(thumb).toHaveAttribute('min', '0');
    expect(thumb).toHaveAttribute('max', '100');
    expect(screen.getByText('50', { selector: 'output' })).toBeVisible();
    expect((await audit(container)).violations).toEqual([]);
  },
  'slider.keyboard': async () => {
    render(
      <Volume min={0} max={1} step={0.1} largeStep={0.5} defaultValue={0.5} />,
    );
    slider().focus();
    await press('ArrowRight', '0.6');
    await press('ArrowDown', '0.5');
    await press('PageUp', '1');
    await press('ArrowRight', '1');
    await press('Home', '0');
    await press('ArrowLeft', '0');
    await press('End', '1');
  },
  'slider.change-commit-form': async () => {
    const changes: number[] = [];
    const commits: number[] = [];
    const view = render(
      <Volume
        step={5}
        onValueChange={(value) => changes.push(value as number)}
        onValueCommitted={(value) => commits.push(value as number)}
      />,
    );
    expect(formValue()).toEqual(['volume', '50']);
    slider().focus();
    await press('ArrowRight', '55');
    expect(changes).toEqual([55]);
    expect(commits).toEqual([55]);
    expect(formValue()).toEqual(['volume', '55']);
    view.unmount();
    render(
      <Volume
        disabled
        onValueChange={(value) => changes.push(value as number)}
      />,
    );
    // A disabled input cannot receive focus, so real keyboard input never reaches it.
    expect(slider()).toBeDisabled();
    slider().focus();
    expect(slider()).not.toHaveFocus();
    expect(slider()).toHaveAttribute('aria-valuenow', '50');
    expect(formValue()).toBeUndefined();
    expect(changes).toEqual([55]);
  },
};
