import { Button, Empty } from '../../packages/react/src/index.js';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';

export function EmptyFixture() {
  return (
    <>
      <section aria-label="Empty states" className="fixture-empty">
        <Button>Before empty states</Button>
        <Empty.Root lang="ja">
          <Empty.Title level="2">
            今週のプロジェクトに関連する作業記録はまだありません
          </Empty.Title>
          <Empty.Description>
            チームのプロジェクトを作成すると、共有された作業記録や進捗をこの画面から確認できます。
          </Empty.Description>
          <Empty.Actions>
            <Button>作業記録を追加</Button>
          </Empty.Actions>
        </Empty.Root>
        <Empty.Root lang="en">
          <Empty.Title level="2">
            No archived project reports are available
          </Empty.Title>
          <Empty.Description>
            Reports will appear here after your team has finished reviewing and
            publishing them. Example identifier:
            projectreport20261111archiveddata.
          </Empty.Description>
          <Empty.Actions>
            <Button>Review reports</Button>
          </Empty.Actions>
        </Empty.Root>
      </section>
      {componentManifest.components.Empty.headingLevels.map((level) => (
        <Empty.Root key={level}>
          <Empty.Title level={level}>Empty heading {level}</Empty.Title>
        </Empty.Root>
      ))}
    </>
  );
}
