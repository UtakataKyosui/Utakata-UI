import { Avatar, Flex, Text } from '@utakata-ui/react';

const photo =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%232357c6'/%3E%3Ccircle cx='20' cy='16' r='7' fill='%23fff'/%3E%3Cpath d='M6 40a14 14 0 0 1 28 0' fill='%23fff'/%3E%3C/svg%3E";

export default function AvatarExample() {
  return (
    <Flex style={{ gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <Avatar.Root size="sm">
        <Avatar.Image src={photo} alt="Aya" />
        <Avatar.Fallback>A</Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root>
        <Avatar.Image src="/missing-avatar.jpg" alt="Ken" />
        <Avatar.Fallback>K</Avatar.Fallback>
      </Avatar.Root>
      <Flex style={{ gap: '0.5rem', alignItems: 'center' }}>
        <Avatar.Root size="lg">
          <Avatar.Image src={photo} alt="" />
          <Avatar.Fallback aria-hidden="true">A</Avatar.Fallback>
        </Avatar.Root>
        <Text>
          Aya (the image is decorative because the name is next to it)
        </Text>
      </Flex>
    </Flex>
  );
}
