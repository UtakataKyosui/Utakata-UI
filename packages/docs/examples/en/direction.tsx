import { Button, Card, Field, Input, Stack } from '@utakata-ui/react';

// Give a right-to-left region dir="rtl" and lang on that subtree.
// Logical properties (inline-start/end) follow the direction.
export default function DirectionExample() {
  return (
    <Stack style={{ gap: '1rem', maxWidth: '28rem' }}>
      <div dir="rtl" lang="ar">
        <Card.Root>
          <Card.Header>
            <Card.Title level="3">تسجيل الدخول</Card.Title>
          </Card.Header>
          <Card.Content>
            <Field.Root name="email">
              <Field.Label>البريد الإلكتروني</Field.Label>
              <Input type="email" autoComplete="email" />
            </Field.Root>
          </Card.Content>
          <Card.Footer>
            <Button style={{ marginInlineStart: 'auto' }}>متابعة</Button>
          </Card.Footer>
        </Card.Root>
      </div>
      <p>
        The frame above uses <code>dir="rtl"</code>. The button is placed at the
        line end with a logical property.
      </p>
    </Stack>
  );
}
