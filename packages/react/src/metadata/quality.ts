export interface QualityRule {
  id: string;
  requirement: string;
  verification: 'automated' | 'manual';
  severity: 'error' | 'warning';
  remediation: string;
}

export const qualityRules = {
  Button: [
    {
      id: 'button.accessible-name',
      requirement: 'Every button has an accessible name.',
      verification: 'automated',
      severity: 'error',
      remediation:
        'Provide visible text or use iconOnly with aria-label or aria-labelledby; resolve development diagnostics and verify computed names with axe.',
    },
    {
      id: 'button.disabled',
      requirement: 'A disabled button cannot activate its action.',
      verification: 'automated',
      severity: 'error',
      remediation: 'Preserve Base UI disabled behavior and native semantics.',
    },
  ],
  Field: [
    {
      id: 'field.label-description',
      requirement: 'The control is associated with its label and description.',
      verification: 'automated',
      severity: 'error',
      remediation: 'Compose Label, Control and Description inside Field.Root.',
    },
  ],
  Dialog: [
    {
      id: 'dialog.accessible-name',
      requirement:
        'An open dialog has an accessible name and, when useful, a description.',
      verification: 'automated',
      severity: 'error',
      remediation: 'Provide Dialog.Title and a useful Dialog.Description.',
    },
    {
      id: 'dialog.escape-focus-return',
      requirement:
        'Escape closes the dialog and restores focus to its trigger.',
      verification: 'automated',
      severity: 'error',
      remediation: 'Preserve Base UI dismissal and focus management.',
    },
    {
      id: 'dialog.keyboard-screen-reader',
      requirement:
        'Verify focus entry, containment, tab order and announcements in a real browser with a screen reader.',
      verification: 'manual',
      severity: 'error',
      remediation:
        'Record browser, assistive technology and findings before release.',
    },
  ],
  shared: [
    {
      id: 'theme.contrast-focus',
      requirement:
        'Verify text contrast and visible keyboard focus in each supported theme.',
      verification: 'manual',
      severity: 'error',
      remediation:
        'Check rendered colors and focus indicators in a real browser.',
    },
    {
      id: 'content.labels-headings',
      requirement:
        'Review label wording and page heading structure in context.',
      verification: 'manual',
      severity: 'warning',
      remediation:
        'Use meaningful labels and headings that reflect page structure.',
    },
  ],
} as const satisfies Record<string, readonly QualityRule[]>;

export interface QualityResult extends QualityRule {
  status: 'passed' | 'failed' | 'unverified';
  detail?: string;
}

export type QualityCheck = () => void | Promise<void>;

async function evaluateRule(
  rule: QualityRule,
  check: QualityCheck | undefined,
): Promise<QualityResult> {
  if (rule.verification === 'manual' || !check) {
    return { ...rule, status: 'unverified' };
  }
  try {
    await check();
    return { ...rule, status: 'passed' };
  } catch (error) {
    return {
      ...rule,
      status: 'failed',
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

/** Missing checks never count as passes. Manual review stays unverified. */
export async function evaluateQuality(
  rules: readonly QualityRule[],
  checks: Readonly<Record<string, QualityCheck>>,
) {
  const results: QualityResult[] = [];
  const ids = new Set<string>();
  for (const rule of rules) {
    if (ids.has(rule.id)) throw new Error(`Duplicate quality rule: ${rule.id}`);
    ids.add(rule.id);
    const check = Object.hasOwn(checks, rule.id) ? checks[rule.id] : undefined;
    results.push(await evaluateRule(rule, check));
  }
  for (const id of Object.keys(checks)) {
    if (!ids.has(id)) throw new Error(`Unknown quality check: ${id}`);
  }
  return {
    results,
    automatedPassed: results.every(
      (result) =>
        result.verification !== 'automated' ||
        result.severity !== 'error' ||
        result.status === 'passed',
    ),
    complete: results.every((result) => result.status === 'passed'),
  };
}

export function formatQualityReport(results: readonly QualityResult[]) {
  return results
    .map(
      (result) =>
        `[${result.status}] [${result.severity}] ${result.id}: ${result.requirement}${result.detail ? `\n${result.detail}` : ''}\nFix / review: ${result.remediation}`,
    )
    .join('\n');
}
