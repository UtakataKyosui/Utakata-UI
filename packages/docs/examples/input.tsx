import { Field, Input, Stack } from '@utakata-ui/react';

export default function InputExample() {
  return (
    <Stack style={{ gap: '1.5rem', maxWidth: '28rem' }}>
      <Field.Root name="email">
        <Field.Label>メールアドレス</Field.Label>
        <Input
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
        <Field.Description>
          必須です。入力内容は送信・保存されません。
        </Field.Description>
        <Field.Error match="valueMissing">
          メールアドレスを入力してください。
        </Field.Error>
      </Field.Root>
      <Field.Root name="nickname">
        <Field.Label>ニックネーム（小）</Field.Label>
        <Input size="sm" autoComplete="nickname" />
      </Field.Root>
      <Field.Root name="account-id">
        <Field.Label>アカウントID（読み取り専用）</Field.Label>
        <Input readOnly defaultValue="utakata-001" />
      </Field.Root>
      <Field.Root name="disabled-name" disabled>
        <Field.Label>名前（無効）</Field.Label>
        <Input size="lg" defaultValue="山田 花子" />
      </Field.Root>
    </Stack>
  );
}
