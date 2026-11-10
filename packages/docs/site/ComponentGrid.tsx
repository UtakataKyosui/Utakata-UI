import { Card } from '@utakata-ui/react';

export interface ComponentGridItem {
  name: string;
  href: string;
  description: string;
}

export interface ComponentGridProps {
  items: ComponentGridItem[];
}

export default function ComponentGrid({ items }: ComponentGridProps) {
  return (
    <ul className="not-prose utakata-docs-block utakata-docs-grid">
      {items.map((item) => (
        <li key={item.name}>
          <Card.Root className="utakata-docs-link-card">
            <Card.Header>
              <Card.Title level="3">
                <a href={item.href}>{item.name}</a>
              </Card.Title>
              <Card.Description>{item.description}</Card.Description>
            </Card.Header>
          </Card.Root>
        </li>
      ))}
    </ul>
  );
}
