import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect } from 'vitest';
import { Chart } from '../../components/Chart.js';
import { Table } from '../../components/Table.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

const rows = [
  { month: 'April', visits: '120', signups: '12' },
  { month: 'May', visits: '180', signups: '20' },
];

export function VisitsChart({ open = false }: { open?: boolean }) {
  return (
    <Chart.Root data-testid="chart">
      <Chart.Caption>Monthly visits</Chart.Caption>
      <Chart.Description>
        Visits rose from 120 in April to 180 in May.
      </Chart.Description>
      <Chart.Plot aria-label="Line chart of monthly visits and signups">
        <svg viewBox="0 0 100 40" aria-hidden="true">
          <polyline
            points="0,30 100,10"
            fill="none"
            stroke="var(--ui-chart-series-1)"
            strokeWidth="2"
          />
          <Chart.Marker series="1" x="0" y="26" />
          <Chart.Marker series="2" x="94" y="6" />
        </svg>
      </Chart.Plot>
      <Chart.Legend>
        <Chart.LegendItem series="1">Visits</Chart.LegendItem>
        <Chart.LegendItem series="2">Signups</Chart.LegendItem>
      </Chart.Legend>
      <Chart.Data summary="Show data table" open={open}>
        <Table.Container aria-label="Monthly visits data">
          <Table.Root>
            <Table.Caption>Monthly visits and signups</Table.Caption>
            <Table.Header>
              <Table.Row>
                <Table.Head scope="col">Month</Table.Head>
                <Table.Head scope="col">Visits</Table.Head>
                <Table.Head scope="col">Signups</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.map((row) => (
                <Table.Row key={row.month}>
                  <Table.Head scope="row">{row.month}</Table.Head>
                  <Table.Cell>{row.visits}</Table.Cell>
                  <Table.Cell>{row.signups}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Table.Container>
      </Chart.Data>
    </Chart.Root>
  );
}

export const chartChecks: Record<string, QualityCheck> = {
  'chart.structure': async () => {
    const { container } = render(<VisitsChart />);
    const figure = screen.getByRole('figure', { name: 'Monthly visits' });
    expect(figure.tagName).toBe('FIGURE');
    expect(figure).toHaveClass('ui-chart');
    const description = screen.getByText(/Visits rose from 120/);
    expect(figure).toHaveAccessibleDescription(
      'Visits rose from 120 in April to 180 in May.',
    );
    expect(figure.getAttribute('aria-describedby')).toBe(description.id);
    const plot = screen.getByRole('img', {
      name: 'Line chart of monthly visits and signups',
    });
    expect(plot).toHaveClass('ui-chart__plot');
    expect(plot).not.toHaveAttribute('tabindex');
    expect(plot.querySelector('a, button, input, [tabindex]')).toBeNull();
    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    const details = container.querySelector('details');
    expect(details).toHaveClass('ui-chart__data');
    expect(details?.firstElementChild?.tagName).toBe('SUMMARY');
    expect((await audit(container)).violations).toEqual([]);
  },
  'chart.series-identification': async () => {
    const { container } = render(<VisitsChart />);
    const items = screen.getAllByRole('listitem');
    // Names come from visible text only; the marker adds nothing to speech.
    expect(items.map((item) => item.textContent)).toEqual([
      'Visits',
      'Signups',
    ]);
    const markers = items.map((item) =>
      item.querySelector<SVGSVGElement>('svg.ui-chart__marker'),
    );
    for (const marker of markers) {
      expect(marker).toHaveAttribute('aria-hidden', 'true');
      expect(marker).not.toHaveAttribute('tabindex');
    }
    expect(markers.map((marker) => marker?.className.baseVal)).toEqual([
      'ui-chart__marker ui-chart__marker--1',
      'ui-chart__marker ui-chart__marker--2',
    ]);
    // Different series use different shapes, so color is not the only cue.
    const shapes = markers.map((marker) => marker?.innerHTML);
    expect(new Set(shapes).size).toBe(2);
    // Markers can also label points inside the plot.
    expect(
      container.querySelectorAll('.ui-chart__plot svg.ui-chart__marker'),
    ).toHaveLength(2);
    expect((await audit(container)).violations).toEqual([]);
  },
  'chart.data-alternative': async () => {
    const { container } = render(<VisitsChart />);
    const summary = screen.getByText('Show data table');
    expect(summary.tagName).toBe('SUMMARY');
    // The native disclosure is the keyboard control; it is in the Tab order.
    expect(summary.tabIndex).toBe(0);
    const details = container.querySelector('details');
    expect(details).not.toHaveAttribute('open');
    fireEvent.click(summary);
    expect(details).toHaveAttribute('open');
    const table = screen.getByRole('table', {
      name: 'Monthly visits and signups',
    });
    for (const name of ['Month', 'Visits', 'Signups'])
      expect(
        within(table).getByRole('columnheader', { name }),
      ).toBeInTheDocument();
    for (const row of rows) {
      expect(
        within(table).getByRole('rowheader', { name: row.month }),
      ).toBeInTheDocument();
      expect(within(table).getByText(row.visits)).toBeInTheDocument();
    }
    expect(
      screen.getByRole('region', { name: 'Monthly visits data' }),
    ).toHaveAttribute('tabindex', '0');
    fireEvent.click(summary);
    expect(details).not.toHaveAttribute('open');
    expect((await audit(container)).violations).toEqual([]);
  },
};
