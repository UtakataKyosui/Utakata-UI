import {
  Checkbox,
  Field,
  Input,
  RadioGroup,
  Stack,
  Text,
} from '@utakata-ui/react';
import { useId } from 'react';

const inline = { display: 'flex', alignItems: 'center', gap: '0.5rem' };

export default function LabelsExample() {
  const planId = useId();
  return (
    <Stack style={{ gap: '1.5rem', maxWidth: '28rem' }}>
      <Field.Root name="name">
        <Field.Label>Full name</Field.Label>
        <Input autoComplete="name" />
        <Field.Description>
          The visible label is the accessible name of the input.
        </Field.Description>
      </Field.Root>
      <Field.Root name="terms" style={inline}>
        <Checkbox.Root value="accepted">
          <Checkbox.Indicator />
        </Checkbox.Root>
        <Field.Label>I agree to the terms of use</Field.Label>
      </Field.Root>
      <Stack style={{ gap: '0.5rem' }}>
        <Text id={planId}>Plan</Text>
        <RadioGroup.Root aria-labelledby={planId} defaultValue="free">
          <RadioGroup.Item value="free">
            <RadioGroup.Indicator />
            Free
          </RadioGroup.Item>
          <RadioGroup.Item value="pro">
            <RadioGroup.Indicator />
            Pro
          </RadioGroup.Item>
        </RadioGroup.Root>
      </Stack>
    </Stack>
  );
}
