import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const archive = resolve(process.argv[2]);
const directory = mkdtempSync(join(tmpdir(), 'utakata-consumer-'));
const run = (command, args) =>
  execFileSync(command, args, { cwd: directory, stdio: 'inherit' });

try {
  writeFileSync(
    join(directory, 'package.json'),
    JSON.stringify({ private: true, type: 'module' }),
  );
  run('npm', [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--prefer-offline',
    archive,
    'react@19',
    'react-dom@19',
    '@types/react@19',
    '@types/react-dom@19',
    'typescript@5.9.3',
  ]);
  const packageDirectory = join(directory, 'node_modules/@utakata-ui/react');
  const metadata = JSON.parse(
    readFileSync(join(packageDirectory, 'package.json'), 'utf8'),
  );
  assert.equal(metadata.license, 'MIT');
  for (const file of ['LICENSE', 'README.md', 'src/styles/styles.css']) {
    assert.ok(readFileSync(join(packageDirectory, file)).length > 0);
  }
  writeFileSync(
    join(directory, 'consumer.tsx'),
    `import {
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
  type ButtonGroupProps,
  type ButtonProps,
  type InputGroupAddonProps,
  type InputProps,
  type NativeSelectProps,
  type PaginationDirectionProps,
  type ProgressRootProps,
  type SelectRootProps,
  type SpinnerProps,
  type TableContainerProps,
  type TabsRootProps,
  type ToggleGroupItemProps,
  type ToggleGroupRootProps,
  type ToggleProps,
  type TooltipPopupProps,
  type TooltipRootProps,
} from '@utakata-ui/react';
import { componentManifest } from '@utakata-ui/react/manifest';
export const view = <><Button>Save</Button><Field.Root><Field.Label>Email</Field.Label><Field.Control /></Field.Root><Dialog.Root><Dialog.Trigger>Open</Dialog.Trigger></Dialog.Root></>;
export const manifest = componentManifest;
export const namedIcon = <Button iconOnly aria-label="Save" />;
export const referencedIcon = <Button iconOnly aria-labelledby="save-label" />;
export const normalButton: ButtonProps = { children: 'Save' };
// @ts-expect-error Icon-only buttons must require a name in shipped declarations.
export const missingName = <Button iconOnly />;
// @ts-expect-error Missing names must also fail through typed object props.
export const missingProps: ButtonProps = { iconOnly: true };
const unnamedSpread = { iconOnly: true as const };
// @ts-expect-error Spreading props must not bypass required names.
export const missingSpread = <Button {...unnamedSpread} />;
function Wrapper(props: ButtonProps) { return <Button {...props} />; }
export const wrappedValid = <Wrapper iconOnly aria-label="Save" />;
// @ts-expect-error Wrappers must preserve the required name contract.
export const wrappedInvalid = <Wrapper iconOnly />;
// @ts-expect-error Unsupported designs must fail against the public API.
export const unsupportedVariant = <Button variant="unsupported">Save</Button>;
export const shortcut = <KbdGroup aria-label="Control and K"><Kbd>Ctrl</Kbd><Kbd size="sm">K</Kbd></KbdGroup>;
// @ts-expect-error Kbd sizes are limited to the manifest.
export const unsupportedKbd = <Kbd size="lg">K</Kbd>;
export const divider = <Separator decorative={false} orientation="vertical" />;
// @ts-expect-error Separator semantics are controlled by decorative.
export const separatorRole = <Separator role="presentation" />;
export const badge = <Badge variant="outline">Draft</Badge>;
// @ts-expect-error Badge requires visible text.
export const emptyBadge = <Badge variant="solid" />;
export const skeleton = <Skeleton shape="circle" style={{ width: 40, height: 40 }} />;
// @ts-expect-error Skeleton never exposes status semantics.
export const skeletonRole = <Skeleton role="status" />;
export const spinner = <Spinner label="Uploading" />;
export const savingButton = <Button disabled><Spinner size="sm" decorative />Saving</Button>;
// @ts-expect-error Decorative spinners cannot carry a label.
export const labelledDecorative = <Spinner decorative label="Saving" />;
// @ts-expect-error The Spinner name comes from label, not aria-label.
export const spinnerAriaLabel = <Spinner aria-label="Loading" />;
export const spinnerProps: SpinnerProps = { decorative: true };
export const card = <Card.Root><Card.Header><Card.Title level="2">Profile</Card.Title></Card.Header><Card.Content>Body</Card.Content></Card.Root>;
// @ts-expect-error Card.Title levels are limited to 1-6.
export const cardLevel = <Card.Title level="7">Profile</Card.Title>;
export const alert = <Alert.Root variant="destructive" role="alert"><Alert.Title>Could not save</Alert.Title></Alert.Root>;
// @ts-expect-error Alert.Root only accepts live-region roles.
export const alertRegion = <Alert.Root role="region" />;
export const avatar = <Avatar.Root size="sm"><Avatar.Image src="/aya.png" alt="Aya" /><Avatar.Fallback>A</Avatar.Fallback></Avatar.Root>;
export const decorativeAvatar = <Avatar.Root><Avatar.Image src="/aya.png" alt="" /><Avatar.Fallback aria-hidden="true">A</Avatar.Fallback></Avatar.Root>;
// @ts-expect-error Avatar images require an explicit alt.
export const avatarNoAlt = <Avatar.Image src="/aya.png" />;
export const progress = <Progress.Root value={45} label="Upload"><Progress.Value /><Progress.Track><Progress.Indicator /></Progress.Track></Progress.Root>;
export const progressNamed = <Progress.Root value={null} aria-label="Sync" />;
// @ts-expect-error Progress.Root requires label, aria-label or aria-labelledby.
export const unnamedProgress = <Progress.Root value={45} />;
const progressSpread = { value: 45 };
// @ts-expect-error Spreading props must not bypass the progress name.
export const spreadProgress = <Progress.Root {...progressSpread} />;
// @ts-expect-error Typed object props keep the progress name contract.
export const progressProps: ProgressRootProps = { value: null };
export const table = <Table.Container aria-label="Invoices"><Table.Root><Table.Caption>Invoices</Table.Caption><Table.Body><Table.Row><Table.Head scope="row">INV-001</Table.Head><Table.Cell>1,000</Table.Cell></Table.Row></Table.Body></Table.Root></Table.Container>;
// @ts-expect-error The focusable table scroll region needs a name.
export const unnamedTable = <Table.Container><Table.Root /></Table.Container>;
// @ts-expect-error The scroll region keeps tabIndex=0 for keyboard scrolling.
export const untabbableTable: TableContainerProps = { 'aria-label': 'Invoices', tabIndex: -1 };
export const breadcrumb = <Breadcrumb.Root><Breadcrumb.List><Breadcrumb.Item><Breadcrumb.Link href="/">Home</Breadcrumb.Link></Breadcrumb.Item><Breadcrumb.Separator /><Breadcrumb.Item><Breadcrumb.Page>Settings</Breadcrumb.Page></Breadcrumb.Item></Breadcrumb.List></Breadcrumb.Root>;
export const routerCrumb = <Breadcrumb.Link render={<a href="/docs" />}>Docs</Breadcrumb.Link>;
// @ts-expect-error A breadcrumb link needs href or render.
export const crumbWithoutHref = <Breadcrumb.Link>Home</Breadcrumb.Link>;
export const pagination = <Pagination.Root aria-label="Result pages"><Pagination.List><Pagination.Item><Pagination.Previous disabled /></Pagination.Item><Pagination.Item><Pagination.Link href="?page=1" active>1</Pagination.Link></Pagination.Item><Pagination.Item><Pagination.Ellipsis /></Pagination.Item><Pagination.Item><Pagination.Next href="?page=2" /></Pagination.Item></Pagination.List></Pagination.Root>;
// @ts-expect-error An enabled Next needs a URL.
export const nextWithoutHref = <Pagination.Next />;
// @ts-expect-error A disabled Previous must not keep its URL.
export const disabledWithHref = <Pagination.Previous disabled href="?page=0" />;
// @ts-expect-error Page links need a URL.
export const pageWithoutHref = <Pagination.Link active>1</Pagination.Link>;
export const directionProps: PaginationDirectionProps = { disabled: true };
export const emailField = <Field.Root name="email"><Field.Label>Email</Field.Label><Input type="email" size="sm" /></Field.Root>;
export const notesField = <Field.Root><Field.Label>Notes</Field.Label><Textarea rows={4} maxLength={500} /></Field.Root>;
export const countryField = <Field.Root><Field.Label>Country</Field.Label><NativeSelect defaultValue="jp"><option value="jp">Japan</option></NativeSelect></Field.Root>;
export const termsCheckbox = <label><Checkbox.Root name="terms" value="accepted" indeterminate><Checkbox.Indicator /></Checkbox.Root>Terms</label>;
export const alertsSwitch = <Switch.Root aria-label="Alerts" readOnly><Switch.Thumb /></Switch.Root>;
// @ts-expect-error Input size is the visual size, not the native numeric size.
export const nativeInputSize = <Input size={20} />;
// @ts-expect-error Input sizes are limited to the manifest.
export const unsupportedInputSize: InputProps = { size: 'xl' };
// @ts-expect-error NativeSelect is single-value only.
export const multipleSelect = <NativeSelect multiple />;
// @ts-expect-error NativeSelect has no listbox size attribute.
export const listboxSelect: NativeSelectProps = { size: 4 };
// @ts-expect-error Switch has no mixed state.
export const mixedSwitch = <Switch.Root indeterminate />;
export const plan = <RadioGroup.Root name="plan" defaultValue="free" aria-label="Plan" orientation="horizontal"><RadioGroup.Item value="free"><RadioGroup.Indicator />Free</RadioGroup.Item></RadioGroup.Root>;
// @ts-expect-error RadioGroup orientation is limited to the manifest.
export const diagonalPlan = <RadioGroup.Root aria-label="Plan" orientation="diagonal" />;
export const theme = <Select.Root name="theme" defaultValue="system" items={[{ value: 'system', label: 'System' }]}><Select.Label>Theme</Select.Label><Select.Trigger><Select.Value placeholder="Choose" /></Select.Trigger><Select.Portal><Select.Positioner><Select.Popup><Select.List><Select.Item value="system"><Select.ItemText>System</Select.ItemText></Select.Item></Select.List></Select.Popup></Select.Positioner></Select.Portal></Select.Root>;
export const singleSelect: SelectRootProps<string> = { defaultValue: 'system' };
// @ts-expect-error Select is single-selection only.
export const multipleStyledSelect = <Select.Root multiple />;
// @ts-expect-error Part classNames are strings, not Base UI state callbacks.
export const callbackTrigger = <Select.Trigger className={() => 'x'} />;
export const volume = <Slider.Root name="volume" defaultValue={50} step={5}><Slider.Label>Volume</Slider.Label><Slider.Control><Slider.Track><Slider.Indicator /><Slider.Thumb /></Slider.Track></Slider.Control></Slider.Root>;
// @ts-expect-error Slider values are numbers.
export const stringVolume = <Slider.Root defaultValue="50" />;
export const disclosure = <Collapsible.Root><Collapsible.Trigger>Details</Collapsible.Trigger><Collapsible.Panel>Body</Collapsible.Panel></Collapsible.Root>;
export const faq = <Accordion.Root multiple defaultValue={['a']}><Accordion.Item value="a"><Accordion.Header level={2}><Accordion.Trigger>Shipping</Accordion.Trigger></Accordion.Header><Accordion.Panel>Body</Accordion.Panel></Accordion.Item></Accordion.Root>;
// @ts-expect-error Accordion heading levels are limited to 2-6.
export const faqLevel = <Accordion.Header level={1}>Shipping</Accordion.Header>;
export const tabs = <Tabs.Root defaultValue="a"><Tabs.List aria-label="Settings"><Tabs.Tab value="a">Profile</Tabs.Tab></Tabs.List><Tabs.Panel value="a">Body</Tabs.Panel></Tabs.Root>;
// @ts-expect-error The initial tab must be explicit.
export const implicitTab = <Tabs.Root><Tabs.List /></Tabs.Root>;
// @ts-expect-error Initial tab props must also fail through typed objects.
export const implicitTabProps: TabsRootProps = {};
export const toggle = <Toggle variant="outline" size="sm">Bold</Toggle>;
export const iconToggle = <Toggle iconOnly aria-label="Bold"><span aria-hidden="true">B</span></Toggle>;
// @ts-expect-error Icon-only toggles must require a name in shipped declarations.
export const unnamedToggle = <Toggle iconOnly />;
// @ts-expect-error Missing toggle names must also fail through typed object props.
export const unnamedToggleProps: ToggleProps = { iconOnly: true };
// @ts-expect-error Toggle variants are limited to the manifest.
export const solidToggle = <Toggle variant="solid">Bold</Toggle>;
export const tooltip = <Tooltip.Provider><Tooltip.Root><Tooltip.Trigger render={<Button iconOnly aria-label="Copy" />} /><Tooltip.Portal><Tooltip.Positioner><Tooltip.Popup>Copy to clipboard</Tooltip.Popup><Tooltip.Arrow /></Tooltip.Positioner></Tooltip.Portal></Tooltip.Root></Tooltip.Provider>;
// @ts-expect-error Tooltip popups hold plain text only; interactive content belongs in Popover.
export const interactiveTooltip = <Tooltip.Popup><a href="/">Help</a></Tooltip.Popup>;
// @ts-expect-error Tooltips must stay hoverable (WCAG 1.4.13).
export const nonHoverableTooltip: TooltipRootProps = { disableHoverablePopup: true };
// @ts-expect-error Typed popup props must also reject element children.
export const elementTooltipProps: TooltipPopupProps = { children: <span>Help</span> };
export const popover = <Popover.Root><Popover.Trigger>Settings</Popover.Trigger><Popover.Portal><Popover.Positioner sideOffset={8}><Popover.Popup><Popover.Title>Settings</Popover.Title><Popover.Close>Close</Popover.Close></Popover.Popup></Popover.Positioner></Popover.Portal></Popover.Root>;
// @ts-expect-error Positioner sides are limited to Base UI placements.
export const badPopoverSide = <Popover.Positioner side="middle" />;
export const menu = <DropdownMenu.Root><DropdownMenu.Trigger>Actions</DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Positioner><DropdownMenu.Popup><DropdownMenu.Group><DropdownMenu.GroupLabel>File</DropdownMenu.GroupLabel><DropdownMenu.Item onClick={() => {}}>Edit</DropdownMenu.Item></DropdownMenu.Group><DropdownMenu.Separator /><DropdownMenu.Item disabled>Delete</DropdownMenu.Item></DropdownMenu.Popup></DropdownMenu.Positioner></DropdownMenu.Portal></DropdownMenu.Root>;
// @ts-expect-error className is a string; Base UI state functions are not part of the public API.
export const stateClassName = <DropdownMenu.Item className={() => 'x'}>Edit</DropdownMenu.Item>;
export const confirmDelete = <AlertDialog.Root><AlertDialog.Trigger>Delete</AlertDialog.Trigger><AlertDialog.Portal><AlertDialog.Backdrop /><AlertDialog.Popup><AlertDialog.Title>Delete?</AlertDialog.Title><AlertDialog.Description>This cannot be undone.</AlertDialog.Description><AlertDialog.Close>Cancel</AlertDialog.Close><Button>Delete</Button></AlertDialog.Popup></AlertDialog.Portal></AlertDialog.Root>;
// @ts-expect-error Alert dialogs cannot opt into outside-press dismissal.
export const dismissibleAlert = <AlertDialog.Root disablePointerDismissal={false} />;
// @ts-expect-error Alert dialogs are always modal.
export const nonModalAlert = <AlertDialog.Root modal={false} />;
export function Toasts() { const { toasts } = useToastManager(); return toasts.map((toast) => <Toast.Root key={toast.id} toast={toast}><Toast.Content><Toast.Title /><Toast.Description /><Toast.Close>Close</Toast.Close></Toast.Content></Toast.Root>); }
export const toastApp = <Toast.Provider timeout={5000}><Toast.Portal><Toast.Viewport aria-label="Notifications"><Toasts /></Toast.Viewport></Toast.Portal></Toast.Provider>;
export const iconClose = <Toast.Close aria-label="Close"><span aria-hidden="true">×</span></Toast.Close>;
// @ts-expect-error Toast.Close requires visible text, aria-label or aria-labelledby.
export const unnamedClose = <Toast.Close />;
// @ts-expect-error Toast.Root requires a toast object from useToastManager.
export const missingToast = <Toast.Root />;
export const searchGroup = <Field.Root><Field.Label>Search</Field.Label><InputGroup.Root><InputGroup.Addon><svg aria-hidden="true" /></InputGroup.Addon><Input type="search" /><InputGroup.Addon align="inline-end"><InputGroup.Button>Search</InputGroup.Button><InputGroup.Button iconOnly aria-label="Clear">×</InputGroup.Button></InputGroup.Addon></InputGroup.Root></Field.Root>;
export const notesGroup = <InputGroup.Root><Textarea aria-label="Notes" aria-describedby="limit" /><InputGroup.Addon align="block-end"><InputGroup.Text id="limit">200 characters</InputGroup.Text></InputGroup.Addon></InputGroup.Root>;
// @ts-expect-error Addon alignments are limited to the manifest.
export const centeredAddon = <InputGroup.Addon align="center" />;
// @ts-expect-error Icon-only addon buttons keep the Button name requirement.
export const unnamedAddonButton = <InputGroup.Button iconOnly />;
// @ts-expect-error Typed addon props reject unsupported alignments.
export const addonProps: InputGroupAddonProps = { align: 'start' };
export const formatGroup = <ToggleGroup.Root multiple aria-label="Format" defaultValue={['bold']} orientation="vertical"><ToggleGroup.Item value="bold" variant="outline">Bold</ToggleGroup.Item><ToggleGroup.Item value="italic" iconOnly aria-label="Italic"><svg aria-hidden="true" /></ToggleGroup.Item></ToggleGroup.Root>;
export const labelledGroup: ToggleGroupRootProps = { 'aria-labelledby': 'format-label', onValueChange: (value: string[]) => value };
// @ts-expect-error Toggle groups require aria-label or aria-labelledby.
export const unnamedToggleGroup = <ToggleGroup.Root><ToggleGroup.Item value="a">A</ToggleGroup.Item></ToggleGroup.Root>;
const toggleGroupSpread = { multiple: true };
// @ts-expect-error Spreading props must not bypass the group name.
export const spreadToggleGroup = <ToggleGroup.Root {...toggleGroupSpread} />;
// @ts-expect-error Typed object props keep the group name contract.
export const unnamedToggleGroupProps: ToggleGroupRootProps = { multiple: true };
// @ts-expect-error Toggle group values are arrays.
export const scalarToggleGroup = <ToggleGroup.Root aria-label="View" value="list" />;
// @ts-expect-error Every toggle group item needs a value.
export const valuelessItem = <ToggleGroup.Item>A</ToggleGroup.Item>;
// @ts-expect-error Pressed state belongs to ToggleGroup.Root.
export const pressedItem: ToggleGroupItemProps = { value: 'a', pressed: true };
// @ts-expect-error Icon-only items keep the Toggle name requirement.
export const unnamedIconItem = <ToggleGroup.Item value="a" iconOnly />;
export const history = <ButtonGroup aria-label="History"><Button variant="outline">Undo</Button><Button variant="outline">Redo</Button></ButtonGroup>;
export const verticalGroup: ButtonGroupProps = { 'aria-labelledby': 'zoom-label', orientation: 'vertical' };
// @ts-expect-error Button groups require aria-label or aria-labelledby.
export const unnamedButtonGroup = <ButtonGroup><Button>Undo</Button></ButtonGroup>;
// @ts-expect-error Typed object props keep the button group name contract.
export const unnamedButtonGroupProps: ButtonGroupProps = { orientation: 'vertical' };
// @ts-expect-error Button groups do not become toolbars.
export const toolbarGroup = <ButtonGroup aria-label="Tools" role="toolbar" />;
// @ts-expect-error Button group orientations are limited to the manifest.
export const diagonalGroup = <ButtonGroup aria-label="Tools" orientation="diagonal" />;
`,
  );
  run(process.execPath, [
    'node_modules/typescript/bin/tsc',
    '--outDir',
    'build',
    '--strict',
    '--jsx',
    'react-jsx',
    '--module',
    'ESNext',
    '--moduleResolution',
    'Bundler',
    '--target',
    'ES2022',
    'consumer.tsx',
  ]);
  writeFileSync(
    join(directory, 'consumer.mjs'),
    `import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from '@utakata-ui/react';
import { componentManifest } from '@utakata-ui/react/manifest';
assert.ok(componentManifest);
assert.match(renderToStaticMarkup(createElement(Button, null, 'Save')), /Save/);
assert.ok(import.meta.resolve('@utakata-ui/react/styles.css').endsWith('.css'));
`,
  );
  run(process.execPath, ['consumer.mjs']);
} finally {
  rmSync(directory, { recursive: true, force: true });
}
