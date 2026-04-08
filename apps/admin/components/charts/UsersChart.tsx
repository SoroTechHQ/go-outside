"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function UsersChart({ values }: { values: number[] }) {
  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 220,
      toolbar: { show: false },
      background: "transparent",
    },
    colors: ["#5FBF2A"],
    plotOptions: {
      bar: {
        columnWidth: "45%",
        borderRadius: 6,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: "rgba(95,191,42,0.06)",
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    xaxis: {
      categories: ["W1", "W2", "W3", "W4", "W5", "W6"],
      labels: { style: { colors: "#4A6A4A", fontSize: "11px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: "#4A6A4A", fontSize: "11px" } },
    },
    tooltip: {
      theme: "dark",
      y: { formatter: (v) => `${v}K new users` },
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "vertical",
        gradientToColors: ["rgba(95,191,42,0.3)"],
        stops: [0, 100],
      },
    },
  };

  const series = [{ name: "New Users (K)", data: values }];

  return (
    <Chart options={options} series={series} type="bar" height={220} />
  );
}
