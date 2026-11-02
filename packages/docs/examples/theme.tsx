import { Button, Field, Input, Stack } from '@utakata-ui/react';
import { useState } from 'react';

function luminance(hex: string) {
  const channels = [1, 3, 5].map((offset) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return (
    (channels[0] ?? 0) * 0.2126 +
    (channels[1] ?? 0) * 0.7152 +
    (channels[2] ?? 0) * 0.0722
  );
}

export default function ThemeExample() {
  const [primary, setPrimary] = useState('#2357c6');
  const [foreground, setForeground] = useState('#ffffff');
  const light = luminance(primary);
  const dark = luminance(foreground);
  const ratio = (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05);
  const css = `:root {\n  --ui-color-primary: ${primary};\n  --ui-color-on-primary: ${foreground};\n}`;

  return (
    <Stack style={{ gap: '1rem' }}>
      <Field.Root>
        <Field.Label>メインカラー</Field.Label>
        <Input
          type="color"
          value={primary}
          onChange={(event) => setPrimary(event.target.value)}
          style={{ minWidth: '44px', minHeight: '44px' }}
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>メインカラー上の文字色</Field.Label>
        <Input
          type="color"
          value={foreground}
          onChange={(event) => setForeground(event.target.value)}
          style={{ minWidth: '44px', minHeight: '44px' }}
        />
      </Field.Root>
      <p>
        選択した2色のコントラスト比: {ratio.toFixed(2)}:1。
        {ratio >= 4.5
          ? '通常文字の4.5:1を満たします。'
          : '通常文字の4.5:1を満たしません。色を調整してください。'}
        フォーカス・境界線・透明度を含む実際の画面は別途確認してください。
      </p>
      <Stack
        style={{
          gap: '1rem',
          '--ui-color-primary': primary,
          '--ui-color-on-primary': foreground,
          '--ui-focus-ring': `0 0 0 3px color-mix(in srgb, ${primary} 35%, transparent)`,
        }}
      >
        <Button>保存</Button>
        <Field.Root>
          <Field.Label>プロジェクト名</Field.Label>
          <Input placeholder="Utakata" />
        </Field.Root>
      </Stack>
      <Button
        variant="outline"
        onClick={() => {
          setPrimary('#2357c6');
          setForeground('#ffffff');
        }}
      >
        標準の色に戻す
      </Button>
      <p>
        次のCSSをコピーして、アプリのグローバルCSSに追加してください。変更は保存されません。
      </p>
      <pre style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <code>{css}</code>
      </pre>
    </Stack>
  );
}
