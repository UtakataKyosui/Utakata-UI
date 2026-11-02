import { cleanup, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { Input } from '../components/Input.js';
import {
  InputGroup,
  type InputGroupAddonProps,
  type InputGroupButtonProps,
} from '../components/InputGroup.js';
import {
  inputGroupManifest,
  inputGroupQualityRules,
} from '../metadata/components/InputGroup.js';
import { inputGroupChecks } from './quality/InputGroup.checks.js';
import { expectAutomatedQuality } from './quality-helpers.js';

afterEach(cleanup);

// Type fixtures checked by pnpm typecheck without rendering invalid JSX.
const blockAddon: InputGroupAddonProps = { align: 'block-end' };
// @ts-expect-error Addon alignments are limited to the manifest.
const unsupportedAlign: InputGroupAddonProps = { align: 'center' };
const iconButton: InputGroupButtonProps = {
  iconOnly: true,
  'aria-label': 'Clear',
};
// @ts-expect-error Icon-only addon buttons keep the Button name requirement.
const unnamedIconButton: InputGroupButtonProps = { iconOnly: true };
// @ts-expect-error className is a string, not a Base UI state callback.
const callbackClassName: InputGroupButtonProps = { className: () => 'x' };
void [
  blockAddon,
  unsupportedAlign,
  iconButton,
  unnamedIconButton,
  callbackClassName,
];

describe('InputGroup', () => {
  it('forwards refs and merges classNames on every part', () => {
    const refs = {
      root: createRef<HTMLDivElement>(),
      addon: createRef<HTMLDivElement>(),
      text: createRef<HTMLSpanElement>(),
      button: createRef<HTMLElement>(),
    };
    render(
      <InputGroup.Root ref={refs.root} className="c">
        <InputGroup.Addon ref={refs.addon} className="c">
          <InputGroup.Text ref={refs.text} className="c">
            https://
          </InputGroup.Text>
        </InputGroup.Addon>
        <Input aria-label="Site" />
        <InputGroup.Addon align="inline-end">
          <InputGroup.Button
            ref={refs.button}
            className="c"
            variant="outline"
            size="md"
          >
            Go
          </InputGroup.Button>
        </InputGroup.Addon>
      </InputGroup.Root>,
    );
    expect(refs.root.current).toHaveClass('ui-input-group', 'c');
    expect(refs.addon.current).toHaveClass(
      'ui-input-group__addon',
      'ui-input-group__addon--inline-start',
      'c',
    );
    expect(refs.text.current).toHaveClass('ui-input-group__text', 'c');
    const button = screen.getByRole('button', { name: 'Go' });
    expect(refs.button.current).toBe(button);
    expect(button).toHaveClass(
      'ui-button',
      'ui-button--outline',
      'ui-button--md',
      'ui-input-group__button',
      'c',
    );
    expect(inputGroupManifest.props.align.default).toBe('inline-start');
    expect(inputGroupManifest.defaults).toMatchObject({
      variant: 'ghost',
      size: 'sm',
    });
  });

  it('renders every addon alignment', () => {
    const { container } = render(
      <InputGroup.Root>
        {inputGroupManifest.aligns.map((align) => (
          <InputGroup.Addon key={align} align={align}>
            {align}
          </InputGroup.Addon>
        ))}
      </InputGroup.Root>,
    );
    for (const align of inputGroupManifest.aligns)
      expect(
        container.querySelector(`.ui-input-group__addon--${align}`),
      ).toHaveTextContent(align);
  });

  it('passes the automated quality rules', async () => {
    const report = await expectAutomatedQuality(
      inputGroupQualityRules,
      inputGroupChecks,
    );
    expect(report.complete).toBe(false);
  });
});
