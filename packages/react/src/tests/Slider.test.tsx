import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { type ComponentProps, createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Field } from '../components/Field.js';
import { Slider } from '../components/Slider.js';
import {
  sliderManifest,
  sliderQualityRules,
} from '../metadata/components/Slider.js';
import { sliderChecks } from './quality/Slider.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Checked by pnpm typecheck without rendering invalid JSX.
type RootProps = ComponentProps<typeof Slider.Root>;
const single: RootProps = { defaultValue: 50, min: 0, max: 100, step: 5 };
// @ts-expect-error Values are numbers, not strings.
const stringValue: RootProps = { defaultValue: '50' };
// @ts-expect-error className must be a string, not a Base UI state callback.
const callbackClass: RootProps = { className: () => 'x' };
void [single, stringValue, callbackClass];

describe('Slider', () => {
  it('uses Base UI defaults and forwards className and refs', () => {
    const rootRef = createRef<HTMLDivElement>();
    const thumbRef = createRef<HTMLDivElement>();
    const inputRef = createRef<HTMLInputElement>();
    render(
      <Slider.Root ref={rootRef} className="root">
        <Slider.Label className="label">Volume</Slider.Label>
        <Slider.Value className="value" />
        <Slider.Control className="control">
          <Slider.Track className="track">
            <Slider.Indicator className="indicator" />
            <Slider.Thumb
              ref={thumbRef}
              inputRef={inputRef}
              className="thumb"
            />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>,
    );
    const input = screen.getByRole('slider', { name: 'Volume' });
    expect(inputRef.current).toBe(input);
    expect(thumbRef.current).toContainElement(input);
    expect(rootRef.current).toHaveClass('ui-slider', 'root');
    for (const part of [
      'label',
      'value',
      'control',
      'track',
      'indicator',
      'thumb',
    ])
      expect(document.querySelector(`.${part}`)).toHaveClass(
        `ui-slider__${part}`,
      );
    expect(input).toHaveAttribute('min', String(sliderManifest.defaults.min));
    expect(input).toHaveAttribute('max', String(sliderManifest.defaults.max));
    expect(input).toHaveAttribute('step', String(sliderManifest.defaults.step));
  });

  it('follows a controlled value', () => {
    const view = render(
      <Slider.Root value={20}>
        <Slider.Control>
          <Slider.Thumb aria-label="Brightness" />
        </Slider.Control>
      </Slider.Root>,
    );
    const input = screen.getByRole('slider', { name: 'Brightness' });
    expect(input).toHaveAttribute('aria-valuenow', '20');
    view.rerender(
      <Slider.Root value={30}>
        <Slider.Control>
          <Slider.Thumb aria-label="Brightness" />
        </Slider.Control>
      </Slider.Root>,
    );
    expect(input).toHaveAttribute('aria-valuenow', '30');
  });

  it('names the thumb with Field.Label inside Field.Root without diagnostics', async () => {
    const warn = vi.spyOn(console, 'warn');
    render(
      <Field.Root>
        <Field.Label>Volume</Field.Label>
        <Slider.Root defaultValue={50}>
          <Slider.Control>
            <Slider.Track>
              <Slider.Indicator />
              <Slider.Thumb />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </Field.Root>,
    );
    await settle();
    expect(screen.getByRole('slider', { name: 'Volume' })).toBeInTheDocument();
    expect(
      warn.mock.calls.filter(([message]) =>
        String(message).startsWith('[Utakata-UI a11y]'),
      ),
    ).toEqual([]);
  });

  it('passes all automated quality rules without diagnostics', async () => {
    await expectAutomatedQuality(sliderQualityRules, sliderChecks);
  });

  it('warns for an unnamed thumb and accepts labelled thumbs', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const view = render(
      <Slider.Root>
        <Slider.Control>
          <Slider.Thumb />
        </Slider.Control>
      </Slider.Root>,
    );
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] Slider.Thumb: No accessible name source',
        ),
      ),
    );
    view.unmount();
    warn.mockClear();
    render(
      <>
        <Slider.Root>
          <Slider.Label>Volume</Slider.Label>
          <Slider.Control>
            <Slider.Thumb />
          </Slider.Control>
        </Slider.Root>
        <Slider.Root>
          <Slider.Control>
            <Slider.Thumb getAriaLabel={() => 'Balance'} />
          </Slider.Control>
        </Slider.Root>
      </>,
    );
    await settle();
    expect(warn).not.toHaveBeenCalled();
  });
});
