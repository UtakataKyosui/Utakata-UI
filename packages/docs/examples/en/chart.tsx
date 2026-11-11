import { Chart, Table } from '@utakata-ui/react';

const months = ['April', 'May', 'June'];
const visits = [120, 180, 240];
const signups = [12, 20, 31];

// Map values into the 0-100 drawing area. Data points use the legend's shapes (series 1 circle, series 2 square). With a charting library, show the same values in the table.
const x = (index: number) => 10 + index * 40;
const y = (value: number, max: number) => 45 - (value / max) * 40;
const points = (values: number[], max: number) =>
  values.map((value, index) => `${x(index)},${y(value, max)}`).join(' ');

export default function ChartExample() {
  return (
    <Chart.Root>
      <Chart.Caption>Monthly visits and signups</Chart.Caption>
      <Chart.Description>
        Visits grew from 120 in April to 240 in June, and signups grew from 12
        to 31.
      </Chart.Description>
      <Chart.Plot aria-label="Line chart of monthly visits and signups">
        <svg viewBox="0 0 100 50" aria-hidden="true">
          <polyline
            points={points(visits, 240)}
            fill="none"
            stroke="var(--ui-chart-series-1)"
            strokeDasharray="var(--ui-chart-dash-1)"
            strokeWidth="1.5"
          />
          <polyline
            points={points(signups, 40)}
            fill="none"
            stroke="var(--ui-chart-series-2)"
            strokeDasharray="var(--ui-chart-dash-2)"
            strokeWidth="1.5"
          />
          {visits.map((value, index) => (
            <circle
              key={`visits-${months[index]}`}
              cx={x(index)}
              cy={y(value, 240)}
              r={2}
              fill="var(--ui-chart-series-1)"
            />
          ))}
          {signups.map((value, index) => (
            <rect
              key={`signups-${months[index]}`}
              x={x(index) - 2}
              y={y(value, 40) - 2}
              width={4}
              height={4}
              fill="var(--ui-chart-series-2)"
            />
          ))}
        </svg>
      </Chart.Plot>
      <Chart.Legend>
        <Chart.LegendItem series="1">Visits (solid line)</Chart.LegendItem>
        <Chart.LegendItem series="2">Signups (dashed line)</Chart.LegendItem>
      </Chart.Legend>
      <Chart.Data summary="Show data table">
        <Table.Container aria-label="Monthly visits and signups data">
          <Table.Root>
            <Table.Caption>Monthly visits and signups</Table.Caption>
            <Table.Header>
              <Table.Row>
                <Table.Head scope="col">Month</Table.Head>
                <Table.Head scope="col" data-align="end">
                  Visits
                </Table.Head>
                <Table.Head scope="col" data-align="end">
                  Signups
                </Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {months.map((month, index) => (
                <Table.Row key={month}>
                  <Table.Head scope="row">{month}</Table.Head>
                  <Table.Cell data-align="end">{visits[index]}</Table.Cell>
                  <Table.Cell data-align="end">{signups[index]}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Table.Container>
      </Chart.Data>
    </Chart.Root>
  );
}
