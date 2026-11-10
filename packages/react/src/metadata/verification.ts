/** Reviewed public verification states. Adding/removing a state requires a coverage review.
 * State evidence does not imply all state × visual-axis permutations were run. */
const verificationStates = {
  Button: ['enabled', 'keyboard', 'disabled'],
  Field: ['labelled', 'focus'],
  Dialog: ['open', 'closed'],
  Kbd: ['static'],
  Separator: ['decorative', 'semantic'],
  Sheet: ['open', 'closed'],
  Badge: ['short', 'long', 'icon'],
  Skeleton: ['loading', 'reducedMotion', 'forcedColors'],
  Spinner: ['running', 'reducedMotion'],
  Card: ['longContent'],
  Alert: ['static', 'longContent'],
  Avatar: ['image', 'fallback'],
  Progress: ['determinate', 'indeterminate'],
  Table: ['overflow'],
  Breadcrumb: ['current', 'wrapping'],
  Pagination: ['disabled', 'current'],
  Input: ['enabled', 'disabled', 'readOnly', 'invalid'],
  Textarea: ['enabled', 'disabled', 'readOnly', 'invalid'],
  NativeSelect: ['enabled', 'disabled', 'invalid'],
  Checkbox: ['checked', 'unchecked', 'resetCanceled'],
  Switch: ['enabled', 'disabled', 'readOnly'],
  RadioGroup: ['selected', 'disabled'],
  Select: ['open', 'dismissed'],
  Slider: ['minimum', 'maximum'],
  Collapsible: ['open', 'closed'],
  Accordion: ['open', 'closed', 'disabled'],
  Tabs: ['selected', 'disabled'],
  Toggle: ['pressed', 'unpressed', 'disabled'],
  Tooltip: ['hover', 'focus', 'dismissed'],
  Popover: ['open', 'closed'],
  DropdownMenu: ['open', 'closed'],
  AlertDialog: ['open', 'closed'],
  Toast: ['visible', 'paused', 'dismissed'],
  InputGroup: ['invalid', 'disabled', 'readOnly'],
  ToggleGroup: ['single', 'multiple', 'disabled'],
  ButtonGroup: ['disabled', 'wrapping'],
} as const;

export function withVerificationStates<
  T extends Record<keyof typeof verificationStates, unknown>,
>(components: T) {
  return Object.fromEntries(
    Object.entries(components).map(([name, component]) => [
      name,
      {
        ...(component as object),
        verificationStates:
          verificationStates[name as keyof typeof verificationStates],
      },
    ]),
  ) as { [K in keyof T]: T[K] & { verificationStates: readonly string[] } };
}
