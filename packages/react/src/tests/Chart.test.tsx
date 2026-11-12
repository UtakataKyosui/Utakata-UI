import { cleanup, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  Chart,
  type ChartDataProps,
  type ChartLegendItemProps,
  type ChartMarkerProps,
  type ChartPlotProps,
} from '../components/Chart.js';
import {
  chartManifest,
  chartQualityRules,
} from '../metadata/components/Chart.js';
import { chartChecks, VisitsChart } from './quality/Chart.checks.js';
import { expectAutomatedQuality } from './quality-helpers.js';

// Checked by pnpm typecheck: the plot needs a name and a series needs an identity.
const labelled: ChartPlotProps = { 'aria-label': 'Sales chart' };
const referenced: ChartPlotProps = { 'aria-labelledby': 'caption' };
// @ts-expect-error Chart.Plot requires aria-label or aria-labelledby.
const unnamed: ChartPlotProps = {};
// @ts-expect-error The image role is fixed.
const roleOverride: ChartPlotProps = { 'aria-label': 'x', role: 'none' };
// @ts-expect-error The plot is not a tab stop; put controls outside it.
const focusable: ChartPlotProps = { 'aria-label': 'x', tabIndex: 0 };
const spreadRoleProps = { 'aria-label': 'x', role: 'none' };
// @ts-expect-error Spreads cannot override the image role.
const spreadRole = <Chart.Plot {...spreadRoleProps} />;
const item: ChartLegendItemProps = { series: '2', children: 'Signups' };
// @ts-expect-error A legend item needs a series so a marker shape identifies it.
const itemNoSeries: ChartLegendItemProps = { children: 'Signups' };
// @ts-expect-error A legend item needs visible text.
const itemNoText: ChartLegendItemProps = { series: '1' };
// @ts-expect-error Only series 1 to 6 have a color token and a shape.
const itemBadSeries: ChartLegendItemProps = { series: '7', children: 'x' };
const marker: ChartMarkerProps = { series: '3', x: 4, y: 5 };
// @ts-expect-error A marker needs a series.
const markerNoSeries: ChartMarkerProps = {};
// @ts-expect-error The marker is decorative and cannot be named or exposed.
const markerLabel: ChartMarkerProps = { series: '1', 'aria-label': 'x' };
const data: ChartDataProps = { summary: 'Show data', children: 'table' };
// @ts-expect-error The data disclosure needs visible summary text.
const dataNoSummary: ChartDataProps = { children: 'table' };
// @ts-expect-error Chart.Root is a figure; its role is fixed.
const rootRole = <Chart.Root role="img" />;
void [
  labelled,
  referenced,
  unnamed,
  roleOverride,
  focusable,
  spreadRole,
  item,
  itemNoSeries,
  itemNoText,
  itemBadSeries,
  marker,
  markerNoSeries,
  markerLabel,
  data,
  dataNoSummary,
  rootRole,
];

afterEach(cleanup);

describe('Chart', () => {
  it('forwards refs and merges classNames on every part', () => {
    const refs = {
      root: createRef<HTMLElement>(),
      caption: createRef<HTMLElement>(),
      description: createRef<HTMLParagraphElement>(),
      plot: createRef<HTMLDivElement>(),
      legend: createRef<HTMLUListElement>(),
      item: createRef<HTMLLIElement>(),
      marker: createRef<SVGSVGElement>(),
      data: createRef<HTMLDetailsElement>(),
    };
    render(
      <Chart.Root ref={refs.root} className="c">
        <Chart.Caption ref={refs.caption} className="c">
          Title
        </Chart.Caption>
        <Chart.Description ref={refs.description} className="c">
          Summary
        </Chart.Description>
        <Chart.Plot ref={refs.plot} aria-label="Plot" className="c">
          <Chart.Marker ref={refs.marker} series="4" className="c" />
        </Chart.Plot>
        <Chart.Legend ref={refs.legend} className="c">
          <Chart.LegendItem ref={refs.item} series="3" className="c">
            Series
          </Chart.LegendItem>
        </Chart.Legend>
        <Chart.Data ref={refs.data} summary="Data" className="c">
          Table
        </Chart.Data>
      </Chart.Root>,
    );
    const expected = {
      root: ['FIGURE', 'ui-chart'],
      caption: ['FIGCAPTION', 'ui-chart__caption'],
      description: ['P', 'ui-chart__description'],
      plot: ['DIV', 'ui-chart__plot'],
      legend: ['UL', 'ui-chart__legend'],
      item: ['LI', 'ui-chart__legend-item'],
      data: ['DETAILS', 'ui-chart__data'],
    } as const;
    for (const [key, [tag, className]] of Object.entries(expected)) {
      const element = refs[key as keyof typeof expected].current;
      expect(element?.tagName).toBe(tag);
      expect(element).toHaveClass(className, 'c');
    }
    expect(refs.marker.current).toHaveClass(
      'ui-chart__marker',
      'ui-chart__marker--4',
      'c',
    );
  });

  it('references a description only while one is rendered', () => {
    const { rerender } = render(
      <Chart.Root>
        <Chart.Caption>Title</Chart.Caption>
      </Chart.Root>,
    );
    expect(screen.getByRole('figure')).not.toHaveAttribute('aria-describedby');
    rerender(
      <Chart.Root>
        <Chart.Caption>Title</Chart.Caption>
        <Chart.Description id="summary">Summary</Chart.Description>
      </Chart.Root>,
    );
    expect(screen.getByRole('figure')).toHaveAttribute(
      'aria-describedby',
      'summary',
    );
    rerender(
      <Chart.Root>
        <Chart.Caption>Title</Chart.Caption>
      </Chart.Root>,
    );
    expect(screen.getByRole('figure')).not.toHaveAttribute('aria-describedby');
  });

  it('renders one distinct shape per documented series', () => {
    const { container } = render(
      chartManifest.series.map((series) => (
        <Chart.Marker key={series} series={series} />
      )),
    );
    const shapes = [...container.querySelectorAll('svg')].map(
      (node) => node.innerHTML,
    );
    expect(shapes).toHaveLength(
      Object.keys(chartManifest.seriesMarkers).length,
    );
    expect(new Set(shapes).size).toBe(chartManifest.series.length);
  });

  it('keeps the data table closed until the disclosure opens', () => {
    const { container } = render(<VisitsChart />);
    expect(container.querySelector('details')).not.toHaveAttribute('open');
  });

  it('passes all automated quality rules', async () => {
    const report = await expectAutomatedQuality(chartQualityRules, chartChecks);
    expect(report.complete).toBe(false);
  });
});
