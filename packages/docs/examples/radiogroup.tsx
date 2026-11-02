import { RadioGroup, Stack, Text } from '@utakata-ui/react';
import { useId } from 'react';

const plans = [
  { value: 'free', label: '無料プラン' },
  { value: 'team', label: 'チームプラン（受付停止中）', disabled: true },
  { value: 'pro', label: '有料プラン' },
];

export default function RadioGroupExample() {
  const labelId = useId();
  return (
    <Stack style={{ gap: '1.5rem' }}>
      <Stack style={{ gap: '0.5rem' }}>
        <Text id={labelId}>プラン</Text>
        <RadioGroup.Root
          name="plan"
          defaultValue="free"
          aria-labelledby={labelId}
        >
          {plans.map((plan) => (
            <RadioGroup.Item
              key={plan.value}
              value={plan.value}
              disabled={plan.disabled}
            >
              <RadioGroup.Indicator />
              {plan.label}
            </RadioGroup.Item>
          ))}
        </RadioGroup.Root>
      </Stack>
      <RadioGroup.Root
        name="size"
        defaultValue="m"
        orientation="horizontal"
        aria-label="サイズ"
      >
        {['S', 'M', 'L'].map((size) => (
          <RadioGroup.Item key={size} value={size.toLowerCase()}>
            <RadioGroup.Indicator />
            {size}
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </Stack>
  );
}
