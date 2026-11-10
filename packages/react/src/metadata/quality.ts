import { accordionQualityRules } from './components/Accordion.js';
import { alertQualityRules } from './components/Alert.js';
import { alertDialogQualityRules } from './components/AlertDialog.js';
import { avatarQualityRules } from './components/Avatar.js';
import { badgeQualityRules } from './components/Badge.js';
import { breadcrumbQualityRules } from './components/Breadcrumb.js';
import { buttonGroupQualityRules } from './components/ButtonGroup.js';
import { cardQualityRules } from './components/Card.js';
import { checkboxQualityRules } from './components/Checkbox.js';
import { collapsibleQualityRules } from './components/Collapsible.js';
import { dropdownMenuQualityRules } from './components/DropdownMenu.js';
import { inputQualityRules } from './components/Input.js';
import { inputGroupQualityRules } from './components/InputGroup.js';
import { kbdQualityRules } from './components/Kbd.js';
import { nativeSelectQualityRules } from './components/NativeSelect.js';
import { paginationQualityRules } from './components/Pagination.js';
import { popoverQualityRules } from './components/Popover.js';
import { progressQualityRules } from './components/Progress.js';
import { radioGroupQualityRules } from './components/RadioGroup.js';
import { selectQualityRules } from './components/Select.js';
import { separatorQualityRules } from './components/Separator.js';
import { skeletonQualityRules } from './components/Skeleton.js';
import { sliderQualityRules } from './components/Slider.js';
import { spinnerQualityRules } from './components/Spinner.js';
import { switchQualityRules } from './components/Switch.js';
import { tableQualityRules } from './components/Table.js';
import { tabsQualityRules } from './components/Tabs.js';
import { textareaQualityRules } from './components/Textarea.js';
import { toastQualityRules } from './components/Toast.js';
import { toggleQualityRules } from './components/Toggle.js';
import { toggleGroupQualityRules } from './components/ToggleGroup.js';
import { tooltipQualityRules } from './components/Tooltip.js';

export interface QualityRule {
  id: string;
  requirement: string;
  verification: 'automated' | 'browser' | 'manual';
  severity: 'error' | 'warning';
  remediation: string;
  /** Scope and limits of independently measured properties. */
  applicability?: string;
  residual?: string;
  criteria?: readonly string[];
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
    {
      id: 'button.destructive-text',
      requirement:
        'A destructive button states its action in text and is not the only safeguard; confirmation is the consumer responsibility.',
      verification: 'manual',
      severity: 'error',
      remediation:
        'Name the destructive action in visible text, do not rely on color, and confirm irreversible actions (for example with AlertDialog).',
      applicability: 'Consumer content using variant="destructive".',
      residual:
        'Whether the label and confirmation are understandable is not machine-verifiable.',
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
      id: 'dialog.browser-keyboard',
      requirement:
        'Real Tab and Shift+Tab remain in the open modal; Escape and Close restore focus to the trigger.',
      verification: 'browser',
      severity: 'error',
      remediation: 'Preserve Base UI keyboard and modal focus behavior.',
      applicability: 'Open modal with a connected trigger and a Close button.',
      residual: 'Trigger removal and nested modals require separate evidence.',
      criteria: ['2.1.1', '2.1.2', '2.4.3'],
    },
    {
      id: 'dialog.assistive-output',
      requirement:
        'Verify title, description, entry and return announcements using the supported screen-reader/browser combinations.',
      verification: 'manual',
      severity: 'error',
      remediation:
        'Record browser, assistive technology and findings before release.',
    },
  ],
  Kbd: kbdQualityRules,
  Separator: separatorQualityRules,
  Badge: badgeQualityRules,
  Skeleton: skeletonQualityRules,
  Spinner: spinnerQualityRules,
  Card: cardQualityRules,
  Alert: alertQualityRules,
  Avatar: avatarQualityRules,
  Progress: progressQualityRules,
  Table: tableQualityRules,
  Breadcrumb: breadcrumbQualityRules,
  Pagination: paginationQualityRules,
  Input: inputQualityRules,
  Textarea: textareaQualityRules,
  NativeSelect: nativeSelectQualityRules,
  Checkbox: checkboxQualityRules,
  Switch: switchQualityRules,
  RadioGroup: radioGroupQualityRules,
  Select: selectQualityRules,
  Slider: sliderQualityRules,
  Collapsible: collapsibleQualityRules,
  Accordion: accordionQualityRules,
  Tabs: tabsQualityRules,
  Toggle: toggleQualityRules,
  Tooltip: tooltipQualityRules,
  Popover: popoverQualityRules,
  DropdownMenu: dropdownMenuQualityRules,
  AlertDialog: alertDialogQualityRules,
  Toast: toastQualityRules,
  InputGroup: inputGroupQualityRules,
  ToggleGroup: toggleGroupQualityRules,
  ButtonGroup: buttonGroupQualityRules,
  shared: [
    {
      id: 'theme.reduced-motion',
      requirement:
        'Reduced motion disables Button transitions and animation while Dialog remains operable.',
      verification: 'browser',
      severity: 'error',
      remediation:
        'Keep the prefers-reduced-motion override and keyboard dismissal.',
      applicability:
        'Every Button variant × size in both standard themes; media emulation.',
      residual:
        'OS preference propagation and physical device perception stay manual.',
      criteria: ['2.3.3 (product requirement)'],
    },
    {
      id: 'theme.target-size',
      requirement:
        'Enabled Button variants/sizes and Field controls have hit-testable targets of at least 24×24 CSS px.',
      verification: 'browser',
      severity: 'error',
      remediation:
        'Keep actual interactive areas at least 24×24 CSS px and unobscured.',
      applicability:
        'Standard Button and Field fixture; no spacing exceptions are used.',
      residual:
        'Physical touch effort and custom controls require separate verification.',
      criteria: ['2.5.8'],
    },
    {
      id: 'theme.reflow',
      requirement:
        'Button, Field and Dialog content remains available at 320 CSS px.',
      verification: 'browser',
      severity: 'error',
      remediation:
        'Allow wrapping and flexible control widths without clipping text or actions.',
      applicability:
        'English/Japanese long content, invalid Field, open/closed Dialog.',
      residual:
        'Text scaling is not actual browser zoom; physical zoom remains manual.',
      criteria: ['1.4.10'],
    },
    {
      id: 'theme.text-size',
      requirement:
        'Button, Field and Dialog retain content and operation with 200% text size at 320 CSS px.',
      verification: 'browser',
      severity: 'error',
      remediation: 'Wrap content without clipping text or actions.',
      applicability:
        'English/Japanese long content, invalid Field and open/closed Dialog.',
      residual: 'Text scaling does not establish actual browser zoom behavior.',
      criteria: ['1.4.4'],
    },
    {
      id: 'theme.text-spacing',
      requirement:
        'Specified line, paragraph, letter and word spacing does not lose content or operation.',
      verification: 'browser',
      severity: 'error',
      remediation: 'Allow text to grow and wrap with user spacing overrides.',
      applicability: 'Button and invalid Field content at 320 CSS px.',
      residual:
        'Arbitrary consumer content and custom CSS require revalidation.',
      criteria: ['1.4.12'],
    },
    {
      id: 'theme.interaction-contrast',
      requirement:
        'Enabled Button text retains 4.5:1 rendered contrast while hovered and keyboard focused.',
      verification: 'browser',
      severity: 'error',
      remediation:
        'Keep foreground/background contrast through interaction states.',
      applicability: 'Every Button variant × size in both standard themes.',
      residual:
        'Disabled controls are exempt from contrast; custom CSS needs revalidation.',
      criteria: ['1.4.3'],
    },
    {
      id: 'theme.rendered-contrast',
      requirement:
        'Rendered enabled Button variants and Field text meet 4.5:1 in light and dark themes.',
      verification: 'browser',
      severity: 'error',
      remediation:
        'Fix rendered foreground/background combinations, not only tokens.',
      applicability: 'Standard themes, Button variant/size and Field fixture.',
      residual: 'Custom CSS, gradients and consumer content need revalidation.',
      criteria: ['1.4.3'],
    },
    {
      id: 'theme.focus-visibility',
      requirement:
        'Keyboard focus retains its ring in standard themes and a solid outline of at least 2px in forced colors.',
      verification: 'browser',
      severity: 'error',
      remediation:
        'Retain the focus-visible outline on Button and Field controls.',
      applicability: 'Button, Field control and Dialog Close fixture.',
      residual:
        'Physical OS high contrast and complex occlusion require manual evidence.',
      criteria: ['2.4.7', '2.4.11'],
    },
    {
      id: 'theme.platform-rendering',
      requirement:
        'Verify real browser zoom, OS high contrast and user perception on supported devices.',
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
        result.verification === 'manual' ||
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
