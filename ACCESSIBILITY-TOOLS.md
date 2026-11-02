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

`tooltip.focus-hover-escape`、`tooltip.hoverable`、`tooltip.visual-position` は Chromium light/dark の必須 browser ルールです。実際のマウスホバーと Tab によるフォーカスで遅延後にツールチップが開き、Escape でフォーカスを動かさず閉じること、トリガーからポップアップへポインターを移動しても開いたままであること（WCAG 1.4.13。`disableHoverablePopup` を渡した既知の不正フィクスチャでは閉じることを確認）、ポップアップ文字が 4.5:1 以上で幅320px のビューポート内に収まること、強制配色でポップアップに境界線が残りフォーカス中のトリガーに 2px 以上の outline が残ることを検証します。Escape の握りつぶしとフォーカス表示の除去の対照例では検証が失敗することを確認します。各ルールの evidence と axe の結果を既存のコミット付き CI 成果物へ添付します。タッチ操作、実際の200%ズーム、ハイコントラスト、スクリーンリーダーの説明の読み上げは `tooltip.platform-manual` に未検証として残ります。

`toggle.keyboard` と `toggle.visual-theme` は Chromium light/dark の必須 browser ルールです。前者は実際の Tab で有効なトグルに到達し無効なものを飛ばすこと、Enter と Space がそれぞれ1回だけ切り替えて通知は1回ずつであること、フォーカスがトグルに残ることを検証します。後者は全サイズ・全バリアントの押下／非押下で文字が 4.5:1 以上、目標サイズが 24×24 CSS px 以上であること、押下状態が色だけでなく内側の枠線（box-shadow）で区別されること、強制配色で押下状態が Highlight 系の色になりフォーカス時に 2px 以上の outline が残ることを検証します。Space の二重発火・押下の内側枠の除去・強制配色のフォーカス消失の対照例では検証が失敗することを確認します。各ルールの evidence と axe の結果を既存のコミット付き CI 成果物へ添付します。実際の200%ズームとハイコントラストは `toggle.zoom-theme` に未検証として残ります。

`tabs.keyboard` と `tabs.indicator-layout` は Chromium light/dark の必須 browser ルールです。前者は実際の Tab で選択中のタブへ入ること、矢印キーでフォーカスが移動し（無効なタブにもフォーカスは移るが選択はできない）、手動アクティベーションではフォーカスだけでは選択されず Enter で選択されること、Home/End が先頭・末尾へ移ること、次の Tab でアクティブなパネル内へ入ることを検証します。後者は選択中のタブが太字と下線で他と区別されること、タブ一覧が複数行に折り返しても縦向きでも、インジケーターが選択タブの位置と大きさに一致する（行の下端・左端・幅／高さを ±1.5px）ことを検証します（折り返し時に最終行へ固定されていた不具合の回帰検出）。矢印キーの握りつぶしとインジケーターの固定位置化の対照例では検証が失敗することを確認します。各ルールの evidence と axe の結果を既存のコミット付き CI 成果物へ添付します。実際の200%ズームとハイコントラストは `tabs.zoom-theme`、読み上げは `tabs.screen-reader` に未検証として残ります。

`accordion.keyboard-focus` と `accordion.motion-forced` は Chromium light/dark の必須 browser ルールです。前者は実際の Tab で有効なトリガーを順に訪れ無効な項目を飛ばすこと、Enter と Space で開閉し、開いたパネル内のリンクへ DOM 順に Tab で到達でき、閉じた後もフォーカスがトリガーに残り、閉じたパネルのリンクが Tab で飛ばされることを検証します。後者は開状態が色ではなく指標の回転で示されること、高さと指標の遷移が既定で動作し `prefers-reduced-motion: reduce` のエミュレーションで 0 秒になること、強制配色でフォーカス中のトリガーに 2px 以上の実線の outline が残ることを検証します。閉じたパネルの強制表示・遷移の維持・フォーカス表示の除去の対照例では検証が失敗することを確認します。各ルールの evidence と axe の結果を既存のコミット付き CI 成果物へ添付します。実際の200%ズームとハイコントラストは `accordion.zoom-theme`、読み上げは `accordion.screen-reader` に未検証として残ります。

`collapsible.keyboard-focus` と `collapsible.motion-forced` は Chromium light/dark の必須 browser ルールです。前者は実際の Tab でトリガーに到達し、Enter で開き Space で閉じること、`aria-expanded` が更新されフォーカスがトリガーに残ること、閉じたパネル（`keepMounted` を含む）の内容が Tab で飛ばされ開いたパネルの内容には到達できること、フォーカス中のトリガーがビューポート内にありフォーカス表示（box-shadow または outline）が出ることを検証します。後者は開閉の指標が色ではなく回転で変わること、高さと指標の遷移が既定で動作し `prefers-reduced-motion: reduce` のエミュレーションで 0 秒になること、強制配色でフォーカス中のトリガーに 2px 以上の実線の outline が残ることを検証します。閉じたパネルの強制表示・遷移の維持・フォーカス表示の除去の対照例では検証が失敗することを確認します。各ルールの evidence と axe の結果を既存のコミット付き CI 成果物へ添付します。実際の200%ズームとハイコントラストは `collapsible.zoom-theme` に未検証として残ります。

`pagination.disabled-direction` と `pagination.target-reflow` は Chromium light/dark の必須 browser ルールです。前者は実際の Tab で無効な「前へ」が飛ばされること、リンクが順番に1回ずつ訪れられること、Enter でリンク先へ遷移すること、無効なリンクのクリックでハンドラーもハッシュも変わらないことを検証します。後者はリンクと省略記号が 24×24 CSS px 以上であること、幅320px とルート文字サイズ200% でクリップやはみ出しなく折り返すこと、現在ページが太い境界線と太字で、無効状態が破線の境界線で色なしに区別できること、リンク文字が 4.5:1 以上であること、強制配色でフォーカス時に 2px 以上の実線の outline が残ることを検証します。無効リンクのフォーカス可能化・色だけの区別・フォーカス表示の除去の対照例では検証が失敗することを確認します。`pagination-keyboard-evidence` / `pagination-reflow-evidence` と axe の結果を既存のコミット付き CI 成果物へ添付します。実際の200%ズームとハイコントラストは `pagination.zoom-theme`、読み上げは `pagination.screen-reader` に未検証として残ります。

`breadcrumb.reflow-focus` は長い階層のパンくずを Chromium light/dark で検証する必須 browser ルールです。幅320px とルート文字サイズ200% でクリップや枠外へのはみ出しなく折り返すこと、リンクと現在ページの文字が 4.5:1 以上であること、リンクには下線があり現在ページには無いため色なしで区別できること、実際の Tab でリンクを順番に1回ずつ訪れ区切りと省略記号を飛ばすこと、フォーカス時に表示が出ること、強制配色では box-shadow が抑制されるため 2px 以上の実線の outline が残ることを検証します。折り返し無効・フォーカス表示の除去・下線の除去の対照例では検証が失敗することを確認します。`breadcrumb-evidence` と `breadcrumb-axe` を既存のコミット付き CI 成果物へ添付します。実際の200%ズームとハイコントラストは `breadcrumb.zoom-theme`、読み上げは `breadcrumb.screen-reader` に未検証として残ります。

`table.reflow-focus` は幅の広い Table を Chromium light/dark で検証する必須 browser ルールです。コンテナが横スクロールになり表が内容幅を保つこと（通常と幅320px）、実際の Tab でスクロール領域にフォーカスが入り、矢印キーで `scrollLeft` が増え、次の Tab で表を抜けること、フォーカス時に表示（box-shadow または outline）が出ること、強制配色では box-shadow が抑制されるため 2px 以上の実線の outline が残ることを検証します。スクロール無効化とフォーカス表示の除去の対照例では検証が失敗することを確認します。`table-evidence` と `table-axe` を既存のコミット付き CI 成果物へ添付します。実際の200%ズームとハイコントラストは `table.zoom-theme`、表ナビゲーションの読み上げは `table.screen-reader` に未検証として残ります。

`progress.visual-motion` は 0・50・100 の確定値と不確定値の Progress を Chromium light/dark で実測する必須 browser ルールです。インジケーター幅が値に比例すること（トラック内寸に対し ±1px）、塗りがトラックと背景に対し 3:1 以上、トラックの境界が背景に対し 3:1 以上、値と見出しの文字が 4.5:1 以上であること、不確定バーが既定でアニメーション実行中で `prefers-reduced-motion: reduce` のエミュレーションでは `none` かつ静止した縞模様になること、強制配色でも塗りとトラック境界が見えることを算出色とレイアウトで検証します。幅の誤り・塗りとトラックの同色化・縮小モーション時のアニメーション維持の対照例では検証が失敗することを確認します。`progress-evidence` と `progress-axe` を既存のコミット付き CI 成果物へ添付します。実際の OS 設定とハイコントラストは `progress.os-reduced-motion`、スクリーンリーダーの発話は `progress.screen-reader` に未検証として残ります。

`avatar.visual-theme` は sm/md/lg の画像表示とフォールバック表示を Chromium light/dark で実測する必須 browser ルールです。横長の画像が `object-fit: cover` で正方形の枠いっぱいに歪まず収まること、アバターが円（幅＝高さ）でサイズが昇順に異なること、フォールバック文字が算出した実効背景に対し 4.5:1 以上であること（ルート文字サイズ200% を含む）、強制配色で 1px 以上の実線境界が背景に対し 3:1 以上あることを検証します。`object-fit: fill` と低コントラストの対照例では検証が失敗することを確認します。`avatar-evidence` と `avatar-axe` を既存のコミット付き CI 成果物へ添付します。実際の200%ズームと画像 alt・フォールバックの読み上げは `avatar.zoom-assistive` に未検証として残ります。

`alert.visual-theme` は default / destructive の両バリアント（アイコン付き・長文）を Chromium light/dark で実測する必須 browser ルールです。タイトルと説明の文字が算出した実効背景に対し 4.5:1 以上であること、長い連続文字列が通常・幅320px・ルート文字サイズ200% でクリップや枠外へのはみ出しなく折り返すこと、強制配色で 1px 以上の実線境界が背景に対し 3:1 以上あることを検証します。低コントラストの destructive と折り返し無効の対照例では検証が失敗することを確認します。`alert-evidence` と `alert-axe` を既存のコミット付き CI 成果物へ添付します。スクリーンリーダーの通知（`role="alert"` / `status`）は `alert.announcement` に未検証として残ります。

`card.layout-theme` は Card の全パーツ組み合わせ（全部入り・本文のみ・ヘッダー+フッター・長文）を Chromium light/dark で実測する必須 browser ルールです。組み合わせに依らずパディングが同一であること、長い連続文字列を含む長文が通常・幅320px・ルート文字サイズ200% でクリップや枠外へのはみ出しなく折り返すこと、タイトル・説明・本文・フッターの文字が算出した実効背景に対し 4.5:1 以上であること、強制配色で 1px 以上の実線の境界が背景に対し 3:1 以上あることを検証します（ルート文字サイズの拡大はブラウザーのズーム操作ではありません）。パディング除去・折り返し無効・低コントラストの対照例では検証が失敗することを確認します。`card-evidence` と `card-axe` を既存のコミット付き CI 成果物へ添付します。実際の200%ズームと見出しレベルの読み上げは `card.zoom-assistive` に未検証として残ります。

`spinner.motion-theme` は sm/md/lg を Chromium light/dark で実測する必須 browser ルールです。既定で回転アニメーションが実行中であること、`prefers-reduced-motion: reduce` のエミュレーションで `none` になり静止した部分リングが残ること、円弧が背景に対し 3:1 以上で、トラックとも 1.5:1 以上の輝度差または線種の違いで区別できること（強制配色ではトラックを点線にして色相だけに頼らない）、サイズが昇順で互いに異なることを算出色とレイアウト寸法（回転の影響を受けない clientWidth）で検証します。縮小モーションの上書き削除と円弧とトラックの同色化の対照例では検証が失敗することを確認します。`spinner-evidence` と `spinner-axe` を既存のコミット付き CI 成果物へ添付します。実際の OS 設定とハイコントラストは `spinner.os-reduced-motion`、スクリーンリーダーの通知は `spinner.announcement` に未検証として残ります。

`skeleton.motion-theme` は Chromium light/dark の必須 browser ルールです。既定でパルスのアニメーションが実行中であること、`prefers-reduced-motion: reduce` のエミュレーションでアニメーションが `none` になること、プレースホルダーの塗りが背景面と 1.1:1 以上で区別できること、強制配色で 1px 以上の実線境界が背景に対し 3:1 以上あることを算出色で検証します（canvas で解決した RGBA を親背景へ合成）。縮小モーションの上書き削除と透明化の対照例では検証が失敗することを確認します。`skeleton-evidence` と `skeleton-axe` を既存のコミット付き CI 成果物へ添付します。エミュレーションは OS 設定の代替ではなく、実際の OS の縮小モーション・ハイコントラスト確認は `skeleton.os-reduced-motion` に未検証として残ります。

`badge.visual-theme` は全バリアント（solid/outline/subtle/destructive）と短文・長文・アイコン付きの組み合わせを Chromium light/dark で実測する必須 browser ルールです。canvas で解決した RGBA を親の背景へ合成した実効背景に対し文字 4.5:1、長文の折り返しとクリップ・親/ビューポートからのはみ出しがないこと（通常、幅320px、ルート文字サイズ200%）、強制配色での文字コントラストと境界線を検証します。これはブラウザーのズーム操作ではなくルート文字サイズの拡大です。低コントラストの上書きとクリップ指定の対照例では検証が失敗することを確認します。`badge-evidence` と `badge-axe` を既存のコミット付き CI 成果物へ添付します。実際の200%ズームと支援技術の読み上げは `badge.zoom-assistive` の手動確認に残ります。

`slider.keyboard` と `slider.pointer` は jsdom の合成イベントから独立させた必須 browser ルールです。Chromium light/dark で、実際の Tab による単一進入、矢印・Page Up/Down・Home/End と小数ステップの範囲内動作、トラック押下による位置移動、サムのドラッグによる連続変更と `onValueCommitted` の解放時1回の通知を検証します。キーとポインター押下を握りつぶす対照例では検証が失敗することを確認します。各ルールの `*-evidence` と `*-axe` を既存のコミット付き CI 成果物へ添付します。スクリーンリーダーの発話は `slider.screen-reader`、視覚状態・実際のズーム・強制配色は `slider.visual-state` の手動確認に残ります。

`select.keyboard-selection`、`select.escape-focus-return`、`select.popup-position-dismiss` は jsdom の合成イベントから独立させた必須 browser ルールです。Chromium light/dark で実際のキーとマウスを使い、ArrowDown での展開、矢印・先頭文字による移動、disabled 項目が選べないこと、Enter での選択とフォーカス復帰、Escape で値を変えず閉じてフォーカスがトリガーへ戻ること、ポップアップがビューポート内かつトリガー近傍に配置されること、外側押下で値を変えず閉じることを検証します。Escape と外側押下を握りつぶす対照例では検証が失敗することを確認します。各ルールの `*-evidence` と `*-axe` を既存のコミット付き CI 成果物へ添付します。スクリーンリーダーの発話と長いリストのスクロールは `select.screen-reader`、視覚状態・実際のズーム・強制配色は `select.visual-state` の手動確認に残ります。

`radio-group.keyboard` は jsdom の合成キーから独立させた必須 browser ルールです。Chromium light/dark で実際の Tab・矢印キーを使い、Tab での単一進入、矢印キーによる移動と選択、disabled 項目の読み飛ばし、グループ離脱後の Shift+Tab による選択項目への復帰、disabled 項目のクリックで値が変わらないことを検証します。矢印キーを握りつぶす不正なハンドラーを挿入した対照例では検証が失敗することを確認します。`radio-group-keyboard-evidence` と `radio-group-axe` を既存のコミット付き CI 成果物へ添付します。スクリーンリーダーの発話、視覚状態、実際のズーム・強制配色は `radio-group.real-keyboard-screen-reader` と `radio-group.visual-state` の手動確認に残ります。

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
