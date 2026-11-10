import { Field, Input, Stack } from '@utakata-ui/react';

export default function InputExample() {
  return (
    <Stack style={{ gap: '1.5rem', maxWidth: '28rem' }}>
      <Field.Root name="email">
        <Field.Label>Email address</Field.Label>
        <Input
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
        <Field.Description>
          Required. The input is not submitted or saved.
        </Field.Description>
        <Field.Error match="valueMissing">Enter an email address.</Field.Error>
      </Field.Root>
      <Field.Root name="nickname">
        <Field.Label>Nickname (small)</Field.Label>
        <Input size="sm" autoComplete="nickname" />
      </Field.Root>
      <Field.Root name="account-id">
        <Field.Label>Account ID (read-only)</Field.Label>
        <Input readOnly defaultValue="utakata-001" />
      </Field.Root>
      <Field.Root name="disabled-name" disabled>
        <Field.Label>Name (disabled)</Field.Label>
        <Input size="lg" defaultValue="Hanako Yamada" />
      </Field.Root>
    </Stack>
  );
}
