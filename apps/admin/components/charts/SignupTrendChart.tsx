'use client'

import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

export function SignupTrendChart({ data }: { data: { date: string; count: number }[] }) {
  const options: ApexOptions = {
    chart: {
      type: 'area',
      height: 260,
      toolbar: { show: false },
      background: 'transparent',
      fontFamily: 'var(--font-body), sans-serif',
    },
    colors: ['var(--brand, #4ade80)'],
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.24, opacityTo: 0.02, stops: [0, 100] },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: 'rgba(255,255,255,0.08)',
      strokeDashArray: 5,
      xaxis: { lines: { show: false } },
    },
    xaxis: {
      categories: data.map((d) => d.date),
      tickAmount: 6,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: data.map(() => '#7A9C76'), fontSize: '10px' }, rotate: -30 },
    },
    yaxis: {
      labels: { style: { colors: ['#7A9C76'], fontSize: '11px' } },
    },
    tooltip: { theme: 'dark' },
  }

  return (
    <Chart
      height={260}
      options={options}
      series={[{ name: 'Signups', data: data.map((d) => d.count) }]}
      type="area"
    />
  )
}
