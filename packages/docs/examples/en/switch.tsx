import { Field, Stack, Switch } from '@utakata-ui/react';

const inline = { display: 'flex', alignItems: 'center', gap: '0.5rem' };

export default function SwitchExample() {
  return (
    <Stack style={{ gap: '1rem' }}>
      <Field.Root name="notifications" style={inline}>
        <Switch.Root>
          <Switch.Thumb />
        </Switch.Root>
        <Field.Label>Enable notifications</Field.Label>
      </Field.Root>
      <label style={inline}>
        <Switch.Root name="dark-mode" defaultChecked>
          <Switch.Thumb />
        </Switch.Root>
        Dark mode
      </label>
      <label style={inline}>
        <Switch.Root disabled>
          <Switch.Thumb />
        </Switch.Root>
        Auto update (disabled)
      </label>
    </Stack>
  );
}
