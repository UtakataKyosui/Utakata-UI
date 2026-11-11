import { Button, Empty } from '@utakata-ui/react';
import { useState } from 'react';

export default function EmptyExample() {
  const [showArchived, setShowArchived] = useState(false);

  return (
    <Empty.Root>
      <Empty.Title level="3">No reports this week</Empty.Title>
      <Empty.Description>
        {showArchived
          ? 'There are no archived reports either.'
          : 'Extend the date range to include archived reports.'}
      </Empty.Description>
      <Empty.Actions>
        <Button
          aria-pressed={showArchived}
          onClick={() => setShowArchived(!showArchived)}
        >
          Include archived reports
        </Button>
      </Empty.Actions>
    </Empty.Root>
  );
}
