import { Field, Stack, Textarea } from '@utakata-ui/react';

export default function TextareaExample() {
  return (
    <Stack style={{ gap: '1.5rem', maxWidth: '32rem' }}>
      <Field.Root name="notes">
        <Field.Label>Notes</Field.Label>
        <Textarea rows={4} maxLength={500} />
        <Field.Description>
          Up to 500 characters. Line breaks are allowed. The input is not
          submitted or saved.
        </Field.Description>
      </Field.Root>
      <Field.Root name="readonly-notes">
        <Field.Label>Previous note (read-only)</Field.Label>
        <Textarea size="sm" readOnly defaultValue={'Line 1\nLine 2'} />
      </Field.Root>
      <Field.Root name="disabled-notes" disabled>
        <Field.Label>Comment (disabled)</Field.Label>
        <Textarea size="lg" defaultValue="This cannot be edited." />
      </Field.Root>
    </Stack>
  );
}
