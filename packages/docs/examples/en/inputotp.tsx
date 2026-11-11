import { Field, InputOTP, Stack } from '@utakata-ui/react';

const slotLabel = (position: number, length: number) =>
  `Digit ${position} of ${length}`;

export default function InputOTPExample() {
  return (
    <Stack style={{ gap: '1.5rem', maxWidth: '24rem' }}>
      <Field.Root>
        <Field.Label>Verification code</Field.Label>
        <Field.Description>
          Enter the 6-digit code sent by SMS.
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
        <Field.Label>Confirmation code</Field.Label>
        <InputOTP.Root length={4} defaultValue="1234" getSlotLabel={slotLabel}>
          <InputOTP.Slot />
          <InputOTP.Slot />
          <InputOTP.Slot />
          <InputOTP.Slot />
        </InputOTP.Root>
        <Field.Error match>
          The code is incorrect or has expired. Request a new code.
        </Field.Error>
      </Field.Root>
    </Stack>
  );
}
