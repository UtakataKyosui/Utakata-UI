import { cleanup, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { Button } from '../components/Button.js';
import {
  ButtonGroup,
  type ButtonGroupProps,
} from '../components/ButtonGroup.js';
import {
  buttonGroupManifest,
  buttonGroupQualityRules,
} from '../metadata/components/ButtonGroup.js';
import { buttonGroupChecks } from './quality/ButtonGroup.checks.js';
import { expectAutomatedQuality } from './quality-helpers.js';

afterEach(cleanup);

// Type fixtures checked by pnpm typecheck without rendering invalid JSX.
const named: ButtonGroupProps = { 'aria-label': 'History' };
const referenced: ButtonGroupProps = {
  'aria-labelledby': 'history',
  orientation: 'vertical',
};
// @ts-expect-error A button group requires aria-label or aria-labelledby.
const unnamed: ButtonGroupProps = {};
// @ts-expect-error Only one group name source may be passed.
const bothNames: ButtonGroupProps = {
  'aria-label': 'History',
  'aria-labelledby': 'history',
};
// @ts-expect-error The group role is fixed; toolbar behavior is not provided.
const toolbar: ButtonGroupProps = { 'aria-label': 'x', role: 'toolbar' };
// @ts-expect-error Orientations are limited to the manifest.
const diagonal: ButtonGroupProps = { 'aria-label': 'x', orientation: 'd' };
const roleProps = { 'aria-label': 'x', role: 'toolbar' };
// @ts-expect-error Spreads cannot change the fixed group role.
const spreadRole = <ButtonGroup {...roleProps} />;
void [named, referenced, unnamed, bothNames, toolbar, diagonal, spreadRole];

describe('ButtonGroup', () => {
  it('applies defaults, className and ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ButtonGroup ref={ref} aria-label="History" className="custom">
        <Button>Undo</Button>
      </ButtonGroup>,
    );
    const group = screen.getByRole('group', { name: 'History' });
    expect(ref.current).toBe(group);
    expect(group).toHaveClass(
      'ui-button-group',
      'ui-button-group--horizontal',
      'custom',
    );
    expect(buttonGroupManifest.props.orientation.default).toBe('horizontal');
  });

  it('passes the automated quality rules', async () => {
    const report = await expectAutomatedQuality(
      buttonGroupQualityRules,
      buttonGroupChecks,
    );
    expect(report.complete).toBe(false);
  });
});
