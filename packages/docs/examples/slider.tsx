import { Slider, Stack } from '@utakata-ui/react';

const percent = { style: 'unit', unit: 'percent' } as const;

export default function SliderExample() {
  return (
    <Stack style={{ gap: '1.5rem', maxWidth: '24rem' }}>
      <Slider.Root name="volume" defaultValue={50} step={5} format={percent}>
        <Slider.Label>音量</Slider.Label>
        <Slider.Value />
        <Slider.Control>
          <Slider.Track>
            <Slider.Indicator />
            <Slider.Thumb />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <Slider.Root
        name="opacity"
        defaultValue={0.3}
        min={0}
        max={1}
        step={0.1}
        disabled
      >
        <Slider.Label>不透明度（無効）</Slider.Label>
        <Slider.Value />
        <Slider.Control>
          <Slider.Track>
            <Slider.Indicator />
            <Slider.Thumb />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </Stack>
  );
}
