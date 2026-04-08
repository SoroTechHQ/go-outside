"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const palette = ["#5FBF2A", "#4A7AE8", "#E85D8A", "#D7F96D", "#91B67E", "#688A64"];

export function CategoryDonut({ items }: { items: { label: string; value: number }[] }) {
  const options: ApexOptions = {
    chart: { type: "donut", background: "transparent" },
    colors: palette,
    labels: items.map((i) => i.label),
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Events",
              color: "#6B8C6B",
              fontSize: "11px",
              formatter: () => `${items.reduce((a, b) => a + b.value, 0)}%`,
            },
            value: { color: "#EDF5E8", fontSize: "22px", fontWeight: "600" },
          },
        },
      },
    },
    tooltip: { theme: "dark" },
  };

  return (
    <div>
      <Chart options={options} series={items.map((i) => i.value)} type="donut" height={200} />
      <div className="mt-3 space-y-2">
        {items.map((item, i) => (
          <div key={item.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: palette[i] }} />
              <span className="text-[var(--text-secondary)]">{item.label}</span>
            </div>
            <span className="font-semibold text-[var(--text-primary)]">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
