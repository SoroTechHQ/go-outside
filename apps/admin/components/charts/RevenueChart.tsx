"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function RevenueChart({ values }: { values: number[] }) {
  const categories = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];

  const options: ApexOptions = {
    chart: {
      type: "area",
      height: 220,
      toolbar: { show: false },
      background: "transparent",
      sparkline: { enabled: false },
    },
    colors: ["#B8FF3C"],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.28,
        opacityTo: 0.02,
        stops: [0, 100],
      },
    },
    stroke: { curve: "smooth", width: 2.5 },
    dataLabels: { enabled: false },
    grid: {
      borderColor: "rgba(184,255,60,0.06)",
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    xaxis: {
      categories,
      labels: { style: { colors: "#4A6A4A", fontSize: "11px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: "#4A6A4A", fontSize: "11px" },
        formatter: (v) => `${v}K`,
      },
    },
    tooltip: {
      theme: "dark",
      y: { formatter: (v) => `GHS ${v}K` },
    },
    markers: { size: 0, hover: { size: 5, sizeOffset: 2 } },
  };

  const series = [{ name: "Revenue (GHS K)", data: values }];

  return (
    <Chart options={options} series={series} type="area" height={220} />
  );
}
