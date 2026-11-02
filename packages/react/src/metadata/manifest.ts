import { accordionManifest } from './components/Accordion.js';
import { alertManifest } from './components/Alert.js';
import { alertDialogManifest } from './components/AlertDialog.js';
import { avatarManifest } from './components/Avatar.js';
import { badgeManifest } from './components/Badge.js';
import { breadcrumbManifest } from './components/Breadcrumb.js';
import { cardManifest } from './components/Card.js';
import { checkboxManifest } from './components/Checkbox.js';
import { collapsibleManifest } from './components/Collapsible.js';
import { dropdownMenuManifest } from './components/DropdownMenu.js';
import { inputManifest } from './components/Input.js';
import { kbdManifest } from './components/Kbd.js';
import { nativeSelectManifest } from './components/NativeSelect.js';
import { paginationManifest } from './components/Pagination.js';
import { popoverManifest } from './components/Popover.js';
import { progressManifest } from './components/Progress.js';
import { radioGroupManifest } from './components/RadioGroup.js';
import { selectManifest } from './components/Select.js';
import { separatorManifest } from './components/Separator.js';
import { skeletonManifest } from './components/Skeleton.js';
import { sliderManifest } from './components/Slider.js';
import { spinnerManifest } from './components/Spinner.js';
import { switchManifest } from './components/Switch.js';
import { tableManifest } from './components/Table.js';
import { tabsManifest } from './components/Tabs.js';
import { textareaManifest } from './components/Textarea.js';
import { toastManifest } from './components/Toast.js';
import { toggleManifest } from './components/Toggle.js';
import { tooltipManifest } from './components/Tooltip.js';
import { qualityRules } from './quality.js';

export const componentManifest = {
  version: 1,
  framework: 'Utakata-UI',
  sharedQualityRules: qualityRules.shared,
  components: {
    Button: {
      qualityRules: qualityRules.Button,
      description:
        'An action control built on the native button behavior from Base UI.',
      props: {
        variant: {
          type: 'solid | outline | ghost',
          default: 'solid',
        },
        size: {
          type: 'sm | md | lg',
          default: 'md',
        },
        iconOnly: {
          type: 'boolean; true requires aria-label or aria-labelledby',
          default: false,
        },
        disabled: {
          type: 'boolean',
          default: false,
        },
      },
      variants: ['solid', 'outline', 'ghost'],
      sizes: ['sm', 'md', 'lg'],
      composition:
        'Place visible text inside Button. For icon-only content use iconOnly with aria-label or aria-labelledby. Development diagnostics warn about missing name sources and dangling label/description references.',
      avoid: [
        'Do not replace an action button with a non-semantic element.',
        'Do not pass unsupported visual props; use variant, size, className, and CSS custom properties.',
      ],
      example: '<Button variant="solid" size="md">Save</Button>',
      accessibility:
        'Retains Base UI native button semantics, disabled behavior, and keyboard support. iconOnly requires an explicit name source at typecheck time; empty or unresolved names need runtime and axe checks.',
    },
    Field: {
      qualityRules: qualityRules.Field,
      description: 'A form field composed from Base UI Field parts.',
      parts: ['Root', 'Label', 'Control', 'Description', 'Error'],
      partProps: {
        Root: 'Base UI FieldRootProps',
        Label: 'Base UI FieldLabelProps',
        Control: 'Base UI FieldControlProps',
        Description: 'Base UI FieldDescriptionProps',
        Error: 'Base UI FieldErrorProps',
      },
      defaults: { disabled: false, validationMode: 'onSubmit' },
      composition:
        'Field.Root contains Field.Label, Field.Control, and optional Description or Error parts.',
      avoid: [
        'Do not use placeholder text as the only label.',
        'Do not omit Field.Label when composing a control.',
      ],
      example:
        '<Field.Root><Field.Label>Email</Field.Label><Field.Control type="email" /></Field.Root>',
      accessibility:
        'Associate every control with a visible Field.Label; use Description and Error for additional context. Development diagnostics warn about missing name sources and dangling label/description references.',
    },
    Dialog: {
      qualityRules: qualityRules.Dialog,
      description: 'A modal dialog composed from Base UI Dialog parts.',
      parts: [
        'Root',
        'Trigger',
        'Portal',
        'Backdrop',
        'Popup',
        'Title',
        'Description',
        'Close',
      ],
      partProps: {
        Root: 'Base UI DialogRootProps',
        Trigger: 'Base UI DialogTriggerProps',
        Portal: 'Base UI DialogPortalProps',
        Backdrop: 'Base UI DialogBackdropProps',
        Popup: 'Base UI DialogPopupProps',
        Title: 'Base UI DialogTitleProps',
        Description: 'Base UI DialogDescriptionProps',
        Close: 'Base UI DialogCloseProps',
      },
      defaults: { open: false },
      composition:
        'Dialog.Root contains a Trigger and a Portal with Backdrop and Popup; Popup should include a Title.',
      avoid: [
        'Do not create a modal without a Dialog.Title.',
        'Do not duplicate Base UI open state, focus management, or Escape dismissal.',
      ],
      example:
        '<Dialog.Root><Dialog.Trigger>Open</Dialog.Trigger><Dialog.Portal><Dialog.Popup><Dialog.Title>Details</Dialog.Title></Dialog.Popup></Dialog.Portal></Dialog.Root>',
      accessibility:
        'Base UI manages modal focus, dismissal, and dialog semantics; provide a Title and an optional useful Description. Development diagnostics warn about missing name sources and dangling label/description references.',
    },
    Kbd: kbdManifest,
    Separator: separatorManifest,
    Badge: badgeManifest,
    Skeleton: skeletonManifest,
    Spinner: spinnerManifest,
    Card: cardManifest,
    Alert: alertManifest,
    Avatar: avatarManifest,
    Progress: progressManifest,
    Table: tableManifest,
    Breadcrumb: breadcrumbManifest,
    Pagination: paginationManifest,
    Input: inputManifest,
    Textarea: textareaManifest,
    NativeSelect: nativeSelectManifest,
    Checkbox: checkboxManifest,
    Switch: switchManifest,
    RadioGroup: radioGroupManifest,
    Select: selectManifest,
    Slider: sliderManifest,
    Collapsible: collapsibleManifest,
    Accordion: accordionManifest,
    Tabs: tabsManifest,
    Toggle: toggleManifest,
    Tooltip: tooltipManifest,
    Popover: popoverManifest,
    DropdownMenu: dropdownMenuManifest,
    AlertDialog: alertDialogManifest,
    Toast: toastManifest,
  },
} as const;

export type ButtonVariant =
  (typeof componentManifest.components.Button.variants)[number];
export type ButtonSize =
  (typeof componentManifest.components.Button.sizes)[number];
export type KbdSize = (typeof componentManifest.components.Kbd.sizes)[number];
export type SeparatorOrientation =
  (typeof componentManifest.components.Separator.orientations)[number];
