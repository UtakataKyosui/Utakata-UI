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
      accessibility:
        'Retains Base UI native button semantics, disabled behavior, and keyboard support.',
    },
    Field: {
      description: 'A form field composed from Base UI Field parts.',
      parts: ['Root', 'Label', 'Control', 'Description', 'Error'],
      composition:
        'Field.Root contains Field.Label, Field.Control, and optional Description or Error parts.',
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
      composition:
        'Dialog.Root contains a Trigger and a Portal with Backdrop and Popup; Popup should include a Title.',
      accessibility:
        'Base UI manages modal focus, dismissal, and dialog semantics; provide a Title and useful Description.',
    },
  },
} as const;

export type ButtonVariant =
  (typeof componentManifest.components.Button.variants)[number];
export type ButtonSize =
  (typeof componentManifest.components.Button.sizes)[number];
