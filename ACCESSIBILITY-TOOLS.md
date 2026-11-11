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

Quality と Release React は共通の `browser.yml` で Chromium light/dark を別ジョブとして実行する。固定ビルドを配信し、開発用依存の再最適化によるページ再読込を避ける。`test-results/browser-evidence.json` はコミット・実行条件・ルールとテストの対応・全試行・成果物参照・手動ルールの未検証一覧を保存する。既存のルール単位の台帳であり、全 variant/size/state の登録漏れ検出や混在ルールの分解が完了したとは扱わない。詳細と残作業は [.github/CI.md](.github/CI.md) を参照する。

- `pnpm lint`: 既存 Biome の推奨ルール（a11y を含む）。
- `pnpm lint:markup`: 部品ソース、docs の TSX 例、ブラウザー fixture の静的検査。正常 JSX、代替テキスト欠落、ボタンの不正な入れ子で検出器を検証する。意図的に不正な既存 Vitest fixture は対象にしない。
- `pnpm test:a11y`: 既存 jsdom / axe と品質ルールの回帰検査。
- `pnpm test:a11y:browser`: 組み込みテーマ light/dark、全 Button variant/size、名前付き icon button、disabled、ラベル・説明付き Field、開閉する Dialog に加え、Kbd・Separator、表示系（Badge・Skeleton・Spinner・Card・Alert・Avatar）、データ・ナビゲーション（Progress・Table・Breadcrumb・Pagination・Sidebar）、フォーム（Input・Textarea・NativeSelect・Checkbox・Switch・RadioGroup・Select・Combobox・InputOTP・Slider）、開閉系（Collapsible・Accordion・Tabs・Toggle）、グループ（InputGroup・ToggleGroup・ButtonGroup）、オーバーレイ（Tooltip・Popover・DropdownMenu・AlertDialog・Command・Sheet・Toast）のフィクスチャー。描画後の axe（コントラストを無効化しない）、名前・説明、Tab / Shift+Tab / Enter / Space / Escape / 矢印キー / Home / End / Page Up/Down / F6 の実キー入力、フォーカス復帰、一部の対象サイズと emulate した reduced motion を検証する。名前欠落・低コントラストの既知の不正例でも検出を確認する。
- 既存の pack 済み公開 `.d.ts` の正/負の利用例検査も継続する。

開発には Node.js 24.16.0 以降の 24.x または 26.3.0 以上を使う（Markuplint の optional Astro parser を含む依存要件）。ブラウザー検査は `pnpm exec playwright install chromium firefox webkit` 後に実行する。CI は Linux の Chromium 全件検査に加え、Firefox/WebKit の基礎検査を各 light/dark で実行する。`pnpm test:a11y:cross-browser` は Button/Field/Dialog の名前・axe・キー操作・フォーカス復帰、ターゲット・コントラスト・320px・文字拡大・文字間隔・reduced-motion と負の対照例を実行する。Chromium 専用の CDP IME、強制配色や全コンポーネントの状態カバレッジは他エンジンへ拡張しない。HTML レポートの添付情報にブラウザーのバージョン・実行条件、axe JSON に検査器と対象 DOM の結果を残す。CI の成果物名にコミット SHA を含め、結果・失敗時 screenshot/trace を14日保存する。skip・fixme・期待された失敗も必須ゲートでは未検証として失敗にする。

fallow には HTML から起動する `tests/browser/main.tsx` をエントリとして登録する。`.markuplintrc.json` から動的ロードする parser/spec の2依存だけを未使用依存検出から除外する。

## 検査範囲と残る確認

`input-group.keyboard` と `input-group.visual-states` は Chromium light/dark の必須 browser ルールです。前者は実際の Tab と入力で、フレームにコントロールのフォーカスが表示されること、入力中の Enter は単一フィールドのフォームの暗黙送信であってアドオンボタンは作動しないこと、Tab でアドオンボタンへ移り Enter・Space で2回作動してもフォームは送信されないこと、ボタンが入力の後ろに並ぶことを検証します。後者は無効・読み取り専用・不正の各フレームが罫線の色・線種・カーソルで区別され不正は Field.Error の文章を伴うこと、アドオンが入力と重ならないこと、アドオン文字が 4.5:1 以上であること、幅320px とルート文字サイズ200% でクリップやはみ出しがないこと、強制配色でフォーカス中のフレームに 2px 以上の実線の outline が残ることを検証します。ボタンの submit 化・アドオンの重なり・フォーカス枠の除去の対照例では検証が失敗することを確認します。各ルールの evidence と axe の結果を既存のコミット付き CI 成果物へ添付します。実際の200%ズームとハイコントラストは `input-group.zoom-theme` に未検証として残ります。

`button-group.keyboard` と `button-group.visual-layout` は Chromium light/dark の必須 browser ルールです。前者は横向き・縦向きのグループで、実際の Tab と Shift+Tab が有効なボタンを見た目の順に1つずつ訪れ無効なボタンを飛ばすこと、フォーカス中のボタンが隣接ボタンより前面に積まれてフォーカスリングが隠れないこと（`position: relative` と `z-index`）を検証します。後者は結合したボタンの内側の角丸が 0 で外側の端だけ丸いこと、隣接ボタンが枠線1px分重なること（横向き・縦向き）、長い横向きグループが幅320px とルート文字サイズ200% でクリップやはみ出しなく折り返すこと、強制配色でフォーカス中のボタンに 2px 以上の実線の outline が残ることを検証します。フォーカスの前面化の除去・角丸の結合の除去・折り返し無効の対照例では検証が失敗することを確認します。各ルールの evidence と axe の結果を既存のコミット付き CI 成果物へ添付します。実際の200%ズームとハイコントラストは `button-group.zoom-theme` に未検証として残ります。

`toggle-group.keyboard` と `toggle-group.visual-states` は Chromium light/dark の必須 browser ルールです。前者は横向き（複数選択）と縦向き（単一選択）の2つのグループで、実際の Tab が単一のタブストップとして先頭の有効項目に入ること（押下中の項目は優先されない）、矢印キーが向きに合った方向に無効項目を飛ばして移動しフォーカスだけでは切り替わらないこと、Home/End が両端へ移ること、Space と Enter が切り替え（単一選択では置き換え）、Tab でグループを抜けることを検証します。後者は押下項目が色ではなく内側の枠線（box-shadow）で区別されること、文字が 4.5:1 以上であること、強制配色で押下項目が `Highlight` / `HighlightText` のシステム色対を使い、フォーカス項目に 2px 以上の実線の outline が残ることを検証します。矢印キーの握りつぶし・押下の内側枠の除去・強制配色のフォーカス消失の対照例では検証が失敗することを確認します。各ルールの evidence と axe の結果を既存のコミット付き CI 成果物へ添付します。実際の200%ズームとハイコントラストは `toggle-group.zoom-theme` に未検証として残ります。

`toast.pause-on-hover-focus`、`toast.close-action-keyboard`、`toast.viewport-layout` は Chromium light/dark の必須 browser ルールです。実際のマウスホバーと F6 によるフォーカスで 800ms の自動消去タイマーが一時停止し、離れる・フォーカスを外すと再開して消えること、F6 でビューポートへ入り Tab でトースト・Undo・Dismiss へ到達できること、Enter で Action が1回だけ実行され、Enter・Space・Escape で閉じることを検証します。幅320×高さ300px の短い画面に複数行のトーストを5つ積んでも、ビューポートが画面内に収まってスクロールでき（上端が画面外に出ない）、各トーストが内容の高さを保つこと、強制配色で Undo と Dismiss のフォーカスに 2px 以上の実線の outline が残ることを検証します。高さ制約とスクロールの除去・ホバーの無視・フォーカス表示の除去の対照例では検証が失敗することを確認します。各ルールの evidence と axe の結果を既存のコミット付き CI 成果物へ添付します。読み上げ、通知頻度、実際の200%ズーム、ハイコントラスト、縮小モーションは `toast.platform-manual` に未検証として残ります。

`command.keyboard-execute`、`command.dialog-focus`、`command.visual-forced` は Chromium light/dark の必須 browser ルールです。実際の Tab・文字入力・矢印キー・Enter で、フォーカスが入力欄に残ったまま `aria-activedescendant` のハイライトが移り、無効なコマンドと該当なしの Enter では何も実行されず、ハイライト中のコマンドが 1 回だけ実行されることを検証します。Dialog に置いたパレットは実際の Enter で開いて入力欄にフォーカスが移り、Enter での実行後と Escape の後にフォーカスがトリガーへ戻ることを検証します。見た目は入力欄のフォーカス表示、ハイライト項目の 2px 以上の outline、強制配色での入力欄・ハイライト・枠線、文字のコントラスト 4.5:1、幅 320 CSS px と文字 200% でのはみ出しを検証し、Escape の握りつぶし・Enter の無効化・フォーカス表示の消失の対照例では失敗することを確認します。インラインの入力欄は Base UI が `aria-haspopup` と `aria-controls` を併せて付けるため、axe は存在する参照先でも `aria-valid-attr-value` を未確定（incomplete、`controlsWithinPopup`）にします。この 1 種類だけを、参照先の listbox が存在する場合に限って許容し、許容した項目は `-axe-accepted-needs-review` 成果物に別に残します。`-axe` 成果物には未解決の incomplete だけを入れるため、他の incomplete と violation は共通の証拠ゲートで失敗のままです。実際の IME・スクリーンリーダー・200% ズームは `command.real-ime`・`command.screen-reader`・`command.visual-state` に未検証として残ります。

`alert-dialog.initial-focus-containment`、`alert-dialog.dismissal-focus-return`、`alert-dialog.forced-focus` は Chromium light/dark の必須 browser ルールです。実際の Enter で開くと最も破壊的でない操作（Cancel）にフォーカスが移り、説明が関連付けられていること、Tab と Shift+Tab を繰り返しても背後のページへフォーカスが出ないこと、ポップアップ外のポインター押下では閉じず、Cancel と Escape で閉じてフォーカスがトリガーへ戻ることを検証します。強制配色ではポップアップに境界線が残り、各操作のフォーカスに 2px 以上の実線の outline が残ることを検証します。Tab で背後へ抜けるフォーカストラップの破壊と強制配色のフォーカス消失の対照例では検証が失敗することを確認します。各ルールの evidence と axe の結果を既存のコミット付き CI 成果物へ添付します。警告の読み上げ、実際の200%ズーム、ハイコントラストは `alert-dialog.platform-manual` に未検証として残ります。

`sheet.focus-containment`、`sheet.dismissal-focus-return`、`sheet.placement-scroll`、`sheet.reduced-motion`、`sheet.forced-focus` は Chromium light/dark の必須 browser ルールで、上・右・下・左の全ての端を対象にします。実際の Tab と Enter で開くとフォーカスが先頭の Close に移り、説明が関連付けられ、開いた popup の axe に違反と incomplete がないこと、Tab と Shift+Tab を繰り返しても背後のページへフォーカスが出ないことを検証します。Escape・Close・背景のポインター押下のそれぞれで閉じてフォーカスがトリガーへ戻ることも検証します。配置では各端がビューポートの端に付いて寸法が合うこと、長い内容が popup 内でスクロールし（マウスホイールで popup だけが動き背後のページは動かない）、最後の操作が Tab で到達でき popup 内で隠れないこと、幅320px・ルート文字サイズ200%でページに横方向のはみ出しを加えず popup 内にも横スクロールが出ないことを検証します（ブラウザーズームではありません）。縮小モーションでは、設定がないときは transform の遷移が動き、`prefers-reduced-motion: reduce` の emulate では遷移も実行中のアニメーションもなく、全ての端で開閉できることを検証します。強制配色ではポップアップに境界線が残り、各操作のフォーカスに 2px 以上の実線の outline が残ることを検証します。`Sheet.Root` は型で `modal` を受け付けず、常にモーダルです。Tab で背後へ抜けるフォーカストラップの破壊、Escape の握りつぶし、popup のスクロールの除去、端への配置の破壊、縮小モーションの上書きの除去、強制配色のフォーカス消失の対照例では検証が失敗することを確認します。各ルールの evidence と axe の結果を既存のコミット付き CI 成果物へ添付します。閉じた状態では見えない各端の配置は `coverage.public-configurations` の閉じた状態の可視性検査から除き、`sheet.placement-scroll` が manifest の全ての端を開いて検証します。読み上げ、実際の200%ズーム、ハイコントラスト、実機でのタッチ操作は `sheet.platform-manual` に未検証として残ります。

`dropdown-menu.keyboard`、`dropdown-menu.activate-dismiss`、`dropdown-menu.forced-highlight` は Chromium light/dark の必須 browser ルールです。実際の Enter/矢印キーで開き、矢印・Home/End・先頭文字でハイライトが移ること、無効な項目にも矢印で到達できるが Enter ではアクションが走らないこと、Enter と Space がそれぞれ1回だけアクションを実行してメニューを閉じフォーカスをトリガーへ戻すこと、Escape と外側クリックで閉じてフォーカスが戻ることを検証します。強制配色ではハイライト中の項目（無効項目を含む）が `Highlight` / `HighlightText` のシステム色対を使い、トリガー（Button を含む）に 2px 以上の実線の outline が残ることを検証します（強制配色では box-shadow が抑制されるため。Button・Field コントロール・Dialog 内要素にも同じ不具合があり、あわせて修正済み）。Escape の握りつぶしと強制配色の上書きの除去の対照例では検証が失敗することを確認します。各ルールの evidence と axe の結果を既存のコミット付き CI 成果物へ添付します。端での衝突配置、実際のハイコントラスト、200%ズーム、読み上げは `dropdown-menu.platform-manual` に未検証として残ります。

`popover.open-dismiss-focus` と `popover.forced-focus` は Chromium light/dark の必須 browser ルールです。前者は実際の Enter で開いて `aria-expanded` が立ちフォーカスがポップアップ内へ移ること、ポップアップ内の入力操作では閉じず、Close・Escape・外側クリックで閉じてフォーカスがトリガーへ戻ることを検証します。後者は強制配色でフォーカス中のトリガー・ポップアップ・ポップアップ内の入力に 2px 以上の実線の outline が残り、ポップアップに境界線が残ることを検証します（強制配色では box-shadow が抑制されるため）。Escape の握りつぶしとフォーカス表示の除去の対照例では検証が失敗することを確認します。各ルールの evidence と axe の結果を既存のコミット付き CI 成果物へ添付します。端での衝突配置、実際の200%ズーム、ハイコントラスト、読み上げは `popover.platform-manual` に未検証として残ります。

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

`input-otp.keyboard-paste` は jsdom の合成イベントから独立させた必須 browser ルールです。Chromium light/dark で、実際の Tab による最初のスロットへの単一進入、入力によるフォーカス前進、矢印・Home/End・Backspace、`validationType` に合わない文字の拒否、入力完了時の `onValueComplete` と自動送信されないこと、実際のクリップボードからの貼り付けを検証します。キーと `beforeinput` を握りつぶす対照例では検証が失敗することを確認します。ワンタイムコードの自動入力と IME は `input-otp.autofill-ime`、スクリーンリーダーの発話は `input-otp.screen-reader`、実際のブラウザーズーム・文字間隔・物理的な強制配色や実プラットフォームでの描画は `input-otp.zoom-physical` の手動確認に残ります（未検証）。

InputOTP の視覚面は独立した必須 browser ルールに分けています。`input-otp.target-size`（空・入力済み・無効・エラーの全スロットが描画上 24x24 CSS px 以上）、`input-otp.contrast`（有効スロットの文字 4.5:1・枠 3:1、無効は対象外）、`input-otp.focus-visible`（キーボードフォーカス時に 2px 以上の実線アウトライン・背景に対し 3:1・フォーカスシャドウ）、`input-otp.invalid-state`（`aria-invalid`・色だけでなく枠の太さの変化・枠 3:1・関連付けたエラー文）、`input-otp.forced-colors`（Chromium の forced-colors エミュレーションで枠とフォーカスアウトラインが残る）、`input-otp.reflow`（320px 幅でクリップ・横スクロール・24px 未満なしに折り返す）です。それぞれ Chromium light/dark で実行し、寸法・色・アウトラインを壊した既知の不正な描画で検出が失敗することを確認し、`*-evidence` を既存のコミット付き CI 成果物へ添付します。物理的な強制配色・実際のズームは検証済みではなく、手動ルールに残ります。

`select.keyboard-selection`、`select.escape-focus-return`、`select.popup-position-dismiss` は jsdom の合成イベントから独立させた必須 browser ルールです。Chromium light/dark で実際のキーとマウスを使い、ArrowDown での展開、矢印・先頭文字による移動、disabled 項目が選べないこと、Enter での選択とフォーカス復帰、Escape で値を変えず閉じてフォーカスがトリガーへ戻ること、ポップアップがビューポート内かつトリガー近傍に配置されること、外側押下で値を変えず閉じることを検証します。Escape と外側押下を握りつぶす対照例では検証が失敗することを確認します。各ルールの `*-evidence` と `*-axe` を既存のコミット付き CI 成果物へ添付します。スクリーンリーダーの発話と長いリストのスクロールは `select.screen-reader`、視覚状態・実際のズーム・強制配色は `select.visual-state` の手動確認に残ります。

`combobox.keyboard-selection`、`combobox.dismiss-focus`、`combobox.visual-forced`、`combobox.ime-browser` は Chromium light/dark の必須 browser ルールです。1つ目は実際の Tab・文字入力・ArrowDown/ArrowUp・Enter で、候補が絞り込まれ、フォーカスが入力欄に残ったままハイライトが `aria-activedescendant` と `data-highlighted` で移り、無効な項目は選択されず、Enter で入力欄にラベルが入り値が送信されること、Trigger と Clear が Tab の停止点にならないことを検証します。2つ目は Escape が値を変えずにポップアップを閉じ、閉じた状態の Escape が入力と値を消去すること、外側押下で値が変わらないこと、ポップアップがビューポート内で入力欄の近くに開くことを検証します。3つ目は入力欄の枠のフォーカスリング、`Combobox.InputGroup` を使わない入力欄が自身の枠線とフォーカス表示を持つこと、強制配色エミュレーションでの 2px 以上の実線の outline（枠・ハイライト中の項目）とポップアップの境界線、選択済み項目のチェック記号、文字 4.5:1、Trigger と Clear の 24×24 CSS px 以上、幅 320px とルート文字サイズ 200% でのはみ出しのなさを検証します。4つ目は DevTools プロトコルで変換を擬似的に再現し、keyCode 229 の Enter が選択肢を選ばず、確定後の Enter が選ぶことを検証します。開いたポップアップ中は Base UI がページの他の部分を `aria-hidden` にするため、axe は閉じた状態で実行します。Escape・外側押下の握りつぶし、変換中の Enter を通常の Enter として再送する処理、フォーカス枠の除去、Trigger と Clear の縮小の対照例では検証が失敗することを確認します。jsdom の `combobox.ime-composition` は合成イベントによる確認で、実際の IME の証拠ではありません。各ルールの evidence と axe の結果を既存のコミット付き CI 成果物へ添付します。実際の日本語 IME は `combobox.real-ime`、スクリーンリーダーの発話は `combobox.screen-reader`、実際の200%ズーム・ハイコントラスト・視覚状態は `combobox.visual-state` に未検証として残ります。

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

Popover・DropdownMenu・Select・Combobox・AlertDialog・Sheet の開いた popup も同様に popup 部分木を対象にし、CSS の表示遷移が終わってから axe を実行する。Toast は `.ui-toast__viewport` ではなく表示中の `.ui-toast` を対象にする。viewport には Base UI のフォーカスガード（`aria-hidden="true"` かつ `tabindex="0"` の span）があり、axe は `aria-hidden-focus` を `incomplete` と報告する。これは合格扱いにせず、フォーカスガードの読み上げ・移動への影響を実ブラウザーとスクリーンリーダーで確認する残課題として未検証のまま残す。

`tests/browser/sidebar.spec.ts` は Sidebar の `sidebar.keyboard`・`sidebar.responsive-focus`・`sidebar.reflow-forced` を Chromium light/dark で検証する。`sidebar.keyboard` は 1280px 幅で、実際の Tab がサイドバーの各リンクとトリガーを文書順に移動すること、トリガーでの Enter/Space による折りたたみと展開（`aria-expanded` の変化、`aria-controls` が nav を指すこと、折りたたみ中はリンクがアクセシビリティツリーに存在せず Tab の移動先から外れること）、リンクの Enter による実行を確かめ、展開時と折りたたみ時の axe（violations と incomplete）を要求する。`sidebar.responsive-focus` は 768px のブレークポイントをまたぐビューポートの変更を使い、広い画面でリンクにフォーカスがある状態で狭くするとフォーカスがページ本体ではなくトリガーに移ること、狭い画面のトリガーが閉じたシートを開いてフォーカスが内側に入り、Escape・閉じる操作・背景の押下のそれぞれで閉じてフォーカスがトリガーに戻ること、シートが開いた状態で広くするとナビゲーションがインライン表示に戻りフォーカスがトリガーに移ること、再び狭くしても閉じた状態から始まることを確かめる。開いたシートの axe は、スライドの遷移が終わってから `[role="dialog"]` を対象に実行する。複数行に折り返すリンク 2 本は、axe が固定配置のスクロールするシート内の折り返しテキストのコントラストを `incomplete`（部分的に隠れている）と報告するため除外している。同じスタイルのリンクは広い画面の axe（折り返しあり）で検証するが、シート内での 2 本のコントラストは自動では確認できず、実機のブラウザーで確認する残課題として未検証のまま残す。`sidebar.reflow-forced` は 320 CSS px・ルートの文字サイズ 200%（ブラウザーのズームではない）・長い英語と日本語のラベルで、広い画面のサイドバーとシートがページの横あふれを増やさずクリップしないこと、現在のリンクが太字と行頭側の 3px 以上の線で他と区別できること、強制カラーで操作中のリンクとトリガーに 2px 以上の実線の outline が残り、現在の印の線が残ることを検証する。既知の不正例として、折りたたみ中も Tab の移動先に残る CSS、Escape を無効にするハンドラー、強制カラーの outline を消す CSS、現在の印を取り除く CSS を使い、検出器が失敗を報告することを確かめる。matchMedia のスタブを使う Vitest は幅の変化の論理を確認するだけで、実際のリサイズ・画面の向き・ブラウザーのズームの代わりにはならない。スクリーンリーダーの読み上げ、実際の 200% ズーム、実際のハイコントラスト、実機のタッチ操作、利用側のルーティングと保存された開閉状態は未検証。

フィクスチャーの icon-only Toggle は SVG アイコンを使う。表示文字（例：`B`）を `aria-hidden` にして別名を付ける構成は axe の `label-content-name-mismatch` が判定できず、ラベルと名前の一致（2.5.3）は手動確認の対象になる。

Firefox/WebKit、実際のスクリーンリーダー・点字出力、実ブラウザーのズーム、全状態のfocusの見やすさ、物理デバイスでの操作、独自CSS、利用者のページ構成は自動検証の保証範囲外。既存の手動品質ルールを自動合格へ変更しない。全WCAG適合の証明にはならない。

### 操作状態の対応表と必須ブラウザー証拠

一時的な操作状態（hover・押下）と確定した状態（選択・checked・open・pressed）を別の視覚表現で区別する。hover と押下は中立の色味の変化だけで表し、選択状態の表現（primary の塗り・内側の枠・チェックマーク・ドットの位置）を借りない。hover は `@media (hover: hover)` の中だけに置き、タッチでの hover 残りを防ぐ。disabled・readOnly では反応させない。`:hover` が無いことだけは不具合とせず、Base UI の状態属性と描画結果で判断した。

| 部品                               | hover                                      | 押下                                                                                                            | focus-visible    | 選択・checked・open                                                                         | disabled・readOnly                      | invalid                       |
| ---------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------- | --------------------------------------- | ----------------------------- |
| Button                             | 背景の色味（variant 別）                   | `:active` で色味を強める                                                                                        | フォーカスリング | 該当なし                                                                                    | `disabled` を除外、opacity 0.55         | 該当なし                      |
| Collapsible / Accordion の Trigger | 色味 8%                                    | 色味 14%                                                                                                        | フォーカスリング | `data-panel-open` でシェブロンが回転（`aria-expanded` も公開）                              | `data-disabled` を除外                  | 該当なし                      |
| Tabs.Tab                           | 色味 8% と文字色を本文色へ                 | 色味 14%                                                                                                        | フォーカスリング | `data-active` で下線と太字。選択中の Tab は hover で変えない                                | `data-disabled` を除外                  | 該当なし                      |
| Toggle / ToggleGroup.Item          | 未押下は色味 8%                            | 色味 14%                                                                                                        | フォーカスリング | `data-pressed` で primary の塗りと内側の枠。押下中の hover と押下は塗りだけを濃くし枠は保つ | `data-disabled` を除外                  | 該当なし                      |
| Select.Trigger                     | 色味 8%                                    | Base UI は pointerdown でポップアップを開きポインターを渡すため `:active` から外れる。`data-pressed` で色味 14% | フォーカスリング | `data-popup-open` で primary の枠                                                           | `data-disabled`・`data-readonly` を除外 | `data-invalid` で danger の枠 |
| Checkbox                           | 未チェックは色味、チェック済みは塗りを濃く | 同左をさらに強める                                                                                              | フォーカスリング | `data-checked` / `data-indeterminate` の塗りとマーク                                        | `data-disabled`・`data-readonly` を除外 | danger の枠は hover でも保つ  |
| Switch                             | トラックを濃く                             | さらに濃く                                                                                                      | フォーカスリング | `data-checked` の塗りとつまみの位置                                                         | `data-disabled`・`data-readonly` を除外 | danger の枠は hover でも保つ  |
| RadioGroup.Item                    | インジケーターの色味                       | 色味 14%                                                                                                        | フォーカスリング | `data-checked` の枠とドット                                                                 | `data-disabled`・`data-readonly` を除外 | `data-invalid` で danger の枠 |
| Slider.Thumb                       | 色味 18%                                   | `data-dragging` または `:active` で色味 32%                                                                     | フォーカスリング | 値は値テキストと位置で公開                                                                  | `data-disabled` を除外                  | 該当なし                      |

強制配色では作者指定の色味が無視されるため、hover は `Highlight` の枠、押下は `Highlight` の塗りと `HighlightText` で表す。ただし Toggle と ToggleGroup.Item では `Highlight` の対が押下済みを表すため、未押下の項目の押下は下線で示し、その対を借りない。選択・checked の `Highlight` / `HighlightText` の対は hover と押下で上書きしない。強制配色の押下では、Toggle の押下済み項目と Checkbox・Switch のチェック済み項目は元から `Highlight` のため追加の変化はない。Select の押下は開いた状態の `Highlight` の枠で示す。Checkbox・Switch・Radio・Slider.Thumb の押下は hover と同じ `Highlight` の枠で、押下専用の塗りは持たない（Slider.Thumb のドラッグ中を除く）。

invalid（Select・RadioGroup.Item・Checkbox・Switch）は枠の色だけで表すため、強制配色では色が置き換わり視覚的な手がかりが残らない。誤りの通知は `Field.Error` などのエラー文で行い、色だけに依存させないことは利用側の責任である。

監査し変更しなかったもの: Input・Textarea・NativeSelect は文字入力で hover を必須としない（フォーカス・disabled・readOnly・invalid は既存）。Select と DropdownMenu の項目は `data-highlighted` の表現が既にある。Breadcrumb と Pagination の `:hover` は `@media (hover: hover)` に包んだ。

`theme.interaction-states`、`theme.interaction-disabled`、`theme.interaction-forced-colors`、`theme.interaction-reduced-motion`、`theme.hover-touch` は Chromium light/dark の必須 browser ルールです。`tests/browser/interaction-states.spec.ts` が `?interaction` の専用 fixture（`tests/browser/interaction-fixture.tsx`）で、実際のマウスの移動と押下を使って確認します。押下はコントロールの外で離すため、Toggle や Checkbox は作動しません。

- `theme.interaction-states`: Button の全 variant × size と上表の各部品で、hover と押下が静止時と異なり、押下が hover とも異なること、hover と押下が選択状態の box-shadow や outline を借りないこと、静止・hover・押下の全てで文字 4.5:1（Checkbox のチェック済みマーク、Switch、Radio、Slider.Thumb は部品の境界または塗りの 3:1）を満たすこと、要素の位置と大きさが変わらないことを、色の遷移が終わってから測ります。
- `theme.interaction-disabled`: 無効な Button の全 variant × size、各部品の disabled と読み取り専用の Switch が、通常配色と強制配色の両方で、静止時・hover・押下の算出スタイルと位置が同一であることを確認します。無効なコントロールにコントラストの閾値は適用しません。
- `theme.interaction-forced-colors`: 強制配色のエミュレーションで、hover の `Highlight` の枠、押下の `Highlight` の塗り（Toggle と ToggleGroup.Item は下線）、選択・checked の `Highlight` / `HighlightText` の対が hover と押下で保たれることを確認します。
- `theme.interaction-reduced-motion`: `prefers-reduced-motion: reduce` をエミュレートし、上表の各コントロールとその `::before`・`::after` の静止・hover・押下で、遷移の時間が 0 秒でアニメーション名が `none` であること、それでも hover の背景が静止時と異なること（動きがなくても状態が見えること）を確認します。
- `theme.hover-touch`: 配布する stylesheet の全 `.ui-` の `:hover` 規則が `(hover: hover)` の内側にあることを CSSOM で走査します（走査対象が 0 件なら失敗）。あわせて `hasTouch` / `isMobile` の Chromium コンテキストで `(hover: hover)` が偽であることを確認したうえで、Button・Collapsible・Accordion をタップしても背景が静止時へ戻ることを確認します。

既知の不正例（検出器が効くことの確認）: 裸の `:hover` 規則、disabled への hover 反応、読めない押下色、反応を消す上書き、hover での位置ずれ、hover での選択風の影、強制配色で選択対を上書きする hover、強制配色で枠の手がかりが無い hover、動きを減らす設定で残る遷移、タッチでの hover 残りは、いずれも検査が失敗することを検証します。fixture に登録した全コントロールと `data-case` が一致しなければ失敗し、invalid の部品が `data-invalid` を公開することも確認します。

残る未検証（手動ルール `theme.interaction-platform` と [ACCESSIBILITY-MANUAL.md](ACCESSIBILITY-MANUAL.md) で追跡する）: 実際のタッチデバイス（エミュレーションのタップは物理タッチの証拠ではない）、ペン・ハイブリッド端末、OS の強制配色・ハイコントラスト、スクリーンリーダーの状態通知、実キーボードのフォーカスと押下の併用、独自 CSS で上書きした表現、上表にない部品の状態。Select の押下は pointerdown でポップアップが開くため、ポインターを離す前の `:active` の見た目は測定対象外で、`data-pressed` を測定している。

## CI改善で追加した契約

Dialogのブラウザー操作と実支援技術出力、テーマの描画コントラストとフォーカスを
独立したrule IDに分離した。Button/Field/Dialogについて操作領域、320 CSS pxの
リフロー、200%文字サイズ、規定の文字間隔、Buttonのhover/focusコントラスト、
reduced-motionを別テストで検証する。小さすぎる操作領域、クリップ、低コントラスト、
抑制されない動き、消えたフォーカスリングの既知の不正例で検出も確認する。
各ruleの適用範囲・基準・残存確認はquality metadataを参照する。

`tests/browser/coverage.ts`は公開部品・列挙値・関連状態とbrowser rule IDの対応表。
manifestに新部品や列挙値を加えて対応表を更新しないと失敗する。
公開値の実描画とvariant×sizeをChromium light/darkで確認し、状態ごとの既存操作テストに
台帳からたどれるようにした。全状態×全列挙値×全文言の直積を検証済みとは称さない。
他部品の既存複合ルールには独立化の残作業がある。

証拠台帳にはソース内容・環境設定・添付ファイルのSHA256を追加した。
未コミット変更もソース内容へ含め、実行中のソース変更や添付の消失・置換も拒否する。
手動ルールは担当役割・確認期限・追跡Issue・[実機手順](ACCESSIBILITY-MANUAL.md)を付けて
未検証として残す。実際の発話、利用者の理解、OS配色、実ズームをエミュレーションで代用しない。


## スクリーンリーダー出力のCI

`pnpm test:a11y:screen-reader` は Guidepup で実際のスクリーンリーダーを起動する。
再利用する browser workflow 内の必須ジョブは macos-15 / VoiceOver / headed WebKit と
windows-2025 / NVDA / headed Firefox。OS設定は使い捨てrunner内だけで行う。
開発端末での自動セットアップは行わない。

検査対象は Field のフォーカス時の名前、Dialog をキーで開いたときの文脈、
Escape後のトリガーへのフォーカス復帰と読み上げ。名前を置き換えた負の対照例も実行する。
環境バージョンと発話ログを添付し、失敗・skip・timeout・証拠欠落を合格にしない。
CIのブラウザー証拠再利用には6ブラウザージョブと2スクリーンリーダージョブの成功を要求する。

これはSafariそのもの、iOS、実機タッチ、実ズーム、全コンポーネントの読み上げ、
通知順、利用者の理解を証明しない。既存manualルールは包括的なためunverifiedのまま残す。
この構成の追加時点ではGitHub上のGuidepup実行は未検証。初回実行の出力を確認するまで、
対象の発話要件も検証済みとは表明しない。
