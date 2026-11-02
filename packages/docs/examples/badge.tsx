import { Badge, Flex } from '@utakata-ui/react';

export default function BadgeExample() {
  return (
    <Flex style={{ gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <Badge>確認待ち</Badge>
      <Badge variant="solid">公開中</Badge>
      <Badge variant="outline">下書き</Badge>
      <Badge variant="destructive">
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12">
          <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        公開失敗
      </Badge>
      <Badge variant="outline">
        アクセシビリティチームによるレビューを待っています
      </Badge>
    </Flex>
  );
}
