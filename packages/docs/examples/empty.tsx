import { Button, Empty } from '@utakata-ui/react';
import { useState } from 'react';

export default function EmptyExample() {
  const [showArchived, setShowArchived] = useState(false);

  return (
    <Empty.Root>
      <Empty.Title level="3">今週の作業記録はありません</Empty.Title>
      <Empty.Description>
        {showArchived
          ? '過去の作業記録もありません。'
          : '過去の記録を表示するには、表示期間を変更してください。'}
      </Empty.Description>
      <Empty.Actions>
        <Button
          aria-pressed={showArchived}
          onClick={() => setShowArchived(!showArchived)}
        >
          過去の記録を含める
        </Button>
      </Empty.Actions>
    </Empty.Root>
  );
}
