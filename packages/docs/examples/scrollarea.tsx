import { ScrollArea } from '@utakata-ui/react';
import { useId } from 'react';

export default function ScrollAreaExample() {
  const headingId = useId();

  return (
    <>
      <h3 id={headingId}>更新履歴</h3>
      <ScrollArea
        aria-labelledby={headingId}
        p="20"
        style={{ maxBlockSize: '9rem' }}
      >
        <ul>
          <li>11月11日: 絞り込みのキーボード操作を改善しました。</li>
          <li>11月10日: 保存済みビューにコンパクト表示を追加しました。</li>
          <li>11月9日: アクティビティの読み込み中の表示を改善しました。</li>
          <li>11月8日: ダウンロードの確認画面に詳細を追加しました。</li>
          <li>11月7日: アカウント設定を項目別に整理しました。</li>
          <li>11月6日: プロジェクト一覧に並べ替えを追加しました。</li>
        </ul>
      </ScrollArea>
    </>
  );
}
