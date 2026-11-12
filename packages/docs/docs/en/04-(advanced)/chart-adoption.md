---

title: Chart adoption decision
description: Charting library comparison and why Chart is a renderer-independent shell
---

shadcn/ui's Chart wraps Recharts. Utakata UI confirms new production dependencies before adding them, so this page compares the options and records the decision before any library is chosen.

## Decision [#decision]

- `Chart` ships as an accessible shell **without a bundled charting library**. It provides a `figure` and `figcaption`, a text description, a legend that identifies series without color, a data table alternative, and theme and reduced-motion tokens.
- You place the renderer inside `Chart.Plot`: inline SVG, Recharts, visx or Chart.js all work. Utakata UI depends on none of them.
- There is no built-in renderer. Axes, ticks, scales and interactive legends would tie the public API and its verification scope to drawing details.
- If a specific library is later added as an optional renderer, it is a production dependency and is confirmed first (`AGENTS.md`).

## Comparison [#comparison]

Sizes and versions change, so measure them again when you adopt a library. This table sticks to structural differences.

| Option           | Rendering | Dependency cost                                                                                    | Accessibility notes                                                                                                             | Decision                                                        |
| ---------------- | --------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Hand-written SVG | SVG (DOM) | None                                                                                               | You supply every element, plus axes, ticks and scale math                                                                       | Fits simple line and bar charts. Used in the shell example      |
| Recharts         | SVG (DOM) | React dependency; uses d3 modules internally; many parts, so a medium or larger bundle is possible | Helpers such as `accessibilityLayer` exist, but non-color series identification, the data table and legend wording remain yours | Same as shadcn/ui. The strongest optional renderer; not bundled |
| visx             | SVG (DOM) | Split into packages, so you take only what you use; more low-level assembly                        | Primitives only; all accessibility is yours                                                                                     | Good for fine control; not bundled                              |
| Chart.js         | Canvas    | Works standalone; a React wrapper is separate                                                      | Canvas has no DOM, so per-point information is invisible to assistive technology; a data table is mandatory                     | Strong for very many points; assumes the shell's data table     |

## Why the shell is renderer independent [#rationale]

1. **Verification stays in scope.** The shell is plain DOM we own, so it is verified in real browsers ([rules](/en/components/chart)). A library's internal DOM changes between versions and cannot widen that guarantee.
2. **Non-color identification is shared.** Series numbers 1 to 6 set color, marker shape and dash pattern together, so any renderer stays consistent with the legend.
3. **The data table is mandatory.** Every value is available as a table whatever the renderer, even canvas. For keyboard users the `Chart.Data` summary works with Tab, Enter and Space, and the table scrolls inside `Table.Container`.
4. **No new production dependency.** You keep using the library you already have.

## Defaults and out of scope [#scope]

- Defaults: the data table starts closed, the legend is a `ul`, series colors are `--ui-chart-series-1` to `6`, dash patterns are `--ui-chart-dash-1` to `6`, and animation time is `--ui-chart-duration` (`200ms` by default, `0s` under `prefers-reduced-motion`). Series colors meet 3:1 against the background in both the light and dark themes.
- Your responsibility: the caption, a description that states the trend, the `Chart.Plot` name, a data table that matches what is plotted, renderer animation that reads `--ui-chart-duration`, and lines or fills that stay distinguishable in forced colors.
- Out of scope: hover-only information such as tooltips (put values in the data table), focusable controls inside `Chart.Plot` (it is exposed as one image), axis, tick and scale calculation, a built-in renderer, and zoom or brush interactions.
- Unverified: screen reader output, real 200% browser zoom and physical forced-colors modes remain manual checks and are unverified until performed.

## References [#references]

- [shadcn/ui Chart](https://ui.shadcn.com/docs/components/chart)
