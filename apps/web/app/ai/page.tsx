import { Suspense } from "react";
import AIDashboardClient from "../dashboard/ai/AIDashboardClient";

export default function AIPage() {
  return (
    <Suspense fallback={null}>
      <AIDashboardClient />
    </Suspense>
  );
}
