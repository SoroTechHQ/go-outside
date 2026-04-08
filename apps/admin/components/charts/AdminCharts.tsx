"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { AccentTone, getAccentColor } from "../dashboard-primitives";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Palette = {
  text: string;
  textMuted: string;
  border: string;
  card: string;
};

function readPalette(): Palette {
  if (typeof window === "undefined") {
    return {
      text: "#E5EFE2",
      textMuted: "#7A9C76",
      border: "rgba(255,255,255,0.08)",
      card: "#172117",
    };
  }

  const style = window.getComputedStyle(document.documentElement);

  return {
    text: style.getPropertyValue("--text-primary").trim() || "#E5EFE2",
    textMuted: style.getPropertyValue("--text-secondary").trim() || "#7A9C76",
    border: style.getPropertyValue("--border-subtle").trim() || "rgba(255,255,255,0.08)",
    card: style.getPropertyValue("--bg-card").trim() || "#172117",
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

type SeriesInput = {
  name: string;
  data: number[];
  tone: AccentTone;
};

export function MultiLineChart({
  categories,
  series,
  height = 280,
}: {
  categories: string[];
  series: SeriesInput[];
  height?: number;
}) {
  const palette = useChartPalette();
  const options: ApexOptions = {
    chart: {
      type: "area",
      height,
      toolbar: { show: false },
      background: "transparent",
      fontFamily: "var(--font-body), sans-serif",
    },
    colors: series.map((entry) => getAccentColor(entry.tone)),
    stroke: { curve: "smooth", width: 3 },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.24, opacityTo: 0.02, stops: [0, 100] },
    },
    dataLabels: { enabled: false },
    legend: { position: "top", horizontalAlign: "left", labels: { colors: palette.text } },
    grid: {
      borderColor: palette.border,
      strokeDashArray: 5,
      xaxis: { lines: { show: false } },
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: categories.map(() => palette.textMuted), fontSize: "11px" } },
    },
    yaxis: {
      labels: {
        style: { colors: [palette.textMuted], fontSize: "11px" },
      },
    },
    tooltip: { theme: "dark" },
  };

  return (
    <Chart
      height={height}
      options={options}
      series={series.map((entry) => ({ name: entry.name, data: entry.data }))}
      type="area"
    />
  );
}

export function MultiBarChart({
  categories,
  series,
  stacked = false,
  height = 280,
}: {
  categories: string[];
  series: SeriesInput[];
  stacked?: boolean;
  height?: number;
}) {
  const palette = useChartPalette();
  const options: ApexOptions = {
    chart: {
      type: "bar",
      stacked,
      height,
      toolbar: { show: false },
      background: "transparent",
      fontFamily: "var(--font-body), sans-serif",
    },
    colors: series.map((entry) => getAccentColor(entry.tone)),
    plotOptions: {
      bar: {
        borderRadius: 7,
        columnWidth: stacked ? "48%" : "40%",
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    legend: { position: "top", horizontalAlign: "left", labels: { colors: palette.text } },
    grid: {
      borderColor: palette.border,
      strokeDashArray: 5,
      xaxis: { lines: { show: false } },
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: categories.map(() => palette.textMuted), fontSize: "11px" } },
    },
    yaxis: {
      labels: { style: { colors: [palette.textMuted], fontSize: "11px" } },
    },
    tooltip: { theme: "dark" },
  };

  return (
    <Chart
      height={height}
      options={options}
      series={series.map((entry) => ({ name: entry.name, data: entry.data }))}
      type="bar"
    />
  );
}

export function DonutChart({
  items,
  height = 260,
}: {
  items: { label: string; value: number; tone: AccentTone }[];
  height?: number;
}) {
  const palette = useChartPalette();
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const options: ApexOptions = {
    chart: {
      type: "donut",
      background: "transparent",
      fontFamily: "var(--font-body), sans-serif",
    },
    colors: items.map((item) => getAccentColor(item.tone)),
    labels: items.map((item) => item.label),
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: "74%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Share",
              color: palette.textMuted,
              formatter: () => `${total}%`,
            },
            value: {
              color: palette.text,
              fontSize: "26px",
              fontWeight: "600",
            },
          },
        },
      },
    },
    tooltip: { theme: "dark" },
  };

  return <Chart height={height} options={options} series={items.map((item) => item.value)} type="donut" />;
}

export function RadialGauge({
  value,
  tone = "cyan",
  label,
}: {
  value: number;
  tone?: AccentTone;
  label: string;
}) {
  const palette = useChartPalette();
  const options: ApexOptions = {
    chart: {
      type: "radialBar",
      background: "transparent",
      sparkline: { enabled: true },
    },
    colors: [getAccentColor(tone)],
    plotOptions: {
      radialBar: {
        hollow: { size: "64%" },
        track: { background: palette.border },
        dataLabels: {
          name: {
            offsetY: 18,
            color: palette.textMuted,
            fontSize: "12px",
          },
          value: {
            offsetY: -18,
            color: palette.text,
            fontSize: "28px",
            fontWeight: "600",
            formatter: (val) => `${Math.round(Number(val))}%`,
          },
        },
      },
    },
    labels: [label],
  };

  return <Chart height={220} options={options} series={[value]} type="radialBar" />;
}
