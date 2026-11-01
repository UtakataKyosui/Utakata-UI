import { Field, Stack } from '@utakata-ui/react';

export default function FieldExample() {
  return (
    <Stack style={{ gap: '1.5rem', maxWidth: '28rem' }}>
      <Field.Root name="email">
        <Field.Label>メールアドレス</Field.Label>
        <Field.Control
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
        />
        <Field.Description>
          入力を試せます。内容は送信・保存されません。
        </Field.Description>
      </Field.Root>
      <Field.Root name="disabled-email" disabled>
        <Field.Label>メールアドレス（無効）</Field.Label>
        <Field.Control type="email" defaultValue="hello@example.com" />
        <Field.Description>disabledの表示例です。</Field.Description>
      </Field.Root>
    </Stack>
  );
}
