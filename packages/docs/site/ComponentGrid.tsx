import { Card } from '@utakata-ui/react';
import { mountBase } from './base-path.js';

export interface ComponentGridItem {
  name: string;
  href: string;
  description: string;
}

export interface ComponentGridProps {
  items: ComponentGridItem[];
  /** Deployment base (`import.meta.env.BASE_URL`), passed by the Astro wrapper. */
  base?: string;
}

export default function ComponentGrid({ items, base }: ComponentGridProps) {
  return (
    <ul className="not-prose utakata-docs-block utakata-docs-grid">
      {items.map((item) => (
        <li key={item.name}>
          <Card.Root className="utakata-docs-link-card">
            <Card.Header>
              <Card.Title level="3">
                <a href={mountBase(base, item.href)}>{item.name}</a>
              </Card.Title>
              <Card.Description>{item.description}</Card.Description>
            </Card.Header>
          </Card.Root>
        </li>
      ))}
    </ul>
  );
}
