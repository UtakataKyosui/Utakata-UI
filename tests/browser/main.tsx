import { useId, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Accordion,
  Alert,
  AlertDialog,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  ButtonGroup,
  Card,
  Checkbox,
  Collapsible,
  Dialog,
  DropdownMenu,
  Field,
  Input,
  InputGroup,
  Kbd,
  KbdGroup,
  NativeSelect,
  Pagination,
  Popover,
  Progress,
  RadioGroup,
  Select,
  Separator,
  Skeleton,
  Slider,
  Spinner,
  Switch,
  Table,
  Tabs,
  Textarea,
  Toast,
  Toggle,
  ToggleGroup,
  Tooltip,
  useToastManager,
} from '../../packages/react/src/index.js';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import '../../packages/react/src/styles/styles.css';
import './fixture.css';

function FixtureToasts() {
  const { toasts } = useToastManager();
  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast}>
      <Toast.Content>
        <Toast.Title />
        <Toast.Description />
        <Toast.Action />
        <Toast.Close>Dismiss</Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ));
}

function ShowToast() {
  const manager = useToastManager();
  return (
    <Button
      onClick={() =>
        manager.add({
          title: 'Saved',
          description: 'Your changes were applied.',
          timeout: 0,
          actionProps: { children: 'Undo' },
        })
      }
    >
      Show toast
    </Button>
  );
}

const avatarImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%232357c6'/%3E%3C/svg%3E";

/** Input, toggle and button groups; the counter exposes activations to the spec. */
function GroupFixtures() {
  const [searches, setSearches] = useState(0);
  const unitId = useId();
  return (
    <section aria-label="Groups">
      {/* The spec counts submit events; nothing here may submit by itself. */}
      <form>
        <Field.Root name="docs-query">
          <Field.Label>Search docs</Field.Label>
          <InputGroup.Root>
            <InputGroup.Addon>
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 16 16"
              >
                <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" />
              </svg>
            </InputGroup.Addon>
            <Input type="search" />
            <InputGroup.Addon align="inline-end">
              <InputGroup.Button onClick={() => setSearches((n) => n + 1)}>
                Run search
              </InputGroup.Button>
            </InputGroup.Addon>
          </InputGroup.Root>
        </Field.Root>
      </form>
      <p data-testid="group-counts">{`searches ${searches}`}</p>
      <Field.Root name="parcel-weight" invalid>
        <Field.Label>Parcel weight</Field.Label>
        <InputGroup.Root>
          <Input defaultValue="heavy" aria-describedby={unitId} />
          <InputGroup.Addon align="inline-end">
            <InputGroup.Text id={unitId}>kilograms per parcel</InputGroup.Text>
          </InputGroup.Addon>
        </InputGroup.Root>
        <Field.Error match>Enter the weight as a number.</Field.Error>
      </Field.Root>
      <Field.Root name="mirror-site" disabled>
        <Field.Label>Mirror site</Field.Label>
        <InputGroup.Root>
          <InputGroup.Addon>
            <InputGroup.Text>https://</InputGroup.Text>
          </InputGroup.Addon>
          <Input defaultValue="mirror.example" />
        </InputGroup.Root>
      </Field.Root>
      <Field.Root name="release-notes">
        <Field.Label>Release notes</Field.Label>
        <InputGroup.Root>
          <InputGroup.Addon align="block-start">
            <InputGroup.Text>Markdown</InputGroup.Text>
          </InputGroup.Addon>
          <Textarea />
        </InputGroup.Root>
      </Field.Root>
      <ToggleGroup.Root
        multiple
        aria-label="Text style"
        defaultValue={['bold']}
      >
        {['Bold', 'Italic', 'Underline', 'Strike'].map((name) => (
          <ToggleGroup.Item
            key={name}
            value={name.toLowerCase()}
            variant="outline"
            disabled={name === 'Underline'}
          >
            {name}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
      <ToggleGroup.Root aria-label="Layout" orientation="vertical">
        <ToggleGroup.Item value="list">List</ToggleGroup.Item>
        <ToggleGroup.Item value="grid">Grid</ToggleGroup.Item>
        <ToggleGroup.Item value="board" size="sm">
          Board
        </ToggleGroup.Item>
      </ToggleGroup.Root>
      <ButtonGroup aria-label="History">
        <Button variant="outline">Step back</Button>
        <Button variant="outline">Step forward</Button>
        <Button>Publish</Button>
      </ButtonGroup>
      <ButtonGroup aria-label="Zoom" orientation="vertical">
        <Button variant="ghost" size="sm">
          Zoom in
        </Button>
        <Button variant="outline" size="sm" disabled>
          Zoom out
        </Button>
        <Button variant="outline" size="sm">
          Reset zoom
        </Button>
      </ButtonGroup>
    </section>
  );
}

function Fixture() {
  const planLabelId = useId();
  return (
    <main>
      <h1>Accessibility fixtures</h1>
      <section aria-label="Buttons">
        {componentManifest.components.Button.variants.flatMap((variant) =>
          componentManifest.components.Button.sizes.map((size) => (
            <Button key={`${variant}-${size}`} variant={variant} size={size}>
              {variant} {size}
            </Button>
          )),
        )}
        <Button iconOnly aria-label="Close notification">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
            <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" />
          </svg>
        </Button>
        <Button disabled>Unavailable</Button>
      </section>
      <Field.Root>
        <Field.Label>Email</Field.Label>
        <Field.Control type="email" />
        <Field.Description>Enter your contact email.</Field.Description>
      </Field.Root>
      <Dialog.Root>
        <Dialog.Trigger render={<Button />}>Open settings</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup>
            <Dialog.Title>Settings</Dialog.Title>
            <Dialog.Description>Update your preferences.</Dialog.Description>
            <Dialog.Close render={<Button />}>Close settings</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <section aria-label="Static display">
        <p>
          Search:{' '}
          <KbdGroup aria-label="Control and K">
            <span aria-hidden="true">
              <Kbd>Ctrl</Kbd> + <Kbd size="sm">K</Kbd>
            </span>
          </KbdGroup>
        </p>
        <Separator />
        <div className="fixture-row">
          <span>Profile</span>
          <Separator decorative={false} orientation="vertical" />
          <span>Settings</span>
        </div>
      </section>
      <section aria-label="Data and navigation">
        <Progress.Root value={45} label="Upload">
          <Progress.Value />
          <Progress.Track>
            <Progress.Indicator />
          </Progress.Track>
        </Progress.Root>
        <Progress.Root value={null} label="Sync">
          <Progress.Track>
            <Progress.Indicator />
          </Progress.Track>
        </Progress.Root>
        <Table.Container aria-label="Invoices" style={{ maxWidth: '16rem' }}>
          <Table.Root>
            <Table.Caption>Invoices</Table.Caption>
            <Table.Header>
              <Table.Row>
                <Table.Head scope="col">Number</Table.Head>
                <Table.Head scope="col">Customer</Table.Head>
                <Table.Head scope="col" data-align="end">
                  Amount
                </Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Head scope="row">INV-001</Table.Head>
                <Table.Cell style={{ whiteSpace: 'nowrap' }}>
                  Example Corporation International Holdings
                </Table.Cell>
                <Table.Cell data-align="end">1,000</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>
        </Table.Container>
        <Breadcrumb.Root aria-label="Breadcrumb">
          <Breadcrumb.List>
            <Breadcrumb.Item>
              <Breadcrumb.Link href="#home">Home</Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <Breadcrumb.Link href="#account">Account</Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <Breadcrumb.Page>Settings</Breadcrumb.Page>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>
        <Pagination.Root aria-label="Result pages">
          <Pagination.List>
            <Pagination.Item>
              <Pagination.Previous disabled>Previous page</Pagination.Previous>
            </Pagination.Item>
            <Pagination.Item>
              <Pagination.Link href="#page-1" active>
                1
              </Pagination.Link>
            </Pagination.Item>
            <Pagination.Item>
              <Pagination.Ellipsis label="More pages" />
            </Pagination.Item>
            <Pagination.Item>
              <Pagination.Next href="#page-2">Next page</Pagination.Next>
            </Pagination.Item>
          </Pagination.List>
        </Pagination.Root>
      </section>
      <section aria-label="Basic form controls">
        <Field.Root name="reply-address">
          <Field.Label>Reply address</Field.Label>
          <Input type="email" autoComplete="email" />
          <Field.Description>We reply to this address.</Field.Description>
        </Field.Root>
        <Field.Root name="notes">
          <Field.Label>Notes</Field.Label>
          <Textarea maxLength={200} />
        </Field.Root>
        <Field.Root name="country">
          <Field.Label>Country</Field.Label>
          <NativeSelect defaultValue="jp">
            <option value="jp">Japan</option>
            <option value="us">United States</option>
          </NativeSelect>
        </Field.Root>
        <Field.Root name="terms" className="fixture-row">
          <Checkbox.Root value="accepted">
            <Checkbox.Indicator />
          </Checkbox.Root>
          <Field.Label>Accept terms</Field.Label>
        </Field.Root>
        <label className="fixture-row">
          <Checkbox.Root indeterminate>
            <Checkbox.Indicator />
          </Checkbox.Root>
          Select all
        </label>
        <Field.Root name="alerts" className="fixture-row">
          <Switch.Root>
            <Switch.Thumb />
          </Switch.Root>
          <Field.Label>Enable alerts</Field.Label>
        </Field.Root>
      </section>
      <section aria-label="Choice controls">
        <p id={planLabelId}>Plan</p>
        <RadioGroup.Root
          name="plan"
          defaultValue="free"
          aria-labelledby={planLabelId}
        >
          <RadioGroup.Item value="free">
            <RadioGroup.Indicator />
            Free
          </RadioGroup.Item>
          <RadioGroup.Item value="team" disabled>
            <RadioGroup.Indicator />
            Team (unavailable)
          </RadioGroup.Item>
          <RadioGroup.Item value="pro">
            <RadioGroup.Indicator />
            Pro
          </RadioGroup.Item>
        </RadioGroup.Root>
        <Select.Root
          name="theme"
          defaultValue="system"
          items={[
            { value: 'system', label: 'System' },
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
          ]}
        >
          <Select.Label>Theme</Select.Label>
          <Select.Trigger>
            <Select.Value placeholder="Choose a theme" />
            <Select.Icon />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.List>
                  <Select.Item value="system">
                    <Select.ItemText>System</Select.ItemText>
                    <Select.ItemIndicator />
                  </Select.Item>
                  <Select.Item value="dark" disabled>
                    <Select.ItemText>Dark</Select.ItemText>
                    <Select.ItemIndicator />
                  </Select.Item>
                  <Select.Item value="light">
                    <Select.ItemText>Light</Select.ItemText>
                    <Select.ItemIndicator />
                  </Select.Item>
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
        <Slider.Root name="volume" defaultValue={50} step={5}>
          <Slider.Label>Volume</Slider.Label>
          <Slider.Value />
          <Slider.Control>
            <Slider.Track>
              <Slider.Indicator />
              <Slider.Thumb getAriaValueText={(value) => `${value} percent`} />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </section>
      <section aria-label="Disclosure">
        <Collapsible.Root>
          <Collapsible.Trigger>Advanced settings</Collapsible.Trigger>
          <Collapsible.Panel>
            <a href="#advanced-help">Advanced settings help</a>
          </Collapsible.Panel>
        </Collapsible.Root>
        <Accordion.Root>
          {['Shipping', 'Returns'].map((item) => (
            <Accordion.Item key={item} value={item}>
              <Accordion.Header level={2}>
                <Accordion.Trigger>{item}</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>
                <a href={`#${item}-policy`}>{item} policy</a>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion.Root>
        <Tabs.Root defaultValue="profile">
          <Tabs.List aria-label="Account">
            <Tabs.Tab value="profile">Profile</Tabs.Tab>
            <Tabs.Tab value="billing" disabled>
              Billing
            </Tabs.Tab>
            <Tabs.Tab value="security">Security</Tabs.Tab>
            <Tabs.Indicator />
          </Tabs.List>
          <Tabs.Panel value="profile">Profile settings</Tabs.Panel>
          <Tabs.Panel value="billing">Billing settings</Tabs.Panel>
          <Tabs.Panel value="security">Security settings</Tabs.Panel>
        </Tabs.Root>
        <div className="fixture-row">
          {(['outline', 'ghost'] as const).flatMap((variant) =>
            (['sm', 'md', 'lg'] as const).map((size) => (
              <Toggle key={`${variant}-${size}`} variant={variant} size={size}>
                {`Toggle ${variant} ${size}`}
              </Toggle>
            )),
          )}
          <Toggle iconOnly aria-label="Bold" variant="outline" defaultPressed>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
              <path d="M4 2h5a3 3 0 0 1 0 6H4zM4 8h6a3 3 0 0 1 0 6H4z" />
            </svg>
          </Toggle>
          <Toggle disabled>Toggle disabled</Toggle>
        </div>
      </section>
      <section aria-label="Floating overlays">
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger
              render={<Button iconOnly aria-label="Copy link" />}
            >
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 16 16"
              >
                <rect
                  x="4"
                  y="4"
                  width="9"
                  height="9"
                  fill="none"
                  stroke="currentColor"
                />
              </svg>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner sideOffset={6}>
                <Tooltip.Popup>
                  Copy the page link to the clipboard
                </Tooltip.Popup>
                <Tooltip.Arrow />
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
        <Popover.Root>
          <Popover.Trigger render={<Button variant="outline" />}>
            Display settings
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner sideOffset={8}>
              <Popover.Popup>
                <Popover.Title>Display</Popover.Title>
                <Popover.Description>Adjust the text size.</Popover.Description>
                <Field.Root>
                  <Field.Label>Text size</Field.Label>
                  <Field.Control type="number" defaultValue={16} />
                </Field.Root>
                <Popover.Close render={<Button />}>
                  Close display settings
                </Popover.Close>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger render={<Button variant="outline" />}>
            Document actions
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner sideOffset={4}>
              <DropdownMenu.Popup>
                <DropdownMenu.Group>
                  <DropdownMenu.GroupLabel>Document</DropdownMenu.GroupLabel>
                  <DropdownMenu.Item>Edit</DropdownMenu.Item>
                  <DropdownMenu.Item>Duplicate</DropdownMenu.Item>
                </DropdownMenu.Group>
                <DropdownMenu.Separator />
                <DropdownMenu.Item disabled>Delete</DropdownMenu.Item>
                <DropdownMenu.Item>Share</DropdownMenu.Item>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </section>
      <section aria-label="Notifications">
        <AlertDialog.Root>
          <AlertDialog.Trigger render={<Button />}>
            Delete file
          </AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Backdrop />
            <AlertDialog.Popup>
              <AlertDialog.Title>Delete file?</AlertDialog.Title>
              <AlertDialog.Description>
                This cannot be undone.
              </AlertDialog.Description>
              <AlertDialog.Close render={<Button variant="outline" />}>
                Cancel
              </AlertDialog.Close>
              <AlertDialog.Close render={<Button />}>
                Delete permanently
              </AlertDialog.Close>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
        <Toast.Provider>
          <ShowToast />
          <Toast.Portal>
            <Toast.Viewport aria-label="Status messages">
              <FixtureToasts />
            </Toast.Viewport>
          </Toast.Portal>
        </Toast.Provider>
      </section>
      <section aria-label="Display">
        <p>
          {componentManifest.components.Badge.variants.map((variant) => (
            <Badge key={variant} variant={variant}>
              {variant} badge
            </Badge>
          ))}
        </p>
        <div aria-busy="true" className="fixture-row">
          <Skeleton shape="circle" />
          <Skeleton style={{ width: 160, height: 16 }} />
        </div>
        <p role="status">Loading profile</p>
        <Spinner label="Loading" />
        <Button disabled>
          <Spinner size="sm" decorative />
          Saving
        </Button>
        <Card.Root>
          <Card.Header>
            <Card.Title level="2">Card title</Card.Title>
            <Card.Description>Card description.</Card.Description>
          </Card.Header>
          <Card.Content>Card content</Card.Content>
          <Card.Footer>
            <Button>Card action</Button>
          </Card.Footer>
        </Card.Root>
        <Alert.Root>
          <Alert.Title>Notice: maintenance</Alert.Title>
          <Alert.Description>Service stops at 22:00.</Alert.Description>
        </Alert.Root>
        <Alert.Root variant="destructive" role="alert">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="7" fill="currentColor" />
          </svg>
          <Alert.Title>Error: could not save</Alert.Title>
        </Alert.Root>
        <Avatar.Root>
          <Avatar.Image src={avatarImage} alt="Aya" />
          <Avatar.Fallback>A</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root size="sm">
          <Avatar.Image src="/missing-avatar.png" alt="Ken" />
          <Avatar.Fallback>K</Avatar.Fallback>
        </Avatar.Root>
      </section>
      <GroupFixtures />
    </main>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing fixture root');
createRoot(root).render(<Fixture />);
