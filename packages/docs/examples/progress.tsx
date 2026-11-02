import { Progress, Stack } from '@utakata-ui/react';

export default function ProgressExample() {
  return (
    <Stack style={{ gap: '1.5rem', maxWidth: '24rem' }}>
      <Progress.Root value={45} label="アップロード">
        <Progress.Value />
        <Progress.Track>
          <Progress.Indicator />
        </Progress.Track>
      </Progress.Root>
      <Progress.Root value={0} label="ダウンロード（未開始）">
        <Progress.Value />
        <Progress.Track>
          <Progress.Indicator />
        </Progress.Track>
      </Progress.Root>
      <Progress.Root value={null} label="同期中（残り時間不明）">
        <Progress.Track>
          <Progress.Indicator />
        </Progress.Track>
      </Progress.Root>
    </Stack>
  );
}
