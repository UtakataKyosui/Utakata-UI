import { Tabs, Text } from '@utakata-ui/react';

export default function TabsExample() {
  return (
    <Tabs.Root defaultValue="profile">
      <Tabs.List aria-label="設定">
        <Tabs.Tab value="profile">プロフィール</Tabs.Tab>
        <Tabs.Tab value="security">セキュリティ</Tabs.Tab>
        <Tabs.Tab value="billing" disabled>
          請求（準備中）
        </Tabs.Tab>
        <Tabs.Indicator />
      </Tabs.List>
      <Tabs.Panel value="profile">
        <Text>表示名とアイコンを変更できます。</Text>
      </Tabs.Panel>
      <Tabs.Panel value="security">
        <Text>パスワードと2段階認証を設定できます。</Text>
      </Tabs.Panel>
      <Tabs.Panel value="billing">
        <Text>請求情報は準備中です。</Text>
      </Tabs.Panel>
    </Tabs.Root>
  );
}
