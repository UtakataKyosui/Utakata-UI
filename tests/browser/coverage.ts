/** Explicit review contract. Never derive expected values from the manifest:
 * adding a public value must require a deliberate fixture/coverage review. */
export const coverage = {
  Button: {
    axes: {
      variants: [
        'solid',
        'secondary',
        'outline',
        'ghost',
        'destructive',
        'link',
      ],
      sizes: ['sm', 'md', 'lg'],
    },
    selector: '.ui-button',
    states: {
      enabled: 'baseline.rendered-axe',
      keyboard: 'baseline.keyboard-focus',
      disabled: 'coverage.public-configurations',
    },
  },
  Field: {
    axes: {},
    selector: '.ui-field',
    states: {
      labelled: 'baseline.rendered-axe',
      focus: 'baseline.forced-colors',
    },
  },
  Dialog: {
    axes: {},
    selector: '.ui-dialog',
    states: {
      open: 'dialog.browser-keyboard',
      closed: 'dialog.browser-keyboard',
    },
  },
  Kbd: {
    axes: { sizes: ['sm', 'md'] },
    selector: '.ui-kbd',
    states: { static: 'coverage.public-configurations' },
  },
  Separator: {
    axes: { orientations: ['horizontal', 'vertical'] },
    selector: '.ui-separator',
    states: {
      decorative: 'coverage.public-configurations',
      semantic: 'coverage.public-configurations',
    },
  },
  Sheet: {
    axes: { sides: ['top', 'right', 'bottom', 'left'] },
    selector: '.ui-sheet__popup',
    states: {
      open: 'sheet.focus-containment',
      closed: 'sheet.dismissal-focus-return',
    },
  },
  Drawer: {
    axes: { sides: ['top', 'right', 'bottom', 'left'] },
    selector: '.ui-drawer__popup',
    states: {
      open: 'drawer.focus-containment',
      closed: 'drawer.dismissal-focus-return',
    },
  },
  Badge: {
    axes: { variants: ['solid', 'outline', 'subtle', 'destructive'] },
    selector: '.ui-badge',
    states: {
      short: 'badge.visual-theme',
      long: 'badge.visual-theme',
      icon: 'badge.visual-theme',
    },
  },
  Skeleton: {
    axes: { shapes: ['rect', 'circle'] },
    selector: '.ui-skeleton',
    states: {
      loading: 'skeleton.motion-theme',
      reducedMotion: 'skeleton.motion-theme',
      forcedColors: 'skeleton.motion-theme',
    },
  },
  Spinner: {
    axes: { sizes: ['sm', 'md', 'lg'] },
    selector: '.ui-spinner',
    states: {
      running: 'spinner.motion-theme',
      reducedMotion: 'spinner.motion-theme',
    },
  },
  Card: {
    axes: { headingLevels: ['1', '2', '3', '4', '5', '6'] },
    selector: '.ui-card',
    states: { longContent: 'card.layout-theme' },
  },
  Alert: {
    axes: { variants: ['default', 'destructive'] },
    selector: '.ui-alert',
    states: { static: 'alert.visual-theme', longContent: 'alert.visual-theme' },
  },
  Avatar: {
    axes: { sizes: ['sm', 'md', 'lg'] },
    selector: '.ui-avatar',
    states: { image: 'avatar.visual-theme', fallback: 'avatar.visual-theme' },
  },
  Progress: {
    axes: {},
    selector: '.ui-progress',
    states: {
      determinate: 'progress.visual-motion',
      indeterminate: 'progress.visual-motion',
    },
  },
  Table: {
    axes: {},
    selector: '.ui-table',
    states: { overflow: 'table.reflow-focus' },
  },
  Breadcrumb: {
    axes: {},
    selector: '.ui-breadcrumb',
    states: {
      current: 'breadcrumb.reflow-focus',
      wrapping: 'breadcrumb.reflow-focus',
    },
  },
  Pagination: {
    axes: {},
    selector: '.ui-pagination',
    states: {
      disabled: 'pagination.disabled-direction',
      current: 'pagination.target-reflow',
    },
  },
  Input: {
    axes: { sizes: ['sm', 'md', 'lg'] },
    selector: '.ui-input',
    states: {
      enabled: 'input.visual-theme',
      disabled: 'input.visual-theme',
      readOnly: 'input.visual-theme',
      invalid: 'input.visual-theme',
    },
  },
  Textarea: {
    axes: { sizes: ['sm', 'md', 'lg'] },
    selector: '.ui-textarea',
    states: {
      enabled: 'textarea.keyboard-input',
      disabled: 'textarea.keyboard-input',
      readOnly: 'textarea.keyboard-input',
      invalid: 'textarea.keyboard-input',
    },
  },
  NativeSelect: {
    axes: { sizes: ['sm', 'md', 'lg'] },
    selector: '.ui-native-select',
    states: {
      enabled: 'native-select.browser-behavior',
      disabled: 'native-select.browser-behavior',
      invalid: 'native-select.browser-behavior',
    },
  },
  Checkbox: {
    axes: {},
    selector: '.ui-checkbox',
    states: {
      checked: 'checkbox.reset-browser',
      unchecked: 'checkbox.reset-browser',
      resetCanceled: 'checkbox.reset-browser',
    },
  },
  Switch: {
    axes: {},
    selector: '.ui-switch',
    states: {
      enabled: 'switch.keyboard-pointer',
      disabled: 'switch.keyboard-pointer',
      readOnly: 'switch.keyboard-pointer',
    },
  },
  RadioGroup: {
    axes: { orientations: ['vertical', 'horizontal'] },
    selector: '.ui-radio-group',
    states: {
      selected: 'radio-group.keyboard',
      disabled: 'radio-group.keyboard',
    },
  },
  Select: {
    axes: {},
    selector: '.ui-select__trigger',
    states: {
      open: 'select.keyboard-selection',
      dismissed: 'select.popup-position-dismiss',
    },
  },
  InputOTP: {
    axes: {},
    selector: '.ui-input-otp',
    states: {
      empty: 'input-otp.keyboard-paste',
      complete: 'input-otp.keyboard-paste',
      invalid: 'input-otp.invalid-state',
      disabled: 'input-otp.target-size',
    },
  },
  Combobox: {
    axes: {},
    selector: '.ui-combobox__input',
    states: {
      open: 'combobox.keyboard-selection',
      dismissed: 'combobox.dismiss-focus',
      composing: 'combobox.ime-browser',
      focused: 'combobox.visual-forced',
    },
  },
  Command: {
    axes: {},
    selector: '.ui-command',
    states: {
      open: 'command.keyboard-execute',
      dismissed: 'command.dialog-focus',
      focused: 'command.visual-forced',
    },
  },
  Slider: {
    axes: {},
    selector: '.ui-slider',
    states: { minimum: 'slider.keyboard', maximum: 'slider.keyboard' },
  },
  Collapsible: {
    axes: {},
    selector: '.ui-collapsible',
    states: {
      open: 'collapsible.keyboard-focus',
      closed: 'collapsible.keyboard-focus',
    },
  },
  Accordion: {
    axes: { headingLevels: [2, 3, 4, 5, 6] },
    selector: '.ui-accordion',
    states: {
      open: 'accordion.keyboard-focus',
      closed: 'accordion.keyboard-focus',
      disabled: 'accordion.keyboard-focus',
    },
  },
  Tabs: {
    axes: { orientations: ['horizontal', 'vertical'] },
    selector: '.ui-tabs',
    states: { selected: 'tabs.keyboard', disabled: 'tabs.keyboard' },
  },
  Toggle: {
    axes: { variants: ['outline', 'ghost'], sizes: ['sm', 'md', 'lg'] },
    selector: '.ui-toggle',
    states: {
      pressed: 'toggle.visual-theme',
      unpressed: 'toggle.visual-theme',
      disabled: 'toggle.keyboard',
    },
  },
  Tooltip: {
    axes: {},
    selector: '.ui-tooltip__trigger',
    states: {
      hover: 'tooltip.hoverable',
      focus: 'tooltip.focus-hover-escape',
      dismissed: 'tooltip.focus-hover-escape',
    },
  },
  Popover: {
    axes: {},
    selector: '.ui-popover__trigger',
    states: {
      open: 'popover.open-dismiss-focus',
      closed: 'popover.open-dismiss-focus',
    },
  },
  DropdownMenu: {
    axes: {},
    selector: '.ui-dropdown-menu__trigger',
    states: {
      open: 'dropdown-menu.keyboard',
      closed: 'dropdown-menu.activate-dismiss',
    },
  },
  AlertDialog: {
    axes: {},
    selector: '.ui-alert-dialog__trigger',
    states: {
      open: 'alert-dialog.initial-focus-containment',
      closed: 'alert-dialog.dismissal-focus-return',
    },
  },
  Toast: {
    axes: {},
    selector: '.ui-toast',
    states: {
      visible: 'toast.viewport-layout',
      paused: 'toast.pause-on-hover-focus',
      dismissed: 'toast.close-action-keyboard',
    },
  },
  InputGroup: {
    axes: {
      aligns: ['inline-start', 'inline-end', 'block-start', 'block-end'],
    },
    selector: '.ui-input-group__addon',
    states: {
      invalid: 'input-group.visual-states',
      disabled: 'input-group.visual-states',
      readOnly: 'input-group.visual-states',
    },
  },
  ToggleGroup: {
    axes: { orientations: ['horizontal', 'vertical'] },
    selector: '.ui-toggle-group',
    states: {
      single: 'toggle-group.keyboard',
      multiple: 'toggle-group.keyboard',
      disabled: 'toggle-group.keyboard',
    },
  },
  ButtonGroup: {
    axes: { orientations: ['horizontal', 'vertical'] },
    selector: '.ui-button-group',
    states: {
      disabled: 'button-group.keyboard',
      wrapping: 'button-group.visual-layout',
    },
  },
} as const;

type Entry = {
  axes: Record<string, readonly (string | number)[]>;
  selector: string;
  states: Record<string, string>;
};
type Component = {
  qualityRules: readonly { id: string; verification: string }[];
  verificationStates: readonly string[];
  [key: string]: unknown;
};

export function validateCoverage(
  components: Record<string, Component>,
  registry: Record<string, Entry> = coverage,
) {
  const ignored = new Set([
    'parts',
    'qualityRules',
    'avoid',
    'verificationStates',
  ]);
  if (
    Object.keys(components).sort().join() !==
    Object.keys(registry).sort().join()
  )
    throw new Error(
      'Public component coverage registration differs from manifest',
    );
  for (const [name, component] of Object.entries(components)) {
    const entry = registry[name];
    if (!entry || !Object.keys(entry.states).length)
      throw new Error(`Missing states: ${name}`);
    if (
      Object.keys(entry.states).sort().join() !==
      [...component.verificationStates].sort().join()
    )
      throw new Error(`Missing or stale state definitions: ${name}`);
    const axes = Object.fromEntries(
      Object.entries(component).filter(
        ([key, value]) =>
          !ignored.has(key) &&
          Array.isArray(value) &&
          value.every((v) => typeof v === 'string' || typeof v === 'number'),
      ),
    );
    if (
      Object.keys(axes).sort().join() !==
        Object.keys(entry.axes).sort().join() ||
      Object.entries(axes).some(
        ([key, values]) =>
          JSON.stringify(values) !== JSON.stringify(entry.axes[key]),
      )
    )
      throw new Error(`Public axes need fixture review: ${name}`);
    for (const rule of Object.values(entry.states)) {
      if (
        !rule.startsWith('baseline.') &&
        rule !== 'coverage.public-configurations' &&
        !component.qualityRules.some(
          (candidate) =>
            candidate.id === rule && candidate.verification === 'browser',
        )
      )
        throw new Error(`Unknown browser state check: ${name}: ${rule}`);
    }
  }
}

export const requiredStateRuleIds = [
  ...new Set(
    Object.values(coverage).flatMap((entry) => Object.values(entry.states)),
  ),
];
