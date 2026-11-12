import type { QualityRule } from '../quality.js';

export const emptyQualityRules = [
  {
    id: 'empty.structure',
    requirement:
      'The empty state renders a static container, a native heading at the chosen level, and a paragraph for the explanation. Actions retain their native semantics.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Use Empty.Title at the appropriate heading level and put named buttons or links inside Empty.Actions.',
  },
  {
    id: 'empty.reflow-actions',
    requirement:
      'Long Japanese and English text wraps at 320 CSS px and 200% text size. Action controls retain their accessible names and keyboard focus in light, dark and forced colors.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Allow the text and actions to wrap, give each action a descriptive visible label, and keep the focus indicator visible.',
  },
  {
    id: 'empty.zoom-assistive',
    requirement:
      'At real browser zoom the empty state reflows without content loss, and assistive technology reads the heading, explanation and actions in order.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Verify real browser zoom and screen reader output in supported environments.',
  },
] as const satisfies readonly QualityRule[];

export const emptyManifest = {
  qualityRules: emptyQualityRules,
  description:
    'An empty state with a heading, an explanation and optional actions.',
  parts: ['Root', 'Title', 'Description', 'Actions'],
  partProps: {
    Root: 'native div props without role or aria-live',
    Title: 'native h1-h6 props + level; children required',
    Description: 'native p props',
    Actions: 'native div props',
  },
  props: {
    level: { type: '1 | 2 | 3 | 4 | 5 | 6 (Empty.Title)', default: '3' },
  },
  defaults: { level: '3' },
  headingLevels: ['1', '2', '3', '4', '5', '6'],
  composition:
    'Place Title and Description inside Root. Add Actions only when the user can take a next step. Use a Button for an action and an anchor for navigation. Adjust spacing with --ui-empty-padding and --ui-empty-gap or Lism style props.',
  avoid: [
    'Use a separate status region when a dynamic result needs to be announced.',
    'Use application state to determine when to display the empty state.',
  ],
  example:
    '<Empty.Root><Empty.Title level="2">No projects</Empty.Title><Empty.Description>Create a project to get started.</Empty.Description><Empty.Actions><Button>Create project</Button></Empty.Actions></Empty.Root>',
  accessibility:
    'The root has no announcement role and does not move focus. Consumers choose the heading level, supply descriptive action names and manage any announcements or focus changes after actions.',
} as const;

export type EmptyTitleLevel = (typeof emptyManifest.headingLevels)[number];
