import axe from 'axe-core';

export async function audit(element: HTMLElement) {
  // jsdom has no layout engine; verify contrast in a real browser manually.
  return axe.run(element, {
    rules: { 'color-contrast': { enabled: false } },
  });
}
