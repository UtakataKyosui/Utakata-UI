import { Button, ButtonGroup, Flex } from '@utakata-ui/react';

export default function ButtonGroupExample() {
  return (
    <Flex style={{ gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <ButtonGroup aria-label="History">
        <Button variant="outline">Undo</Button>
        <Button variant="outline">Redo</Button>
      </ButtonGroup>
      <ButtonGroup aria-label="File">
        <Button>Save</Button>
        <Button variant="outline">Duplicate</Button>
        <Button variant="outline" disabled>
          Delete (disabled)
        </Button>
      </ButtonGroup>
      <ButtonGroup aria-label="Zoom" orientation="vertical">
        <Button variant="outline" size="sm">
          Zoom in
        </Button>
        <Button variant="outline" size="sm">
          Zoom out
        </Button>
      </ButtonGroup>
    </Flex>
  );
}
