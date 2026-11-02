import type { QualityRule } from '../quality.js';

export const toastQualityRules = [
  {
    id: 'toast.live-announcement',
    requirement:
      'The viewport is a named polite live region; adding a toast does not move focus, and high-priority toasts are additionally announced through role="alert".',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Render one Toast.Viewport inside Toast.Provider, name it in the page language with aria-label, and reserve priority "high" for urgent errors.',
  },
  {
    id: 'toast.lifecycle',
    requirement:
      'Toasts added through useToastManager render with their title and description, update in place by ID, close individually and are removed after the timeout.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Manage toasts only with manager.add/update/close; map manager.toasts to Toast.Root with a stable key.',
  },
  {
    id: 'toast.pause-on-hover-focus',
    requirement:
      'In a real browser auto-dismiss timers pause while the pointer is over the viewport or keyboard focus is inside it, and resume afterwards (WCAG 2.2.1).',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Preserve Base UI viewport hover/focus handling; do not implement separate timers.',
  },
  {
    id: 'toast.persistent-timeout',
    requirement:
      'A toast added with timeout 0 stays until the user closes it, so notifications with actions or important errors are not lost automatically.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Use timeout: 0 for toasts that contain an Action or information the user must act on; also keep important actions available elsewhere on the page.',
  },
  {
    id: 'toast.close-action-keyboard',
    requirement:
      'In a real browser F6 moves focus into the viewport, Toast.Close and Toast.Action are reached by Tab as named native buttons, Enter or Space on Close and Escape inside the toast close it, and Action runs its handler once.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Give Close visible text or aria-label and Action a descriptive label; keep Base UI keyboard handling.',
  },
  {
    id: 'toast.viewport-layout',
    requirement:
      'In a real browser a stack of tall toasts in a short viewport stays inside the screen, the viewport scrolls instead of leaving the top unreachable, toast items keep their full content height, and in forced colors the focused Action and Close keep a system-color outline of at least 2px.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the viewport max height and overflow scrolling, flex-shrink: 0 on toasts and the forced-colors outline for focusable toast parts.',
  },
  {
    id: 'toast.platform-manual',
    requirement:
      'Announcements, notification frequency, real 200% browser zoom, real high-contrast modes and reduced motion are verified in real browsers with screen readers.',
    verification: 'manual',
    severity: 'error',
    remediation:
      'Record browser, assistive technology, theme and findings before release; leave unverified until performed.',
  },
] as const satisfies readonly QualityRule[];

export const toastManifest = {
  qualityRules: toastQualityRules,
  description:
    'Temporary notifications managed by the Base UI Toast manager, announced without moving focus.',
  parts: [
    'Provider',
    'Portal',
    'Viewport',
    'Root',
    'Content',
    'Title',
    'Description',
    'Action',
    'Close',
  ],
  partProps: {
    Provider: 'Base UI ToastProviderProps (timeout, limit)',
    Portal: 'Base UI ToastPortalProps',
    Viewport: 'Base UI ToastViewportProps; default aria-label "Notifications"',
    Root: 'Base UI ToastRootProps; toast object from useToastManager is required',
    Content: 'Base UI ToastContentProps',
    Title: 'Base UI ToastTitleProps; defaults to toast.title',
    Description: 'Base UI ToastDescriptionProps; defaults to toast.description',
    Action:
      'Base UI ToastActionProps; renders only with children or toast.actionProps',
    Close:
      'Base UI ToastCloseProps; requires children, aria-label or aria-labelledby',
  },
  hooks: {
    useToastManager:
      'Returns { toasts, add, update, close, promise } for the nearest Toast.Provider',
  },
  defaults: { timeout: 5000, limit: 3, priority: 'low' },
  composition:
    'Wrap the app in Toast.Provider and render one Toast.Portal > Toast.Viewport that maps useToastManager().toasts to Toast.Root > Toast.Content with Title, Description, optional Action and Close. Trigger notifications with manager.add({ title, description }).',
  avoid: [
    'Do not render more than one Viewport per Provider or build a separate queue or global singleton.',
    'Do not place the only path to an important action in an auto-dismissed toast; use timeout: 0 and keep the action available elsewhere.',
    'Do not use priority "high" for routine success messages.',
    'Do not fire toasts repeatedly for the same event; update an existing toast by ID instead.',
  ],
  example:
    'function Toasts() { const { toasts } = useToastManager(); return toasts.map((toast) => <Toast.Root key={toast.id} toast={toast}><Toast.Content><Toast.Title /><Toast.Description /><Toast.Close>閉じる</Toast.Close></Toast.Content></Toast.Root>); }\nfunction SaveButton() { const manager = useToastManager(); return <Button onClick={() => manager.add({ title: "保存しました", description: "変更を反映しました。" })}>保存</Button>; }\nexport const app = <Toast.Provider><SaveButton /><Toast.Portal><Toast.Viewport aria-label="通知"><Toasts /></Toast.Viewport></Toast.Portal></Toast.Provider>;',
  accessibility:
    'Base UI exposes the viewport as a polite live region, announces high-priority toasts through role="alert", pauses timers on hover/focus, moves focus to the viewport with F6 and returns it afterwards. Consumers choose priority, timeout (0 for persistent), concise text and a localized viewport aria-label. Development diagnostics warn when a toast or action has no name source.',
} as const;
