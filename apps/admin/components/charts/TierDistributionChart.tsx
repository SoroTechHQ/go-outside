'use client'

import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

const TIER_COLORS: Record<string, string> = {
  newcomer: 'var(--accent-cyan, #38bdf8)',
  regular: 'var(--brand, #4ade80)',
  enthusiast: 'var(--accent-violet, #a78bfa)',
  vip: 'var(--accent-amber, #fbbf24)',
}

export function TierDistributionChart({ data }: { data: { tier: string; count: number }[] }) {
  const labels = data.map((d) => d.tier)
  const colors = labels.map((l) => TIER_COLORS[l] ?? 'var(--accent-coral, #fb7185)')

  const options: ApexOptions = {
    chart: {
      type: 'donut',
      background: 'transparent',
      fontFamily: 'var(--font-body), sans-serif',
    },
    colors,
    labels,
    dataLabels: { enabled: false },
    legend: {
      position: 'bottom',
      labels: { colors: '#7A9C76' },
    },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Users',
              color: '#7A9C76',
              formatter: (w) =>
                String(w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)),
            },
            value: { color: '#E5EFE2', fontSize: '26px', fontWeight: '600' },
          },
        },
      },
    },
    tooltip: { theme: 'dark' },
  }

  return (
    <Chart
      height={280}
      options={options}
      series={data.map((d) => d.count)}
      type="donut"
    />
  )
}
