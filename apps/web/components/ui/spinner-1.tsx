import React from "react";

const BARS = [
  { delay: "-1.2s", transform: "rotate(.0001deg) translate(146%)" },
  { delay: "-1.1s", transform: "rotate(30deg) translate(146%)" },
  { delay: "-1.0s", transform: "rotate(60deg) translate(146%)" },
  { delay: "-0.9s", transform: "rotate(90deg) translate(146%)" },
  { delay: "-0.8s", transform: "rotate(120deg) translate(146%)" },
  { delay: "-0.7s", transform: "rotate(150deg) translate(146%)" },
  { delay: "-0.6s", transform: "rotate(180deg) translate(146%)" },
  { delay: "-0.5s", transform: "rotate(210deg) translate(146%)" },
  { delay: "-0.4s", transform: "rotate(240deg) translate(146%)" },
  { delay: "-0.3s", transform: "rotate(270deg) translate(146%)" },
  { delay: "-0.2s", transform: "rotate(300deg) translate(146%)" },
  { delay: "-0.1s", transform: "rotate(330deg) translate(146%)" },
];

export function Spinner1({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      {BARS.map((bar) => (
        <div
          key={bar.transform}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            height: "8%",
            width: "24%",
            marginLeft: "-10%",
            marginTop: "-3.9%",
            borderRadius: 5,
            backgroundColor: color,
            transform: bar.transform,
            animationDelay: bar.delay,
            animation: "go-spin 1.2s linear infinite",
          }}
        />
      ))}
    </div>
  );
}
