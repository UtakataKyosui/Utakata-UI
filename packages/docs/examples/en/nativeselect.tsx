import { Field, NativeSelect, Stack } from '@utakata-ui/react';

export default function NativeSelectExample() {
  return (
    <Stack style={{ gap: '1.5rem', maxWidth: '28rem' }}>
      <Field.Root name="country">
        <Field.Label>Country or region</Field.Label>
        <NativeSelect defaultValue="jp">
          <option value="jp">Japan</option>
          <optgroup label="North America">
            <option value="us">United States</option>
            <option value="ca" disabled>
              Canada (coming soon)
            </option>
          </optgroup>
        </NativeSelect>
        <Field.Description>
          Uses the browser's native option list and keyboard behavior.
        </Field.Description>
      </Field.Root>
      <Field.Root name="size">
        <Field.Label>Display size (small)</Field.Label>
        <NativeSelect size="sm" defaultValue="md">
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
        </NativeSelect>
      </Field.Root>
      <Field.Root name="disabled-plan" disabled>
        <Field.Label>Plan (disabled)</Field.Label>
        <NativeSelect size="lg" defaultValue="free">
          <option value="free">Free</option>
        </NativeSelect>
      </Field.Root>
    </Stack>
  );
}
