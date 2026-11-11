---

title: Installation
description: Add Utakata-UI to a React application and render your first component
---

## Requirements [#requirements]

| Item                | Requirement                                        |
| ------------------- | -------------------------------------------------- |
| React and React DOM | 18.3.1 or later                                    |
| Bundler             | One that resolves CSS `@import` (for example Vite) |
| TypeScript          | `moduleResolution: "Bundler"`                      |

## 1. Add the package [#install]

```sh
pnpm add @utakata-ui/react lism-css
```

With npm use `npm install @utakata-ui/react lism-css`; with yarn use `yarn add @utakata-ui/react lism-css`. Base UI is installed as a dependency. Add Lism CSS as a direct dependency to import its primitives directly. See [Using Lism CSS](/en/lism) for responsive Props and layout.

## 2. Load the styles once [#styles]

Load the styles once in your app entry (`src/main.tsx` for Vite, the root `layout.tsx` for Next.js). You do not need to load them per component.

```tsx
import '@utakata-ui/react/styles.css';
```

To change colors, override CSS variables after this import. See [Theme colors](/en/theming).

## 3. Use components [#use]

Import components by name from `@utakata-ui/react`.

```tsx
import { Button, Field, Input } from '@utakata-ui/react';

export function ProfileForm() {
  return (
    <form>
      <Field.Root>
        <Field.Label>Display name</Field.Label>
        <Input name="displayName" autoComplete="nickname" />
      </Field.Root>
      <Button type="submit">Save</Button>
    </form>
  );
}
```

Each page in the [component list](/en/components) lists the Props a component accepts, how its parts are composed and the names to import.

## 4. Give the specification to your agent [#agents]

Utakata UI is designed for Agent Coding, where you build interfaces together with AI agents. Let your agent look up the public API and accessibility requirements through [MCP](/en/mcp) and implement according to the component specification.

## Available components [#exports]

UI components are grouped by purpose in the [component list](/en/components). The Lism CSS layout primitives `Box`, `Stack`, `Flex`, `Grid`, `Container`, `Text` and `Heading` can also be imported from `@utakata-ui/react`.

## Keeping usage accessible [#accessibility]

A regular button with text has a name without extra ARIA attributes. An icon-only button needs `iconOnly` together with `aria-label` or `aria-labelledby`. Omitting the name is a TypeScript error.

```tsx
<Button>Save</Button>
<Button iconOnly aria-label="Close">
  <span aria-hidden="true">×</span>
</Button>
```

Combine Field with `Field.Label` and Dialog with `Dialog.Title`, and add descriptions when needed. Button, Field.Control, Dialog.Popup and other controls that need a name (form controls, triggers, popups and so on) report a missing name source or a broken `aria-labelledby` / `aria-describedby` reference with an `[Utakata-UI a11y]` warning during development. Dynamic label changes are checked again, and repeated identical warnings are suppressed. Warnings never stop the page.

The diagnostics are a helper that checks common name sources; they are not a complete accessible name computation. Check complex references, CSS generated content and actual assistive technology output with axe and real devices. String types do not guarantee that a name is non-blank or well worded. Icon-only content without `iconOnly` cannot be detected by types either, so it needs a DOM check.

Replace `process.env.NODE_ENV` with `production` in production builds (the same build assumption as React). Monitoring and warnings do not run in production, and nothing touches the DOM during SSR. If you change the standard theme with custom CSS, verify contrast, focus and zoom again.

## Copying and modifying source [#source]

Only when you need to rewrite a component's implementation, you can [copy the source with the CLI](/en/registry). Copied source does not receive npm package updates, and type constraints, development diagnostics and accessibility fixes are not applied automatically. Use the npm package in normal cases.
