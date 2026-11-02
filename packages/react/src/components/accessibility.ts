import { type ForwardedRef, useCallback, useRef } from 'react';

// Replaced by consumer bundlers, as with React; no Node typings at runtime.
declare const process: { env: { NODE_ENV?: string } };

/** Describes a control whose accessible name is checked in development. */
interface DiagnosticTarget {
  /** Public part name used in warning messages, e.g. "Input". */
  name: string;
  /** Remediation appended to a missing-name warning. */
  fix: string;
  /** Whether visible text content is a valid name source, as for buttons. */
  nameFromContent?: boolean;
}

const builtInTargets = {
  Button: {
    name: 'Button',
    fix: 'Provide visible text, aria-label, or a valid aria-labelledby.',
    nameFromContent: true,
  },
  'Field.Control': {
    name: 'Field.Control',
    fix: 'Associate a Field.Label or another accessible label.',
  },
  'Dialog.Popup': {
    name: 'Dialog.Popup',
    fix: 'Provide a Dialog.Title or another accessible label.',
  },
} as const satisfies Record<string, DiagnosticTarget>;

type Component = keyof typeof builtInTargets | DiagnosticTarget;

function resolveTarget(component: Component): DiagnosticTarget {
  return typeof component === 'string' ? builtInTargets[component] : component;
}

// Checks common name sources, not the complete Accessible Name algorithm.
// Browser/axe checks remain necessary for complex markup and CSS content.
function textAlternative(element: Element, referenced = false): string {
  if (
    !referenced &&
    (element.getAttribute('aria-hidden') === 'true' ||
      element.hasAttribute('hidden') ||
      element.ownerDocument.defaultView?.getComputedStyle(element).display ===
        'none')
  )
    return '';
  const explicit = element.getAttribute('aria-label')?.trim();
  if (explicit) return explicit;
  if (element.tagName === 'IMG') return element.getAttribute('alt') ?? '';
  return Array.from(element.childNodes)
    .map((child) =>
      child.nodeType === 3
        ? child.textContent
        : child.nodeType === 1
          ? textAlternative(child as Element, referenced)
          : '',
    )
    .join(' ')
    .trim();
}

function joinText(nodes: Iterable<Element>): string {
  return Array.from(nodes, (node) => textAlternative(node, true))
    .join(' ')
    .trim();
}

function labelledByName(element: HTMLElement): string | undefined {
  const doc = element.ownerDocument;
  const references = (element.getAttribute('aria-labelledby') ?? '')
    .trim()
    .split(/\s+/)
    .map((id) => doc.getElementById(id))
    .filter((node): node is HTMLElement => node !== null);
  return references.length ? joinText(references) : undefined;
}

function nameSource(element: HTMLElement, target: DiagnosticTarget): string {
  const referenced = labelledByName(element);
  if (referenced !== undefined) return referenced;
  const labels =
    'labels' in element
      ? (element.labels as NodeListOf<HTMLLabelElement> | null)
      : null;
  return (
    element.getAttribute('aria-label')?.trim() ||
    joinText(labels ?? []) ||
    (target.nameFromContent ? textAlternative(element) : '') ||
    element.getAttribute('title')?.trim() ||
    ''
  );
}

function diagnose(element: HTMLElement, target: DiagnosticTarget): string {
  const issues: string[] = [];
  const doc = element.ownerDocument;
  for (const attribute of ['aria-labelledby', 'aria-describedby']) {
    const value = element.getAttribute(attribute);
    if (value === null) continue;
    const ids = value.trim().split(/\s+/).filter(Boolean);
    if (!ids.length || ids.some((id) => !doc.getElementById(id)))
      issues.push(
        `${attribute} must reference existing elements with nonempty IDs.`,
      );
  }
  const name = nameSource(element, target);
  if (!name) issues.push(`No accessible name source was found. ${target.fix}`);
  return issues.join(' ');
}

type Watch = {
  checks: Set<() => void>;
  observer: MutationObserver;
  timer: ReturnType<typeof setTimeout> | undefined;
};
// One development-only observer per document also handles external labels/portals.
const documents = new WeakMap<Document, Watch>();

function observe(element: HTMLElement, target: DiagnosticTarget) {
  const doc = element.ownerDocument;
  let previous = '';
  const check = () => {
    if (!element.isConnected) return;
    const message = diagnose(element, target);
    if (message && message !== previous)
      console.warn(`[Utakata-UI a11y] ${target.name}: ${message}`);
    previous = message;
  };
  let entry = documents.get(doc);
  if (!entry) {
    const checks = new Set<() => void>();
    const observer = new MutationObserver(() => {
      const current = documents.get(doc);
      if (!current || current.timer !== undefined) return;
      current.timer = setTimeout(() => {
        current.timer = undefined;
        for (const run of checks) run();
      }, 0);
    });
    entry = { checks, observer, timer: undefined };
    documents.set(doc, entry);
    observer.observe(doc, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [
        'id',
        'aria-label',
        'aria-labelledby',
        'aria-describedby',
        'aria-hidden',
        'hidden',
        'alt',
        'title',
        'for',
        'style',
        'class',
      ],
    });
  }
  entry.checks.add(check);
  // Sibling labels and Base UI's generated IDs must commit before inspection.
  const initial = setTimeout(check, 0);
  return () => {
    clearTimeout(initial);
    entry.checks.delete(check);
    if (!entry.checks.size) {
      entry.observer.disconnect();
      clearTimeout(entry.timer);
      documents.delete(doc);
    }
  };
}

export function useAccessibilityRef<T extends HTMLElement>(
  component: Component,
  forwardedRef: ForwardedRef<T>,
) {
  const cleanup = useRef<(() => void) | undefined>(undefined);
  const refCleanup = useRef<(() => void) | undefined>(undefined);
  return useCallback(
    (element: T | null) => {
      cleanup.current?.();
      cleanup.current = undefined;
      if (typeof forwardedRef === 'function') {
        if (!element && refCleanup.current) {
          refCleanup.current();
          refCleanup.current = undefined;
        } else {
          const result: unknown = forwardedRef(element);
          refCleanup.current =
            typeof result === 'function' ? (result as () => void) : undefined;
        }
      } else if (forwardedRef) forwardedRef.current = element;
      if (element && process.env.NODE_ENV !== 'production')
        cleanup.current = observe(element, resolveTarget(component));
    },
    [component, forwardedRef],
  );
}
