import { Badge } from '@utakata-ui/react';

export interface BadgeListProps {
  label: string;
  items: string[];
}

export default function BadgeList({ label, items }: BadgeListProps) {
  return (
    <ul aria-label={label} className="not-prose utakata-docs-badges">
      {items.map((item) => (
        <li key={item}>
          <Badge variant="outline">{item}</Badge>
        </li>
      ))}
    </ul>
  );
}
