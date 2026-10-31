export const componentManifest = {
  version: 1,
  framework: 'Utakata-UI',
  components: {
    Button: {
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
        disabled: {
          type: 'boolean',
          default: false,
        },
      },
      variants: ['solid', 'outline', 'ghost'],
      sizes: ['sm', 'md', 'lg'],
      composition:
        'Place an accessible text label or an explicitly labelled icon inside Button.',
      avoid: [
        'Do not replace an action button with a non-semantic element.',
        'Do not pass unsupported visual props; use variant, size, className, and CSS custom properties.',
      ],
      example: '<Button variant="solid" size="md">Save</Button>',
      accessibility:
        'Retains Base UI native button semantics, disabled behavior, and keyboard support.',
    },
    Field: {
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
        'Associate every control with a visible Field.Label; use Description and Error for additional context.',
    },
    Dialog: {
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
        'Base UI manages modal focus, dismissal, and dialog semantics; provide a Title and useful Description.',
    },
  },
} as const;

export type ButtonVariant =
  (typeof componentManifest.components.Button.variants)[number];
export type ButtonSize =
  (typeof componentManifest.components.Button.sizes)[number];
