---

title: Using Lism CSS
description: Combine Lism layout, responsive Props and Utakata-UI styles
---

## Installation [#install]

```sh
pnpm add @utakata-ui/react lism-css
```

Add Lism CSS as a direct application dependency when importing from `lism-css/react` directly. Your application provides React and React DOM.

```tsx
import '@utakata-ui/react/styles.css';
import { Box, Button, Card, Stack } from '@utakata-ui/react';

export function Actions() {
  return (
    <Box isContainer>
      <Card.Root p={{ base: '1rem', md: '2rem' }}>
        <Stack g="1rem">
          <Card.Title>Profile</Card.Title>
          <Button w={{ base: '100%', md: 'auto' }}>Save</Button>
        </Stack>
      </Card.Root>
    </Box>
  );
}
```

`styles.css` includes Lism base, layout, trait, utility and Props CSS. Load it once in the application entry; you do not need another `lism-css/main.css` import. The layer order places component defaults above Lism resets and lets explicit Lism layout and utility styles customize components.

## Shared styling Props [#props]

Components and parts that render DOM accept Lism Props such as `p`, `g`, `w`, `fz`, `bgc` and `layout`. Responsive values use Lism's `{ base, sm, md, lg, xl }` form. Classes and CSS custom properties are applied to the existing element without adding wrapper DOM. Refs and event handlers keep targeting that element.

State-only roots such as `Dialog.Root` and `Select.Root`, providers, portals and collections have no styling DOM. Style rendered parts such as `Dialog.Popup` and `Select.Trigger` instead. Existing component Props, including `size`, `variant`, ARIA and required names, take precedence. Lism's `forwardedRef` and internal `primitiveClass` are excluded.

Import `LismProps` (the upstream type), `LismStyleProps` (component styling) and `WithLismProps<Props>` as types from `@utakata-ui/react`. Re-exported `Box`, `Stack`, `Flex`, `Frame`, `Grid`, `Container`, `Text` and `Heading` provide layout and typography.

Responsive values follow the ancestor CSS container width, rather than the viewport. Wrap them in `Box isContainer` as above. The standard CSS uses 480, 800 and 1120px for `sm`, `md` and `lg`. `xl` is disabled by default and is available with a custom Lism CSS configuration.

When customizing colors, layout or dimensions, verify contrast, target size, focus, reading order, reflow, forced colors and reduced motion in your application. Styling Props do not waive accessibility requirements.

## Aspect ratio [#aspect-ratio]

Utakata-UI has no `AspectRatio` component. Lism's `ar` Prop (CSS `aspect-ratio`) on Lism's `Frame` (`layout="frame"`) already covers the shadcn/ui use case, so a wrapper would add DOM and a second API for the same thing. Compose the re-exported `Frame` (like `Box`, a thin Lism primitive) instead. The only public API change is that `Frame` is now re-exported; there is no new dependency or manifest entry.

```tsx
import { Box, Frame } from '@utakata-ui/react';

export function Cover() {
  return (
    <Box isContainer>
      <Frame ar="16/9" w="100%">
        <img src="/cover.jpg" alt="Quarterly revenue chart" />
      </Frame>
    </Box>
  );
}
```

- Final API: `Frame` with `ar` (for example `"16/9"`, `"4/3"`, `"1/1"` or `{ base: '1/1', md: '16/9' }`). There is no default ratio; omit `ar` and the frame follows its content. Responsive values follow the ancestor container as described above.
- Behavior (verified in Chromium): the frame reserves its ratio before the media loads, keeps it when the width changes (including a 320px container) and when the intrinsic ratio of the image differs, and clips overflowing content instead of growing. A direct `img`, `video` or `iframe` child fills the frame with `object-fit: cover`.
- Out of scope: it is a static layout. It does not load, lazy-load, crop to a focal point, show a fallback or provide controls. Put only media inside a frame; text is clipped, so use `Card` or normal flow for text.
- Your responsibilities: alternative text (`alt=""` only for decoration), `title` on `iframe`, captions, transcripts and visible controls for video, and not cropping essential information (`object-fit: cover` crops). Verify other ratios, custom CSS that overrides `aspect-ratio` or `overflow`, and zoom in your application. Types do not validate ratio strings: Lism's `ar` accepts any value and CSS ignores an invalid one. Dynamic strings and custom CSS are therefore not checked by typechecking.

## Copying source [#cli]

`@utakata-ui/cli init` automatically installs Base UI and Lism CSS. It selects the package manager from `packageManager`, then the lockfile, falling back to npm. Select one explicitly with `--package-manager pnpm`. Use `--no-install` to print the command without running it, or `--dry-run` to leave both files and dependencies unchanged. Add the copied CSS import yourself. See [CLI instructions](/en/registry).
