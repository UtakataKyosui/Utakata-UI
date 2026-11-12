import type { QualityRule } from '../quality.js';

export const itemQualityRules = [
  {
    id: 'item.structure',
    requirement:
      'Every part is optional and forwards class, ref and HTML attributes; Item.Group renders a ul whose Item.Root children become li, Item.Root outside a group is a div, and Item.Icon is always aria-hidden.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Compose Item.Group > Item.Root for lists; Item.Icon is decorative, so state its meaning in Item.Title text.',
  },
  {
    id: 'item.semantics',
    requirement:
      'A static Item has no role, tabindex or click behavior and exposes no focusable element; Item.Link is a native a with an href named by its text; Item.Button is a native button with type="button" named by its text; each Item has at most one such primary control.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Use Item.Link to navigate and Item.Button to act; leave Item.Root static and do not add onClick, tabIndex or role to it.',
  },
  {
    id: 'item.no-nested-interactive',
    requirement:
      'Item.Actions, Item.Meta and Item.Icon are siblings of the primary control, never inside it. Development diagnostics warn when an Item.Link or Item.Button contains an interactive element, sits inside Item.Actions, Item.Meta or Item.Icon, when an Item has more than one primary control, or when an Item is wrapped by an interactive element. Valid compositions emit no warning.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Move Buttons and links out of Item.Link/Item.Button into Item.Actions; keep one primary control per Item. These are runtime DOM diagnostics, not type warnings.',
  },
  {
    id: 'item.focus-order',
    requirement:
      'Tab order follows the DOM: the primary control first, then each Item.Actions control in source order; the stretched link target adds no extra tab stop.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Keep Item.Body before Item.Actions in the source and do not use positive tabindex or CSS order to rearrange operable parts.',
  },
  {
    id: 'item.layout-focus',
    requirement:
      'In a real browser long unbroken text in the title, description and meta wraps without clipping or overflow at 320 CSS px and 200% text size; text keeps at least 4.5:1 contrast; an Item.Link title is underlined so it differs without color; real Tab visits the primary control and then each action once in order; the focused primary control shows a visible indicator around the whole row, and in forced colors that indicator is a system-color outline of at least 2px; every action target is at least 24 by 24 CSS px; and pointer activation on the row triggers the primary control while an action beside it triggers only itself.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep overflow-wrap and wrapping on Item.Root, the stretched ::after focus ring and its forced-colors outline, and the stacking of Item.Actions above the stretched target.',
  },
  {
    id: 'item.zoom-assistive',
    requirement:
      'At real 200% browser zoom and in real high-contrast modes the row stays readable and operable, and screen readers announce the link or button name, the description in reading order, and each action by its name.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Record NVDA + Firefox and VoiceOver + Safari results with browser zoom and high-contrast modes; leave unverified until performed.',
  },
] as const satisfies readonly QualityRule[];

export const itemManifest = {
  qualityRules: itemQualityRules,
  description:
    'A row that composes an icon, body, supplementary meta and separate actions, optionally operable as one link or button.',
  parts: [
    'Group',
    'Root',
    'Icon',
    'Body',
    'Title',
    'Description',
    'Meta',
    'Actions',
    'Link',
    'Button',
  ],
  partProps: {
    Group: 'native ul props; provides list semantics for Root children',
    Root: 'native div props (li inside Group); onClick, tabIndex and role are rejected by types',
    Icon: 'native div props; always aria-hidden; aria-label, aria-labelledby, aria-hidden and role are rejected by types',
    Body: 'native div props',
    Title: 'native div props; static text',
    Description: 'native p props',
    Meta: 'native div props; static supplementary text',
    Actions: 'native div props; holds Button or link siblings',
    Link: 'native a props + Base UI render; requires href or render, and children as the name; role is rejected',
    Button:
      'native button props; always type="button"; requires children as the name; type and role are rejected',
  },
  defaults: { Button: 'type="button"', Icon: 'aria-hidden="true"' },
  composition:
    'Item.Group > Item.Root > (Item.Icon, Item.Body > (Item.Title | Item.Link | Item.Button, Item.Description), Item.Meta, Item.Actions). Static rows use Item.Title. Put exactly one Item.Link (navigation, or a router link via render) or Item.Button (action) in Item.Body to make the whole row operable through a stretched native control. Further operations go in Item.Actions as siblings, named with Button (icon-only Buttons need aria-label). Spacing, border and background use --ui-item-gap, --ui-item-padding, --ui-item-border, --ui-item-background and --ui-item-hover-background.',
  avoid: [
    'Do not put Button, links or inputs inside Item.Link, Item.Button, Item.Meta or Item.Icon; use Item.Actions.',
    'Do not add onClick, tabIndex or role to Item.Root; use Item.Link or Item.Button.',
    'Do not use more than one Item.Link or Item.Button per Item.',
    'Do not rely on Item.Icon or Item.Meta color for essential information; state it in text.',
    'Do not wrap an Item in a link or button.',
  ],
  example:
    '<Item.Group><Item.Root><Item.Icon><FileIcon /></Item.Icon><Item.Body><Item.Link href="/report">月次レポート</Item.Link><Item.Description>2026年10月分</Item.Description></Item.Body><Item.Meta>更新: 11月1日</Item.Meta><Item.Actions><Button iconOnly aria-label="月次レポートを削除" variant="ghost"><TrashIcon /></Button></Item.Actions></Item.Root></Item.Group>',
  accessibility:
    'Static div (li in a Group), native a and button elements, no custom roles. The link or button text is the name; the stretched hit area is a CSS pseudo-element, not an extra control, so the tab order is the DOM order. Consumers supply meaningful link text, action names, language and list context. Types and development diagnostics catch common nesting mistakes; they do not prove text quality, real keyboard or screen reader behavior, or customized styling.',
} as const;
