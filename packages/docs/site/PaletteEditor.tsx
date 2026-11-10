import {
  Button,
  Field,
  Input,
  NativeSelect,
  Stack,
  Textarea,
} from '@utakata-ui/react';
import { useEffect, useRef, useState } from 'react';

const defaults = {
  light: {
    primary: '#2357c6',
    'on-primary': '#ffffff',
    surface: '#ffffff',
    text: '#1c2432',
    muted: '#596579',
    border: '#8993a5',
    danger: '#b42318',
  },
  dark: {
    primary: '#9bb9ff',
    'on-primary': '#101a30',
    surface: '#1c2432',
    text: '#f0f3f9',
    muted: '#c1cad8',
    border: '#748099',
    danger: '#ffb4ab',
  },
};
type Scheme = keyof typeof defaults;
type Token = keyof typeof defaults.light;
const tokens = Object.keys(defaults.light) as Token[];
const labels = {
  ja: {
    primary: 'メインカラー',
    'on-primary': 'メインカラー上の文字色',
    surface: '背景色',
    text: '本文色',
    muted: '補足説明の色',
    border: '枠線の色',
    danger: 'エラーの色',
  },
  en: {
    primary: 'Primary color',
    'on-primary': 'Text color on the primary color',
    surface: 'Surface color',
    text: 'Text color',
    muted: 'Muted text color',
    border: 'Border color',
    danger: 'Error color',
  },
};

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

function contrast(first: string, second: string) {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function registryIsValid(value: string) {
  try {
    const url = new URL(value);
    return (
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      (url.protocol === 'https:' ||
        (url.protocol === 'http:' &&
          ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))
    );
  } catch {
    return false;
  }
}

const quote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;

const messages = {
  ja: {
    scheme: '編集する配色',
    light: 'ライト',
    dark: 'ダーク',
    ratio: 'メインカラーと文字色のコントラスト比: ',
    meets: '通常文字の4.5:1を満たします。',
    fails: '通常文字の4.5:1を満たしません。色を調整してください。',
    verification:
      'この計算は画面全体の適合を保証しません。各配色の本文・補足説明・境界線・エラー・フォーカスを別途確認してください。',
    save: '保存',
    project: 'プロジェクト名',
    preview: '配色のプレビュー',
    reset: '標準の色に戻す',
    instructions:
      'CSSをグローバルCSSに追加するか、ソース取得用の初期化コマンドを利用できます。変更はリロードでリセットされます。',
    registryHint:
      'このドキュメントの配信先を初期値にします。別のregistryを使う場合は変更してください。',
    registryError:
      'HTTPSのURL（ローカル開発ではHTTPのlocalhost）を入力してください。',
    command: '初期化コマンド',
    commandHint:
      'プロジェクトルートで実行し、表示される依存インストールとtheme.cssの読み込みを行ってください。',
    copy: '初期化コマンドをコピー',
    success: 'コマンドをコピーしました。',
    failure:
      'コピーできませんでした。コマンド欄を選択して手動でコピーしてください。',
  },
  en: {
    scheme: 'Color scheme to edit',
    light: 'Light',
    dark: 'Dark',
    ratio: 'Primary/text contrast ratio: ',
    meets: 'Meets 4.5:1 for normal text.',
    fails: 'Does not meet 4.5:1 for normal text. Adjust the colors.',
    verification:
      'This calculation does not establish conformance of the screen. Check text, muted text, borders, errors and focus in each scheme separately.',
    save: 'Save',
    project: 'Project name',
    preview: 'Palette preview',
    reset: 'Reset to the standard colors',
    instructions:
      'Add the CSS to your global stylesheet, or use the source installation command below. Changes reset on reload.',
    registryHint:
      'Defaults to this documentation deployment. Change it to use another registry.',
    registryError:
      'Enter an HTTPS URL (HTTP localhost is allowed for local development).',
    command: 'Initialization command',
    commandHint:
      'Run at your project root, then install the printed dependencies and import theme.css.',
    copy: 'Copy initialization command',
    success: 'Command copied.',
    failure: 'Copy failed. Select the command field and copy it manually.',
  },
};

export default function PaletteEditor({ locale }: { locale: 'ja' | 'en' }) {
  const text = messages[locale];
  const [palette, setPalette] = useState(defaults);
  const [scheme, setScheme] = useState<Scheme>('light');
  const [registry, setRegistry] = useState('');
  const [copied, setCopied] = useState<{ command: string; success: boolean }>();
  const commandRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const prefix = window.location.pathname.split('/blume-examples/')[0];
    setRegistry(
      `${window.location.origin}${prefix === window.location.pathname ? '' : prefix}/registry/v1`,
    );
  }, []);
  const colors = palette[scheme];
  const ratio = contrast(colors.primary, colors['on-primary']);
  const css = (['light', 'dark'] as const)
    .map(
      (mode) =>
        `@media (prefers-color-scheme: ${mode}) {\n  :root {\n${tokens.map((token) => `    --ui-color-${token}: ${palette[mode][token]};`).join('\n')}\n  }\n}`,
    )
    .join('\n\n');
  const validRegistry = registryIsValid(registry);
  const command = validRegistry
    ? `npx -y @utakata-ui/cli@0.1.0 init --registry ${quote(registry)} --palette ${quote(JSON.stringify(palette))}`
    : '';
  const message =
    copied?.command === command
      ? copied.success
        ? text.success
        : text.failure
      : '';

  return (
    <Stack style={{ gap: '1rem', minWidth: 0 }}>
      <Field.Root>
        <Field.Label>{text.scheme}</Field.Label>
        <NativeSelect
          value={scheme}
          onChange={(event) => setScheme(event.target.value as Scheme)}
        >
          <option value="light">{text.light}</option>
          <option value="dark">{text.dark}</option>
        </NativeSelect>
      </Field.Root>
      {tokens.map((token) => (
        <Field.Root key={token}>
          <Field.Label>{labels[locale][token]}</Field.Label>
          <Input
            type="color"
            value={colors[token]}
            onChange={(event) => {
              const value = event.target.value;
              setPalette((previous) => ({
                ...previous,
                [scheme]: { ...previous[scheme], [token]: value },
              }));
            }}
            style={{ minWidth: '44px', minHeight: '44px' }}
          />
        </Field.Root>
      ))}
      <p>
        {text.ratio}
        {ratio.toFixed(2)}:1. {ratio >= 4.5 ? text.meets : text.fails}{' '}
        {text.verification}
      </p>
      <Stack
        style={{
          gap: '1rem',
          padding: '1rem',
          colorScheme: scheme,
          background: colors.surface,
          color: colors.text,
          ...Object.fromEntries(
            tokens.map((token) => [`--ui-color-${token}`, colors[token]]),
          ),
        }}
      >
        <Button>{text.save}</Button>
        <Field.Root>
          <Field.Label>{text.project}</Field.Label>
          <Input placeholder="Utakata" />
          <Field.Description>{text.preview}</Field.Description>
        </Field.Root>
      </Stack>
      <Button variant="outline" onClick={() => setPalette(defaults)}>
        {text.reset}
      </Button>
      <p>{text.instructions}</p>
      <pre style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <code>{css}</code>
      </pre>
      <Field.Root invalid={!validRegistry}>
        <Field.Label>Registry URL</Field.Label>
        <Input
          type="url"
          value={registry}
          onChange={(event) => setRegistry(event.target.value)}
        />
        <Field.Description>{text.registryHint}</Field.Description>
        {!validRegistry && <Field.Error>{text.registryError}</Field.Error>}
      </Field.Root>
      <Field.Root>
        <Field.Label>{text.command}</Field.Label>
        <Textarea
          ref={commandRef}
          readOnly
          value={command}
          rows={8}
          style={{ width: '100%', minWidth: 0 }}
        />
        <Field.Description>{text.commandHint}</Field.Description>
      </Field.Root>
      <Button
        disabled={!command}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(command);
            setCopied({ command, success: true });
          } catch {
            setCopied({ command, success: false });
            commandRef.current?.focus();
            commandRef.current?.select();
          }
        }}
      >
        {text.copy}
      </Button>
      <p role="status">{message}</p>
    </Stack>
  );
}
