import { ScrollArea } from '@utakata-ui/react';
import { useId } from 'react';

export default function ScrollAreaExample() {
  const headingId = useId();
  const hintId = useId();

  return (
    <>
      <h3 id={headingId}>Release notes</h3>
      <p id={hintId}>Scroll within this area to see more updates.</p>
      <ScrollArea
        aria-describedby={hintId}
        aria-labelledby={headingId}
        p="20"
        style={{ maxBlockSize: '9rem' }}
      >
        <ul>
          <li>November 11: Improved keyboard navigation in filters.</li>
          <li>November 10: Added a compact layout for saved views.</li>
          <li>November 9: Improved loading states in the activity feed.</li>
          <li>November 8: Added more context to download confirmations.</li>
          <li>November 7: Grouped account preferences by topic.</li>
          <li>November 6: Added sorting to the projects overview.</li>
        </ul>
      </ScrollArea>
    </>
  );
}
