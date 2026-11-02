import type { QualityRule } from '../quality.js';

export const tooltipQualityRules = [
  {
    id: 'tooltip.description',
    requirement:
      'The trigger has its own accessible name and, while open, is described by the tooltip popup (role="tooltip").',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Give Tooltip.Trigger visible text, aria-label or aria-labelledby; do not use the tooltip as the only name.',
  },
  {
    id: 'tooltip.focus-hover-escape',
    requirement:
      'The tooltip opens after the delay on hover and on keyboard focus, and Escape closes it without moving focus.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Preserve Base UI hover/focus handling; do not open tooltips only from pointer events.',
  },
  {
    id: 'tooltip.hoverable',
    requirement:
      'Moving the pointer from the trigger onto the popup keeps the tooltip open (WCAG 1.4.13).',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Keep the hoverable popup behavior; Tooltip.Root does not accept disableHoverablePopup.',
  },
  {
    id: 'tooltip.no-tab-stop',
    requirement:
      'The tooltip adds no extra Tab stop and contains only short non-interactive text.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Compose Tooltip.Trigger onto an existing control with render; move interactive content to Popover.',
  },
  {
    id: 'tooltip.real-browser',
    requirement:
      'Verify real keyboard focus display, pointer travel to the popup, edge positioning, touch usability without the tooltip, themes, forced colors, 200% zoom and screen-reader description output.',
    verification: 'manual',
    severity: 'error',
    remediation:
      'Record browser, assistive technology, commit and findings before release.',
  },
] as const satisfies readonly QualityRule[];

export const tooltipManifest = {
  qualityRules: tooltipQualityRules,
  description:
    'A short supplementary text label shown on hover and keyboard focus, built on Base UI Tooltip.',
  parts: [
    'Provider',
    'Root',
    'Trigger',
    'Portal',
    'Positioner',
    'Popup',
    'Arrow',
  ],
  partProps: {
    Provider: 'Base UI TooltipProviderProps (delay, closeDelay, timeout)',
    Root: 'Base UI TooltipRootProps without disableHoverablePopup',
    Trigger:
      'Base UI TooltipTriggerProps; renders a button or the render element',
    Portal: 'Base UI TooltipPortalProps',
    Positioner: 'Base UI TooltipPositionerProps (side, align, sideOffset)',
    Popup:
      'Base UI TooltipPopupProps; children is plain text; renders role="tooltip"',
    Arrow:
      'Base UI TooltipArrowProps; place inside Positioner next to Popup because Popup accepts text only',
  },
  defaults: { delay: 600, closeDelay: 0, open: false, side: 'top' },
  composition:
    'Tooltip.Root contains a Trigger and a Portal with Positioner and Popup. Compose Trigger onto an existing control with render (for example render={<Button />}) so no extra Tab stop is added. The popup describes the trigger via aria-describedby while open.',
  avoid: [
    'Do not use the tooltip as the only accessible name or the only source of essential information; touch users may never see it.',
    'Do not place links, buttons or form controls in a tooltip; use Popover for interactive content.',
    'Do not attach a tooltip to a natively disabled button; it cannot receive focus. Use Button focusableWhenDisabled or visible explanatory text.',
  ],
  example:
    '<Tooltip.Provider><Tooltip.Root><Tooltip.Trigger render={<Button iconOnly aria-label="コピー" />}>⧉</Tooltip.Trigger><Tooltip.Portal><Tooltip.Positioner sideOffset={6}><Tooltip.Popup>クリップボードにコピー</Tooltip.Popup></Tooltip.Positioner></Tooltip.Portal></Tooltip.Root></Tooltip.Provider>',
  accessibility:
    'Base UI opens the tooltip on hover and keyboard focus, keeps it open while hovered and closes it with Escape. Utakata-UI adds role="tooltip" and aria-describedby on the trigger while the popup is mounted. The consumer provides the trigger name and keeps essential information visible elsewhere.',
} as const;
