import { Badge, Flex } from '@utakata-ui/react';

export default function BadgeExample() {
  return (
    <Flex style={{ gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <Badge>Pending review</Badge>
      <Badge variant="solid">Published</Badge>
      <Badge variant="outline">Draft</Badge>
      <Badge variant="destructive">
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12">
          <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        Publish failed
      </Badge>
      <Badge variant="outline">
        Waiting for review by the accessibility team
      </Badge>
    </Flex>
  );
}
