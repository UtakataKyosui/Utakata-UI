/**
 * Prefixes a route Blume generates with the deployment base (`/guide` under
 * `/docs` becomes `/docs/guide`), matching Blume's built-in layout slots.
 * External and protocol-relative URLs pass through unchanged.
 */
export function mountBase(base: string | undefined, route: string): string {
  const trimmed = (base ?? '/').replace(/\/+$/u, '');
  const rootRelative =
    route.startsWith('/') && !/^\/[\t\n\r]*[/\\]/u.test(route);
  if (!(trimmed && rootRelative)) return route;
  return route === '/' ? trimmed : `${trimmed}${route}`;
}
