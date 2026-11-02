import { Button, ButtonGroup, Flex } from '@utakata-ui/react';

export default function ButtonGroupExample() {
  return (
    <Flex style={{ gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <ButtonGroup aria-label="履歴">
        <Button variant="outline">戻す</Button>
        <Button variant="outline">やり直す</Button>
      </ButtonGroup>
      <ButtonGroup aria-label="ファイル">
        <Button>保存</Button>
        <Button variant="outline">複製</Button>
        <Button variant="outline" disabled>
          削除（無効）
        </Button>
      </ButtonGroup>
      <ButtonGroup aria-label="表示倍率" orientation="vertical">
        <Button variant="outline" size="sm">
          拡大
        </Button>
        <Button variant="outline" size="sm">
          縮小
        </Button>
      </ButtonGroup>
    </Flex>
  );
}
