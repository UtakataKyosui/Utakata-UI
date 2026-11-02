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
    `import type { ComponentProps } from 'react';
import { Alert, Avatar, Badge, Button, Card, Dialog, Field, Input, Kbd, KbdGroup, NativeSelect, RadioGroup, Select, Separator, Skeleton, Slider, Spinner, Textarea, type BadgeProps, type ButtonProps, type InputProps, type NativeSelectProps, type RadioGroupRootProps, type SelectRootProps, type SkeletonProps, type SpinnerProps, type TextareaProps } from '@utakata-ui/react';
import { componentManifest } from '@utakata-ui/react/manifest';
export const view = <><Button>Save</Button><Field.Root><Field.Label>Email</Field.Label><Field.Control /></Field.Root><Dialog.Root><Dialog.Trigger>Open</Dialog.Trigger></Dialog.Root></>;
export const manifest = componentManifest;
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
assert.match(renderToStaticMarkup(createElement(Button, null, 'Save')), /Save/);
assert.ok(import.meta.resolve('@utakata-ui/react/styles.css').endsWith('.css'));
`,
  );
  run(process.execPath, ['consumer.mjs']);
} finally {
  rmSync(directory, { recursive: true, force: true });
}
