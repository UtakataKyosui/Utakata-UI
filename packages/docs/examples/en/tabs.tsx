import { Tabs, Text } from '@utakata-ui/react';

export default function TabsExample() {
  return (
    <Tabs.Root defaultValue="profile">
      <Tabs.List aria-label="Settings">
        <Tabs.Tab value="profile">Profile</Tabs.Tab>
        <Tabs.Tab value="security">Security</Tabs.Tab>
        <Tabs.Tab value="billing" disabled>
          Billing (coming soon)
        </Tabs.Tab>
        <Tabs.Indicator />
      </Tabs.List>
      <Tabs.Panel value="profile">
        <Text>Change your display name and icon.</Text>
      </Tabs.Panel>
      <Tabs.Panel value="security">
        <Text>Set your password and two-step verification.</Text>
      </Tabs.Panel>
      <Tabs.Panel value="billing">
        <Text>Billing information is coming soon.</Text>
      </Tabs.Panel>
    </Tabs.Root>
  );
}
