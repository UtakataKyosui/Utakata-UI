import { type ForwardedRef, useCallback, useRef } from 'react';

// Replaced by consumer bundlers, as with React; no Node typings at runtime.
declare const process: { env: { NODE_ENV?: string } };

type Component = 'Button' | 'Field.Control' | 'Dialog.Popup';

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

function nameSource(element: HTMLElement, component: Component): string {
  const doc = element.ownerDocument;
  const references = (element.getAttribute('aria-labelledby') ?? '')
    .trim()
    .split(/\s+/)
    .map((id) => doc.getElementById(id))
    .filter((node): node is HTMLElement => node !== null);
  if (references.length) {
    return references
      .map((node) => textAlternative(node, true))
      .join(' ')
      .trim();
  }
  let name = element.getAttribute('aria-label')?.trim() ?? '';
  if (!name && 'labels' in element)
    name = Array.from(
      (element.labels as NodeListOf<HTMLLabelElement> | null) ?? [],
    )
      .map((label) => textAlternative(label, true))
      .join(' ')
      .trim();
  if (!name && component === 'Button') name = textAlternative(element);
  if (!name) name = element.getAttribute('title')?.trim() ?? '';
  return name;
}

function diagnose(element: HTMLElement, component: Component): string {
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
  const name = nameSource(element, component);
  if (!name) {
    const fix = {
      Button: 'Provide visible text, aria-label, or a valid aria-labelledby.',
      'Field.Control': 'Associate a Field.Label or another accessible label.',
      'Dialog.Popup': 'Provide a Dialog.Title or another accessible label.',
    }[component];
    issues.push(`No accessible name source was found. ${fix}`);
  }
  return issues.join(' ');
}

type Watch = {
  checks: Set<() => void>;
  observer: MutationObserver;
  timer: ReturnType<typeof setTimeout> | undefined;
};
// One development-only observer per document also handles external labels/portals.
const documents = new WeakMap<Document, Watch>();

function observe(element: HTMLElement, component: Component) {
  const doc = element.ownerDocument;
  let previous = '';
  const check = () => {
    if (!element.isConnected) return;
    const message = diagnose(element, component);
    if (message && message !== previous)
      console.warn(`[Utakata-UI a11y] ${component}: ${message}`);
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
        cleanup.current = observe(element, component);
    },
    [component, forwardedRef],
  );
}
