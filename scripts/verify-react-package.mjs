import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
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
    'react@19.3.1',
    'react-dom@19.3.1',
    '@types/react@19.3.0',
    '@types/react-dom@19.3.0',
    'typescript@5.9.3',
    'vite@8.3.5',
  ]);
  const packageDirectory = join(directory, 'node_modules/@utakata-ui/react');
  const metadata = JSON.parse(
    readFileSync(join(packageDirectory, 'package.json'), 'utf8'),
  );
  assert.equal(metadata.license, 'MIT');
  // tsc must preserve each client boundary in the archive consumed by Next/RSC.
  const sources = new URL('../packages/react/src/components/', import.meta.url);
  for (const file of readdirSync(sources).filter((name) =>
    name.endsWith('.tsx'),
  )) {
    const source = readFileSync(new URL(file, sources), 'utf8');
    if (/^['"]use client['"];/.test(source.trimStart())) {
      const output = readFileSync(
        join(
          packageDirectory,
          'dist/components',
          file.replace(/\.tsx$/, '.js'),
        ),
        'utf8',
      );
      assert.match(
        output.trimStart(),
        /^['"]use client['"];/,
        `${file}: packed client directive was lost`,
      );
    }
  }

  for (const file of ['LICENSE', 'README.md', 'src/styles/styles.css']) {
    assert.ok(readFileSync(join(packageDirectory, file)).length > 0);
  }
  writeFileSync(
    join(directory, 'consumer.tsx'),
    `import type { ComponentProps } from 'react';
import { Accordion, Alert, AlertDialog, Avatar, Badge, Breadcrumb, Button, ButtonGroup, Card, Collapsible, Combobox, Command, Dialog, Field, Frame, Input, InputGroup, InputOTP, Kbd, KbdGroup, NativeSelect, Pagination, Progress, RadioGroup, Select, Separator, Sheet, Skeleton, Slider, Spinner, Table, Tabs, Textarea, Toast, Toggle, ToggleGroup, Tooltip, type AccordionHeaderProps, type AlertDialogPopupProps, type BadgeProps, type BreadcrumbLinkProps, type BreadcrumbPageProps, type ButtonGroupProps, type ButtonProps, type CollapsibleRootProps, type ComboboxRootProps, type CommandRootProps, type InputGroupAddonProps, type InputGroupButtonProps, type InputOTPRootProps, type InputProps, type NativeSelectProps, type PaginationDirectionProps, type PaginationLinkProps, type ProgressRootProps, type RadioGroupRootProps, type SelectRootProps, type SheetPopupProps, type SkeletonProps, type SpinnerProps, type TableContainerProps, type TabsRootProps, type TextareaProps, type ToastCloseProps, type ToggleGroupItemProps, type ToggleGroupRootProps, type ToggleProps, type TooltipPopupProps, type TooltipRootProps } from '@utakata-ui/react';
import { componentManifest } from '@utakata-ui/react/manifest';
export const view = <><Button>Save</Button><Field.Root><Field.Label>Email</Field.Label><Field.Control /></Field.Root><Dialog.Root><Dialog.Trigger>Open</Dialog.Trigger></Dialog.Root></>;
export const manifest = componentManifest;
export const lismButton: ButtonProps = { p: '1rem', w: { base: '100%', md: 'auto' }, children: 'Save' };
export const lismView = <Card.Root p={{ base: '1rem', md: '2rem' }}><Field.Root g="1rem"><Field.Label>Email</Field.Label><Input w="100%" /></Field.Root><Button {...lismButton} /><Dialog.Root><Dialog.Trigger p="1rem">Open</Dialog.Trigger></Dialog.Root></Card.Root>;
export const aspectFrame = <Frame ar={{ base: '1/1', md: '16/9' }} w="100%"><img alt="Chart" src="chart.png" /></Frame>;
// @ts-expect-error Lism's alternative ref is not part of the shipped Box composition contract.
export const aspectFrameBadRef = <Skeleton forwardedRef={() => {}} ar="16/9" />;
export const lismTypes: import('@utakata-ui/react').LismStyleProps = { g: '1rem', layout: 'flex' };
export const upstreamLismType: import('@utakata-ui/react').LismProps = { p: '1rem' };
export const mergedLismType: import('@utakata-ui/react').WithLismProps<{ required: true }> = { required: true, p: '1rem' };
// @ts-expect-error Styling cannot bypass the icon-only name requirement.
export const lismUnnamedIcon = <Button iconOnly p="1rem" />;
// @ts-expect-error Component size takes precedence over generic styling.
export const lismInvalidSize = <Button p="1rem" size="xl">Save</Button>;
// @ts-expect-error Alternative Lism refs are excluded from public component Props.
export const lismAlternativeRef = <Button forwardedRef={() => {}}>Save</Button>;
export const verificationStates: readonly string[] = componentManifest.components.Button.verificationStates;
export const nativeSelectProps: NativeSelectProps = { size: 'lg', required: true, defaultValue: 'jp', className: 'country' };
export const country = <NativeSelect {...nativeSelectProps} aria-label="Country"><option value="jp">Japan</option></NativeSelect>;
// @ts-expect-error Numeric listbox size is excluded from the shipped API.
export const nativeSelectNumericSize: NativeSelectProps = { size: 4 };
// @ts-expect-error Multiple selection is not supported.
export const nativeSelectMultiple = <NativeSelect multiple aria-label="Country" />;
const multipleSelectProps = { multiple: true, className: 'country' };
// @ts-expect-error Spreads must preserve the single-selection contract.
export const nativeSelectMultipleSpread = <NativeSelect {...multipleSelectProps} aria-label="Country" />;
export const textareaProps: TextareaProps = { size: 'sm', rows: 4, maxLength: 500, className: 'notes' };
export const notes = <Field.Root><Field.Label>Notes</Field.Label><Textarea {...textareaProps} /></Field.Root>;
// @ts-expect-error Unsupported Textarea sizes fail against shipped declarations.
export const textareaUnsupportedSize: TextareaProps = { size: 'xl' };
// @ts-expect-error Textarea className must be a string.
export const textareaFunctionClass = <Textarea aria-label="Notes" className={() => 'x'} />;
export const inputProps: InputProps = { size: 'lg', type: 'email', readOnly: true, className: 'email' };
export const input = <Field.Root><Field.Label>Email</Field.Label><Input {...inputProps} /></Field.Root>;
// @ts-expect-error Input visual sizes replace the numeric native size.
export const inputNativeSize: InputProps = { size: 20 };
// @ts-expect-error Unsupported sizes must fail in shipped declarations.
export const inputUnsupportedSize = <Input aria-label="Email" size="xl" />;
// @ts-expect-error Input className must be a string.
export const inputFunctionClass: InputProps = { className: () => 'x' };
export const radioGroupProps: RadioGroupRootProps = { orientation: 'horizontal', className: 'plan', name: 'plan' };
export const plan = <RadioGroup.Root {...radioGroupProps} aria-label="Plan"><RadioGroup.Item value="free"><RadioGroup.Indicator />Free</RadioGroup.Item></RadioGroup.Root>;
// @ts-expect-error RadioGroup orientation is limited to the manifest values in shipped declarations.
export const radioGroupDiagonal: RadioGroupRootProps = { orientation: 'diagonal' };
// @ts-expect-error RadioGroup className must be a string in shipped declarations.
export const radioGroupFunctionClass: RadioGroupRootProps = { className: () => 'x' };
export const selectProps: SelectRootProps<string> = { defaultValue: 'system', name: 'theme' };
export const theme = <Select.Root {...selectProps}><Select.Label>Theme</Select.Label><Select.Trigger><Select.Value placeholder="Choose a theme" /><Select.Icon /></Select.Trigger></Select.Root>;
// @ts-expect-error Select is single-selection only in shipped declarations.
export const selectMultiple: SelectRootProps<string> = { multiple: true };
// @ts-expect-error A single Select does not accept an array value in shipped declarations.
export const selectArrayValue: SelectRootProps<string> = { value: ['a'] };
// @ts-expect-error Select.Trigger className must be a string in shipped declarations.
export const selectFunctionClass = <Select.Trigger className={() => 'x'} />;
const otpSlotLabel = (position: number, length: number) => 'Digit ' + position + ' of ' + length;
export const otpProps: InputOTPRootProps = { length: 6, name: 'code', getSlotLabel: otpSlotLabel, validationType: 'numeric' };
export const otp = <Field.Root><Field.Label>Verification code</Field.Label><InputOTP.Root {...otpProps}><InputOTP.Slot /><InputOTP.Slot /><InputOTP.Slot /><InputOTP.Separator /><InputOTP.Slot /><InputOTP.Slot /><InputOTP.Slot /></InputOTP.Root></Field.Root>;
// @ts-expect-error InputOTP.Root requires getSlotLabel in shipped declarations.
export const otpNoSlotLabel: InputOTPRootProps = { length: 6 };
// @ts-expect-error InputOTP does not provide autoSubmit in shipped declarations.
export const otpAutoSubmit: InputOTPRootProps = { length: 6, getSlotLabel: otpSlotLabel, autoSubmit: true };
// @ts-expect-error InputOTP.Root aria-label would leave the first slot unnamed in shipped declarations.
export const otpRootLabel: InputOTPRootProps = { length: 6, getSlotLabel: otpSlotLabel, 'aria-label': 'Code' };
// @ts-expect-error InputOTP.Root className must be a string in shipped declarations.
export const otpFunctionClass: InputOTPRootProps = { length: 6, getSlotLabel: otpSlotLabel, className: () => 'x' };
export const comboboxProps: ComboboxRootProps<string> = { defaultValue: 'apple', name: 'fruit', items: ['apple', 'banana'] };
export const fruit = <Field.Root><Field.Label>Fruit</Field.Label><Combobox.Root {...comboboxProps}><Combobox.InputGroup><Combobox.Input placeholder="Search fruit" /><Combobox.Clear aria-label="Clear" /><Combobox.Trigger aria-label="Show options" /></Combobox.InputGroup><Combobox.Portal><Combobox.Positioner><Combobox.Popup><Combobox.Empty>No fruit found</Combobox.Empty><Combobox.List>{(item: string) => <Combobox.Item key={item} value={item}>{item}<Combobox.ItemIndicator /></Combobox.Item>}</Combobox.List></Combobox.Popup></Combobox.Positioner></Combobox.Portal></Combobox.Root></Field.Root>;
export const comboboxNamedByContent = <Combobox.Trigger>Show options</Combobox.Trigger>;
export const comboboxNamedByReference = <Combobox.Clear aria-labelledby="clear-name" />;
// @ts-expect-error Combobox is single-selection only in shipped declarations.
export const comboboxMultiple: ComboboxRootProps<string> = { multiple: true };
// @ts-expect-error A single Combobox does not accept an array value in shipped declarations.
export const comboboxArrayValue: ComboboxRootProps<string> = { value: ['a'] };
// @ts-expect-error Inline lists are not provided in shipped declarations.
export const comboboxInline: ComboboxRootProps<string> = { inline: true };
// @ts-expect-error An unnamed Combobox.Clear is a type error in shipped declarations.
export const comboboxUnnamedClear = <Combobox.Clear />;
// @ts-expect-error An unnamed Combobox.Trigger is a type error in shipped declarations.
export const comboboxUnnamedTrigger = <Combobox.Trigger />;
const comboboxEmptyProps = { className: 'clear' };
// @ts-expect-error Spreads cannot remove the required Clear name in shipped declarations.
export const comboboxUnnamedSpread = <Combobox.Clear {...comboboxEmptyProps} />;
// @ts-expect-error Combobox.Input className must be a string in shipped declarations.
export const comboboxFunctionClass = <Combobox.Input className={() => 'x'} />;
// @ts-expect-error Combobox.Label is not exported: it would label only the trigger in shipped declarations.
export const comboboxLabel = <Combobox.Label>Fruit</Combobox.Label>;
export const commandProps: CommandRootProps<string> = { items: ['home', 'settings'] };
export const palette = <Command.Root {...commandProps}><Command.Panel><Command.Input aria-label="Search commands" /><Command.Empty>No commands found</Command.Empty><Command.List>{(item: string) => <Command.Item key={item} value={item} onClick={() => {}}>{item}<Command.Shortcut aria-hidden="true">K</Command.Shortcut></Command.Item>}</Command.List></Command.Panel></Command.Root>;
// @ts-expect-error Command is always inline: open state is not configurable in shipped declarations.
export const commandOpen: CommandRootProps<string> = { open: false };
// @ts-expect-error Command is always inline in shipped declarations.
export const commandInline: CommandRootProps<string> = { inline: false };
// @ts-expect-error Command is not a form field and has no name in shipped declarations.
export const commandName: CommandRootProps<string> = { name: 'command' };
// @ts-expect-error Command.Input className must be a string in shipped declarations.
export const commandFunctionClass = <Command.Input className={() => 'x'} />;
// @ts-expect-error Command.Popup is not exported: the list is inline in shipped declarations.
export const commandPopup = <Command.Popup />;
type SliderRootProps = ComponentProps<typeof Slider.Root>;
export const sliderProps: SliderRootProps = { defaultValue: 50, min: 0, max: 100, step: 5, name: 'volume' };
export const volume = <Slider.Root {...sliderProps}><Slider.Label>Volume</Slider.Label><Slider.Control><Slider.Track><Slider.Indicator /><Slider.Thumb getAriaValueText={(value) => value + ' percent'} /></Slider.Track></Slider.Control></Slider.Root>;
// @ts-expect-error Slider values are numbers in shipped declarations.
export const sliderStringValue: SliderRootProps = { defaultValue: '50' };
// @ts-expect-error Slider className must be a string in shipped declarations.
export const sliderFunctionClass: SliderRootProps = { className: () => 'x' };
export const badgeProps: BadgeProps = { variant: 'outline', children: 'Draft' };
export const badge = <Badge {...badgeProps} />;
// @ts-expect-error Badge variants are limited to the manifest in shipped declarations.
export const badgeUnsupportedVariant = <Badge variant="loud">Draft</Badge>;
// @ts-expect-error Badge requires visible text children in shipped declarations.
export const badgeMissingText = <Badge />;
// @ts-expect-error Badge className must be a string in shipped declarations.
export const badgeFunctionClass = <Badge className={() => 'x'}>Draft</Badge>;
export const skeletonProps: SkeletonProps = { shape: 'circle', style: { width: 40 } };
export const skeleton = <Skeleton {...skeletonProps} />;
// @ts-expect-error Skeleton shapes are limited to the manifest in shipped declarations.
export const skeletonUnsupportedShape: SkeletonProps = { shape: 'pill' };
// @ts-expect-error Skeleton never exposes status semantics in shipped declarations.
export const skeletonRole: SkeletonProps = { role: 'status' };
const skeletonFocusProps = { tabIndex: 0, role: 'button' };
// @ts-expect-error Spreads cannot make a Skeleton focusable in shipped declarations.
export const skeletonFocusSpread = <Skeleton {...skeletonFocusProps} />;
const skeletonContentProps = { children: 'Loading' };
// @ts-expect-error Spreads cannot give a Skeleton content in shipped declarations.
export const skeletonContentSpread = <Skeleton {...skeletonContentProps} />;
export const spinnerProps: SpinnerProps = { label: 'Uploading', size: 'sm' };
export const spinner = <Spinner {...spinnerProps} />;
export const decorativeSpinner = <Button><Spinner decorative />Saving</Button>;
// @ts-expect-error Decorative spinners announce nothing, so a label is invalid in shipped declarations.
export const spinnerLabelledDecorative: SpinnerProps = { decorative: true, label: 'Saving' };
// @ts-expect-error The status role is managed by Spinner in shipped declarations.
export const spinnerRole: SpinnerProps = { role: 'progressbar' };
// @ts-expect-error The name comes from label, including hyphenated JSX attributes.
export const spinnerAriaLabel = <Spinner aria-label="Loading" />;
// @ts-expect-error Spinner sizes are limited to the manifest in shipped declarations.
export const spinnerUnsupportedSize: SpinnerProps = { size: 'xl' };
const spinnerRoleProps = { role: 'progressbar' };
// @ts-expect-error Spreads cannot override the managed status role.
export const spinnerRoleSpread = <Spinner {...spinnerRoleProps} />;
const spinnerNameProps = { 'aria-label': 'Loading' };
// @ts-expect-error Spreads cannot add a second accessible name.
export const spinnerNameSpread = <Spinner {...spinnerNameProps} />;
function SpinnerWrapper(props: SpinnerProps) { return <Spinner {...props} />; }
export const wrappedSpinner = <SpinnerWrapper label="Uploading" />;
// @ts-expect-error Wrappers must preserve the decorative and label exclusion.
export const wrappedSpinnerInvalid = <SpinnerWrapper decorative label="Uploading" />;
type CardTitleProps = ComponentProps<typeof Card.Title>;
export const cardTitleProps: CardTitleProps = { level: '2', children: 'Profile' };
export const card = <Card.Root><Card.Header><Card.Title {...cardTitleProps} /><Card.Description>Edit</Card.Description></Card.Header><Card.Content>Body</Card.Content><Card.Footer><Button>Save</Button></Card.Footer></Card.Root>;
// @ts-expect-error Card.Title heading levels are limited to 1-6 in shipped declarations.
export const cardInvalidLevel: CardTitleProps = { level: '7', children: 'Profile' };
// @ts-expect-error Card.Title requires heading text in shipped declarations.
export const cardEmptyTitle: CardTitleProps = { level: '2' };
// @ts-expect-error Card className must be a string in shipped declarations.
export const cardFunctionClass = <Card.Root className={() => 'x'} />;
type AlertRootProps = ComponentProps<typeof Alert.Root>;
export const alertProps: AlertRootProps = { variant: 'destructive', role: 'alert' };
export const alert = <Alert.Root {...alertProps}><Alert.Title>Could not save</Alert.Title><Alert.Description>Try again.</Alert.Description></Alert.Root>;
export const staticAlert = <Alert.Root><Alert.Title>Notice</Alert.Title></Alert.Root>;
// @ts-expect-error Only live-region roles are supported on Alert.Root in shipped declarations.
export const alertRegionRole: AlertRootProps = { role: 'region' };
// @ts-expect-error Alert variants are limited to the manifest in shipped declarations.
export const alertUnsupportedVariant: AlertRootProps = { variant: 'warning' };
const alertRoleProps = { role: 'region' };
// @ts-expect-error Spreads cannot widen the Alert role contract.
export const alertRoleSpread = <Alert.Root {...alertRoleProps} />;
// @ts-expect-error Alert className must be a string in shipped declarations.
export const alertFunctionClass = <Alert.Root className={() => 'x'} />;
type AvatarImageProps = ComponentProps<typeof Avatar.Image>;
export const namedAvatarProps: AvatarImageProps = { src: '/aya.png', alt: 'Aya' };
export const decorativeAvatarProps: AvatarImageProps = { src: '/aya.png', alt: '' };
export const avatar = <Avatar.Root size="lg"><Avatar.Image {...namedAvatarProps} /><Avatar.Fallback>Aya</Avatar.Fallback></Avatar.Root>;
export const adjacentNameAvatar = <Avatar.Root><Avatar.Image {...decorativeAvatarProps} /><Avatar.Fallback aria-hidden="true">A</Avatar.Fallback></Avatar.Root>;
// @ts-expect-error Avatar images require an explicit alt decision in shipped declarations.
export const avatarMissingAlt: AvatarImageProps = { src: '/aya.png' };
// @ts-expect-error Avatar.Image requires alt in JSX in shipped declarations.
export const avatarMissingAltJsx = <Avatar.Image src="/aya.png" />;
const avatarSpreadProps = { src: '/aya.png' };
// @ts-expect-error Spreads cannot bypass the required alt.
export const avatarSpreadMissingAlt = <Avatar.Image {...avatarSpreadProps} />;
function AvatarWrapper(props: AvatarImageProps) { return <Avatar.Image {...props} />; }
export const wrappedAvatar = <AvatarWrapper src="/aya.png" alt="Aya" />;
// @ts-expect-error Wrappers must preserve the required alt.
export const wrappedAvatarInvalid = <AvatarWrapper src="/aya.png" />;
// @ts-expect-error Avatar sizes are limited to the manifest in shipped declarations.
export const avatarUnsupportedSize = <Avatar.Root size="xl" />;
export const labelledProgress: ProgressRootProps = { value: 10, label: 'Upload' };
export const namedProgress: ProgressRootProps = { value: 10, 'aria-label': 'Upload' };
export const indeterminateProgress: ProgressRootProps = { value: null, 'aria-labelledby': 'upload-label' };
export const progress = <Progress.Root {...labelledProgress}><Progress.Value /><Progress.Track><Progress.Indicator /></Progress.Track></Progress.Root>;
// @ts-expect-error Progress.Root requires a name source in shipped declarations.
export const unnamedProgress: ProgressRootProps = { value: 10 };
// @ts-expect-error label and aria-label are alternative name sources in shipped declarations.
export const doubleNamedProgress: ProgressRootProps = { value: 1, label: 'A', 'aria-label': 'B' };
// @ts-expect-error value is required; use null for indeterminate.
export const progressMissingValue: ProgressRootProps = { label: 'Upload' };
// @ts-expect-error JSX usage must also provide a name source.
export const progressUnnamedJsx = <Progress.Root value={10} />;
const unnamedProgressProps = { value: 10 };
// @ts-expect-error Spreads cannot bypass the required name.
export const progressSpreadUnnamed = <Progress.Root {...unnamedProgressProps} />;
function ProgressWrapper(props: ProgressRootProps) { return <Progress.Root {...props} />; }
export const wrappedProgress = <ProgressWrapper value={5} label="Upload" />;
// @ts-expect-error Wrappers must preserve the required name.
export const wrappedProgressInvalid = <ProgressWrapper value={5} />;
export const labelledTable: TableContainerProps = { 'aria-label': 'Team members' };
export const referencedTable: TableContainerProps = { 'aria-labelledby': 'team-caption' };
export const table = <Table.Container {...labelledTable}><Table.Root><Table.Caption id="team-caption">Team</Table.Caption><Table.Header><Table.Row><Table.Head scope="col">Name</Table.Head></Table.Row></Table.Header></Table.Root></Table.Container>;
// @ts-expect-error Table.Container requires a name in shipped declarations.
export const unnamedTable: TableContainerProps = {};
// @ts-expect-error Container focusability is fixed for keyboard scrolling.
export const untabbableTable: TableContainerProps = { 'aria-label': 'x', tabIndex: -1 };
// @ts-expect-error The region role is fixed.
export const tableRoleOverride: TableContainerProps = { 'aria-label': 'x', role: 'none' };
const tableRoleProps = { 'aria-label': 'x', role: 'none' };
// @ts-expect-error Spreads cannot override the region role.
export const tableRoleSpread = <Table.Container {...tableRoleProps} />;
const tableFocusProps = { 'aria-label': 'x', tabIndex: -1 };
// @ts-expect-error Spreads cannot remove the container from the tab order.
export const tableFocusSpread = <Table.Container {...tableFocusProps} />;
export const hrefLink: BreadcrumbLinkProps = { href: '/' };
export const routerLink: BreadcrumbLinkProps = { render: <a href="/docs">Docs</a> };
export const breadcrumb = <Breadcrumb.Root><Breadcrumb.List><Breadcrumb.Item><Breadcrumb.Link {...hrefLink}>Home</Breadcrumb.Link></Breadcrumb.Item><Breadcrumb.Separator /><Breadcrumb.Item><Breadcrumb.Page>Docs</Breadcrumb.Page></Breadcrumb.Item></Breadcrumb.List></Breadcrumb.Root>;
// @ts-expect-error A breadcrumb link needs href or a render element in shipped declarations.
export const breadcrumbNoDestination: BreadcrumbLinkProps = { children: 'Home' };
// @ts-expect-error JSX usage must also provide a destination.
export const breadcrumbNoDestinationJsx = <Breadcrumb.Link>Home</Breadcrumb.Link>;
// @ts-expect-error The current page always uses aria-current="page" in shipped declarations.
export const breadcrumbWrongCurrent: BreadcrumbPageProps = { 'aria-current': 'step' };
const breadcrumbCurrentProps = { 'aria-current': 'step' as const };
// @ts-expect-error Spreads cannot change the current-page marker.
export const breadcrumbCurrentSpread = <Breadcrumb.Page {...breadcrumbCurrentProps} />;
const breadcrumbVisibleProps = { 'aria-hidden': false as const, role: 'presentation' };
// @ts-expect-error Spreads cannot expose decorative separators.
export const breadcrumbSeparatorSpread = <Breadcrumb.Separator {...breadcrumbVisibleProps} />;
const breadcrumbLinkProps = { children: 'Home' };
// @ts-expect-error Spreads cannot create a link without a destination.
export const breadcrumbLinkSpread = <Breadcrumb.Link {...breadcrumbLinkProps} />;
export const paginationPage: PaginationLinkProps = { href: '?page=2', active: true };
export const paginationEnabled: PaginationDirectionProps = { href: '?page=2' };
export const paginationDisabled: PaginationDirectionProps = { disabled: true };
export const pagination = <Pagination.Root aria-label="Result pages"><Pagination.List><Pagination.Item><Pagination.Previous {...paginationDisabled} /></Pagination.Item><Pagination.Item><Pagination.Link {...paginationPage}>1</Pagination.Link></Pagination.Item><Pagination.Item><Pagination.Ellipsis label="More pages" /></Pagination.Item><Pagination.Item><Pagination.Next {...paginationEnabled} /></Pagination.Item></Pagination.List></Pagination.Root>;
// @ts-expect-error Page links need a URL in shipped declarations.
export const paginationNoHref: PaginationLinkProps = { children: '2' };
// @ts-expect-error An enabled Previous/Next needs a URL in shipped declarations.
export const paginationEnabledNoHref: PaginationDirectionProps = {};
// @ts-expect-error A disabled Previous/Next must not keep its URL in shipped declarations.
export const paginationDisabledHref: PaginationDirectionProps = { disabled: true, href: '?' };
// @ts-expect-error The current page is set with active, not aria-current.
export const paginationRawCurrent: PaginationLinkProps = { href: '?', 'aria-current': 'page' };
const paginationCurrentProps = { href: '?', 'aria-current': 'page' as const };
// @ts-expect-error Spreads cannot set aria-current directly.
export const paginationCurrentSpread = <Pagination.Link {...paginationCurrentProps} />;
const paginationDisabledProps = { href: '?', 'aria-disabled': false as const };
// @ts-expect-error Spreads cannot override the managed disabled state.
export const paginationDisabledSpread = <Pagination.Next {...paginationDisabledProps} />;
function PaginationWrapper(props: PaginationDirectionProps) { return <Pagination.Next {...props} />; }
export const wrappedPagination = <PaginationWrapper href="?page=3" />;
// @ts-expect-error Wrappers must preserve the href/disabled exclusion.
export const wrappedPaginationInvalid = <PaginationWrapper disabled href="?page=3" />;
export const collapsibleProps: CollapsibleRootProps = { defaultOpen: true, disabled: false };
export const collapsible = <Collapsible.Root {...collapsibleProps}><Collapsible.Trigger>Advanced settings</Collapsible.Trigger><Collapsible.Panel keepMounted>Details</Collapsible.Panel></Collapsible.Root>;
// @ts-expect-error className is a string; state functions are not public API in shipped declarations.
export const collapsibleFunctionClass: CollapsibleRootProps = { className: () => 'x' };
// @ts-expect-error Trigger className must be a string in shipped declarations.
export const collapsibleTriggerFunctionClass = <Collapsible.Trigger className={() => 'x'}>Open</Collapsible.Trigger>;
const collapsibleBadProps = { className: () => 'x' };
// @ts-expect-error Spreads cannot pass a state function as className.
export const collapsibleSpreadClass = <Collapsible.Root {...collapsibleBadProps} />;
function CollapsibleWrapper(props: CollapsibleRootProps) { return <Collapsible.Root {...props} />; }
export const wrappedCollapsible = <CollapsibleWrapper defaultOpen />;
// @ts-expect-error Wrappers must preserve the string className contract.
export const wrappedCollapsibleInvalid = <CollapsibleWrapper className={() => 'x'} />;
export const accordionHeader: AccordionHeaderProps = { level: 2 };
export const accordion = <Accordion.Root defaultValue={['a']}><Accordion.Item value="a"><Accordion.Header {...accordionHeader}><Accordion.Trigger>Account</Accordion.Trigger></Accordion.Header><Accordion.Panel>Details</Accordion.Panel></Accordion.Item></Accordion.Root>;
// @ts-expect-error Heading levels are limited to 2-6 in shipped declarations.
export const accordionPageTitleLevel: AccordionHeaderProps = { level: 1 };
// @ts-expect-error Heading levels are limited to 2-6 in JSX in shipped declarations.
export const accordionInvalidLevelJsx = <Accordion.Header level={7} />;
const accordionBadLevel = { level: 1 };
// @ts-expect-error Spreads cannot bypass the heading level contract.
export const accordionLevelSpread = <Accordion.Header {...accordionBadLevel} />;
// @ts-expect-error Accordion className must be a string in shipped declarations.
export const accordionFunctionClass = <Accordion.Root className={() => 'x'} />;
function AccordionHeaderWrapper(props: AccordionHeaderProps) { return <Accordion.Header {...props} />; }
export const wrappedAccordionHeader = <AccordionHeaderWrapper level={4} />;
// @ts-expect-error Wrappers must preserve the heading level contract.
export const wrappedAccordionHeaderInvalid = <AccordionHeaderWrapper level={1} />;
export const tabsUncontrolled: TabsRootProps = { defaultValue: 'profile' };
export const tabsControlled: TabsRootProps = { value: 'profile' };
export const tabs = <Tabs.Root {...tabsUncontrolled}><Tabs.List aria-label="Settings"><Tabs.Tab value="profile">Profile</Tabs.Tab></Tabs.List><Tabs.Panel value="profile">Details</Tabs.Panel></Tabs.Root>;
// @ts-expect-error The initial tab must be explicit in shipped declarations.
export const tabsImplicitInitial: TabsRootProps = {};
// @ts-expect-error value and defaultValue are mutually exclusive in shipped declarations.
export const tabsBoth: TabsRootProps = { value: 'a', defaultValue: 'b' };
// @ts-expect-error JSX usage must also provide the initial tab.
export const tabsImplicitJsx = <Tabs.Root />;
const tabsNoValueProps = { orientation: 'vertical' as const };
// @ts-expect-error Spreads cannot bypass the explicit initial tab.
export const tabsSpreadImplicit = <Tabs.Root {...tabsNoValueProps} />;
function TabsWrapper(props: TabsRootProps) { return <Tabs.Root {...props} />; }
export const wrappedTabs = <TabsWrapper defaultValue="a" />;
// @ts-expect-error Wrappers must preserve the explicit initial tab.
export const wrappedTabsInvalid = <TabsWrapper />;
export const toggleNamedIcon: ToggleProps = { iconOnly: true, 'aria-label': 'Bold' };
export const toggleReferencedIcon: ToggleProps = { iconOnly: true, 'aria-labelledby': 'bold-label' };
export const toggle = <Toggle size="sm" variant="outline" defaultPressed>Bold</Toggle>;
export const toggleIcon = <Toggle {...toggleNamedIcon} />;
// @ts-expect-error Icon-only toggles require an explicit name source in shipped declarations.
export const toggleUnnamedIcon: ToggleProps = { iconOnly: true };
// @ts-expect-error JSX usage must also provide a name for icon-only toggles.
export const toggleUnnamedIconJsx = <Toggle iconOnly />;
// @ts-expect-error Toggle variants are limited to the manifest in shipped declarations.
export const toggleUnsupportedVariant: ToggleProps = { variant: 'solid' };
// @ts-expect-error Toggle sizes are limited to the manifest in shipped declarations.
export const toggleUnsupportedSize: ToggleProps = { size: 'xl' };
const toggleUnnamedProps = { iconOnly: true as const };
// @ts-expect-error Spreads cannot bypass the required name.
export const toggleSpreadUnnamed = <Toggle {...toggleUnnamedProps} />;
function ToggleWrapper(props: ToggleProps) { return <Toggle {...props} />; }
export const wrappedToggle = <ToggleWrapper iconOnly aria-label="Bold" />;
// @ts-expect-error Wrappers must preserve the required name contract.
export const wrappedToggleInvalid = <ToggleWrapper iconOnly />;
export const tooltipText: TooltipPopupProps = { children: 'Copy to clipboard' };
export const tooltip = <Tooltip.Provider><Tooltip.Root><Tooltip.Trigger render={<Button />}>Copy</Tooltip.Trigger><Tooltip.Portal><Tooltip.Positioner><Tooltip.Popup {...tooltipText} /></Tooltip.Positioner></Tooltip.Portal></Tooltip.Root></Tooltip.Provider>;
// @ts-expect-error Tooltips hold plain text; interactive content belongs in Popover.
export const tooltipElementPopup: TooltipPopupProps = { children: <a href="/">Help</a> };
// @ts-expect-error The popup must stay hoverable (WCAG 1.4.13) in shipped declarations.
export const tooltipNonHoverable: TooltipRootProps = { disableHoverablePopup: true };
// @ts-expect-error className is a string, not a Base UI state function, in shipped declarations.
export const tooltipStateClass: TooltipPopupProps = { children: 'x', className: () => 'x' };
// @ts-expect-error JSX usage must also keep the popup hoverable.
export const tooltipNonHoverableJsx = <Tooltip.Root disableHoverablePopup />;
const tooltipPopupProps = { children: <a href="/">Help</a> };
// @ts-expect-error Spreads cannot put interactive content into a tooltip.
export const tooltipSpreadElement = <Tooltip.Popup {...tooltipPopupProps} />;
function TooltipWrapper(props: TooltipPopupProps) { return <Tooltip.Popup {...props} />; }
export const wrappedTooltip = <TooltipWrapper>Copy</TooltipWrapper>;
// @ts-expect-error Wrappers must preserve the plain-text contract.
export const wrappedTooltipInvalid = <TooltipWrapper><a href="/">Help</a></TooltipWrapper>;
type AlertDialogRootProps = ComponentProps<typeof AlertDialog.Root>;
export const alertDialogRoot: AlertDialogRootProps = { defaultOpen: true };
export const alertDialogPopup: AlertDialogPopupProps = { className: 'confirm' };
export const alertDialog = <AlertDialog.Root {...alertDialogRoot}><AlertDialog.Trigger>Delete</AlertDialog.Trigger><AlertDialog.Portal><AlertDialog.Backdrop /><AlertDialog.Popup {...alertDialogPopup}><AlertDialog.Title>Delete file?</AlertDialog.Title><AlertDialog.Description>This cannot be undone.</AlertDialog.Description><AlertDialog.Close>Cancel</AlertDialog.Close></AlertDialog.Popup></AlertDialog.Portal></AlertDialog.Root>;
// @ts-expect-error Outside-press dismissal is not configurable on AlertDialog in shipped declarations.
export const alertDialogDismissible: AlertDialogRootProps = { disablePointerDismissal: false };
// @ts-expect-error AlertDialog is always modal in shipped declarations.
export const alertDialogNonModal: AlertDialogRootProps = { modal: false };
// @ts-expect-error JSX usage must also keep the dialog modal.
export const alertDialogNonModalJsx = <AlertDialog.Root modal={false} />;
// @ts-expect-error className must be a string, not a state function, in shipped declarations.
export const alertDialogPopupClass: AlertDialogPopupProps = { className: () => 'x' };
const alertDialogUnsafeProps = { modal: false };
// @ts-expect-error Spreads cannot make the dialog non-modal.
export const alertDialogSpreadNonModal = <AlertDialog.Root {...alertDialogUnsafeProps} />;
function AlertDialogWrapper(props: AlertDialogRootProps) { return <AlertDialog.Root {...props} />; }
export const wrappedAlertDialog = <AlertDialogWrapper defaultOpen />;
// @ts-expect-error Wrappers must preserve the modal contract.
export const wrappedAlertDialogInvalid = <AlertDialogWrapper modal={false} />;
export const sheetPopup: SheetPopupProps = { side: 'left', className: 'panel' };
export const sheet = <Sheet.Root><Sheet.Trigger>Open filters</Sheet.Trigger><Sheet.Portal><Sheet.Backdrop /><Sheet.Popup {...sheetPopup}><Sheet.Title>Filters</Sheet.Title><Sheet.Description>Narrow the list.</Sheet.Description><Sheet.Close>Close</Sheet.Close></Sheet.Popup></Sheet.Portal></Sheet.Root>;
export const sheetDefaultSide = <Sheet.Popup><Sheet.Title>Filters</Sheet.Title></Sheet.Popup>;
// @ts-expect-error Sides are limited to the four edges in shipped declarations.
export const sheetInvalidSide: SheetPopupProps = { side: 'center' };
// @ts-expect-error JSX usage must also use a supported side.
export const sheetInvalidSideJsx = <Sheet.Popup side="center" />;
const sheetUnsafeProps = { side: 'center' };
// @ts-expect-error Spreads cannot pass an unsupported side.
export const sheetSpreadSide = <Sheet.Popup {...sheetUnsafeProps} />;
// @ts-expect-error className must be a string, not a state function, in shipped declarations.
export const sheetPopupClass: SheetPopupProps = { className: () => 'x' };
type SheetRootProps = ComponentProps<typeof Sheet.Root>;
export const sheetRoot: SheetRootProps = { defaultOpen: true };
// @ts-expect-error A Sheet is always modal in shipped declarations.
export const sheetNonModal: SheetRootProps = { modal: false };
// @ts-expect-error The trap-focus variant is not available in shipped declarations.
export const sheetTrapFocus: SheetRootProps = { modal: 'trap-focus' };
// @ts-expect-error JSX usage must also keep the sheet modal.
export const sheetNonModalJsx = <Sheet.Root modal={false} />;
const sheetUnsafeRoot = { modal: false };
// @ts-expect-error Spreads cannot make the sheet non-modal.
export const sheetSpreadNonModal = <Sheet.Root {...sheetUnsafeRoot} />;
function SheetRootWrapper(props: SheetRootProps) { return <Sheet.Root {...props} />; }
export const wrappedSheetRoot = <SheetRootWrapper defaultOpen />;
// @ts-expect-error Wrappers must preserve the modal contract.
export const wrappedSheetRootInvalid = <SheetRootWrapper modal={false} />;
function SheetWrapper(props: SheetPopupProps) { return <Sheet.Popup {...props} />; }
export const wrappedSheet = <SheetWrapper side="top" />;
// @ts-expect-error Wrappers must preserve the side contract.
export const wrappedSheetInvalid = <SheetWrapper side="center" />;
export const toastTextClose: ToastCloseProps = { children: 'Dismiss' };
export const toastLabelledClose: ToastCloseProps = { 'aria-label': 'Close notification' };
export const toastClose = <Toast.Close {...toastTextClose} />;
// @ts-expect-error An empty Close button has no accessible name in shipped declarations.
export const toastEmptyClose: ToastCloseProps = {};
// @ts-expect-error JSX usage must also provide a name for Close.
export const toastEmptyCloseJsx = <Toast.Close />;
// @ts-expect-error className must be a string, not a state function, in shipped declarations.
export const toastFunctionClass: ToastCloseProps = { children: 'x', className: () => 'x' };
const toastEmptyProps = { id: 'close' };
// @ts-expect-error Spreads cannot create an unnamed Close button.
export const toastSpreadEmptyClose = <Toast.Close {...toastEmptyProps} />;
function ToastCloseWrapper(props: ToastCloseProps) { return <Toast.Close {...props} />; }
export const wrappedToastClose = <ToastCloseWrapper aria-label="Close" />;
// @ts-expect-error Wrappers must preserve the required name.
export const wrappedToastCloseInvalid = <ToastCloseWrapper />;
export const toggleGroupNamed: ToggleGroupRootProps = { 'aria-label': 'Format', multiple: true };
export const toggleGroupReferenced: ToggleGroupRootProps = { 'aria-labelledby': 'format' };
export const toggleGroupItem: ToggleGroupItemProps = { value: 'bold', variant: 'outline' };
export const toggleGroup = <ToggleGroup.Root {...toggleGroupNamed}><ToggleGroup.Item {...toggleGroupItem}>Bold</ToggleGroup.Item><ToggleGroup.Item value="italic" iconOnly aria-label="Italic" /></ToggleGroup.Root>;
// @ts-expect-error The group requires aria-label or aria-labelledby in shipped declarations.
export const toggleGroupUnnamed: ToggleGroupRootProps = { multiple: true };
// @ts-expect-error Only one group name source may be passed in shipped declarations.
export const toggleGroupBothNames: ToggleGroupRootProps = { 'aria-label': 'Format', 'aria-labelledby': 'format' };
// @ts-expect-error Values are arrays in both single and multiple mode in shipped declarations.
export const toggleGroupScalarValue: ToggleGroupRootProps = { 'aria-label': 'x', value: 'a' };
// @ts-expect-error Every item needs a value in shipped declarations.
export const toggleGroupNoValue: ToggleGroupItemProps = { children: 'Bold' };
// @ts-expect-error Icon-only items keep the Toggle name requirement in shipped declarations.
export const toggleGroupUnnamedIcon: ToggleGroupItemProps = { value: 'b', iconOnly: true };
// @ts-expect-error Pressed state belongs to ToggleGroup.Root in shipped declarations.
export const toggleGroupPressedItem: ToggleGroupItemProps = { value: 'b', pressed: true };
// @ts-expect-error JSX usage must also name the group.
export const toggleGroupUnnamedJsx = <ToggleGroup.Root />;
const toggleGroupUnnamedProps = { multiple: true as const };
// @ts-expect-error Spreads cannot bypass the required group name.
export const toggleGroupSpreadUnnamed = <ToggleGroup.Root {...toggleGroupUnnamedProps} />;
function ToggleGroupWrapper(props: ToggleGroupRootProps) { return <ToggleGroup.Root {...props} />; }
export const wrappedToggleGroup = <ToggleGroupWrapper aria-label="Format" />;
// @ts-expect-error Wrappers must preserve the required group name.
export const wrappedToggleGroupInvalid = <ToggleGroupWrapper />;
export const buttonGroupNamed: ButtonGroupProps = { 'aria-label': 'History' };
export const buttonGroupReferenced: ButtonGroupProps = { 'aria-labelledby': 'history', orientation: 'vertical' };
export const buttonGroup = <ButtonGroup {...buttonGroupNamed}><Button>Undo</Button><Button disabled>Redo</Button></ButtonGroup>;
// @ts-expect-error A button group requires aria-label or aria-labelledby in shipped declarations.
export const buttonGroupUnnamed: ButtonGroupProps = {};
// @ts-expect-error Only one group name source may be passed in shipped declarations.
export const buttonGroupBothNames: ButtonGroupProps = { 'aria-label': 'History', 'aria-labelledby': 'history' };
// @ts-expect-error The group role is fixed; toolbar behavior is not provided.
export const buttonGroupToolbar: ButtonGroupProps = { 'aria-label': 'x', role: 'toolbar' };
// @ts-expect-error Orientations are limited to the manifest in shipped declarations.
export const buttonGroupDiagonal: ButtonGroupProps = { 'aria-label': 'x', orientation: 'd' };
// @ts-expect-error JSX usage must also name the group.
export const buttonGroupUnnamedJsx = <ButtonGroup />;
const buttonGroupUnnamedProps = { orientation: 'vertical' as const };
// @ts-expect-error Spreads cannot bypass the required group name.
export const buttonGroupSpreadUnnamed = <ButtonGroup {...buttonGroupUnnamedProps} />;
const buttonGroupRoleProps = { 'aria-label': 'x', role: 'toolbar' };
// @ts-expect-error Spreads cannot change the fixed group role.
export const buttonGroupSpreadRole = <ButtonGroup {...buttonGroupRoleProps} />;
function ButtonGroupWrapper(props: ButtonGroupProps) { return <ButtonGroup {...props} />; }
export const wrappedButtonGroup = <ButtonGroupWrapper aria-label="History" />;
// @ts-expect-error Wrappers must preserve the required group name.
export const wrappedButtonGroupInvalid = <ButtonGroupWrapper />;
export const inputGroupAddon: InputGroupAddonProps = { align: 'block-end' };
export const inputGroupIconButton: InputGroupButtonProps = { iconOnly: true, 'aria-label': 'Clear' };
export const inputGroup = <Field.Root><Field.Label>Search</Field.Label><InputGroup.Root><Input type="search" /><InputGroup.Addon {...inputGroupAddon}><InputGroup.Button {...inputGroupIconButton} /></InputGroup.Addon></InputGroup.Root></Field.Root>;
// @ts-expect-error Addon alignments are limited to the manifest in shipped declarations.
export const inputGroupUnsupportedAlign: InputGroupAddonProps = { align: 'center' };
// @ts-expect-error Icon-only addon buttons keep the Button name requirement in shipped declarations.
export const inputGroupUnnamedIcon: InputGroupButtonProps = { iconOnly: true };
// @ts-expect-error className is a string, not a Base UI state callback, in shipped declarations.
export const inputGroupFunctionClass: InputGroupButtonProps = { className: () => 'x' };
// @ts-expect-error JSX usage must also name icon-only addon buttons.
export const inputGroupUnnamedIconJsx = <InputGroup.Button iconOnly />;
const inputGroupUnnamedProps = { iconOnly: true as const };
// @ts-expect-error Spreads cannot bypass the required name.
export const inputGroupSpreadUnnamed = <InputGroup.Button {...inputGroupUnnamedProps} />;
function InputGroupButtonWrapper(props: InputGroupButtonProps) { return <InputGroup.Button {...props} />; }
export const wrappedInputGroupButton = <InputGroupButtonWrapper iconOnly aria-label="Clear" />;
// @ts-expect-error Wrappers must preserve the required name.
export const wrappedInputGroupButtonInvalid = <InputGroupButtonWrapper iconOnly />;
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
export const squareNamed = <Button iconOnly square size="lg" aria-label="Add" />;
export const squareReferenced = <Button iconOnly square aria-labelledby="add-label" />;
export const squareProps: ButtonProps = { iconOnly: true, square: true, 'aria-label': 'Add' };
// @ts-expect-error square requires iconOnly in shipped declarations.
export const squareWithoutIconOnly = <Button square>Add</Button>;
// @ts-expect-error square without iconOnly must also fail through typed object props.
export const squareWithoutIconOnlyProps: ButtonProps = { square: true, children: 'Add' };
// @ts-expect-error A square icon-only button still requires a name source.
export const squareUnnamed = <Button iconOnly square />;
// @ts-expect-error A square icon-only button must require a name through typed object props.
export const squareUnnamedProps: ButtonProps = { iconOnly: true, square: true };
const squareUnnamedSpread = { iconOnly: true as const, square: true as const };
// @ts-expect-error Spreads cannot bypass the name required by square icon buttons.
export const squareSpreadUnnamed = <Button {...squareUnnamedSpread} />;
const squareTextSpread = { square: true as const };
// @ts-expect-error Spreads cannot add square to a text button.
export const squareSpreadWithoutIconOnly = <Button {...squareTextSpread}>Add</Button>;
export const wrappedSquareValid = <Wrapper iconOnly square aria-label="Add" />;
// @ts-expect-error Wrappers must preserve the square icon name requirement.
export const wrappedSquareUnnamed = <Wrapper iconOnly square />;
// @ts-expect-error Wrappers must preserve that square requires iconOnly.
export const wrappedSquareWithoutIconOnly = <Wrapper square>Add</Wrapper>;
// @ts-expect-error There is no xs size in shipped declarations.
export const extraSmallButton = <Button size="xs">Save</Button>;
export const secondaryAction = <Button variant="secondary">Edit</Button>;
export const destructiveAction = <Button variant="destructive">Delete account</Button>;
export const linkAction = <Button variant="link">Show details</Button>;
// @ts-expect-error Unsupported designs must fail against the public API.
export const unsupportedVariant = <Button variant="unsupported">Save</Button>;
export const shortcut = <KbdGroup aria-label="Control and K"><Kbd>Ctrl</Kbd><Kbd size="sm">K</Kbd></KbdGroup>;
// @ts-expect-error Kbd sizes are limited to the manifest.
export const unsupportedKbd = <Kbd size="lg">K</Kbd>;
export const divider = <Separator decorative={false} orientation="vertical" />;
// @ts-expect-error Separator semantics are controlled by decorative.
export const separatorRole = <Separator role="presentation" />;
// @ts-expect-error Decorative separators cannot receive focus.
export const focusableSeparator = <Separator tabIndex={0} />;
// @ts-expect-error Semantic separators are static rather than resizable widgets.
export const focusableSemanticSeparator = <Separator decorative={false} tabIndex={0} />;
const focusableDividerProps = { tabIndex: 0 };
// @ts-expect-error Spreads cannot bypass the static separator contract.
export const focusableSeparatorSpread = <Separator {...focusableDividerProps} />;
// @ts-expect-error Editable separators would introduce keyboard focus.
export const editableSeparator = <Separator contentEditable />;
// @ts-expect-error Display-only keys cannot receive keyboard focus.
export const focusableKbd = <Kbd tabIndex={0}>K</Kbd>;
// @ts-expect-error Display-only groups cannot intercept keyboard events.
export const keyboardGroup = <KbdGroup onKeyDown={() => {}}>K</KbdGroup>;
const interactiveKeyProps = { tabIndex: 0, onKeyUp: () => {} };
// @ts-expect-error Spreads cannot bypass the display-only key contract.
export const interactiveKbdSpread = <Kbd {...interactiveKeyProps}>K</Kbd>;
// @ts-expect-error Spreads cannot bypass the display-only group contract.
export const interactiveGroupSpread = <KbdGroup {...interactiveKeyProps}>K</KbdGroup>;
// @ts-expect-error Editable keys would introduce keyboard interaction.
export const editableKbd = <Kbd contentEditable>K</Kbd>;
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
assert.ok(componentManifest.components.Button.verificationStates.includes('disabled'));
assert.match(renderToStaticMarkup(createElement(Button, null, 'Save')), /Save/);
assert.match(renderToStaticMarkup(createElement(Button, { iconOnly: true, square: true, 'aria-label': 'Add' }, '+')), /ui-button--square/);
assert.doesNotMatch(renderToStaticMarkup(createElement(Button, { iconOnly: true, square: true, 'aria-label': 'Add' }, '+')), /square=/);
assert.ok(import.meta.resolve('@utakata-ui/react/styles.css').endsWith('.css'));
`,
  );
  run(process.execPath, ['consumer.mjs']);
  // Resolve JS, declarations, manifest and the CSS export through the installed
  // package in a real consumer build, without workspace aliases.
  writeFileSync(
    join(directory, 'index.html'),
    '<html lang="en"><head><title>Consumer</title></head><body><div id="root"></div><script type="module" src="/app.tsx"></script></body></html>',
  );
  writeFileSync(
    join(directory, 'app.tsx'),
    `
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '@utakata-ui/react';
import { componentManifest } from '@utakata-ui/react/manifest';
import '@utakata-ui/react/styles.css';
createRoot(document.getElementById('root')!).render(createElement(Button, null, componentManifest.components.Button.description));
`,
  );
  writeFileSync(
    join(directory, 'vite.config.mjs'),
    `
export default {
  build: {
    rolldownOptions: {
      // This generated app calls createRoot: it has no server/client boundary.
      onLog(level, warning, defaultHandler) {
        if (level === 'warn' && warning.code === 'MODULE_LEVEL_DIRECTIVE' && /["']use client["']/.test(warning.message)) return;
        defaultHandler(level, warning);
      }
    }
  }
};
`,
  );
  run(process.execPath, ['node_modules/vite/bin/vite.js', 'build']);
  // The published peer range includes React 18. Check the same full positive /
  // negative declaration fixture, SSR and production build against both major
  // versions, using exact versions rather than a floating latest type package.
  run('npm', [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--prefer-offline',
    'react@18.3.1',
    'react-dom@18.3.1',
    '@types/react@18.3.31',
    '@types/react-dom@18.3.7',
  ]);
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
  run(process.execPath, ['consumer.mjs']);
  run(process.execPath, ['node_modules/vite/bin/vite.js', 'build']);
  console.log(
    'Packed declarations / SSR / CSS / manifest / Vite verified: TypeScript 5.9.3; React 18.3.1 + types 18.3.31; React 19.3.1 + types 19.3.0.',
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
