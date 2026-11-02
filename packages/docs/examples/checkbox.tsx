import { Checkbox, Field, Stack } from '@utakata-ui/react';

const inline = { display: 'flex', alignItems: 'center', gap: '0.5rem' };

export default function CheckboxExample() {
  return (
    <Stack style={{ gap: '1rem' }}>
      <Field.Root name="terms" style={inline}>
        <Checkbox.Root value="accepted">
          <Checkbox.Indicator />
        </Checkbox.Root>
        <Field.Label>利用規約に同意する</Field.Label>
      </Field.Root>
      <label style={inline}>
        <Checkbox.Root name="newsletter" defaultChecked>
          <Checkbox.Indicator />
        </Checkbox.Root>
        お知らせメールを受け取る
      </label>
      <label style={inline}>
        <Checkbox.Root indeterminate>
          <Checkbox.Indicator />
        </Checkbox.Root>
        すべて選択（一部選択中）
      </label>
      <label style={inline}>
        <Checkbox.Root disabled>
          <Checkbox.Indicator />
        </Checkbox.Root>
        選択できない項目（無効）
      </label>
    </Stack>
  );
}
