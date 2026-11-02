import type { QualityRule } from '../quality.js';

export const alertDialogQualityRules = [
  {
    id: 'alert-dialog.semantics',
    requirement:
      'An open alert dialog exposes role="alertdialog" with an accessible name from AlertDialog.Title and a description from AlertDialog.Description.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Compose AlertDialog.Title and AlertDialog.Description inside AlertDialog.Popup; resolve development diagnostics.',
  },
  {
    id: 'alert-dialog.initial-focus-containment',
    requirement:
      'In a real browser opening moves focus to the least destructive action (the cancel Close placed first or targeted by initialFocus), and Tab and Shift+Tab keep focus inside the popup while the page behind is inert.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Place AlertDialog.Close before the confirming action or pass initialFocus to AlertDialog.Popup; preserve Base UI focus management.',
  },
  {
    id: 'alert-dialog.dismissal-focus-return',
    requirement:
      'In a real browser Cancel and Escape close the dialog and restore focus to the trigger; pointer presses outside the popup do not close it.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep Base UI Alert Dialog dismissal; do not reuse the outside-press dismissal of a normal Dialog.',
  },
  {
    id: 'alert-dialog.confirm-controlled',
    requirement:
      'The confirming action calls its handler once, and a controlled open state decides when the dialog closes (for example after asynchronous work).',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Run the action from a consumer Button and close with controlled open/onOpenChange; do not build a confirm Promise API.',
  },
  {
    id: 'alert-dialog.forced-focus',
    requirement:
      'In a real browser with forced colors active the popup keeps a visible border and every focused popup action keeps a system-color outline of at least 2px.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the forced-colors popup border and the outline fallback for focusable popup descendants.',
  },
  {
    id: 'alert-dialog.platform-manual',
    requirement:
      'The alert announcement, real 200% browser zoom and real high-contrast modes are verified in real browsers with screen readers.',
    verification: 'manual',
    severity: 'error',
    remediation:
      'Record browser, assistive technology, theme and findings before release; leave unverified until performed.',
  },
] as const satisfies readonly QualityRule[];

export const alertDialogManifest = {
  qualityRules: alertDialogQualityRules,
  description:
    'A modal confirmation for important or destructive actions, composed from Base UI Alert Dialog parts.',
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
    Root: 'Base UI AlertDialogRootProps (open, defaultOpen, onOpenChange)',
    Trigger: 'Base UI AlertDialogTriggerProps',
    Portal: 'Base UI DialogPortalProps',
    Backdrop: 'Base UI DialogBackdropProps',
    Popup: 'Base UI DialogPopupProps (initialFocus, finalFocus)',
    Title: 'Base UI DialogTitleProps',
    Description: 'Base UI DialogDescriptionProps',
    Close: 'Base UI DialogCloseProps',
  },
  defaults: { open: false },
  composition:
    'AlertDialog.Root contains a Trigger and a Portal with Backdrop and Popup. Popup includes a Title, a Description, an AlertDialog.Close cancel action placed first (or targeted by initialFocus) and a consumer Button for the confirming action. Close asynchronously with controlled open/onOpenChange.',
  avoid: [
    'Do not create an alert dialog without AlertDialog.Title and Description.',
    'Do not place the destructive action first or give it initial focus.',
    'Do not add outside-click dismissal or a custom confirm Promise service.',
  ],
  example:
    '<AlertDialog.Root><AlertDialog.Trigger render={<Button />}>削除</AlertDialog.Trigger><AlertDialog.Portal><AlertDialog.Backdrop /><AlertDialog.Popup><AlertDialog.Title>削除しますか</AlertDialog.Title><AlertDialog.Description>元に戻せません。</AlertDialog.Description><AlertDialog.Close render={<Button variant="outline" />}>キャンセル</AlertDialog.Close><Button onClick={() => {}}>削除する</Button></AlertDialog.Popup></AlertDialog.Portal></AlertDialog.Root>',
  accessibility:
    'Base UI renders role="alertdialog", traps focus, closes on Escape and restores focus to the trigger; unlike Dialog, outside presses do not dismiss it. Consumers supply the Title, Description, a non-destructive first action and the confirming handler. Development diagnostics warn when the popup has no name source.',
} as const;
