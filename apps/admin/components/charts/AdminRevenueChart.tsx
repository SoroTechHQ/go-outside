"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Palette = {
  text: string;
  textMuted: string;
  border: string;
};

function readPalette(): Palette {
  if (typeof window === "undefined") {
    return {
      text: "#E5EFE2",
      textMuted: "#7A9C76",
      border: "rgba(255,255,255,0.08)",
    };
  }
  const style = window.getComputedStyle(document.documentElement);
  return {
    text: style.getPropertyValue("--text-primary").trim() || "#E5EFE2",
    textMuted: style.getPropertyValue("--text-secondary").trim() || "#7A9C76",
    border: style.getPropertyValue("--border-subtle").trim() || "rgba(255,255,255,0.08)",
  };
}

function useChartPalette() {
  const [palette, setPalette] = useState<Palette>(readPalette);

  useEffect(() => {
    const update = () => setPalette(readPalette());
    const observer = new MutationObserver(update);
    update();
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "style"],
    });
    window.addEventListener("gooutside-theme-change", update as EventListener);
    return () => {
      observer.disconnect();
      window.removeEventListener("gooutside-theme-change", update as EventListener);
    };
  }, []);

  return palette;
}

export function AdminRevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  const palette = useChartPalette();

  const categories = data.map((d) => d.date);
  const series = data.map((d) => d.revenue);

  const options: ApexOptions = {
    chart: {
      type: "area",
      height: 280,
      toolbar: { show: false },
      background: "transparent",
      fontFamily: "var(--font-body), sans-serif",
    },
    colors: ["var(--brand, #4ade80)"],
    stroke: { curve: "smooth", width: 3 },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.24, opacityTo: 0.02, stops: [0, 100] },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: palette.border,
      strokeDashArray: 5,
      xaxis: { lines: { show: false } },
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        rotate: -45,
        style: { colors: categories.map(() => palette.textMuted), fontSize: "10px" },
        formatter: (val: string) => {
          // Show only every 5th label to avoid crowding
          const idx = categories.indexOf(val);
          return idx % 5 === 0 ? val : "";
        },
      },
    },
    yaxis: {
      labels: {
        style: { colors: [palette.textMuted], fontSize: "11px" },
        formatter: (val: number) => `GH₵${val.toLocaleString()}`,
      },
    },
    tooltip: {
      theme: "dark",
      y: { formatter: (val: number) => `GH₵${val.toLocaleString()}` },
    },
  };

  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-[var(--text-tertiary)]">
        No revenue data for the last 30 days.
      </div>
    );
  }

  return (
    <Chart
      height={280}
      options={options}
      series={[{ name: "Revenue (GHS)", data: series }]}
      type="area"
    />
  );
}
