# @utakata-ui/a11y-cli

Crust-based CLI for declared color usage contracts. Requires Node 24+.

```sh
pnpm --filter @utakata-ui/a11y-cli build
node packages/a11y-cli/dist/cli.js --config packages/a11y-cli/example.json
node packages/a11y-cli/dist/cli.js --config packages/a11y-cli/example.json --json
```

Configuration is a non-empty JSON array. Each entry has a unique `name`, opaque
hex `foreground` and `background` (#RGB or #RRGGBB), `kind`, and explicit
`conveysMeaning` boolean. When color conveys meaning, describe the visible
alternative in `nonColorCue` (for example, an error label, icon or pattern).
Run the command in CI to reject violations: exit 0 passes, 1 means a failed
color contract, and 2 means invalid input or an execution error.

- `text`: WCAG 2.2 AA 1.4.3, minimum 4.5:1.
- `large-text`: 1.4.3, minimum 3:1. Only use for text at least 18pt (24 CSS px),
  or bold text at least 14pt (18⅔ CSS px).
- `non-text`: 1.4.11, minimum 3:1 against the adjacent color for visual
  information required to identify controls, states and graphical objects.
- `conveysMeaning: true`: 1.4.1 requires a non-empty `nonColorCue` declaration.

Ratios are compared before display rounding. This tool validates declared
pairs, not CSS, DOM, rendered pages or the truth of cue declarations. Include
every relevant adjacent color and each theme/state as separate entries.
Transparency, gradients and images are deliberately rejected; supply verified
opaque composited colors. Review cue visibility, actual typography, focus,
hover, disabled-state exemptions and rendered theme coverage manually. A pass
does not establish WCAG conformance.

References: [WCAG 2.2](https://www.w3.org/TR/WCAG22/),
[Crust core](https://crustjs.com/docs/modules/core/).
