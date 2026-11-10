import { Button, Command, Dialog } from '@utakata-ui/react';
import { useState } from 'react';

const groups = [
  {
    value: 'Navigate',
    items: [
      { value: 'home', label: 'Home' },
      { value: 'settings', label: 'Settings' },
    ],
  },
  {
    value: 'Actions',
    items: [
      { value: 'copy', label: 'Copy link' },
      { value: 'delete', label: 'Delete project (not permitted)' },
    ],
  },
];

export default function CommandExample() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState('Nothing run yet');
  return (
    <>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger render={<Button variant="outline" />}>
          Open command palette
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup>
            <Dialog.Title>Command palette</Dialog.Title>
            <Command.Root items={groups}>
              <Command.Panel>
                <Command.Input
                  aria-label="Search commands"
                  placeholder="Type a command"
                />
                <Command.Empty>No commands found</Command.Empty>
                <Command.List>
                  {(group: (typeof groups)[number]) => (
                    <Command.Group key={group.value} items={group.items}>
                      <Command.GroupLabel>{group.value}</Command.GroupLabel>
                      <Command.Collection>
                        {(item: (typeof groups)[number]['items'][number]) => (
                          <Command.Item
                            key={item.value}
                            value={item}
                            disabled={item.value === 'delete'}
                            onClick={() => {
                              setLast(item.label);
                              setOpen(false);
                            }}
                          >
                            {item.label}
                          </Command.Item>
                        )}
                      </Command.Collection>
                    </Command.Group>
                  )}
                </Command.List>
              </Command.Panel>
            </Command.Root>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <p>Last run: {last}</p>
    </>
  );
}
