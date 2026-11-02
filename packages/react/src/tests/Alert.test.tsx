import { cleanup, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { Alert, type AlertRootProps } from '../components/Alert.js';
import {
  alertManifest,
  alertQualityRules,
} from '../metadata/components/Alert.js';
import { alertChecks } from './quality/Alert.checks.js';
import { expectAutomatedQuality } from './quality-helpers.js';

afterEach(cleanup);

// Type fixtures checked by pnpm typecheck without rendering invalid JSX.
const urgent: AlertRootProps = { variant: 'destructive', role: 'alert' };
// @ts-expect-error Only live-region roles are supported on Alert.Root.
const region: AlertRootProps = { role: 'region' };
// @ts-expect-error Variants are limited to the manifest.
const unsupported: AlertRootProps = { variant: 'warning' };
void [urgent, region, unsupported];

describe('Alert', () => {
  it('uses the default variant and forwards className, ref and attributes', () => {
    const refs = {
      Root: createRef<HTMLDivElement>(),
      Title: createRef<HTMLDivElement>(),
      Description: createRef<HTMLDivElement>(),
    };
    render(
      <Alert.Root ref={refs.Root} className="root" id="notice">
        <Alert.Title ref={refs.Title} className="title">
          Maintenance
        </Alert.Title>
        <Alert.Description ref={refs.Description} className="description">
          The service stops at 22:00.
        </Alert.Description>
      </Alert.Root>,
    );
    expect(refs.Root.current).toHaveClass(
      'ui-alert',
      'ui-alert--default',
      'root',
    );
    expect(refs.Root.current).toHaveAttribute('id', 'notice');
    expect(refs.Title.current).toHaveClass('ui-alert__title', 'title');
    expect(refs.Description.current).toHaveClass(
      'ui-alert__description',
      'description',
    );
    expect(alertManifest.defaults.variant).toBe('default');
  });

  it('applies variant classes and allows optional parts', () => {
    render(
      <Alert.Root variant="destructive" role="alert">
        <Alert.Description>Only a description</Alert.Description>
      </Alert.Root>,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('ui-alert--destructive');
    expect(alert).toHaveTextContent('Only a description');
  });

  it('passes every automated quality rule', async () => {
    await expectAutomatedQuality(alertQualityRules, alertChecks);
  });
});
