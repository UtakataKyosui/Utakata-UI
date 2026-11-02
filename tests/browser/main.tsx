import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Accordion,
  Alert,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Collapsible,
  Dialog,
  Field,
  Input,
  Kbd,
  KbdGroup,
  NativeSelect,
  Pagination,
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
  Toggle,
  Tooltip,
} from '../../packages/react/src/index.js';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import '../../packages/react/src/styles/styles.css';
import './fixture.css';

function cancelResetRef(form: HTMLFormElement | null) {
  if (!form) return;
  const cancel = (event: Event) => event.preventDefault();
  form.addEventListener('reset', cancel);
  return () => form.removeEventListener('reset', cancel);
}

function SwitchStates() {
  const [changes, setChanges] = useState<string[]>([]);
  return (
    <section aria-label="Switch input">
      <Button>Before switches</Button>
      {['Enabled', 'Disabled', 'Read only'].map((state) => (
        <label key={state}>
          <Switch.Root
            disabled={state === 'Disabled'}
            readOnly={state === 'Read only'}
            onCheckedChange={(checked) =>
              setChanges((previous) => [...previous, `${state}:${checked}`])
            }
          >
            <Switch.Thumb />
          </Switch.Root>
          <span>{state} switch</span>
        </label>
      ))}
      <output aria-label="Switch changes">{JSON.stringify(changes)}</output>
    </section>
  );
}

function RadioGroupStates() {
  const [changes, setChanges] = useState<string[]>([]);
  return (
    <section aria-label="RadioGroup input">
      <Button>Before radios</Button>
      <RadioGroup.Root
        aria-label="Plan"
        onValueChange={(value) =>
          setChanges((previous) => [...previous, String(value)])
        }
      >
        {['free', 'team', 'pro'].map((value) => (
          <RadioGroup.Item
            key={value}
            value={value}
            disabled={value === 'team'}
          >
            <RadioGroup.Indicator />
            {value}
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
      <Button>After radios</Button>
      <output aria-label="RadioGroup changes">{JSON.stringify(changes)}</output>
    </section>
  );
}

const selectThemes = [
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

function SelectStates() {
  const [changes, setChanges] = useState<string[]>([]);
  return (
    <section aria-label="Select input">
      <Button>Before select</Button>
      <form aria-label="Select form">
        <Select.Root
          name="theme"
          defaultValue="system"
          items={selectThemes}
          onValueChange={(value) =>
            setChanges((previous) => [...previous, String(value)])
          }
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
                  {selectThemes.map((theme) => (
                    <Select.Item
                      key={theme.value}
                      value={theme.value}
                      disabled={theme.value === 'dark'}
                    >
                      <Select.ItemText>{theme.label}</Select.ItemText>
                      <Select.ItemIndicator>✓</Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </form>
      <Button>After select</Button>
      <output aria-label="Select changes">{JSON.stringify(changes)}</output>
    </section>
  );
}

function SliderStates() {
  const [events, setEvents] = useState<string[]>([]);
  return (
    <section aria-label="Slider input">
      <Button>Before slider</Button>
      <Slider.Root
        min={0}
        max={1}
        step={0.1}
        largeStep={0.5}
        defaultValue={0.5}
      >
        <Slider.Label>Gain</Slider.Label>
        <Slider.Value />
        <Slider.Control>
          <Slider.Track>
            <Slider.Indicator />
            <Slider.Thumb getAriaValueText={(value) => `${value} gain`} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <Slider.Root
        defaultValue={50}
        step={5}
        onValueChange={(value) =>
          setEvents((previous) => [...previous, `change:${value}`])
        }
        onValueCommitted={(value) =>
          setEvents((previous) => [...previous, `commit:${value}`])
        }
      >
        <Slider.Label>Volume</Slider.Label>
        <Slider.Value />
        <Slider.Control>
          <Slider.Track>
            <Slider.Indicator />
            <Slider.Thumb getAriaValueText={(value) => `${value} percent`} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <output aria-label="Slider events">{JSON.stringify(events)}</output>
    </section>
  );
}

const badgeLongText =
  'Awaiting approval from the regional administration team before publication';

function BadgeStates() {
  return (
    <section aria-label="Badge states">
      {componentManifest.components.Badge.variants.map((variant) => (
        <div key={variant} className="fixture-badges">
          <Badge variant={variant} data-case="short">
            Active {variant}
          </Badge>
          <Badge variant={variant} data-case="long">
            {badgeLongText} {variant}
          </Badge>
          <Badge variant={variant} data-case="icon">
            <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12">
              <circle cx="6" cy="6" r="5" fill="currentColor" />
            </svg>
            Icon {variant}
          </Badge>
        </div>
      ))}
    </section>
  );
}

function SkeletonStates() {
  return (
    <section aria-label="Skeleton states">
      <p role="status">Loading profile</p>
      <div aria-busy="true" className="fixture-skeletons">
        <Skeleton shape="circle" style={{ width: 40, height: 40 }} />
        <Skeleton style={{ width: 160, height: 16 }} />
      </div>
    </section>
  );
}

function SpinnerStates() {
  return (
    <section aria-label="Spinner states">
      {componentManifest.components.Spinner.sizes.map((size) => (
        <Spinner key={size} size={size} label={`Loading ${size}`} />
      ))}
    </section>
  );
}

const cardLongText =
  'Supercalifragilisticexpialidocious_unbroken_identifier_that_must_wrap and a long sentence describing the account in detail.';

function CardStates() {
  return (
    <section aria-label="Card states">
      <Card.Root data-case="full">
        <Card.Header>
          <Card.Title level="2">Profile</Card.Title>
          <Card.Description>Edit your public information</Card.Description>
        </Card.Header>
        <Card.Content>Body content</Card.Content>
        <Card.Footer>
          <Button>Save</Button>
        </Card.Footer>
      </Card.Root>
      <Card.Root data-case="content">
        <Card.Content>Content only</Card.Content>
      </Card.Root>
      <Card.Root data-case="header-footer">
        <Card.Header>
          <Card.Title level="3">Header only</Card.Title>
        </Card.Header>
        <Card.Footer>Footer text</Card.Footer>
      </Card.Root>
      <Card.Root data-case="long">
        <Card.Header>
          <Card.Title level="3">{cardLongText}</Card.Title>
          <Card.Description>{cardLongText}</Card.Description>
        </Card.Header>
        <Card.Content>{cardLongText}</Card.Content>
      </Card.Root>
    </section>
  );
}

const alertLongText =
  'Unbroken_identifier_that_must_wrap_inside_the_alert and a long sentence describing what happened.';

function AlertStates() {
  return (
    <section aria-label="Alert states">
      {componentManifest.components.Alert.variants.flatMap((variant) => [
        <Alert.Root key={`${variant}-icon`} variant={variant} data-case="icon">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="7" fill="currentColor" />
          </svg>
          <Alert.Title>Status {variant}</Alert.Title>
          <Alert.Description>Description for {variant}</Alert.Description>
        </Alert.Root>,
        <Alert.Root key={`${variant}-long`} variant={variant} data-case="long">
          <Alert.Title>{alertLongText}</Alert.Title>
          <Alert.Description>{alertLongText}</Alert.Description>
        </Alert.Root>,
      ])}
    </section>
  );
}

// A wide image proves the avatar crops instead of stretching it.
const avatarImage =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="#3366cc"/><circle cx="100" cy="50" r="40" fill="#ffffff"/></svg>',
  );

function AvatarStates() {
  return (
    <section aria-label="Avatar states">
      {componentManifest.components.Avatar.sizes.map((size) => (
        <Avatar.Root key={`${size}-image`} size={size} data-case="image">
          <Avatar.Image src={avatarImage} alt={`Image ${size}`} />
          <Avatar.Fallback>IM</Avatar.Fallback>
        </Avatar.Root>
      ))}
      {componentManifest.components.Avatar.sizes.map((size) => (
        <Avatar.Root key={`${size}-fallback`} size={size} data-case="fallback">
          <Avatar.Fallback>{size.toUpperCase()}</Avatar.Fallback>
        </Avatar.Root>
      ))}
    </section>
  );
}

function ProgressStates() {
  return (
    <section aria-label="Progress states">
      {[0, 50, 100, null].map((value) => (
        <Progress.Root
          key={String(value)}
          value={value}
          label={value === null ? 'Working' : `Upload ${value}`}
        >
          <Progress.Value />
          <Progress.Track>
            <Progress.Indicator />
          </Progress.Track>
        </Progress.Root>
      ))}
    </section>
  );
}

const tableColumns = [
  'Name',
  'Email address',
  'Department',
  'Location',
  'Status',
];

function TableStates() {
  return (
    <section aria-label="Table states">
      <Button>Before table</Button>
      <Table.Container aria-label="Team members">
        <Table.Root>
          <Table.Caption>Team members</Table.Caption>
          <Table.Header>
            <Table.Row>
              {tableColumns.map((column) => (
                <Table.Head key={column} scope="col">
                  {column}
                </Table.Head>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {['Aya', 'Ken'].map((name) => (
              <Table.Row key={name}>
                <Table.Head scope="row">{name}</Table.Head>
                {tableColumns.slice(1).map((column) => (
                  <Table.Cell key={column}>
                    {column} of {name} in the regional office
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.Container>
      <Button>After table</Button>
    </section>
  );
}

function BreadcrumbStates() {
  return (
    <section aria-label="Breadcrumb states">
      <Button>Before breadcrumb</Button>
      <Breadcrumb.Root>
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Link href="#home">Home</Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator />
          <Breadcrumb.Item>
            <Breadcrumb.Ellipsis />
          </Breadcrumb.Item>
          <Breadcrumb.Separator />
          <Breadcrumb.Item>
            <Breadcrumb.Link href="#catalog">
              Catalog_of_regional_products_and_services
            </Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator />
          <Breadcrumb.Item>
            <Breadcrumb.Page>
              Current_page_with_a_very_long_unbroken_title_for_wrapping
            </Breadcrumb.Page>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>
      <Button>After breadcrumb</Button>
    </section>
  );
}

function PaginationStates() {
  const [clicks, setClicks] = useState(0);
  return (
    <section aria-label="Pagination states">
      <Button>Before pagination</Button>
      <Pagination.Root aria-label="Result pages">
        <Pagination.List>
          <Pagination.Item>
            <Pagination.Previous
              disabled
              onClick={() => setClicks((n) => n + 1)}
            >
              Previous
            </Pagination.Previous>
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Link href="#page-1" active>
              1
            </Pagination.Link>
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Link href="#page-2">2</Pagination.Link>
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Ellipsis label="More pages" />
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Link href="#page-9">9</Pagination.Link>
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Next href="#page-next">Next</Pagination.Next>
          </Pagination.Item>
        </Pagination.List>
      </Pagination.Root>
      <Button>After pagination</Button>
      <output aria-label="Pagination clicks">{clicks}</output>
    </section>
  );
}

function CollapsibleStates() {
  return (
    <section aria-label="Collapsible states">
      <Button>Before collapsible</Button>
      <Collapsible.Root>
        <Collapsible.Trigger>Advanced settings</Collapsible.Trigger>
        <Collapsible.Panel>
          <p>Additional settings</p>
          <Button>Panel action</Button>
        </Collapsible.Panel>
      </Collapsible.Root>
      <Collapsible.Root>
        <Collapsible.Trigger>Kept mounted</Collapsible.Trigger>
        <Collapsible.Panel keepMounted>
          <Button>Hidden action</Button>
        </Collapsible.Panel>
      </Collapsible.Root>
      <Button>After collapsible</Button>
    </section>
  );
}

function AccordionStates() {
  return (
    <section aria-label="Accordion states">
      <Button>Before accordion</Button>
      <Accordion.Root>
        {[
          { value: 'account', title: 'Account', link: 'Account link' },
          { value: 'billing', title: 'Billing', link: 'Billing link' },
          { value: 'archive', title: 'Archive', link: 'Archive link' },
        ].map((item) => (
          <Accordion.Item
            key={item.value}
            value={item.value}
            disabled={item.value === 'archive'}
          >
            <Accordion.Header level={3}>
              <Accordion.Trigger>{item.title}</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>
              <a href={`#${item.value}`}>{item.link}</a>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion.Root>
      <Button>After accordion</Button>
    </section>
  );
}

function TabsStates() {
  return (
    <section aria-label="Tabs states">
      <Button>Before tabs</Button>
      <Tabs.Root defaultValue="profile">
        <Tabs.List aria-label="Account sections">
          <Tabs.Tab value="profile">Profile</Tabs.Tab>
          <Tabs.Tab value="billing">Billing</Tabs.Tab>
          <Tabs.Tab value="team" disabled>
            Team
          </Tabs.Tab>
          <Tabs.Tab value="security">Security</Tabs.Tab>
        </Tabs.List>
        {['profile', 'billing', 'team', 'security'].map((value) => (
          <Tabs.Panel key={value} value={value}>
            <Button>{value} action</Button>
          </Tabs.Panel>
        ))}
      </Tabs.Root>
      <Button>After tabs</Button>
      <div className="fixture-tabs-wrap" data-case="wrap">
        <Tabs.Root defaultValue="overview">
          <Tabs.List aria-label="Wrapping sections">
            {['overview', 'activity', 'reports', 'settings', 'billing'].map(
              (value) => (
                <Tabs.Tab key={value} value={value}>
                  {value}
                </Tabs.Tab>
              ),
            )}
            <Tabs.Indicator />
          </Tabs.List>
          {['overview', 'activity', 'reports', 'settings', 'billing'].map(
            (value) => (
              <Tabs.Panel key={value} value={value}>
                {value} panel
              </Tabs.Panel>
            ),
          )}
        </Tabs.Root>
      </div>
      <div className="fixture-tabs-vertical" data-case="vertical">
        <Tabs.Root defaultValue="one" orientation="vertical">
          <Tabs.List aria-label="Vertical sections">
            {['one', 'two', 'three'].map((value) => (
              <Tabs.Tab key={value} value={value}>
                {value}
              </Tabs.Tab>
            ))}
            <Tabs.Indicator />
          </Tabs.List>
          {['one', 'two', 'three'].map((value) => (
            <Tabs.Panel key={value} value={value}>
              {value} panel
            </Tabs.Panel>
          ))}
        </Tabs.Root>
      </div>
    </section>
  );
}

function ToggleStates() {
  const [changes, setChanges] = useState<string[]>([]);
  const { sizes, variants } = componentManifest.components.Toggle;
  return (
    <section aria-label="Toggle states">
      <Button>Before toggle</Button>
      <Toggle
        onPressedChange={(pressed) =>
          setChanges((previous) => [...previous, `Italic:${pressed}`])
        }
      >
        Italic
      </Toggle>
      <Toggle disabled>Underline</Toggle>
      <Button>After toggle</Button>
      <output aria-label="Toggle changes">{JSON.stringify(changes)}</output>
      <div className="fixture-toggles">
        {sizes.flatMap((size) =>
          variants.flatMap((variant) =>
            [false, true].map((pressed) => (
              <Toggle
                key={`${size}-${variant}-${pressed}`}
                size={size}
                variant={variant}
                defaultPressed={pressed}
                data-case="visual"
              >
                {`Bold ${size} ${variant} ${pressed ? 'on' : 'off'}`}
              </Toggle>
            )),
          ),
        )}
      </div>
    </section>
  );
}

const tooltipLong =
  'Saves the draft to the shared workspace so that every collaborator can review the latest changes';

function TooltipStates() {
  return (
    <section aria-label="Tooltip states">
      <Button>Before tooltip</Button>
      <Tooltip.Provider delay={100}>
        <Tooltip.Root>
          <Tooltip.Trigger render={<Button />}>Save</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={6}>
              <Tooltip.Popup>{tooltipLong}</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
        {/* Known-invalid control: Base UI accepts the prop the types omit. */}
        <Tooltip.Root
          {...({ disableHoverablePopup: true } as Record<string, unknown>)}
        >
          <Tooltip.Trigger render={<Button />}>Not hoverable</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={6}>
              <Tooltip.Popup>Closes when the pointer leaves</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
      <Button>After tooltip</Button>
    </section>
  );
}

function Fixture() {
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
      <section aria-label="Input states">
        {componentManifest.components.Input.sizes.map((size) => (
          <div key={size} className="fixture-inputs">
            <Field.Root name={`input-${size}`}>
              <Field.Label>Input {size}</Field.Label>
              <Input size={size} placeholder="Enter a value" />
              <Field.Description>
                Required contact information.
              </Field.Description>
            </Field.Root>
            <Input
              size={size}
              aria-label={`Read only ${size}`}
              readOnly
              defaultValue="Kept value"
            />
            <Input
              size={size}
              aria-label={`Disabled ${size}`}
              disabled
              defaultValue="Unavailable"
            />
            <Field.Root invalid>
              <Field.Label>Invalid {size}</Field.Label>
              <Input size={size} defaultValue="Invalid value" />
              <Field.Error match>Enter a valid contact value.</Field.Error>
            </Field.Root>
          </div>
        ))}
      </section>
      <section aria-label="Textarea states">
        {componentManifest.components.Textarea.sizes.map((size) => (
          <form key={size} className="fixture-inputs">
            <Field.Root name="notes">
              <Field.Label>Notes {size}</Field.Label>
              <Textarea size={size} maxLength={8} />
              <Field.Description>
                Up to 8 characters, including line breaks.
              </Field.Description>
            </Field.Root>
            <Textarea
              size={size}
              aria-label={`Read only notes ${size}`}
              name="readonly"
              readOnly
              defaultValue="Kept value"
            />
            <Textarea
              size={size}
              aria-label={`Disabled notes ${size}`}
              name="disabled"
              disabled
              defaultValue="Unavailable"
            />
            <Field.Root invalid>
              <Field.Label>Invalid notes {size}</Field.Label>
              <Textarea size={size} defaultValue="Invalid note" />
              <Field.Error match>Enter a valid note.</Field.Error>
            </Field.Root>
          </form>
        ))}
      </section>
      <section aria-label="NativeSelect states">
        {componentManifest.components.NativeSelect.sizes.map((size) => (
          <form key={size} className="fixture-inputs">
            <Field.Root name="country">
              <Field.Label>Country {size}</Field.Label>
              <NativeSelect size={size} defaultValue="jp">
                <option value="jp">Japan</option>
                <option value="ca" disabled>
                  Canada
                </option>
                <optgroup label="Other countries">
                  <option value="us">United States</option>
                </optgroup>
              </NativeSelect>
              <Field.Description>Used for shipping.</Field.Description>
            </Field.Root>
            <NativeSelect
              size={size}
              disabled
              name="disabled"
              aria-label={`Disabled country ${size}`}
            >
              <option value="jp">Japan</option>
            </NativeSelect>
            <Field.Root invalid>
              <Field.Label>Invalid country {size}</Field.Label>
              <NativeSelect size={size}>
                <option value="">Choose a country</option>
              </NativeSelect>
              <Field.Error match>Choose a valid country.</Field.Error>
            </Field.Root>
            <Button type="reset">Reset country {size}</Button>
          </form>
        ))}
      </section>
      <section aria-label="Checkbox reset">
        {[false, true].flatMap((canceled) =>
          [false, true].map((defaultChecked) => {
            const name = `Reset ${canceled ? 'canceled' : 'allowed'} default ${defaultChecked}`;
            return (
              <form key={name} ref={canceled ? cancelResetRef : undefined}>
                <Checkbox.Root
                  aria-label={name}
                  name="choice"
                  value="yes"
                  defaultChecked={defaultChecked}
                >
                  <Checkbox.Indicator />
                </Checkbox.Root>
                <Button type="reset">{name}</Button>
              </form>
            );
          }),
        )}
      </section>
      <SwitchStates />
      <RadioGroupStates />
      <SelectStates />
      <SliderStates />
      <BadgeStates />
      <SkeletonStates />
      <SpinnerStates />
      <CardStates />
      <AlertStates />
      <AvatarStates />
      <ProgressStates />
      <TableStates />
      <BreadcrumbStates />
      <PaginationStates />
      <CollapsibleStates />
      <AccordionStates />
      <TabsStates />
      <ToggleStates />
      <TooltipStates />
    </main>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing fixture root');
createRoot(root).render(<Fixture />);
