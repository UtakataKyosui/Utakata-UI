import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Button,
  componentManifest,
  Dialog,
  Field,
} from '../react/src/index.js';
import '../react/src/styles.css';
import './styles.css';

function Example({ code }: { code: string }) {
  return (
    <details>
      <summary>使用例を見る</summary>
      <pre>
        <code>{code}</code>
      </pre>
    </details>
  );
}

function App() {
  const [count, setCount] = useState(0);
  return (
    <>
      <a className="skip-link" href="#main">
        本文へ移動
      </a>
      <header className="site-header">
        <a className="brand" href="#main">
          Utakata<span>-UI</span>
        </a>
        <nav aria-label="コンポーネント">
          <a href="#button">Button</a>
          <a href="#field">Field</a>
          <a href="#dialog">Dialog</a>
        </nav>
        <span className="badge">開発中 · v0.1.0</span>
      </header>
      <main id="main">
        <div className="hero">
          <p className="eyebrow">COMPONENT EXPLORER</p>
          <h1>
            使って確かめる、
            <br />
            Utakata-UI。
          </h1>
          <p>
            ReactとTypeScriptのためのUIフレームワーク。
            <br />
            Base UIの振る舞いとLism CSSの基盤を、シンプルなAPIで。
          </p>
          <p className="note">
            現在開発している3つのコンポーネントを、このページで操作できます。
          </p>
        </div>
        <section className="setup" aria-labelledby="setup-title">
          <h2 id="setup-title">使いはじめる</h2>
          <p>
            各使用例では、コンポーネントと共通スタイルを読み込んでください。
          </p>
          <pre>
            <code>
              {
                "import { Button, Field, Dialog } from '@utakata-ui/react';\nimport '@utakata-ui/react/styles.css';"
              }
            </code>
          </pre>
        </section>
        <section id="button" aria-labelledby="button-title">
          <div className="section-heading">
            <span>01</span>
            <div>
              <h2 id="button-title">Button</h2>
              <p>アクションを伝える、3つの表現と3つのサイズ。</p>
            </div>
          </div>
          <div className="preview">
            <h3>Variants</h3>
            <div className="row">
              {componentManifest.components.Button.variants.map((variant) => (
                <Button
                  key={variant}
                  variant={variant}
                  onClick={() => setCount((value) => value + 1)}
                >
                  {variant}
                </Button>
              ))}
            </div>
            <p className="note" role="status">
              クリック回数: {count}
            </p>
            <h3>Sizes</h3>
            <div className="row">
              {componentManifest.components.Button.sizes.map((size) => (
                <Button key={size} size={size} variant="outline">
                  サイズ {size}
                </Button>
              ))}
              <Button disabled>無効なボタン</Button>
            </div>
          </div>
          <Example
            code={
              '<Button variant="solid" size="md" onClick={handleSave}>\n  保存する\n</Button>\n<Button variant="outline">キャンセル</Button>\n<Button disabled>無効なボタン</Button>'
            }
          />
        </section>
        <section id="field" aria-labelledby="field-title">
          <div className="section-heading">
            <span>02</span>
            <div>
              <h2 id="field-title">Field</h2>
              <p>ラベル、入力欄、補足をひとまとまりに。</p>
            </div>
          </div>
          <div className="preview field-preview">
            <Field.Root name="email">
              <Field.Label>メールアドレス</Field.Label>
              <Field.Control
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
              />
              <Field.Description>
                入力を試せます。内容は送信・保存されません。
              </Field.Description>
            </Field.Root>
            <Field.Root name="disabled-email" disabled>
              <Field.Label>メールアドレス（無効）</Field.Label>
              <Field.Control type="email" defaultValue="hello@example.com" />
              <Field.Description>disabledの表示例です。</Field.Description>
            </Field.Root>
          </div>
          <Example
            code={
              '<Field.Root name="email">\n  <Field.Label>メールアドレス</Field.Label>\n  <Field.Control type="email" autoComplete="email" />\n  <Field.Description>連絡先として使用します。</Field.Description>\n</Field.Root>'
            }
          />
        </section>
        <section id="dialog" aria-labelledby="dialog-title">
          <div className="section-heading">
            <span>03</span>
            <div>
              <h2 id="dialog-title">Dialog</h2>
              <p>必要な情報に、フォーカスを集める。</p>
            </div>
          </div>
          <div className="preview">
            <Dialog.Root>
              <Dialog.Trigger render={<Button />}>
                ダイアログを開く
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Backdrop />
                <Dialog.Popup>
                  <Dialog.Title>Utakata-UIへようこそ</Dialog.Title>
                  <Dialog.Description>
                    開発中のDialogコンポーネントです。Escapeキー、背景のクリック、または閉じるボタンで閉じられます。
                  </Dialog.Description>
                  <Dialog.Close render={<Button variant="outline" />}>
                    閉じる
                  </Dialog.Close>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
            <p className="note">
              Tabキーでフォーカスを移動し、Escapeキーで閉じる操作も試せます。
            </p>
          </div>
          <Example
            code={
              '<Dialog.Root>\n  <Dialog.Trigger render={<Button />}>開く</Dialog.Trigger>\n  <Dialog.Portal>\n    <Dialog.Backdrop />\n    <Dialog.Popup>\n      <Dialog.Title>タイトル</Dialog.Title>\n      <Dialog.Description>内容の説明です。</Dialog.Description>\n      <Dialog.Close render={<Button variant="outline" />}>\n        閉じる\n      </Dialog.Close>\n    </Dialog.Popup>\n  </Dialog.Portal>\n</Dialog.Root>'
            }
          />
        </section>
        <footer>
          Utakata-UI · 開発中のため、APIや見た目は変更される場合があります。
        </footer>
      </main>
    </>
  );
}

const root = document.getElementById('root');
if (root) createRoot(root).render(<App />);
