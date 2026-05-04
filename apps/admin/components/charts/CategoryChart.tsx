'use client'

import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

export function CategoryChart({ data }: { data: { category: string; count: number }[] }) {
  const options: ApexOptions = {
    chart: {
      type: 'bar',
      height: 280,
      toolbar: { show: false },
      background: 'transparent',
      fontFamily: 'var(--font-body), sans-serif',
    },
    colors: ['var(--accent-violet, #a78bfa)'],
    plotOptions: {
      bar: {
        borderRadius: 7,
        columnWidth: '55%',
        borderRadiusApplication: 'end',
      },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: 'rgba(255,255,255,0.08)',
      strokeDashArray: 5,
      xaxis: { lines: { show: false } },
    },
    xaxis: {
      categories: data.map((d) => d.category),
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
      height={280}
      options={options}
      series={[{ name: 'Events', data: data.map((d) => d.count) }]}
      type="bar"
    />
  )
}
