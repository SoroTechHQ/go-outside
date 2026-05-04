'use client'

import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

export function CityBreakdownChart({ data }: { data: { city: string; count: number }[] }) {
  const options: ApexOptions = {
    chart: {
      type: 'bar',
      height: 280,
      toolbar: { show: false },
      background: 'transparent',
      fontFamily: 'var(--font-body), sans-serif',
    },
    colors: ['var(--accent-cyan, #38bdf8)'],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
        borderRadiusApplication: 'end',
        barHeight: '60%',
      },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: 'rgba(255,255,255,0.08)',
      strokeDashArray: 5,
      yaxis: { lines: { show: false } },
    },
    xaxis: {
      categories: data.map((d) => d.city),
      labels: { style: { colors: data.map(() => '#7A9C76'), fontSize: '11px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: ['#7A9C76'], fontSize: '11px' } },
    },
    tooltip: { theme: 'dark' },
  }

  return (
    <Chart
      height={280}
      options={options}
      series={[{ name: 'Users', data: data.map((d) => d.count) }]}
      type="bar"
    />
  )
}
