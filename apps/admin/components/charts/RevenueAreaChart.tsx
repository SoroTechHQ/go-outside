"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function RevenueAreaChart({
  data,
}: {
  data: { date: string; total: number }[];
}) {
  const categories = data.map((d) => d.date);
  const values = data.map((d) => d.total);

  const options: ApexOptions = {
    chart: {
      type: "area",
      height: 260,
      toolbar: { show: false },
      background: "transparent",
    },
    colors: ["#4ade80"],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0.02,
        stops: [0, 100],
      },
    },
    stroke: { curve: "smooth", width: 2.5 },
    dataLabels: { enabled: false },
    grid: {
      borderColor: "rgba(74,222,128,0.08)",
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    xaxis: {
      categories,
      labels: {
        rotate: -45,
        style: { colors: "#4A6A4A", fontSize: "10px" },
        formatter: (v: string) => v.slice(5), // show MM-DD
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: "#4A6A4A", fontSize: "11px" },
        formatter: (v: number) => `GHS ${v.toFixed(0)}`,
      },
    },
    tooltip: {
      theme: "dark",
      y: { formatter: (v: number) => `GHS ${v.toFixed(2)}` },
    },
    markers: { size: 0, hover: { size: 5 } },
  };

  const series = [{ name: "Revenue (GHS)", data: values }];

  return <Chart options={options} series={series} type="area" height={260} />;
}
