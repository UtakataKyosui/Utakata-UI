# アクセシビリティ検証ツールの選定

調査日: 2026-11-01。検査器の数ではなく、検出する性質と実行環境で選ぶ。

| 候補                                                                                        | 用途                                                        | 今回の扱い                                                           |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------- |
| [Markuplint](https://markuplint.dev/docs/configuration/usecases/react-project)              | JSX/HTML の構造・属性・名前等を静的検査                     | 5.4.0 の React 推奨設定を CI に追加。警告も失敗にする                |
| [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)              | JSX の AST によるアクセシビリティ検査                       | 既存 Biome の a11y 検査と重なるため、今回は ESLint 基盤を追加しない  |
| [Playwright + axe](https://playwright.dev/docs/accessibility-testing)                       | 描画された DOM、コントラスト、ブラウザーのキー入力          | Chromium の light/dark 専用 fixture と CI を追加                     |
| [Pa11y / Pa11y CI](https://pa11y.org/)                                                      | URL の一括監査。axe / HTML_CodeSniffer の runner を利用可能 | 公開ページ群の監査候補。今回の部品の状態遷移は Playwright で直接検証 |
| [Lighthouse](https://developer.chrome.com/docs/lighthouse/accessibility/scoring)            | ページ監査・スコア                                          | 手動項目が点数に含まれないため、完全性の合否判定には採用しない       |
| [Storybook addon-a11y](https://storybook.js.org/docs/9/writing-tests/accessibility-testing) | Story 上の axe 検査                                         | このリポジトリには Storybook がないため追加しない。axe は直接実行    |

## 実装したゲート

- `pnpm lint`: 既存 Biome の推奨ルール（a11y を含む）。
- `pnpm lint:markup`: 部品ソース、docs の TSX 例、ブラウザー fixture の静的検査。正常 JSX、代替テキスト欠落、ボタンの不正な入れ子で検出器を検証する。意図的に不正な既存 Vitest fixture は対象にしない。
- `pnpm test:a11y`: 既存 jsdom / axe と品質ルールの回帰検査。
- `pnpm test:a11y:browser`: 組み込みテーマ light/dark、全 Button variant/size、名前付き icon button、disabled、ラベル・説明付き Field、開閉する Dialog。描画後の axe（コントラストを無効化しない）、名前・説明、Tab / Shift+Tab / Enter / Space / Escape、フォーカス復帰を検証する。名前欠落・低コントラストの既知の不正例でも検出を確認する。
- 既存の pack 済み公開 `.d.ts` の正/負の利用例検査も継続する。

開発には Node.js 24.16.0 以降の 24.x または 26.3.0 以上を使う（Markuplint の optional Astro parser を含む依存要件）。ブラウザー検査は `pnpm exec playwright install chromium` 後に実行する。CI は Linux の Chromium、ローカル実行はホスト OS の Chromium を使う。HTML レポートの添付情報にブラウザーのバージョン・実行条件、axe JSON に検査器と対象 DOM の結果を残す。CI の成果物名にコミット SHA を含め、結果・失敗時 screenshot/trace を14日保存する。skip・fixme・期待された失敗も必須ゲートでは未検証として失敗にする。

fallow には HTML から起動する `tests/browser/main.tsx` をエントリとして登録する。`.markuplintrc.json` から動的ロードする parser/spec の2依存だけを未使用依存検出から除外する。

## 検査範囲と残る確認

`switch.keyboard-pointer` は jsdom の合成キーから独立させた必須 browser ルールです。Chromium light/dark で実際の Tab・Space・ポインターを使い、Spaceの1回の切り替えと通知回数、ラベル/本体クリック、disabled の Tab 除外、readOnly のフォーカスと変更禁止を検証します。二重にクリックを発生させる不正な keyup ハンドラーを挿入した対照例では通知回数と状態の不一致を検出します。`switch-keyboard-evidence` と `switch-axe` を既存のコミット付き CI 成果物へ添付します。視覚状態・実際のズーム・支援技術の発話等は `switch.visual-state` 等の手動確認に残ります。

`checkbox.reset-browser` は Chromium light/dark で defaultChecked のオン・オフと reset のキャンセル有無の4通りを、実際のチェック・リセットボタン操作で検証します。reset 後の遅延処理を待ち、aria-checked と FormData を照合し、`checkbox-reset-evidence` を既存のコミット付き CI 成果物に添付します。キャンセルの回帰テストは修正前に両初期値で失敗することを確認済みです。これは Checkbox の全キーボード・視覚状態・支援技術出力の証拠ではありません。

`native-select.browser-behavior` は Chromium light/dark の全 sm/md/lg でラベル・説明・エラー関連、実キーのネイティブ type-ahead 選択、disabled の Tab 除外、フォーム値とリセット、24×24 CSS px、文字4.5:1・境界/フォーカス/矢印3:1の算出色を検証します。矢印の aria-hidden と pointer-events も確認し、`native-select-evidence` / `native-select-axe` を既存CI成果物へ添付します。ラベル関連と disabled を意図的に除去した DOM で検出も確認します。OS のポップアップ内の操作・外観、スクリーンリーダー、実際のズーム・強制配色は `native-select.platform-picker` に未検証として残します。type-ahead の合格は OS ピッカー操作の合格ではありません。

`textarea.keyboard-input` は Chromium light/dark の全 sm/md/lg で実キーボードによる Enter の改行と maxLength の上限、Tab による disabled の除外、readOnly の編集禁止、フォーム値・説明・エラー関連を検証します。maxLength を意図的に除去した DOM でも制限超過を検出します。`textarea-evidence` と `textarea-axe` に環境・状態・実測値と結果を添付し、既存 CI 成果物でコミットに結び付けます。jsdom の `textarea.value-form` は属性の転送と値・送信の単体検証で、ブラウザーによる文字数制限の証拠には使いません。手動リサイズ、実際の文字ズーム、支援技術の発話等は `textarea.visual-resize` の未検証事項として残ります。

### Input の必須ブラウザー証拠

`input.visual-theme` は `verification: 'browser'` の必須自動ルールです。jsdom の検査対象から明示的に分離し、Playwright で `evaluateQuality` に実測チェックを渡します。チェック未提供なら `unverified` となり `automatedPassed` は失敗します。reporter は manifest の全 browser rule ID を読み、Chromium light/dark の各プロジェクトに対応するテストがなければ失敗します。`pnpm test:ci` に、欠落・片テーマのみ・skip を検出する否定例があります。

`tests/browser/input.spec.ts` は全 sm/md/lg と通常・readOnly・disabled・invalid を描画し、24×24 CSS px、通常テーマの有効な入力の文字・placeholder 4.5:1、境界・フォーカス 3:1、説明・エラー関連、実際の Tab による disabled の除外、readOnly の編集禁止、320 CSS px 幅の収まり、強制配色エミュレーションでの outline を検査します。コントラストはこの fixture の不透明な背景と算出色に適用し、非対応の色表現は未判定として失敗します。disabled はコントラスト閾値の適用外です。低コントラスト・小さすぎる実 DOM を使い検出能力も確認します。

`input-evidence` にブラウザー・OS・テーマ・状態ごとの実測値とルール結果、`input-axe` に axe 結果を添付します。CI の既存成果物はコミット SHA と結び付いています。実際の200%文字ズーム、物理環境の強制配色、スクリーンリーダーの発話と利用者の理解は `input.zoom-assistive-output` に残し、未検証です。320px の viewport はズームの証拠ではありません。独自 CSS や利用側の背景は別途検証が必要です。

Markuplint は任意の React 合成や Base UI の polymorphic `render` の描画結果を確定できない。今回 Pretenders による一律の HTML 要素マッピングは設定していない。型と描画後の検証を併用する。利用者向けの共有 lint preset の配布は未実装。

SPA の `tests/browser/index.html` に限り `require-h1` を無効化する。h1 は React で描画し、ブラウザーテストで存在を明示検証する。他の規則・ファイルへ例外を広げない。

開いた Dialog の axe は可視 popup の部分木を対象にする。Base UI が管理する背景とフォーカスガードはこの axe の対象外で、フォーカスが popup 内に留まることをキー入力で別に検査する。全ページの開いた modal に対する axe 合格とは称さない。対象範囲内の `violations` と `incomplete` はどちらも失敗にし、未判定を合格へ読み替えない。

Firefox/WebKit、実際のスクリーンリーダー・点字出力、拡大・リフロー、全状態の focus の見やすさ、強制配色、動きの抑制、物理デバイスでの操作、独自 CSS、利用者のページ構成は今回の検証範囲外。既存の手動品質ルールを自動合格へ変更しない。全 WCAG 適合の証明にはならない。
