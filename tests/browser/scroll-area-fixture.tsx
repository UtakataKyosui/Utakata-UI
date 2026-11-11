import { Button, ScrollArea } from '../../packages/react/src/index.js';

export function ScrollAreaFixture() {
  return (
    <main>
      <section aria-label="Scroll Area states">
        <Button>Before scroll area</Button>
        <ScrollArea
          aria-label="Updates"
          style={{
            backgroundColor: 'var(--ui-color-surface)',
            maxBlockSize: '8rem',
            maxInlineSize: '14rem',
          }}
        >
          <div style={{ minBlockSize: '24rem', minInlineSize: '28rem' }}>
            <Button variant="link">Read update</Button>
          </div>
        </ScrollArea>
        <Button>After scroll area</Button>
      </section>
    </main>
  );
}
