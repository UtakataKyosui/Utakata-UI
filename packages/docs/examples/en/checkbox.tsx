import { Checkbox, Field, Stack } from '@utakata-ui/react';

const inline = { display: 'flex', alignItems: 'center', gap: '0.5rem' };

export default function CheckboxExample() {
  return (
    <Stack style={{ gap: '1rem' }}>
      <Field.Root name="terms" style={inline}>
        <Checkbox.Root value="accepted">
          <Checkbox.Indicator />
        </Checkbox.Root>
        <Field.Label>I agree to the terms of service</Field.Label>
      </Field.Root>
      <label style={inline}>
        <Checkbox.Root name="newsletter" defaultChecked>
          <Checkbox.Indicator />
        </Checkbox.Root>
        Receive newsletter emails
      </label>
      <label style={inline}>
        <Checkbox.Root indeterminate>
          <Checkbox.Indicator />
        </Checkbox.Root>
        Select all (partially selected)
      </label>
      <label style={inline}>
        <Checkbox.Root disabled>
          <Checkbox.Indicator />
        </Checkbox.Root>
        Unavailable item (disabled)
      </label>
    </Stack>
  );
}
