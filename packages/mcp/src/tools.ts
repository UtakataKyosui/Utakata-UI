import { componentManifest } from '@utakata-ui/react/manifest';

type ComponentName = keyof typeof componentManifest.components;

interface QualityRuleEntry {
  readonly id: string;
  readonly requirement: string;
  readonly verification: 'automated' | 'browser' | 'manual';
  readonly severity: 'error' | 'warning';
  readonly remediation: string;
}

/**
 * A manifest entry plus shared review rules. Typed loosely because the
 * inferred union over every component exceeds TypeScript's declaration limit.
 */
export interface ComponentInfo {
  readonly name: string;
  readonly qualityRules: readonly QualityRuleEntry[];
  readonly [key: string]: unknown;
}

export function listComponents(): ComponentInfo[] {
  return Object.entries(componentManifest.components).map(
    ([name, details]) => ({
      name,
      ...details,
      qualityRules: [
        ...details.qualityRules,
        ...componentManifest.sharedQualityRules,
      ],
    }),
  );
}

export function getComponent(name: string): ComponentInfo | undefined {
  const componentName = Object.keys(componentManifest.components).find(
    (candidate) => candidate.toLowerCase() === name.toLowerCase(),
  ) as ComponentName | undefined;

  if (!componentName) {
    return undefined;
  }

  return {
    name: componentName,
    ...componentManifest.components[componentName],
    qualityRules: [
      ...componentManifest.components[componentName].qualityRules,
      ...componentManifest.sharedQualityRules,
    ],
  };
}

export function searchComponents(query: string): ComponentInfo[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return listComponents().filter((component) =>
    JSON.stringify(component).toLowerCase().includes(normalizedQuery),
  );
}
