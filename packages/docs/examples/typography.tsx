import { Card, Heading, Stack, Text } from '@utakata-ui/react';
import { useId } from 'react';

// ページの h1 はアプリ側で 1 つ持ち、部品内の見出しはその下の階層に合わせます。
export default function TypographyExample() {
  const profileId = useId();
  const securityId = useId();
  return (
    <Stack style={{ gap: '1.5rem', maxWidth: '36rem' }}>
      <Heading level="1">アカウント設定</Heading>
      <Text>見出しの level は見た目ではなく文書の階層で選びます。</Text>
      <section aria-labelledby={profileId}>
        <Heading level="2" id={profileId}>
          プロフィール
        </Heading>
        <Text>公開される情報を管理します。</Text>
        <Card.Root>
          <Card.Title level="3">表示名</Card.Title>
          <Card.Content>Card.Title は level で階層を合わせます。</Card.Content>
        </Card.Root>
      </section>
      <section aria-labelledby={securityId}>
        <Heading level="2" id={securityId}>
          セキュリティ
        </Heading>
        <Text>サインインと回復手段を管理します。</Text>
      </section>
    </Stack>
  );
}
