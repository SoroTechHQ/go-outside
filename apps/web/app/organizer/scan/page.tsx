import type { Metadata } from "next";
import ScannerClient from "./ScannerClient";

export const metadata: Metadata = { title: "Scan Tickets" };

export default function ScanPage() {
  return <ScannerClient />;
}
