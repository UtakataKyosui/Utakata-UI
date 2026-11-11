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
        <Field.Label>お名前</Field.Label>
        <Input autoComplete="name" />
        <Field.Description>
          見えるラベルがそのまま入力欄の名前になります。
        </Field.Description>
      </Field.Root>
      <Field.Root name="terms" style={inline}>
        <Checkbox.Root value="accepted">
          <Checkbox.Indicator />
        </Checkbox.Root>
        <Field.Label>利用規約に同意する</Field.Label>
      </Field.Root>
      <Stack style={{ gap: '0.5rem' }}>
        <Text id={planId}>プラン</Text>
        <RadioGroup.Root aria-labelledby={planId} defaultValue="free">
          <RadioGroup.Item value="free">
            <RadioGroup.Indicator />
            無料
          </RadioGroup.Item>
          <RadioGroup.Item value="pro">
            <RadioGroup.Indicator />
            有料
          </RadioGroup.Item>
        </RadioGroup.Root>
      </Stack>
    </Stack>
  );
}
