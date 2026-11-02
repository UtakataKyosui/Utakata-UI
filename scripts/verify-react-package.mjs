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
    `import { Button, Dialog, Field, Input, Kbd, KbdGroup, Separator, type ButtonProps, type InputProps } from '@utakata-ui/react';
import { componentManifest } from '@utakata-ui/react/manifest';
export const view = <><Button>Save</Button><Field.Root><Field.Label>Email</Field.Label><Field.Control /></Field.Root><Dialog.Root><Dialog.Trigger>Open</Dialog.Trigger></Dialog.Root></>;
export const manifest = componentManifest;
export const inputProps: InputProps = { size: 'lg', type: 'email', readOnly: true, className: 'email' };
export const input = <Field.Root><Field.Label>Email</Field.Label><Input {...inputProps} /></Field.Root>;
// @ts-expect-error Input visual sizes replace the numeric native size.
export const inputNativeSize: InputProps = { size: 20 };
// @ts-expect-error Unsupported sizes must fail in shipped declarations.
export const inputUnsupportedSize = <Input aria-label="Email" size="xl" />;
// @ts-expect-error Input className must be a string.
export const inputFunctionClass: InputProps = { className: () => 'x' };
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
