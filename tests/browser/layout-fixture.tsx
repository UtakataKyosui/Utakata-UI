import { Button, Dialog, Field } from '../../packages/react/src/index.js';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';

export function LayoutFixture() {
  return (
    <main className="layout-contract">
      <h1>Layout contract / 表示検証</h1>
      <p>Long content / 入力内容とエラーを確認して保存してください。</p>
      {componentManifest.components.Button.variants.flatMap((variant) =>
        componentManifest.components.Button.sizes.map((size) => (
          <Button key={`${variant}-${size}`} variant={variant} size={size}>
            {variant} {size} 保存
          </Button>
        )),
      )}
      <Field.Root invalid>
        <Field.Label>Contact email / 連絡先</Field.Label>
        <Field.Control type="email" defaultValue="invalid" />
        <Field.Description>
          Enter your contact email / メールアドレスを入力
        </Field.Description>
        <Field.Error match>
          Enter a valid email address / 入力を修正してください。
        </Field.Error>
      </Field.Root>
      <Dialog.Root>
        <Dialog.Trigger render={<Button />}>Review / 確認</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup>
            <Dialog.Title>Review settings / 設定確認</Dialog.Title>
            <Dialog.Description>
              Read the changes before closing / 変更内容を確認してください。
            </Dialog.Description>
            <Dialog.Close render={<Button />}>Close / 閉じる</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
