import { Field, Stack } from '@utakata-ui/react';

export default function FieldExample() {
  return (
    <Stack style={{ gap: '1.5rem', maxWidth: '28rem' }}>
      <Field.Root name="email">
        <Field.Label>Email address</Field.Label>
        <Field.Control
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
        />
        <Field.Description>
          Try typing. The input is not submitted or saved.
        </Field.Description>
      </Field.Root>
      <Field.Root name="disabled-email" disabled>
        <Field.Label>Email address (disabled)</Field.Label>
        <Field.Control type="email" defaultValue="hello@example.com" />
        <Field.Description>An example of the disabled state.</Field.Description>
      </Field.Root>
    </Stack>
  );
}
