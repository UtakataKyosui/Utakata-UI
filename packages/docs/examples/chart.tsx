import { Chart, Table } from '@utakata-ui/react';

const months = ['4月', '5月', '6月'];
const visits = [120, 180, 240];
const signups = [12, 20, 31];

// 値を 0〜100 の描画範囲へ写す。データ点は凡例と同じ形（系列1は円、系列2は四角）で描く。描画ライブラリを使う場合も、同じ値を表に出す。
const x = (index: number) => 10 + index * 40;
const y = (value: number, max: number) => 45 - (value / max) * 40;
const points = (values: number[], max: number) =>
  values.map((value, index) => `${x(index)},${y(value, max)}`).join(' ');

export default function ChartExample() {
  return (
    <Chart.Root>
      <Chart.Caption>月別の訪問数と新規登録数</Chart.Caption>
      <Chart.Description>
        訪問数は4月の120件から6月の240件へ増え、新規登録数も12件から31件へ増えました。
      </Chart.Description>
      <Chart.Plot aria-label="月別の訪問数と新規登録数の折れ線グラフ">
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
        <Chart.LegendItem series="1">訪問数（実線）</Chart.LegendItem>
        <Chart.LegendItem series="2">新規登録数（破線）</Chart.LegendItem>
      </Chart.Legend>
      <Chart.Data summary="データ表を表示">
        <Table.Container aria-label="月別の訪問数と新規登録数のデータ">
          <Table.Root>
            <Table.Caption>月別の訪問数と新規登録数</Table.Caption>
            <Table.Header>
              <Table.Row>
                <Table.Head scope="col">月</Table.Head>
                <Table.Head scope="col" data-align="end">
                  訪問数
                </Table.Head>
                <Table.Head scope="col" data-align="end">
                  新規登録数
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
