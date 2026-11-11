import { Field, InputOTP, Stack } from '@utakata-ui/react';

const slotLabel = (position: number, length: number) =>
  `${length}桁中${position}桁目`;

export default function InputOTPExample() {
  return (
    <Stack style={{ gap: '1.5rem', maxWidth: '24rem' }}>
      <Field.Root>
        <Field.Label>認証コード</Field.Label>
        <Field.Description>
          SMSで届いた6桁のコードを入力してください。
        </Field.Description>
        <InputOTP.Root name="code" length={6} getSlotLabel={slotLabel}>
          <InputOTP.Slot />
          <InputOTP.Slot />
          <InputOTP.Slot />
          <InputOTP.Separator />
          <InputOTP.Slot />
          <InputOTP.Slot />
          <InputOTP.Slot />
        </InputOTP.Root>
      </Field.Root>
      <Field.Root invalid>
        <Field.Label>確認コード</Field.Label>
        <InputOTP.Root length={4} defaultValue="1234" getSlotLabel={slotLabel}>
          <InputOTP.Slot />
          <InputOTP.Slot />
          <InputOTP.Slot />
          <InputOTP.Slot />
        </InputOTP.Root>
        <Field.Error match>
          コードが正しくないか、有効期限が切れています。新しいコードを再送してください。
        </Field.Error>
      </Field.Root>
    </Stack>
  );
}
