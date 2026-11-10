import { Button, Card, Field, Grid } from '@utakata-ui/react';

export default function CardExample() {
  return (
    <Grid
      style={{
        gap: '1rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))',
      }}
    >
      <Card.Root>
        <Card.Header>
          <Card.Title>Profile</Card.Title>
          <Card.Description>Edit your public information</Card.Description>
        </Card.Header>
        <Card.Content>
          <Field.Root>
            <Field.Label>Display name</Field.Label>
            <Field.Control defaultValue="Aya" />
          </Field.Root>
        </Card.Content>
        <Card.Footer>
          <Button>Save</Button>
        </Card.Footer>
      </Card.Root>
      <Card.Root>
        <Card.Title level="4">Announcement</Card.Title>
        <Card.Content>
          Long text wraps while keeping the inner padding. The Card itself is
          not clickable; buttons and links inside it handle actions.
        </Card.Content>
      </Card.Root>
    </Grid>
  );
}
