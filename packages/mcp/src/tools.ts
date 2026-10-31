import { componentManifest } from '@utakata-ui/react/manifest';

type ComponentName = keyof typeof componentManifest.components;

export function listComponents() {
  return Object.entries(componentManifest.components).map(
    ([name, details]) => ({
      name,
      ...details,
    }),
  );
}

export function getComponent(name: string) {
  const componentName = Object.keys(componentManifest.components).find(
    (candidate) => candidate.toLowerCase() === name.toLowerCase(),
  ) as ComponentName | undefined;

  if (!componentName) {
    return undefined;
  }

  return {
    name: componentName,
    ...componentManifest.components[componentName],
  };
}

export function searchComponents(query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return listComponents().filter((component) =>
    JSON.stringify(component).toLowerCase().includes(normalizedQuery),
  );
}
