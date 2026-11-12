import { Button, Item } from '@utakata-ui/react';

function FileIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16">
      <path d="M3 1h7l3 3v11H3z" fill="currentColor" />
    </svg>
  );
}

export default function ItemExample() {
  return (
    <Item.Group aria-label="Files">
      <Item.Root>
        <Item.Icon>
          <FileIcon />
        </Item.Icon>
        <Item.Body>
          <Item.Link href="#">Monthly report</Item.Link>
          <Item.Description>Sales and usage for October 2026</Item.Description>
        </Item.Body>
        <Item.Meta>Updated Nov 1</Item.Meta>
        <Item.Actions>
          <Button variant="outline" size="sm">
            Share
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Delete monthly report"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16">
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </Button>
        </Item.Actions>
      </Item.Root>
      <Item.Root>
        <Item.Body>
          <Item.Button onClick={() => alert('Opening details')}>
            Open details
          </Item.Button>
          <Item.Description>The whole row works as a button</Item.Description>
        </Item.Body>
        <Item.Meta>Draft</Item.Meta>
      </Item.Root>
      <Item.Root>
        <Item.Body>
          <Item.Title>A row without an operation</Item.Title>
          <Item.Description>
            Long descriptions wrap while keeping the inner padding. This row is
            neither a link nor a button.
          </Item.Description>
        </Item.Body>
      </Item.Root>
    </Item.Group>
  );
}
