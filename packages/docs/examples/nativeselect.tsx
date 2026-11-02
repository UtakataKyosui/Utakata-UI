import { Field, NativeSelect, Stack } from '@utakata-ui/react';

export default function NativeSelectExample() {
  return (
    <Stack style={{ gap: '1.5rem', maxWidth: '28rem' }}>
      <Field.Root name="country">
        <Field.Label>国・地域</Field.Label>
        <NativeSelect defaultValue="jp">
          <option value="jp">日本</option>
          <optgroup label="北米">
            <option value="us">米国</option>
            <option value="ca" disabled>
              カナダ（準備中）
            </option>
          </optgroup>
        </NativeSelect>
        <Field.Description>
          ブラウザー標準の候補表示とキーボード操作を使います。
        </Field.Description>
      </Field.Root>
      <Field.Root name="size">
        <Field.Label>表示サイズ（小）</Field.Label>
        <NativeSelect size="sm" defaultValue="md">
          <option value="sm">小</option>
          <option value="md">中</option>
          <option value="lg">大</option>
        </NativeSelect>
      </Field.Root>
      <Field.Root name="disabled-plan" disabled>
        <Field.Label>プラン（無効）</Field.Label>
        <NativeSelect size="lg" defaultValue="free">
          <option value="free">無料</option>
        </NativeSelect>
      </Field.Root>
    </Stack>
  );
}
