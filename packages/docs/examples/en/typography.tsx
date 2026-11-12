import { Card, Heading, Stack, Text } from '@utakata-ui/react';
import { useId } from 'react';

// The app owns the single page h1; headings inside parts follow its outline.
export default function TypographyExample() {
  const profileId = useId();
  const securityId = useId();
  return (
    <Stack style={{ gap: '1.5rem', maxWidth: '36rem' }}>
      <Heading level="1">Account settings</Heading>
      <Text>
        Choose the heading level from the document outline, not from its look.
      </Text>
      <section aria-labelledby={profileId}>
        <Heading level="2" id={profileId}>
          Profile
        </Heading>
        <Text>Manage the information that is shown publicly.</Text>
        <Card.Root>
          <Card.Title level="3">Display name</Card.Title>
          <Card.Content>
            Card.Title matches the outline through level.
          </Card.Content>
        </Card.Root>
      </section>
      <section aria-labelledby={securityId}>
        <Heading level="2" id={securityId}>
          Security
        </Heading>
        <Text>Manage sign-in and recovery methods.</Text>
      </section>
    </Stack>
  );
}
