import { Field, Stack, Textarea } from '@utakata-ui/react';

export default function TextareaExample() {
  return (
    <Stack style={{ gap: '1.5rem', maxWidth: '32rem' }}>
      <Field.Root name="notes">
        <Field.Label>備考</Field.Label>
        <Textarea rows={4} maxLength={500} />
        <Field.Description>
          500文字以内。改行できます。入力内容は送信・保存されません。
        </Field.Description>
      </Field.Root>
      <Field.Root name="readonly-notes">
        <Field.Label>前回のメモ（読み取り専用）</Field.Label>
        <Textarea size="sm" readOnly defaultValue={'1行目\n2行目'} />
      </Field.Root>
      <Field.Root name="disabled-notes" disabled>
        <Field.Label>コメント（無効）</Field.Label>
        <Textarea size="lg" defaultValue="編集できません。" />
      </Field.Root>
    </Stack>
  );
}
