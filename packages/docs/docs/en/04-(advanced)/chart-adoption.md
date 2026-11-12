---
title: Using a chart renderer
description: Render a chart and provide a caption, legend, and data table.
---

Place your SVG or chart renderer inside `Chart.Plot`. Give the plot an accessible name and use `Chart.Caption` to identify the chart and `Chart.Description` to explain its main trend. See [Chart](/en/components/chart) for a complete example and the component API.

- Use the same series numbers in the plot and legend. Match the colors with marker shapes or dash patterns so readers can distinguish series without relying on color.
- Put the values in `Chart.Data` with a `Table.Container`. Keep the table in sync with the plot so readers can get the values by keyboard, including values shown on hover.
- Put interactive controls outside `Chart.Plot`, which is exposed to assistive technology as a single image.
- When animating, use `--ui-chart-duration` to follow the user's reduced-motion preference. Check that lines and fills remain distinguishable in forced colors.
